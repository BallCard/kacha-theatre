/**
 * 离线兜底用的预录剧情。?mock=1 或 API 抽风时使用。
 *
 * 设计：摸鱼御史主题完整可通关，3 节点 + 2 结局。
 * 图片用占位 SVG dataURL（一张就够，所有分镜共用），
 * 真实演示前可以手动替换为预生成的 6 张图。
 */

import { StoryArc, StoryContext } from '../types';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f0c869"/>
      <stop offset="60%" stop-color="#d4222b"/>
      <stop offset="100%" stop-color="#5a1a1f"/>
    </radialGradient>
    <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#fdfaf2" opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="1024" height="1536" fill="url(#g)"/>
  <rect width="1024" height="1536" fill="url(#dots)"/>
  <text x="512" y="720" font-family="STKaiti, Kaiti, serif" font-size="120" font-weight="900"
        fill="#fdfaf2" text-anchor="middle" opacity="0.92">御史落墨</text>
  <text x="512" y="850" font-family="STKaiti, Kaiti, serif" font-size="42"
        fill="#fdfaf2" text-anchor="middle" opacity="0.75">（离线兜底·示意图）</text>
</svg>`);

export const MOCK_STORY_ARC: StoryArc = {
  introPanel: {
    narration:
      '甲辰年某未时，紫微星偏东南三度。御史房内冷美式凝结成霜，{NAME}瘫坐工位之上，魂在云端。',
    characterLine: '（{NAME}轻声）今日……要不要再小憩一炷香？',
    imagePrompt:
      'A young office worker slumped at an ancient desk in a fusion of imperial Chinese ministry and modern office, ' +
      'twilight light streaming through paper windows, half-empty coffee on the desk, ' +
      'preserve facial features of reference person, anime illustration with ink-wash texture',
    imageUrl: PLACEHOLDER_IMAGE,
  },
  nodes: [
    {
      id: 'node-0',
      narration: '忽闻同僚脚步声渐近，似要派活，{NAME}心头一紧。',
      characterLine: '（屏息）此乃生死攸关之刻。',
      imagePrompt:
        'Same character at desk, sensing a colleague approaching from behind, ' +
        'tense expression, dramatic over-the-shoulder shot, ' +
        'preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        {
          label: '迅速假装在改 PPT',
          statDelta: { '摸鱼值': -8, '警觉度': +15 },
          nextNodeId: 'node-1',
        },
        {
          label: '装作没听见，继续假寐',
          statDelta: { '摸鱼值': +5, '警觉度': -5, '玄学值': +10 },
          nextNodeId: 'node-1',
        },
        {
          label: '起身去茶水间避风头',
          statDelta: { '摸鱼值': +3, '警觉度': +5, '玄学值': +5 },
          nextNodeId: 'node-1',
        },
      ],
    },
    {
      id: 'node-1',
      narration: '同僚却只是路过，未派活。但片刻后，老板的钉钉响了，{NAME}盯着屏幕，冷汗如珠。',
      characterLine: '（盯着屏幕）老板……他在打字。',
      imagePrompt:
        'Same character staring at a glowing screen with a typing-indicator notification, ' +
        'cold sweat, dramatic close-up of the worried face, ' +
        'preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        {
          label: '主动出击，先发汇报',
          statDelta: { '摸鱼值': -15, '警觉度': +20 },
          nextNodeId: 'node-2',
        },
        {
          label: '装作没看见，关掉屏幕',
          statDelta: { '摸鱼值': +10, '警觉度': -10, '玄学值': +15 },
          nextNodeId: 'node-2',
        },
        {
          label: '默默撤回上一条朋友圈',
          statDelta: { '摸鱼值': +2, '警觉度': +8, '玄学值': +6 },
          nextNodeId: 'node-2',
        },
      ],
    },
    {
      id: 'node-2',
      narration: '老板的消息终于发来：「下午五点要的方案，做好了吗？」',
      characterLine: '（深吸一口气）今日……成败在此一举。',
      imagePrompt:
        'Same character facing a glowing chat message bubble that fills the screen, ' +
        'dramatic lighting like a courtroom verdict, climactic moment, ' +
        'preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        {
          label: '硬刚：编一个完美方案',
          statDelta: { '摸鱼值': -5, '玄学值': +20 },
          nextNodeId: 'ending:legend',
        },
        {
          label: '装病：今日告退',
          statDelta: { '摸鱼值': +20, '警觉度': -20 },
          nextNodeId: 'ending:escape',
        },
        {
          label: '已读不回，假装失联',
          statDelta: { '摸鱼值': +12, '警觉度': -8, '玄学值': +12 },
          nextNodeId: 'ending:ghost',
        },
      ],
    },
  ],
  endings: {
    legend: {
      key: 'legend',
      title: '假寐天尊·乘风破浪',
      narration:
        '{NAME}神来一笔，凭借多年摸鱼积累的玄学功力，三分钟编出了惊艳全场的方案。老板大悦，当场封为「划水大将军」。御史台传为佳话，{NAME}之名载入摸鱼正史。',
      imagePrompt:
        'Hero shot of the character standing victorious in a sunlit office, ' +
        'documents flying around like cherry blossoms, golden hour lighting, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    escape: {
      key: 'escape',
      title: '咸鱼大遁·神隐结局',
      narration:
        '{NAME}临危不乱，假装腹痛速速告退，溜之大吉。当晚老板亲自加班赶完方案，从此再不敢派活。{NAME}遂成御史房传说，曰「咸鱼祖师」。',
      imagePrompt:
        'The character walking out of the office at dusk with a serene smile, ' +
        'a backpack over the shoulder, the sun setting behind glass towers, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    ghost: {
      key: 'ghost',
      title: '已读修罗·失联结局',
      narration:
        '{NAME}索性熄屏断网，化身赛博幽灵。手机静音、座机拔线、企微离线，三更钟后悄然下班。次日，老板群里只见一片「？」，从此{NAME}被供奉为「失联御史」，列入摸鱼史录。',
      imagePrompt:
        'The character silhouetted against a row of dimmed monitors, leaving the office in stealth, ' +
        'a soft phantom-like aura around them, dramatic cool-tone lighting, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
  },
};

export const MOCK_STORY_CONTEXT: StoryContext = {
  theme: {
    id: 'moyu-yushi',
    name: '摸鱼御史·御史房',
    visualStyle:
      'chinese ancient court painting style fused with modern anime illustration, ' +
      'warm earthy palette, parchment texture',
    languageStyle: '半文半白、玄学占卜调',
  },
  protagonist: {
    role: '划水侍郎·御史房新进员外郎',
    referenceImageBase64: '',
    appearanceHint: 'office worker in a relaxed slacking posture, modern casual attire',
  },
  scene: {
    description: '黄昏的御史房，工位上的冷美式凝结成霜',
    keyObjects: ['半凉拿铁', '黑屏显示器', '未审PPT'],
  },
  tags: ['趴桌型', '划水侍郎', '假装思考'],
  initialStats: {
    '摸鱼值': 72,
    '警觉度': 18,
    '玄学值': 60,
  },
};

export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('mock')
    || new URLSearchParams(window.location.search).has('offline');
}
