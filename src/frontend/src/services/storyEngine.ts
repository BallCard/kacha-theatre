/**
 * 剧情引擎：核心负责生成「整棵剧情树」和「每帧连环画」。
 *
 * 流程：
 *   generateStoryArc(ctx)   → 1 次 LLM 调用，出 intro + 3 节点 + 2 结局的完整 JSON
 *   generatePanelImage(...) → 按需出图（gpt-image-2 走参考图保留真人特征）
 *   generateEndingImage(...) → 同上，但是 keepsake 风格
 */

import {
  StoryContext,
  StoryArc,
  PanelSpec,
  EndingSpec,
  StoryNode,
} from '../types';
import { chatCompletion, imageEdit, ImageEditResult } from './openaiClient';

// ============================================================
// 1. 剧情树生成
// ============================================================

const STORY_SYSTEM_PROMPT = `你是一位连环画互动剧情编剧。
你会拿到一份"世界观设定 + 主角设定"，需要输出一个完整剧情树，要素包括：

- 1 个开篇分镜（intro）：把场景"漫画化"地铺开，建立世界观和角色身份
- 3 个互动节点（nodes）：每个节点是一帧分镜 + 3 个选项，选项会改变数值和走向
- 至少 2 个结局（endings）：根据数值或选择路径分流

输出格式严格遵循以下 JSON Schema（不要任何解释文字，只返回 JSON）：

{
  "introPanel": {
    "narration": "string, 30-80字, 旁白",
    "characterLine": "string?, 20-40字, 主角内心独白或对白（可选）",
    "imagePrompt": "string, 详细英文场景 prompt 用于图生图，必须包含具体动作/光线/构图"
  },
  "nodes": [
    {
      "id": "node-0",
      "narration": "string, 30-80字",
      "characterLine": "string?, 20-40字",
      "imagePrompt": "string, 详细英文场景 prompt",
      "choices": [
        {
          "label": "string, 8-16字, 选项文案",
          "statDelta": { "数值名": +/- 数字, ... },
          "nextNodeId": "node-1 | node-2 | ending:good | ending:bad | ending:weird"
        }
      ]
    }
  ],
  "endings": {
    "good": {
      "key": "good",
      "title": "string, 6-12字, 结局标题，最好带主题风格印章感",
      "narration": "string, 50-120字, 结局长文案",
      "imagePrompt": "string, 详细英文场景 prompt，keepsake poster style"
    },
    "bad": { ... }
  }
}

硬性要求：
1. nodes 长度必须是 3
2. 每个 node 的 choices 长度必须是 3
3. endings 至少 2 个，key 任选（good/bad/weird/perfect/disaster…）
4. node-2（最后一个互动节点）的选项 nextNodeId 必须指向 ending:xxx
5. 文案语言风格必须严格匹配输入的 languageStyle
6. 数值变化范围合理（±3 到 ±20 之间）
7. 旁白和对白要有戏剧张力，避免说教
8. imagePrompt 用英文，必须包含「preserve facial features of the reference person」
9. 如果输入提供了「主角姓名」，旁白和对白中至少自然出现 2 次该姓名（不要生硬地把名字塞到每句话开头）`;

function buildUserPrompt(ctx: StoryContext): string {
  return `世界观设定：
- 主题名：${ctx.theme.name}
- 视觉风格：${ctx.theme.visualStyle}
- 语言风格：${ctx.theme.languageStyle}

主角设定：
- 姓名：${ctx.protagonist.name || '（玩家未填，旁白请用"该员/卿/汝"等代称，不要瞎编名字）'}
- 身份：${ctx.protagonist.role}
- 外观锚点：${ctx.protagonist.appearanceHint}

场景：
- 当前场景：${ctx.scene.description}
- 关键道具：${ctx.scene.keyObjects.join('、') || '（无）'}

初始标签：${ctx.tags.join('、')}
初始数值：${JSON.stringify(ctx.initialStats, null, 2)}

请基于以上设定，生成完整剧情树 JSON。剧情节奏建议：
- 开篇铺设世界观，引出"今日有事发生"
- 节点 0：第一个抉择（小事，定基调）
- 节点 1：转折（出现意外或冲突）
- 节点 2：高潮抉择（指向结局分流）

记住：结局要有反转或情绪点，不要平庸收尾。`;
}

export async function generateStoryArc(ctx: StoryContext): Promise<StoryArc> {
  const raw = await chatCompletion({
    messages: [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(ctx) },
    ],
    jsonMode: true,
    temperature: 0.95,
    maxTokens: 2500,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`剧情 JSON 解析失败：${(err as Error).message}\n原文：${raw.slice(0, 200)}…`);
  }

  // 软校验 + 自愈
  const arc = normalizeArc(parsed);
  return arc;
}

function normalizeArc(raw: any): StoryArc {
  if (!raw?.introPanel?.imagePrompt) {
    throw new Error('剧情 JSON 缺 introPanel');
  }
  if (!Array.isArray(raw?.nodes) || raw.nodes.length === 0) {
    throw new Error('剧情 JSON 缺 nodes');
  }
  if (!raw?.endings || Object.keys(raw.endings).length < 1) {
    throw new Error('剧情 JSON 缺 endings');
  }

  // 强制 nodes id 规范化为 node-0/1/2，避免 LLM 乱起名
  const nodes: StoryNode[] = raw.nodes.slice(0, 3).map((n: any, i: number) => {
    const fallbackNext = i < 2 ? `node-${i + 1}` : 'ending:good';
    const rawChoices: any[] = Array.isArray(n.choices) ? n.choices : [];
    let choices = rawChoices.slice(0, 3).map((c: any) => ({
      label: String(c.label ?? '继续'),
      statDelta: typeof c.statDelta === 'object' && c.statDelta ? c.statDelta : {},
      nextNodeId: String(c.nextNodeId ?? fallbackNext),
    }));
    // 不足 3 个就补兜底选项，保证 UI 永远 3 选 1
    const fillers = [
      { label: '继续观望', statDelta: {}, nextNodeId: fallbackNext },
      { label: '另作他想', statDelta: {}, nextNodeId: fallbackNext },
      { label: '听天由命', statDelta: {}, nextNodeId: fallbackNext },
    ];
    while (choices.length < 3) choices.push(fillers[choices.length]);
    return {
      id: `node-${i}`,
      narration: String(n.narration ?? ''),
      characterLine: n.characterLine ? String(n.characterLine) : undefined,
      imagePrompt: String(n.imagePrompt ?? ''),
      choices,
    };
  });

  // 强制最后一个节点的选项指向 ending
  const lastNode = nodes[nodes.length - 1];
  lastNode.choices = lastNode.choices.map((c) =>
    c.nextNodeId.startsWith('ending:') ? c : { ...c, nextNodeId: 'ending:good' }
  );

  const endings: Record<string, EndingSpec> = {};
  for (const key of Object.keys(raw.endings)) {
    const e = raw.endings[key];
    if (!e?.imagePrompt) continue;
    endings[key] = {
      key,
      title: String(e.title ?? '神秘结局'),
      narration: String(e.narration ?? ''),
      imagePrompt: String(e.imagePrompt),
    };
  }

  return {
    introPanel: {
      narration: String(raw.introPanel.narration ?? ''),
      characterLine: raw.introPanel.characterLine ? String(raw.introPanel.characterLine) : undefined,
      imagePrompt: String(raw.introPanel.imagePrompt),
    },
    nodes,
    endings,
  };
}

// ============================================================
// 2. 分镜图生成
// ============================================================

const IMAGE_NEGATIVE_KEYWORDS = 'no text, no captions, no watermark, no subtitles';

// Fast 档：默认 'low'（gpt-image-2 出图速度 ~5-10s）；可通过 VITE_IMAGE_QUALITY 覆盖。
const IMAGE_QUALITY = (import.meta.env.VITE_IMAGE_QUALITY as string | undefined) || 'low';
// Fast 档下用 1024x1024 而非 1024x1536，再砍 ~30% 时延；高保真模式可改回。
const IMAGE_SIZE = (import.meta.env.VITE_IMAGE_SIZE as ImageSize | undefined)
  || (IMAGE_QUALITY === 'low' || IMAGE_QUALITY === 'medium' ? '1024x1024' : '1024x1536');

type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | '1792x1024' | '1024x1792';
type ImageQuality = 'low' | 'medium' | 'high' | 'auto' | 'standard' | 'hd';

function composeImagePrompt(panel: PanelSpec | EndingSpec, ctx: StoryContext, opts?: { keepsake?: boolean }): string {
  const parts = [
    ctx.theme.visualStyle,
    'anime illustration, comic panel composition, vertical poster framing',
    `character: ${ctx.protagonist.appearanceHint}`,
    `scene: ${panel.imagePrompt}`,
    'preserve the facial features, hairstyle, and overall aura of the reference person',
    opts?.keepsake ? 'keepsake poster style, dramatic centered composition' : 'cinematic lighting',
    IMAGE_NEGATIVE_KEYWORDS,
  ];
  return parts.filter(Boolean).join(', ');
}

export async function generatePanelImage(
  panel: PanelSpec,
  ctx: StoryContext
): Promise<ImageEditResult> {
  return imageEdit({
    prompt: composeImagePrompt(panel, ctx),
    referenceImageBase64: ctx.protagonist.referenceImageBase64,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY as ImageQuality,
  });
}

export async function generateEndingImage(
  spec: EndingSpec,
  ctx: StoryContext
): Promise<ImageEditResult> {
  return imageEdit({
    prompt: composeImagePrompt(spec, ctx, { keepsake: true }),
    referenceImageBase64: ctx.protagonist.referenceImageBase64,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY as ImageQuality,
  });
}
