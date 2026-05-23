import { callDoubao } from './vlm-doubao.js';
import { callGPT4o } from './vlm-gpt4o.js';
import { SYSTEM_PROMPT, USER_PROMPT, buildRetryPrompt } from './prompt.js';
import { validateAnalyzeResult } from './schema.js';
import { enforceTierConsistency } from './tier.js';
import { makeFallback } from './fallback.js';
import type { AnalyzeResult } from './types.js';

export interface VLMTrace {
  attempts: Array<{
    provider: 'doubao' | 'gpt4o';
    attempt: number;
    ok: boolean;
    latencyMs: number;
    schemaOk?: boolean;
    error?: string;
  }>;
  finalSource: 'doubao' | 'gpt4o' | 'fallback';
  totalMs: number;
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

function postProcess(parsed: any): AnalyzeResult {
  parsed.level_tier = enforceTierConsistency(parsed.moyu_score, parsed.level_tier);
  return parsed as AnalyzeResult;
}

export async function analyzeWithVLM(
  imageBase64: string,
  preferProvider: 'doubao' | 'gpt4o' = 'doubao',
): Promise<{ result: AnalyzeResult; trace: VLMTrace }> {
  const start = Date.now();
  const trace: VLMTrace = { attempts: [], finalSource: 'fallback', totalMs: 0 };

  const order: Array<'doubao' | 'gpt4o'> =
    preferProvider === 'gpt4o' ? ['gpt4o', 'doubao'] : ['doubao', 'gpt4o'];

  for (const provider of order) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const lastErrors = attempt === 2
        ? trace.attempts.filter(a => a.provider === provider).flatMap(a => a.error ? [a.error] : [])
        : [];
      const userPrompt = attempt === 1
        ? USER_PROMPT
        : `${USER_PROMPT}\n\n${buildRetryPrompt(lastErrors)}`;

      const call = provider === 'doubao'
        ? await callDoubao({ imageBase64, systemPrompt: SYSTEM_PROMPT, userPrompt })
        : await callGPT4o({ imageBase64, systemPrompt: SYSTEM_PROMPT, userPrompt });

      if (!call.ok) {
        trace.attempts.push({ provider, attempt, ok: false, latencyMs: call.latencyMs, error: call.error });
        continue;
      }

      const parsed = tryParseJson(call.raw);
      if (!parsed) {
        trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: 'not json' });
        continue;
      }

      const v = validateAnalyzeResult(parsed);
      if (!v.ok) {
        trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: v.errors?.join('; ') });
        continue;
      }

      trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: true });
      trace.finalSource = provider;
      trace.totalMs = Date.now() - start;
      return { result: postProcess(parsed), trace };
    }
  }

  trace.finalSource = 'fallback';
  trace.totalMs = Date.now() - start;
  return { result: makeFallback(), trace };
}
