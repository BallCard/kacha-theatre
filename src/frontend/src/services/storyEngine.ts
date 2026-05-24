/**
 * 剧情引擎：核心负责生成「整棵剧情树」和「每帧连环画」。
 *
 * Part 2 设计（见 docs/superpowers/specs/2026-05-23-kacha-juchang-part2-design.md）：
 *   - 1 开篇 + 5 节点（辰/午前/未/申/酉）+ 6 结局
 *   - 每节点 3 选项分别对应「顺应天命 / 逆天而行 / 中立观望」
 *   - 每节点至少 1 个选项 yijiMatch='yi'、至少 1 个 yijiMatch='ji'，关键词必须来自 Part 1 奏折
 *   - 结局由前端规则函数 determineEnding(yi_hits, ji_hits, level_tier) 判定，不依赖 LLM
 *
 * 流程：
 *   generateStoryArc(ctx)   → 1 次 LLM 调用，出 intro + 5 节点 + 6 结局的完整 JSON
 *   determineEnding(ctx, hits) → 纯前端规则，返回 EndingType key
 *   generatePanelImage(...) → 按需出图（gpt-image-2 走参考图保留真人特征）
 *   generateEndingImage(...) → 同上，但是 keepsake 风格
 */

import {
  StoryContext,
  StoryArc,
  PanelSpec,
  EndingSpec,
  StoryNode,
  StoryChoice,
  ChoiceStrategy,
  YijiMatch,
  EndingType,
} from '../types';
import { chatCompletion, imageEdit, ImageEditResult } from './openaiClient';

// ============================================================
// 1. 剧情树生成
// ============================================================

const TIME_SLOTS = ['辰时', '午前', '未时', '申时', '酉时'] as const;
const STRATEGY_ORDER: ChoiceStrategy[] = ['顺应天命', '逆天而行', '中立观望'];
const ALL_ENDING_TYPES: EndingType[] = [
  '天降祥瑞',
  '御史降罚',
  '逆天改命',
  '贵人相助',
  '天命应验',
  '哭笑不得',
];

const STORY_SYSTEM_PROMPT = `你是御史房派驻的"演义官"，负责把一张办公室照片演成 5 幕互动剧。

【调性】
- 半文半白御史腔为主，可塞「周报 / KPI / 开会 / 划水 / 加班 / 钉钉」等现代办公词制造反差
- 嘲讽但不刻薄，不评价相貌身份，只描述行为与桌面物件
- 不识别真实身份，用「卿」「该员」「尔」或玩家提供的姓名作代称

【铁律】
1. 严格 5 节点，时段顺序固定为 辰时 / 午前 / 未时 / 申时 / 酉时
2. 每节点 3 选项，顺序固定为 A=顺应天命 / B=逆天而行 / C=中立观望
3. 每节点至少 1 个选项 yijiMatch='yi'（命中今日宜），至少 1 个 yijiMatch='ji'（命中今日忌），剩下 1 个 yijiMatch='neutral'
4. 选项的 yijiKeyword 必须从用户提供的「今日宜」「今日忌」原文里挑，不要造新词
5. 至少有 1 个选项的描述里嵌入用户照片中的 desk_objects 元素，让用户感到"这就是我"
6. 输出 6 个结局，endings 的 key 必须正好是 ${ALL_ENDING_TYPES.map((e) => `"${e}"`).join(' / ')}
7. 严格 JSON，不要 markdown 包裹

【JSON Schema】
{
  "introPanel": {
    "narration": "30-80字 旁白",
    "characterLine": "可选 20-40字 主角内心独白",
    "imagePrompt": "英文场景 prompt，必含 preserve facial features of the reference person"
  },
  "nodes": [
    {
      "id": "node-0",
      "sceneTitle": "8-12字，带时辰前缀，如「辰时·御史临朝」",
      "timeSlot": "辰时|午前|未时|申时|酉时",
      "narration": "80-150字 旁白，至少 1 个 desk_objects 出现",
      "characterLine": "可选 20-40字 对白",
      "imagePrompt": "英文场景 prompt",
      "choices": [
        {
          "label": "12-20字 选项文案",
          "strategy": "顺应天命|逆天而行|中立观望",
          "yijiMatch": "yi|ji|neutral",
          "yijiKeyword": "来自今日宜/忌列表的关键词，neutral 时为 null",
          "statDelta": { "数值名": +/- 数字 },
          "nextNodeId": "node-1|node-2|node-3|node-4|ending:<type>"
        }
      ]
    }
  ],
  "endings": {
    "天降祥瑞": { "title": "...", "narration": "120-180字", "imagePrompt": "...", "titleAward": "4-6字封号" },
    "御史降罚": { ... },
    "逆天改命": { ... },
    "贵人相助": { ... },
    "天命应验": { ... },
    "哭笑不得": { ... }
  }
}

【硬性要求】
- nodes 长度必须是 5
- 每个 node 的 choices 长度必须是 3，按 顺应天命 / 逆天而行 / 中立观望 顺序
- node-4（酉时·最后一个互动节点）的 choices 的 nextNodeId 必须都是 ending:xxx
- 中间节点（0-3）的 nextNodeId 指向下一个 node-N
- endings 必须正好 6 个，key 必须是 ${ALL_ENDING_TYPES.join(' / ')}
- imagePrompt 一律英文，必须含「preserve facial features of the reference person」
- 如玩家提供了姓名，旁白和对白中至少自然出现 2 次该姓名`;

function buildUserPrompt(ctx: StoryContext): string {
  const yi = ctx.seedYi && ctx.seedYi.length ? ctx.seedYi.join('、') : '（未提供）';
  const ji = ctx.seedJi && ctx.seedJi.length ? ctx.seedJi.join('、') : '（未提供）';
  return `世界观设定：
- 主题名：${ctx.theme.name}
- 视觉风格：${ctx.theme.visualStyle}
- 语言风格：${ctx.theme.languageStyle}

主角设定：
- 姓名：${ctx.protagonist.name || '（玩家未填，旁白请用"该员/卿/汝"等代称，不要瞎编名字）'}
- 身份：${ctx.protagonist.role}
- 外观锚点：${ctx.protagonist.appearanceHint}
- 段位：${ctx.levelTier ?? '（未指定）'}（摸鱼指数 ${ctx.moyuScore ?? '-'}）

场景：
- 当前场景：${ctx.scene.description}
- 桌面物件 desk_objects：${ctx.scene.keyObjects.join('、') || '（无）'}

今日奏折：
- 宜：${yi}
- 忌：${ji}

初始标签：${ctx.tags.join('、')}
初始数值：${JSON.stringify(ctx.initialStats, null, 2)}

请基于以上设定，生成完整 5 幕剧情树 JSON。剧情节奏建议：
- 开篇 intro：主角刚到工位，铺垫世界观
- 辰时（node-0）：到岗，第一个抉择（小事，定基调）
- 午前（node-1）：突发事件（领导 / 群消息 / 任务）
- 未时（node-2）：困倦高峰，摸鱼诱惑最大
- 申时（node-3）：危机降临
- 酉时（node-4）：终局抉择，3 选项分别指向不同结局类型

记住：选项的 yijiKeyword **必须从上方"宜/忌"列表里挑**，不要造新词；neutral 时该字段为 null。`;
}

export async function generateStoryArc(ctx: StoryContext): Promise<StoryArc> {
  const raw = await chatCompletion({
    messages: [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(ctx) },
    ],
    jsonMode: true,
    temperature: 0.95,
    maxTokens: 4500,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`剧情 JSON 解析失败：${(err as Error).message}\n原文：${raw.slice(0, 200)}…`);
  }

  const arc = normalizeArc(parsed, ctx);
  return arc;
}

function pickYijiFiller(prev: YijiMatch[]): YijiMatch {
  // 兜底补 yijiMatch：保证 yi + ji 至少各 1 个，剩下补 neutral
  const hasYi = prev.includes('yi');
  const hasJi = prev.includes('ji');
  if (!hasYi) return 'yi';
  if (!hasJi) return 'ji';
  return 'neutral';
}

function normalizeArc(raw: any, ctx: StoryContext): StoryArc {
  if (!raw?.introPanel?.imagePrompt) {
    throw new Error('剧情 JSON 缺 introPanel');
  }
  if (!Array.isArray(raw?.nodes) || raw.nodes.length === 0) {
    throw new Error('剧情 JSON 缺 nodes');
  }
  if (!raw?.endings || Object.keys(raw.endings).length < 1) {
    throw new Error('剧情 JSON 缺 endings');
  }

  // 强制 nodes id 规范化为 node-0..4，5 节点
  const sliced = raw.nodes.slice(0, 5);
  const nodes: StoryNode[] = sliced.map((n: any, i: number) => {
    const isLast = i === 4 || i === sliced.length - 1;
    const fallbackNext = isLast ? `ending:${ALL_ENDING_TYPES[i % ALL_ENDING_TYPES.length]}` : `node-${i + 1}`;
    const rawChoices: any[] = Array.isArray(n.choices) ? n.choices : [];

    let choices: StoryChoice[] = rawChoices.slice(0, 3).map((c: any, ci: number): StoryChoice => {
      const strategy = (STRATEGY_ORDER.includes(c.strategy) ? c.strategy : STRATEGY_ORDER[ci % 3]) as ChoiceStrategy;
      const yijiMatch: YijiMatch =
        c.yijiMatch === 'yi' || c.yijiMatch === 'ji' || c.yijiMatch === 'neutral'
          ? c.yijiMatch
          : strategy === '顺应天命'
          ? 'yi'
          : strategy === '逆天而行'
          ? 'ji'
          : 'neutral';
      return {
        label: String(c.label ?? '继续'),
        statDelta: typeof c.statDelta === 'object' && c.statDelta ? c.statDelta : {},
        nextNodeId: String(c.nextNodeId ?? fallbackNext),
        strategy,
        yijiMatch,
        yijiKeyword:
          yijiMatch === 'neutral'
            ? null
            : typeof c.yijiKeyword === 'string'
            ? c.yijiKeyword
            : pickFirstSeed(ctx, yijiMatch) ?? null,
      };
    });

    // 不足 3 个就补足
    while (choices.length < 3) {
      const ci = choices.length;
      const strategy = STRATEGY_ORDER[ci];
      const yijiMatch = pickYijiFiller(choices.map((c) => c.yijiMatch ?? 'neutral'));
      choices.push({
        label: ['继续观望', '听天由命', '另作他想'][ci],
        statDelta: {},
        nextNodeId: fallbackNext,
        strategy,
        yijiMatch,
        yijiKeyword: yijiMatch === 'neutral' ? null : pickFirstSeed(ctx, yijiMatch) ?? null,
      });
    }

    // 强约束：yi 至少 1，ji 至少 1
    const hasYi = choices.some((c) => c.yijiMatch === 'yi');
    const hasJi = choices.some((c) => c.yijiMatch === 'ji');
    if (!hasYi) {
      // 找一个 neutral 改成 yi
      const idx = choices.findIndex((c) => c.yijiMatch === 'neutral');
      const target = idx >= 0 ? idx : 0;
      choices[target] = {
        ...choices[target],
        yijiMatch: 'yi',
        yijiKeyword: pickFirstSeed(ctx, 'yi') ?? choices[target].yijiKeyword ?? null,
      };
    }
    if (!hasJi) {
      const idx = choices.findIndex((c) => c.yijiMatch === 'neutral');
      const target = idx >= 0 ? idx : choices.length - 1;
      choices[target] = {
        ...choices[target],
        yijiMatch: 'ji',
        yijiKeyword: pickFirstSeed(ctx, 'ji') ?? choices[target].yijiKeyword ?? null,
      };
    }

    return {
      id: `node-${i}`,
      sceneTitle: String(n.sceneTitle ?? `${TIME_SLOTS[i] ?? ''}·第${i + 1}幕`),
      timeSlot: (TIME_SLOTS as readonly string[]).includes(n.timeSlot) ? n.timeSlot : TIME_SLOTS[i],
      narration: String(n.narration ?? ''),
      characterLine: n.characterLine ? String(n.characterLine) : undefined,
      imagePrompt: String(n.imagePrompt ?? ''),
      choices,
    };
  });

  // 补足到 5 节点（如果 LLM 少出）
  while (nodes.length < 5) {
    const i = nodes.length;
    const isLast = i === 4;
    const fallbackNext = isLast ? `ending:${ALL_ENDING_TYPES[0]}` : `node-${i + 1}`;
    nodes.push({
      id: `node-${i}`,
      sceneTitle: `${TIME_SLOTS[i]}·留白幕`,
      timeSlot: TIME_SLOTS[i],
      narration: `（${TIME_SLOTS[i]}·此幕暂留白）`,
      imagePrompt: 'placeholder office scene, preserve facial features of the reference person',
      choices: STRATEGY_ORDER.map((s, ci): StoryChoice => ({
        label: `（${s}）继续`,
        statDelta: {},
        nextNodeId: fallbackNext,
        strategy: s,
        yijiMatch: ci === 0 ? 'yi' : ci === 1 ? 'ji' : 'neutral',
        yijiKeyword:
          ci === 0 ? pickFirstSeed(ctx, 'yi') ?? null : ci === 1 ? pickFirstSeed(ctx, 'ji') ?? null : null,
      })),
    });
  }

  // 最后一个节点 (node-4) 的选项必须指向 ending
  const lastNode = nodes[nodes.length - 1];
  lastNode.choices = lastNode.choices.map((c, ci) =>
    c.nextNodeId.startsWith('ending:')
      ? c
      : { ...c, nextNodeId: `ending:${ALL_ENDING_TYPES[ci % ALL_ENDING_TYPES.length]}` }
  );

  // endings：补足 6 种，缺的用 LLM 出过的任意结局兜底
  const endings: Record<string, EndingSpec> = {};
  for (const key of Object.keys(raw.endings)) {
    const e = raw.endings[key];
    if (!e) continue;
    const endingType = (ALL_ENDING_TYPES as readonly string[]).includes(key)
      ? (key as EndingType)
      : undefined;
    endings[key] = {
      key,
      title: String(e.title ?? key),
      narration: String(e.narration ?? ''),
      imagePrompt: String(e.imagePrompt ?? 'imperial keepsake poster, preserve facial features of the reference person'),
      endingType,
      titleAward: typeof e.titleAward === 'string' ? e.titleAward : undefined,
    };
  }
  // 缺的 ending 用第一个兜底
  const firstExisting = Object.values(endings)[0];
  for (const t of ALL_ENDING_TYPES) {
    if (!endings[t]) {
      endings[t] = firstExisting
        ? { ...firstExisting, key: t, endingType: t, title: `${t}·御史秘录` }
        : {
            key: t,
            title: `${t}·御史秘录`,
            narration: `（${t}·此结局留白）`,
            imagePrompt: 'imperial keepsake poster, preserve facial features of the reference person',
            endingType: t,
          };
    }
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

function pickFirstSeed(ctx: StoryContext, kind: 'yi' | 'ji'): string | null {
  const list = kind === 'yi' ? ctx.seedYi : ctx.seedJi;
  return list && list.length ? list[0] : null;
}

// ============================================================
// 1.5 结局判定规则（前端纯本地，不依赖 LLM）
// 见 §4.2 of part2-剧情游戏.md
// ============================================================
export function determineEnding(
  ctx: StoryContext,
  yiHits: number,
  jiHits: number
): EndingType {
  const tier = ctx.levelTier;

  // 优先级 1: level_tier == 假寐天尊 且 yi_hits >= 3
  if (tier === '假寐天尊' && yiHits >= 3) return '天降祥瑞';

  // 优先级 2: ji_hits >= 3
  if (jiHits >= 3) return '御史降罚';

  // 优先级 3: 打工新丁/划水学徒 且 yi_hits >= 4
  if ((tier === '打工新丁' || tier === '划水学徒') && yiHits >= 4) return '逆天改命';

  // 优先级 4: 打工新丁/划水学徒 且 ji_hits >= 2 但未触发降罚
  if ((tier === '打工新丁' || tier === '划水学徒') && jiHits >= 2) return '贵人相助';

  // 优先级 5: yi_hits >= 3 且 ji_hits <= 1
  if (yiHits >= 3 && jiHits <= 1) return '天命应验';

  // 兜底
  return '哭笑不得';
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
