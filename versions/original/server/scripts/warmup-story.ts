// CLI 预热脚本：把指定示例 (照片 hash + 主题 + 画风) 的全部 40 节点缓存灌满
//
// 用法：
//   npm run warmup-story -- --image=path/to/photo.jpg --theme=宫斗剧 --artStyle=恋与深空
//   npm run warmup-story                   (读 server/data/story-examples.json 全量)
//
// 输出：终端进度条 + 每节点 cache hit/miss + 失败列表

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { sha256OfBuffer, shortHash } from '../lib/hash.js';
import { generateNodeInProcess } from '../api/plot/v2/node.js';
import type { Theme, ArtStyle } from '../lib/storyStyles.js';
import { THEMES, ART_STYLE_NAMES } from '../lib/storyStyles.js';

interface ExampleSpec {
  imagePath: string;          // 相对仓库根或绝对路径
  theme: Theme;
  artStyle: ArtStyle;
  characterAName?: string;
  model?: string;
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function allPathKeys(): string[] {
  const keys: string[] = ['root'];
  const choices = ['A', 'B', 'C'] as const;
  for (const c1 of choices) {
    keys.push(c1);
    for (const c2 of choices) {
      keys.push(`${c1}.${c2}`);
      for (const c3 of choices) {
        keys.push(`${c1}.${c2}.${c3}`);
      }
    }
  }
  return keys; // 1 + 3 + 9 + 27 = 40
}

function ancestorKeys(pk: string): string[] {
  if (pk === 'root') return [];
  const segs = pk.split('.');
  const out: string[] = ['root'];
  for (let i = 1; i < segs.length; i++) out.push(segs.slice(0, i).join('.'));
  return out;
}

async function warmupExample(spec: ExampleSpec) {
  const imgFull = isAbsolute(spec.imagePath) ? spec.imagePath : join(process.cwd(), '..', spec.imagePath);
  const imgBuf = await readFile(imgFull);
  const imageHash = shortHash(sha256OfBuffer(imgBuf));
  const dataUrl = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;

  console.log(`\n[example] ${spec.imagePath}  theme=${spec.theme}  artStyle=${spec.artStyle}  hash=${imageHash}`);

  const keys = allPathKeys();
  let ok = 0, miss = 0, hit = 0;
  const failures: Array<{ pathKey: string; err: string }> = [];

  for (let i = 0; i < keys.length; i++) {
    const pk = keys[i];
    process.stdout.write(`  [${i + 1}/${keys.length}] ${pk} ... `);
    const res = await generateNodeInProcess({
      imageHash,
      image: pk === 'root' ? dataUrl : undefined,  // 首次传图入盘；之后从盘读
      theme: spec.theme,
      artStyle: spec.artStyle,
      pathKey: pk,
      model: spec.model,
      characterAName: spec.characterAName,
      ancestors: ancestorKeys(pk).map((ak) => ({ pathKey: ak })),
    } as any);

    if ('error' in res) {
      failures.push({ pathKey: pk, err: (res as any).detail ?? (res as any).error });
      process.stdout.write(`FAIL: ${(res as any).error}\n`);
    } else {
      ok++;
      if ((res as any).cacheHit) { hit++; process.stdout.write('HIT\n'); }
      else { miss++; process.stdout.write('MISS->gen\n'); }
    }
  }

  console.log(`\n[done] total=${keys.length} ok=${ok} (hit=${hit}, miss=${miss}) failed=${failures.length}`);
  if (failures.length) {
    console.log('failures:');
    for (const f of failures) console.log(`  ${f.pathKey}: ${f.err}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let specs: ExampleSpec[];
  if (args.image && args.theme && args.artStyle) {
    if (!THEMES.includes(args.theme as Theme)) throw new Error(`invalid theme: ${args.theme}`);
    if (!ART_STYLE_NAMES.includes(args.artStyle as ArtStyle)) throw new Error(`invalid artStyle: ${args.artStyle}`);
    specs = [{
      imagePath: args.image,
      theme: args.theme as Theme,
      artStyle: args.artStyle as ArtStyle,
      characterAName: args.name,
      model: args.model,
    }];
  } else {
    const exPath = join(process.cwd(), 'data', 'story-examples.json');
    const raw = await readFile(exPath, 'utf8').catch(() => '[]');
    specs = JSON.parse(raw);
  }

  if (specs.length === 0) {
    console.log('no examples configured. 用法见文件头注释。');
    return;
  }

  for (const spec of specs) {
    try { await warmupExample(spec); }
    catch (e: any) { console.error(`[example failed]`, spec, e?.message); }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
