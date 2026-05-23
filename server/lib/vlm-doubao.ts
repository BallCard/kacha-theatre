import { fetch } from 'undici';

const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

export interface DoubaoCallOptions {
  imageBase64: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export type DoubaoCallResult =
  | { ok: true; raw: string; latencyMs: number }
  | { ok: false; error: string; latencyMs: number };

export async function callDoubao(opts: DoubaoCallOptions): Promise<DoubaoCallResult> {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL;
  if (!apiKey || !model) {
    return { ok: false, error: 'ARK_API_KEY or ARK_MODEL missing', latencyMs: 0 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  const start = Date.now();

  try {
    const res = await fetch(ARK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
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
        max_tokens: 800,
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
    if (!content) {
      return { ok: false, error: 'empty content', latencyMs };
    }
    return { ok: true, raw: content, latencyMs };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e), latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}
