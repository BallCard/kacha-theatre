// 前端 -> /api/plot/v2/node 调用封装

import type { StoryNodeResponse, StoryTheme, StoryArtStyle } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:3000';

export interface FetchNodeArgs {
  imageBase64?: string;          // 首次必传；后续可省（带 imageHash 即可）
  imageHash?: string;
  theme: StoryTheme;
  artStyle: StoryArtStyle;
  pathKey: string;
  model?: string;
  characterAName?: string;
}

export async function fetchStoryNode(args: FetchNodeArgs): Promise<StoryNodeResponse> {
  const body: Record<string, unknown> = {
    theme: args.theme,
    artStyle: args.artStyle,
    pathKey: args.pathKey,
  };
  if (args.imageBase64) body.image = args.imageBase64;
  if (args.imageHash) body.imageHash = args.imageHash;
  if (args.model) body.model = args.model;
  if (args.characterAName) body.characterAName = args.characterAName;

  const r = await fetch(`${API_BASE}/api/plot/v2/node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`plot/v2/node failed: ${r.status} ${text.slice(0, 200)}`);
  }
  return r.json();
}

// 让 imageUrl 同时支持后端绝对/相对路径
export function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

// 前端侧 SHA-256（用于把 guofeng.html 已上传的图传给 React Part 2 时不重复算）
export async function sha256OfDataUrl(dataUrl: string): Promise<string> {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const hashBuf = await crypto.subtle.digest('SHA-256', bytes);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
