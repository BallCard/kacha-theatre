// Part 2 LLM 系统提示词 + 单节点用户提示词构造
//
// 第一人称「我」= 拿相机的人；A = 照片中人；剧情中我始终主角光环常胜
// A 翻身的 10% 概率不由 LLM 控制，由 server/api/plot/v2/node.ts 决定后再喂 awinsHint

import type { Theme, ArtStyle, Shot } from './storyStyles.js';
import { THEME_TONE, ART_STYLE_PROMPTS, pathDepth } from './storyStyles.js';

export interface StoryNodeContext {
  theme: Theme;
  artStyle: ArtStyle;
  pathKey: string;                // root / A / A.B / A.B.C
  ancestors: AncestorBrief[];     // 从根到当前节点的父链（不含当前）
  shot: Shot;                     // 后端已选好镜头
  shotsUsedAncestors: string[];   // 父链已使用的镜头（提示 LLM 不要重复描述）
  // 终幕时由后端决定 A 是否翻身
  endingMode?: 'me_wins' | 'a_wins';
  // 给 LLM 的 A 自称（默认 "A"）
  characterAName?: string;
}

export interface AncestorBrief {
  pathKey: string;
  choiceTaken?: string;           // 上一节点用户选的选项文字
  narrationSummary?: string;      // 一句话摘要
}

export function buildStorySystemPrompt(theme: Theme, artStyle: ArtStyle, characterAName = 'A'): string {
  return `你是一个互动连环画编剧 AI。
现在要演的是一段「梦境闯入」剧情：拿相机的「我」按下快门后进入了 ${characterAName} 的梦境。
照相机只是入口，进入梦境后不必再提相机。

【世界观主题】${theme}
${THEME_TONE[theme]}

【画风（仅在生成 imagePrompt 时影响视觉关键词）】${artStyle}

【角色铁律】
1. 主视角是「我」（第一人称），${characterAName} 是配角。
2. 剧情中「我」永远更顺、更强、更有戏剧光环，可适度装/秀/装到位。
3. ${characterAName} 大多数时刻处于被动 / 被衬托 / 被打脸的位置，但要保持可爱 / 体面，不要刻意贬损。
4. 不识别真人身份，称谓只用「${characterAName}」「他」或玩家提供的代称。
5. 不评价相貌，只描述行为、衣着、姿态、表情。

【输出 JSON Schema（严格 JSON，无 markdown 包裹）】
{
  "narration": "60-140 字第一人称旁白",
  "characterLine": "可空字符串。0-30 字台词，可以是「我」的内心独白 或 ${characterAName} 的一句反应",
  "imagePrompt": "英文一段，描述当前画面。必含 'preserve facial features of the reference person'。要从给定 SHOT 关键词出发，明确人物动作/角度/构图与父节点不同。",
  "choices": [
    { "id": "A", "text": "12-22 字选项 1，描述「我」要做的事" },
    { "id": "B", "text": "12-22 字选项 2" },
    { "id": "C", "text": "12-22 字选项 3" }
  ],
  "ending": null
}

如果当前节点是「终幕」（pathKey 深度 = 3），则 "choices" 必须为 null，"ending" 必须为：
{
  "type": "戏剧化标题，6-12 字",
  "verdict": "60-140 字结局总结",
  "aWins": true | false
}
aWins 的取值会由系统在用户消息里指定，你只能按要求填写。
`;
}

export function buildStoryUserPrompt(ctx: StoryNodeContext, characterAName = 'A'): string {
  const depth = pathDepth(ctx.pathKey);
  const lines: string[] = [];

  lines.push(`【当前路径】${ctx.pathKey}（深度 ${depth} / 总 3）`);

  if (ctx.ancestors.length > 0) {
    lines.push('【父链】');
    for (const a of ctx.ancestors) {
      const seg: string[] = [`- ${a.pathKey}`];
      if (a.choiceTaken) seg.push(`选择=${a.choiceTaken}`);
      if (a.narrationSummary) seg.push(`摘要=${a.narrationSummary}`);
      lines.push(seg.join(' '));
    }
  }

  if (depth === 0) {
    lines.push('');
    lines.push('【开篇说明】');
    lines.push(`这是第一幕。开局是「我」按下相机快门进入 ${characterAName} 梦境的瞬间。`);
    lines.push(`必须在 narration 里：① 引入梦境身份背景（${characterAName} 在梦里是什么身份）；② 给出第一次冲突或选择钩子。`);
  }

  lines.push('');
  lines.push(`【镜头】imagePrompt 必须明确使用以下镜头描述并据此安排人物姿态构图：`);
  lines.push(`  SHOT = ${ctx.shot}`);
  if (ctx.shotsUsedAncestors.length > 0) {
    lines.push(`【已用过镜头】${ctx.shotsUsedAncestors.join(' | ')}（禁止再描述相同动作/角度）`);
  }

  if (ctx.endingMode) {
    lines.push('');
    lines.push('【终幕指令】');
    if (ctx.endingMode === 'a_wins') {
      lines.push(`本节点为终幕，且 ${characterAName} 反转翻身。`);
      lines.push(`要求：让 ${characterAName} 获得可爱 / 体面 / 反转洗白的结局，「我」的主角光环被打断或自嘲收尾，但不要把「我」写得太惨。`);
      lines.push('ending.aWins = true');
    } else {
      lines.push(`本节点为终幕，"我"继续顺利收尾。`);
      lines.push(`要求：戏剧化收束「我」的主角光环，${characterAName} 仍体面但被衬托。`);
      lines.push('ending.aWins = false');
    }
  }

  lines.push('');
  lines.push('请按系统提示中的 JSON Schema 严格输出。');
  return lines.join('\n');
}

// 画风注入到最终 imagePrompt（在 LLM 给出 imagePrompt 后追加）
export function applyArtStyle(rawImagePrompt: string, artStyle: ArtStyle, shot: Shot): string {
  const stylePrefix = ART_STYLE_PROMPTS[artStyle];
  return [
    stylePrefix,
    rawImagePrompt,
    `SHOT: ${shot}`,
    'preserve facial features of the reference person; the face must clearly resemble them; body pose, outfit, framing should be fresh and different from earlier panels',
    'manga / anime illustration, vertical 2:3 composition, dramatic lighting, sharp focus on the character',
  ].join('. ');
}
