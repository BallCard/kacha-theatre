import { callRelay } from './vlm-relay.js';
import { SYSTEM_PROMPT, USER_PROMPT, buildRetryPrompt } from './prompt.js';
import { validateAnalyzeResult } from './schema.js';
import { enforceTierConsistency } from './tier.js';
import { makeFallback } from './fallback.js';
import type { AnalyzeResult } from './types.js';

export interface VLMTrace {
  attempts: Array<{
    model: string;
    attempt: number;
    ok: boolean;
    latencyMs: number;
    schemaOk?: boolean;
    error?: string;
  }>;
  finalSource: string;
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

function getModels(prefer?: string): string[] {
  const primary = prefer ?? process.env.PRIMARY_MODEL ?? 'gemini-2.5-flash-nothinking';
  const fallback = process.env.FALLBACK_MODEL ?? 'gpt-4.1-mini';
  return primary === fallback ? [primary] : [primary, fallback];
}

export async function analyzeWithVLM(
  imageBase64: string,
  preferModel?: string,
): Promise<{ result: AnalyzeResult; trace: VLMTrace }> {
  const start = Date.now();
  const trace: VLMTrace = { attempts: [], finalSource: 'fallback', totalMs: 0 };

  const models = getModels(preferModel);

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const lastErrors = attempt === 2
        ? trace.attempts.filter(a => a.model === model).flatMap(a => a.error ? [a.error] : [])
        : [];
      const userPrompt = attempt === 1
        ? USER_PROMPT
        : `${USER_PROMPT}\n\n${buildRetryPrompt(lastErrors)}`;

      const call = await callRelay({
        imageBase64,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        model,
      });

      if (!call.ok) {
        trace.attempts.push({ model, attempt, ok: false, latencyMs: call.latencyMs, error: call.error });
        continue;
      }

      const parsed = tryParseJson(call.raw);
      if (!parsed) {
        trace.attempts.push({ model, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: 'not json' });
        continue;
      }

      const v = validateAnalyzeResult(parsed);
      if (!v.ok) {
        trace.attempts.push({ model, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: v.errors?.join('; ') });
        continue;
      }

      trace.attempts.push({ model, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: true });
      trace.finalSource = model;
      trace.totalMs = Date.now() - start;
      return { result: postProcess(parsed), trace };
    }
  }

  trace.finalSource = 'fallback';
  trace.totalMs = Date.now() - start;
  return { result: makeFallback(), trace };
}
