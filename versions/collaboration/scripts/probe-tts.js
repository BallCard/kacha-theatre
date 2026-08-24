#!/usr/bin/env node
// 探活：单次 /v1/audio/speech，确认中转站开了 TTS 端点。
// 用法：node scripts/probe-tts.js [voice]  默认 onyx
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai-next.com';
const API_KEY = process.env.OPENAI_API_KEY || '';
const TTS_MODEL = process.env.TTS_MODEL || 'gpt-4o-mini-tts';
const voice = process.argv[2] || 'onyx';

(async () => {
  const t0 = Date.now();
  try {
    const resp = await axios.post(
      `${API_BASE}/v1/audio/speech`,
      {
        model: TTS_MODEL,
        voice,
        input: '你好，这是一段中文测试音频，咔嚓剧场。',
        response_format: 'mp3',
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );
    const out = path.join(__dirname, '..', 'cache', `probe-tts-${voice}.mp3`);
    if (!fs.existsSync(path.dirname(out))) fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(resp.data));
    console.log(`OK  ${TTS_MODEL} voice=${voice}  ${(resp.data.byteLength/1024).toFixed(1)}KB  ${((Date.now()-t0)/1000).toFixed(1)}s → ${out}`);
  } catch (err) {
    const status = err.response && err.response.status;
    let body = err.response && err.response.data;
    if (body && body.constructor === Buffer) body = body.toString('utf8').slice(0, 500);
    console.error(`FAIL status=${status} model=${TTS_MODEL} voice=${voice}`);
    console.error(body || err.message);
    process.exit(1);
  }
})();
