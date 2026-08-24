// 用 sharp 压缩源图：把上传上来的大图（可能 6MB JPG）压到 ~1024px JPEG q82
// 用途：
//   1) 落盘做 reference 时存小图（后续 /images/edits multipart 上传不再 6MB → 不再 UND_ERR_SOCKET）
//   2) 同一接口可用于产出缩略图
//
// 失败时返回原 buffer，不阻塞主流程

import sharp from 'sharp';

export interface CompressOptions {
  maxSide?: number;       // 长边像素，默认 1024
  jpegQuality?: number;   // 1-100，默认 82
}

export async function compressForReference(input: Buffer, opts: CompressOptions = {}): Promise<Buffer> {
  const maxSide = opts.maxSide ?? 1024;
  const quality = opts.jpegQuality ?? 82;
  try {
    return await sharp(input, { failOn: 'none' })
      .rotate()                                 // 按 EXIF 自动转正
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  } catch (e: any) {
    // 失败时保守返回原图
    console.warn('[imageCompress] failed, falling back to raw:', e?.message);
    return input;
  }
}
