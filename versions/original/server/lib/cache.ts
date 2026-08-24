// 统一磁盘缓存：跨进程、跨重启永久有效，bump CACHE_VERSION 即整体失效
//
// 目录布局：
//   server/data/cache/<CACHE_VERSION>/<namespace>/<imageHash>/<scopeKey>.json
//   server/data/cache/<CACHE_VERSION>/<namespace>/<imageHash>/<scopeKey>.png
//
// scopeKey 可含 '/'，会被映射到子目录；最后一段当文件名

import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

export const CACHE_VERSION = 'v1';

const ROOT = join(process.cwd(), 'data', 'cache', CACHE_VERSION);

export type Namespace = 'analyze' | 'story';

function safeSegment(s: string): string {
  // 防止 .. / 反斜杠等越狱；保留中文与基本符号
  return s.replace(/\.\./g, '_').replace(/[\\:*?"<>|]/g, '_');
}

function buildPath(ns: Namespace, imageHash: string, scopeKey: string, ext: 'json' | 'png'): string {
  const parts = scopeKey.split('/').map(safeSegment);
  return join(ROOT, ns, safeSegment(imageHash), ...parts) + '.' + ext;
}

async function ensureDir(p: string) {
  await mkdir(dirname(p), { recursive: true });
}

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

async function atomicWrite(p: string, data: Buffer | string) {
  await ensureDir(p);
  const tmp = p + '.tmp.' + randomBytes(4).toString('hex');
  await writeFile(tmp, data);
  await rename(tmp, p);
}

// ---- JSON 缓存 ----

export async function getJson<T>(ns: Namespace, imageHash: string, scopeKey: string): Promise<T | null> {
  const p = buildPath(ns, imageHash, scopeKey, 'json');
  if (!(await exists(p))) return null;
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function putJson<T>(ns: Namespace, imageHash: string, scopeKey: string, value: T): Promise<void> {
  const p = buildPath(ns, imageHash, scopeKey, 'json');
  await atomicWrite(p, JSON.stringify(value));
}

export async function getOrSetJson<T>(
  ns: Namespace,
  imageHash: string,
  scopeKey: string,
  factory: () => Promise<T | null>,
): Promise<{ value: T; hit: boolean } | { value: null; hit: false }> {
  const cached = await getJson<T>(ns, imageHash, scopeKey);
  if (cached !== null) return { value: cached, hit: true };
  const fresh = await factory();
  if (fresh === null) return { value: null, hit: false };
  await putJson(ns, imageHash, scopeKey, fresh);
  return { value: fresh, hit: false };
}

// ---- 二进制（PNG）缓存 ----

export async function getBinary(ns: Namespace, imageHash: string, scopeKey: string): Promise<Buffer | null> {
  const p = buildPath(ns, imageHash, scopeKey, 'png');
  if (!(await exists(p))) return null;
  try { return await readFile(p); } catch { return null; }
}

export async function putBinary(ns: Namespace, imageHash: string, scopeKey: string, buf: Buffer): Promise<string> {
  const p = buildPath(ns, imageHash, scopeKey, 'png');
  await atomicWrite(p, buf);
  return p;
}

// 给前端用的可访问 URL（local-server 暴露 /cache/* 静态路由）
export function publicUrl(ns: Namespace, imageHash: string, scopeKey: string): string {
  const parts = scopeKey.split('/').map(encodeURIComponent).join('/');
  return `/cache/${CACHE_VERSION}/${ns}/${encodeURIComponent(imageHash)}/${parts}.png`;
}

export function cacheRoot(): string { return ROOT; }
