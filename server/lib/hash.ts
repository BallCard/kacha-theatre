import { createHash } from 'node:crypto';

export function sha256OfBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function sha256OfBase64(b64: string): string {
  // 兼容 dataURL 前缀
  const idx = b64.indexOf(',');
  const pure = idx >= 0 ? b64.slice(idx + 1) : b64;
  const buf = Buffer.from(pure, 'base64');
  return sha256OfBuffer(buf);
}

// 截短做目录名 / 短 key；16 字符冲突概率 << 1e-9，足够
export function shortHash(full: string, len = 16): string {
  return full.slice(0, len);
}
