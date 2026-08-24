const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TTS_CACHE_DIR = path.join(ROOT, 'cache', 'tts');

function startServer(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(server.address().port);
    });
  });
}
function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}
async function unusedPort() {
  const server = http.createServer();
  const port = await startServer(server);
  await stopServer(server);
  return port;
}
function waitForApp(child, expectedLine) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`App did not start. Output: ${output}`)), 5000);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      if (output.includes(expectedLine)) { clearTimeout(timeout); resolve(); }
    });
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`App exited with code ${code}. Output: ${output}`));
    });
  });
}

test('TTS: 缓存命中跳过 upstream；posterStyle 不同走不同音色 → 独立缓存', async (t) => {
  const mp3Body = Buffer.from('FAKEMP3-' + Date.now());
  const upstreamCalls = [];

  const upstreamApi = http.createServer((req, res) => {
    let buf = '';
    req.on('data', (c) => { buf += c.toString(); });
    req.on('end', () => {
      let body;
      try { body = JSON.parse(buf); } catch (e) { body = {}; }
      upstreamCalls.push({ url: req.url, body });
      res.writeHead(200, { 'content-type': 'audio/mpeg' });
      res.end(mp3Body);
    });
  });
  const apiPort = await startServer(upstreamApi);

  const appPort = await unusedPort();
  const app = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(appPort),
      OPENAI_API_KEY: 'test-key',
      OPENAI_BASE_URL: `http://127.0.0.1:${apiPort}`,
      TTS_MODEL: 'gpt-4o-mini-tts',
      NO_PROXY: '127.0.0.1,localhost',
      no_proxy: '127.0.0.1,localhost',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOut = '';
  app.stdout.on('data', (c) => { serverOut += c.toString(); });
  app.stderr.on('data', (c) => { serverOut += c.toString(); });
  void serverOut;

  // 收集本测试期间生成的 tts 缓存文件，结束时清理
  const beforeFiles = new Set(fs.existsSync(TTS_CACHE_DIR) ? fs.readdirSync(TTS_CACHE_DIR) : []);
  t.after(async () => {
    app.kill();
    await stopServer(upstreamApi);
    if (fs.existsSync(TTS_CACHE_DIR)) {
      for (const f of fs.readdirSync(TTS_CACHE_DIR)) {
        if (!beforeFiles.has(f)) fs.rmSync(path.join(TTS_CACHE_DIR, f), { force: true });
      }
    }
  });

  await waitForApp(app, `http://localhost:${appPort}`);

  async function callTts(text, posterStyle) {
    const resp = await fetch(`http://127.0.0.1:${appPort}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, posterStyle }),
    });
    const buf = Buffer.from(await resp.arrayBuffer());
    return { status: resp.status, cache: resp.headers.get('x-cache'), bytes: buf };
  }

  const text = '测试旁白：你抬眼看见示例同学';

  const r1 = await callTts(text, 'prank');
  assert.equal(r1.status, 200);
  assert.equal(r1.cache, 'MISS');
  assert.deepEqual(r1.bytes, mp3Body);
  assert.equal(upstreamCalls.length, 1, '首次应触发 upstream');

  const r2 = await callTts(text, 'prank');
  assert.equal(r2.status, 200);
  assert.equal(r2.cache, 'HIT');
  assert.deepEqual(r2.bytes, mp3Body);
  assert.equal(upstreamCalls.length, 1, '相同入参的二次请求必须命中缓存，不再调 upstream');

  const r3 = await callTts(text, 'warm');
  assert.equal(r3.status, 200);
  assert.equal(r3.cache, 'MISS', 'posterStyle 不同 → 音色不同 → 独立缓存键');
  assert.equal(upstreamCalls.length, 2);

  // upstream 收到的 body 含正确字段
  assert.equal(upstreamCalls[0].body.model, 'gpt-4o-mini-tts');
  assert.equal(upstreamCalls[0].body.voice, 'onyx');
  assert.equal(upstreamCalls[0].body.input, text);
  assert.equal(upstreamCalls[0].body.response_format, 'mp3');
  assert.equal(upstreamCalls[1].body.voice, 'nova');

  // 缓存文件确实落盘
  const afterFiles = fs.readdirSync(TTS_CACHE_DIR);
  const newFiles = afterFiles.filter((f) => !beforeFiles.has(f));
  assert.equal(newFiles.length, 2, '应有两个新的 mp3 缓存文件（prank + warm）');
  for (const f of newFiles) assert.ok(f.endsWith('.mp3'));
});

test('TTS: 空 text → 400', async (t) => {
  const apiPort = await unusedPort();  // 不需要真 upstream
  const appPort = await unusedPort();
  const app = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(appPort),
      OPENAI_API_KEY: 'test-key',
      OPENAI_BASE_URL: `http://127.0.0.1:${apiPort}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { app.kill(); });
  await waitForApp(app, `http://localhost:${appPort}`);

  const resp = await fetch(`http://127.0.0.1:${appPort}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '   ', posterStyle: 'prank' }),
  });
  assert.equal(resp.status, 400);
});
