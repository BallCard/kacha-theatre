import type { AnalyzeResult } from './types.js';

export const FALLBACK_RESULT: AnalyzeResult = {
  pose_type: '假装思考型',
  desk_objects: ['显示器', '桌面'],
  moyu_score: 60,
  sign_type: '中签',
  level_tier: '摸鱼修士',
  title_candidates: ['半日仙人', '神游侍中', '摸鱼修士'],
  report: {
    paragraph: '御史台今日观星不利，未能洞察该员摸鱼真章。然紫微入命，姑且记为中等划水，待来日补审。',
    yi: ['再摸一会', '等下班', '假装思考'],
    ji: ['被领导看到', '开会发言', '改PPT'],
  },
  face_boxes: [],
  initial_stickers: [
    { id: 'yellow_tag_03', text: '再摸会儿', x: 0.15, y: 0.80, rot: -4 },
  ],
};

export function makeFallback(): AnalyzeResult {
  return JSON.parse(JSON.stringify(FALLBACK_RESULT));
}
