// Part 2 主题 + 画风矩阵
//
// THEMES：剧情走向（影响叙事调性、人物关系、冲突类型）
// ART_STYLES：图像视觉（注入到 imagePrompt 头部以统一三套画风）
//
// 注意：A 仅在终幕可能翻身（10%），由 server/api/plot/v2/node.ts 在终幕节点随机 roll
// 翻身时再让 LLM 出反转结局，避免概率不可控。

export const THEMES = ['宫斗剧', '穿越重生', '悬疑探案', '打脸', '爽文'] as const;
export type Theme = (typeof THEMES)[number];

export const ART_STYLE_NAMES = ['恋与深空', '蓝色监狱', '仙逆'] as const;
export type ArtStyle = (typeof ART_STYLE_NAMES)[number];

export const ART_STYLE_PROMPTS: Record<ArtStyle, string> = {
  '恋与深空':
    'cinematic semi-realistic anime in the style of "Love and Deepspace" otome game, soft rim light, dreamy bokeh, glossy hair highlights, delicate eye sparkles, refined facial structure, fashion-magazine framing',
  '蓝色监狱':
    'high-contrast sports anime in the style of "Blue Lock", sharp angular linework, dynamic speed lines, dramatic shadows, intense expressions, bold ink shading, fierce competitive atmosphere',
  '仙逆':
    'xianxia donghua in the style of "Renegade Immortal", flowing immortal robes, mountain mist, glowing talismans, ink-wash mountains backdrop, ethereal hair flow, jade and gold ornaments',
};

// 主题 → 叙事调性指引（喂给 LLM 系统提示）
export const THEME_TONE: Record<Theme, string> = {
  '宫斗剧':
    '半文白宫廷腔；明面恭敬暗里机锋；权谋、嫔妃位分、宫禁规矩；称谓用「本宫/臣妾/陛下」等',
  '穿越重生':
    '现代人灵魂带前世记忆穿到异世界/古代/重启时间线；金手指明显，言谈夹带现代梗；常出现「上辈子/重来一次/历史进程」之类台词',
  '悬疑探案':
    '冷峻克制的推理腔；现场线索、动机、不在场证明；阴影、灯光、特写；台词留白多',
  '打脸':
    '前期被低估 / 误解 / 嘲讽，后期反转碾压；强对比节奏；常见「你算什么东西」「啪啪打脸」桥段',
  '爽文':
    '直白热血网文腔；金手指、扮猪吃虎、装到位；台词偏短、节奏快、信息密度高、爽点密集',
};

// 镜头池（imagePrompt 多样性硬约束）
export const SHOT_POOL = [
  'sprinting forward, motion-blurred background',
  'sword swing mid-strike, dynamic diagonal composition',
  'casting a spell with glowing hand seals, low angle',
  'glancing back over the shoulder, dramatic lighting',
  'top-down birds-eye view of the character',
  'low worm-eye view looking up at the character',
  'over-the-shoulder cinematic shot',
  'extreme close-up on the face, intense gaze',
  'kneeling pose, head tilted up',
  'mid-air jump, frozen apex',
  'side profile, walking in slow strides',
  'sitting on a throne / high seat, regal posture',
] as const;
export type Shot = (typeof SHOT_POOL)[number];

export function pickShot(excludes: string[]): Shot {
  const remain = SHOT_POOL.filter((s) => !excludes.includes(s));
  const pool = remain.length > 0 ? remain : (SHOT_POOL as readonly Shot[]);
  return pool[Math.floor(Math.random() * pool.length)] as Shot;
}

// 路径 helpers：pathKey = "root" | "A" | "A.B" | "A.B.C"
export function pathDepth(pathKey: string): number {
  if (pathKey === 'root') return 0;
  return pathKey.split('.').length;
}

export function pathAncestors(pathKey: string): string[] {
  if (pathKey === 'root') return [];
  const segs = pathKey.split('.');
  const out: string[] = ['root'];
  for (let i = 1; i <= segs.length - 1; i++) out.push(segs.slice(0, i).join('.'));
  return out;
}

export function isFinalDepth(pathKey: string): boolean {
  return pathDepth(pathKey) === 3;
}
