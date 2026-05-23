import { fetch } from 'undici';

export interface RelayCallOptions {
  imageBase64: string;
  systemPrompt: string;
  userPrompt: string;
  model: string;
  timeoutMs?: number;
}

export type RelayCallResult =
  | { ok: true; raw: string; latencyMs: number }
  | { ok: false; error: string; latencyMs: number };

export async function callRelay(opts: RelayCallOptions): Promise<RelayCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY missing', latencyMs: 0 };

  const url = `${baseUrl}/chat/completions`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20000);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: opts.userPrompt },
              { type: 'image_url', image_url: { url: opts.imageBase64 } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
