import { describe, it, expect } from 'vitest';
import { validateAnalyzeResult } from '../lib/schema.js';

const VALID = {
  pose_type: '趴桌型',
  desk_objects: ['半杯冷美式', '青轴键盘'],
  moyu_score: 87,
  sign_type: '上上签',
  level_tier: '摸鱼大将军',
  title_candidates: ['划水大将军', '假寐侍郎', '摸鱼世家'],
  report: {
    paragraph: '紫微星偏移三度，案上美式已凉，足证该员神游天外不下半盏茶时辰。',
    yi: ['摸鱼', '划水', '假装思考'],
    ji: ['开会', '改PPT', '接电话'],
  },
  face_boxes: [{ x: 0.32, y: 0.18, w: 0.24, h: 0.28 }],
  initial_stickers: [
    { id: 'yellow_tag_02', text: '凉透了', x: 0.12, y: 0.78, rot: -6 },
  ],
};

describe('validateAnalyzeResult', () => {
  it('accepts a fully valid result', () => {
    const r = validateAnalyzeResult(VALID);
    expect(r.ok).toBe(true);
  });

  it('rejects missing required fields', () => {
    const bad = { ...VALID } as any;
    delete bad.moyu_score;
    const r = validateAnalyzeResult(bad);
    expect(r.ok).toBe(false);
    expect(r.errors?.[0]).toMatch(/moyu_score/);
  });

  it('rejects pose_type not in enum', () => {
    const r = validateAnalyzeResult({ ...VALID, pose_type: '飞天型' });
    expect(r.ok).toBe(false);
  });

  it('rejects score out of range', () => {
    const r = validateAnalyzeResult({ ...VALID, moyu_score: 150 });
    expect(r.ok).toBe(false);
  });

  it('rejects title_candidates length != 3', () => {
    const r = validateAnalyzeResult({ ...VALID, title_candidates: ['a', 'b'] });
    expect(r.ok).toBe(false);
  });

  it('rejects paragraph shorter than 30 chars', () => {
    const r = validateAnalyzeResult({
      ...VALID,
      report: { ...VALID.report, paragraph: '太短了' },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects yi/ji length != 3', () => {
    const r = validateAnalyzeResult({
      ...VALID,
      report: { ...VALID.report, yi: ['摸鱼', '划水'] },
    });
    expect(r.ok).toBe(false);
  });

  it('accepts empty face_boxes array', () => {
    const r = validateAnalyzeResult({ ...VALID, face_boxes: [] });
    expect(r.ok).toBe(true);
  });
});
