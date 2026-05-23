import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import 'dotenv/config';
import { analyzeWithVLM } from '../lib/vlm.js';

const FIXTURES_DIR = join(process.cwd(), 'scripts', 'bench-fixtures');
const OUT_PATH = join(process.cwd(), 'scripts', 'bench-report.md');
const RUNS_PER_IMAGE = 3;

async function imageToBase64(path: string): Promise<string> {
  const buf = await readFile(path);
  const ext = extname(path).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${buf.toString('base64')}`;
}

async function main() {
  await mkdir(FIXTURES_DIR, { recursive: true });
  const files = (await readdir(FIXTURES_DIR)).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (files.length === 0) {
    console.error(`没有 fixture 图。放进 ${FIXTURES_DIR}`);
    process.exit(1);
  }

  const rows: string[] = [
    `# Prompt Bench Report — ${new Date().toISOString()}`,
    '',
    `每张图跑 ${RUNS_PER_IMAGE} 次，观察 score 抖动、称号调性、奏折稳定性。`,
    `Primary: \`${process.env.PRIMARY_MODEL ?? 'gemini-2.5-flash-nothinking'}\` · Fallback: \`${process.env.FALLBACK_MODEL ?? 'gpt-4.1-mini'}\``,
    '',
  ];

  for (const f of files) {
    console.log(`>>> ${f}`);
    rows.push(`## ${f}`, '');
    const b64 = await imageToBase64(join(FIXTURES_DIR, f));
    rows.push('| run | score | tier | pose | title[0] | latency | source |');
    rows.push('|---|---|---|---|---|---|---|');
    const reports: string[] = [];
    const titles: string[] = [];
    const scores: number[] = [];
    for (let i = 1; i <= RUNS_PER_IMAGE; i++) {
      const start = Date.now();
      const { result, trace } = await analyzeWithVLM(b64);
      const ms = Date.now() - start;
      console.log(`  run ${i}: score=${result.moyu_score} tier=${result.level_tier} ${ms}ms ${trace.finalSource}`);
      rows.push(`| ${i} | ${result.moyu_score} | ${result.level_tier} | ${result.pose_type} | ${result.title_candidates[0]} | ${ms}ms | ${trace.finalSource} |`);
      reports.push(`run${i}: ${result.report.paragraph}`);
      titles.push(`run${i}: ${result.title_candidates.join(' / ')}`);
      scores.push(result.moyu_score);
    }
    const minS = Math.min(...scores);
    const maxS = Math.max(...scores);
    rows.push('', `**Score 抖动：${minS} ~ ${maxS}（极差 ${maxS - minS}）** —— 目标 ≤ 10`, '');
    rows.push('<details><summary>奏折正文</summary>', '', ...reports.map(r => `- ${r}`), '', '</details>', '');
    rows.push('<details><summary>称号候选</summary>', '', ...titles.map(t => `- ${t}`), '', '</details>', '');
  }

  await writeFile(OUT_PATH, rows.join('\n'), 'utf8');
  console.log(`\n报告写入 ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
