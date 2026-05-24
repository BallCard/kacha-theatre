// 纯文本 LLM 调用（不带图片），与 server/lib/vlm-relay.ts 走同一 OPENAI_API_KEY / BASE_URL
// 用于 Part 2 剧情文本生成（图片走 gpt-image-2，不必塞 chat 模型）

import { fetch } from 'undici';

export interface StoryLLMOptions {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  timeoutMs?: number;
}

export type StoryLLMResult =
  | { ok: true; raw: string; latencyMs: number }
  | { ok: false; error: string; latencyMs: number };

export async function callStoryLLM(opts: StoryLLMOptions): Promise<StoryLLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY missing', latencyMs: 0 };

  const url = `${baseUrl}/chat/completions`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30000);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
      signal: ctrl.signal,
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `http ${res.status}: ${body.slice(0, 200)}`, latencyMs };
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: 'empty content', latencyMs };
    return { ok: true, raw: content, latencyMs };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e), latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

export function tryParseJson(raw: string): unknown | null {
  try { return JSON.parse(raw); } catch { /* fallthrough */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
