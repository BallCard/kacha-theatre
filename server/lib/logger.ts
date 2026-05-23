import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');

export interface EventBase {
  ev: string;
  [k: string]: unknown;
}

export async function logEvent(ev: EventBase): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const file = join(DATA_DIR, `events-${today}.jsonl`);
  const line = JSON.stringify({ t: Math.floor(Date.now() / 1000), ...ev }) + '\n';
  try {
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, line, 'utf8');
  } catch {
    // 埋点失败不影响主流程
  }
}
