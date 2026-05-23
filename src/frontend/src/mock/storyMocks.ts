/**
 * 离线兜底用的预录剧情。?mock=1 或 API 抽风时使用。
 *
 * Part 2 设计（5 节点 / 3 策略 / 宜忌强约束 / 6 结局），见
 *   docs/superpowers/specs/2026-05-23-摸鱼御史-part2-剧情游戏.md
 *
 * 旁白/对白用 {NAME} 占位，渲染前会被 StoryScreen.applyNameToArc 替换为玩家姓名。
 */

import { StoryArc, StoryContext, StoryChoice } from '../types';

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

// 选项工厂：方便写五幕
function c(
  label: string,
  strategy: StoryChoice['strategy'],
  yijiMatch: StoryChoice['yijiMatch'],
  yijiKeyword: string | null,
  nextNodeId: string,
  statDelta: Record<string, number> = {}
): StoryChoice {
  return { label, strategy, yijiMatch, yijiKeyword, nextNodeId, statDelta };
}

export const MOCK_STORY_ARC: StoryArc = {
  introPanel: {
    narration:
      '甲辰年某日，紫微星偏东南三度。{NAME}踏入御史房，案上冷美式凝结成霜，键盘灯影微闪——今日命途未卜。',
    characterLine: '（{NAME}低吟）凡间一日，须演完五幕。',
    imagePrompt:
      'A young office worker entering an ancient-meets-modern imperial office at dawn, ' +
      'parchment scrolls and a glowing monitor side by side, dawn light through paper windows, ' +
      'preserve facial features of reference person, anime illustration with ink-wash texture',
    imageUrl: PLACEHOLDER_IMAGE,
  },
  nodes: [
    // 辰时
    {
      id: 'node-0',
      sceneTitle: '辰时·御史临朝',
      timeSlot: '辰时',
      narration:
        '辰时三刻，{NAME}方落座工位。半杯冷美式与青轴键盘对视，工位群里弹出钉钉早会提醒。',
      characterLine: '（{NAME}揉眼）头香今日，宁先摸鱼一刻钟。',
      imagePrompt:
        'Same character sitting at the desk in the morning, half-empty coffee and clicky keyboard, ' +
        'cold dim lighting, sleepy demeanor, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        c('开屏假装查文档，实则刷短视频', '顺应天命', 'yi', '摸鱼', 'node-1', { '摸鱼值': +8 }),
        c('立即开会，主动汇报昨日 KPI', '逆天而行', 'ji', '开会', 'node-1', { '摸鱼值': -10, '警觉度': +12 }),
        c('先去茶水间观望同僚动向', '中立观望', 'neutral', null, 'node-1', { '玄学值': +5 }),
      ],
    },
    // 午前
    {
      id: 'node-1',
      sceneTitle: '午前·群中点将',
      timeSlot: '午前',
      narration:
        '午前时分，企业微信「@所有人」骤响：「下午两点临时复盘」。对面工位小李回头一笑，{NAME}心头一紧。',
      characterLine: '（{NAME}屏息）此乃天降之劫。',
      imagePrompt:
        'Same character staring at a buzzing chat window, dread on the face, ' +
        'cold afternoon light, monitor glow, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        c('继续假装思考，假寐三分钟', '顺应天命', 'yi', '假装思考', 'node-2', { '摸鱼值': +6 }),
        c('立刻群里改 PPT 至大汗淋漓', '逆天而行', 'ji', '改PPT', 'node-2', { '摸鱼值': -12 }),
        c('走到小李工位先打听情况', '中立观望', 'neutral', null, 'node-2', { '玄学值': +6 }),
      ],
    },
    // 未时
    {
      id: 'node-2',
      sceneTitle: '未时·困意如山',
      timeSlot: '未时',
      narration:
        '未时正午，饱食后困意如山压顶。空调嗡鸣，{NAME}眼皮重若千钧。窗外阳光斜射工位，似在催眠。',
      characterLine: '（{NAME}迷糊）此乃假寐良时。',
      imagePrompt:
        'Same character struggling to stay awake at desk after lunch, ' +
        'warm afternoon sun streaming in, blurry vision effect, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        c('双手托腮假寐，眼神放空', '顺应天命', 'yi', '划水', 'node-3', { '摸鱼值': +12 }),
        c('强撑精神接电话核对数据', '逆天而行', 'ji', '接电话', 'node-3', { '警觉度': +15, '摸鱼值': -8 }),
        c('起身去茶水间冲冰美式醒神', '中立观望', 'neutral', null, 'node-3', { '玄学值': +4 }),
      ],
    },
    // 申时
    {
      id: 'node-3',
      sceneTitle: '申时·危机骤至',
      timeSlot: '申时',
      narration:
        '申时刚过，老板的钉钉头像突现：「{NAME}，过来一下」。整个工位寂然无声，只闻空调风声呼啸。',
      characterLine: '（{NAME}冷汗）此劫绕不开矣。',
      imagePrompt:
        'Same character receiving a tense direct message from the boss, ' +
        'cold sweat, dramatic close-up, late afternoon golden light, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        c('从容拿起准备好的资料前去汇报', '顺应天命', 'yi', '查文档', 'node-4', { '玄学值': +12 }),
        c('先群里发言「收到」再说', '逆天而行', 'ji', '开会', 'node-4', { '警觉度': +10, '摸鱼值': -8 }),
        c('先去趟洗手间冷静三秒', '中立观望', 'neutral', null, 'node-4', { '玄学值': +3 }),
      ],
    },
    // 酉时
    {
      id: 'node-4',
      sceneTitle: '酉时·终局抉择',
      timeSlot: '酉时',
      narration:
        '酉时将近，下班钟声仿佛已在耳畔。老板的方案需求未明，{NAME}面前三条路，皆通玄机。',
      characterLine: '（{NAME}深吸气）今日成败，在此一举。',
      imagePrompt:
        'Same character facing a glowing chat bubble at sunset, dramatic verdict-like lighting, ' +
        'three paths diverging in the office shadows, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
      choices: [
        c('用平日划水积累的灵感秒出方案', '顺应天命', 'yi', '假装思考', 'ending:天降祥瑞', { '玄学值': +20 }),
        c('硬刚开会主动发言扛下任务', '逆天而行', 'ji', '开会', 'ending:御史降罚', { '警觉度': +20, '摸鱼值': -20 }),
        c('装病请假明日再战', '中立观望', 'neutral', null, 'ending:哭笑不得', { '摸鱼值': +10 }),
      ],
    },
  ],
  endings: {
    天降祥瑞: {
      key: '天降祥瑞',
      endingType: '天降祥瑞',
      title: '天降祥瑞·紫微入命',
      titleAward: '祥瑞天尊',
      narration:
        '{NAME}今日紫微入命，案上冷美式竟得同事新斟之热咖。三分钟即出惊世方案，老板大悦，当场封为「划水大将军」，载入摸鱼正史。御史台传为佳话。',
      imagePrompt:
        'Hero shot of the character standing in a sunlit office, documents flying like blossoms, golden hour, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    御史降罚: {
      key: '御史降罚',
      endingType: '御史降罚',
      title: '御史降罚·当庭训斥',
      titleAward: '加班尚书',
      narration:
        '{NAME}今日触犯天条，宜忌连犯，御史台当庭训斥。周报扣分、KPI 红字、明日仍需加班至寅时。本卷收录为反面教材，警示后世员外郎。',
      imagePrompt:
        'The character being scolded at a long meeting table, scattered documents, harsh fluorescent light, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    逆天改命: {
      key: '逆天改命',
      endingType: '逆天改命',
      title: '逆天改命·咸鱼翻身',
      titleAward: '反骨员外',
      narration:
        '{NAME}虽天命低微，却凭一身反骨硬扛到底。今日方案竟得高管赞许，工位升迁有望，从「打工新丁」一跃成「划水侍郎」。御史房传：天命不绝勤者。',
      imagePrompt:
        'The character standing victorious at a promotion moment, paperwork in hand, soft uplifting light, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    贵人相助: {
      key: '贵人相助',
      endingType: '贵人相助',
      title: '贵人相助·神之援手',
      titleAward: '同舟侍郎',
      narration:
        '{NAME}本应翻车，奈何同事小李神助攻，悄悄替补一份方案。老板未察，{NAME}得以全身而退。御史房叹：人脉胜过天命。',
      imagePrompt:
        'The character receiving a folder from a friendly colleague in dim office light, ' +
        'warm camaraderie tone, keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    天命应验: {
      key: '天命应验',
      endingType: '天命应验',
      title: '天命应验·按部就班',
      titleAward: '稳健郎中',
      narration:
        '{NAME}今日宜忌皆顺，按部就班，平稳到底。无大喜亦无大悲，方案过审，按时下班。御史房曰：稳即是道。',
      imagePrompt:
        'The character calmly closing the laptop at sunset, steady demeanor, balanced composition, ' +
        'keepsake poster style, preserve facial features of reference person',
      imageUrl: PLACEHOLDER_IMAGE,
    },
    哭笑不得: {
      key: '哭笑不得',
      endingType: '哭笑不得',
      title: '哭笑不得·一日如戏',
      titleAward: '滑稽御史',
      narration:
        '{NAME}今日宜忌交织，啼笑皆非。一会儿被同事夸方案精妙，一会儿被老板批 PPT 配色辣眼。下班时方案没改完，新任务又来了。御史房叹：人生如戏。',
      imagePrompt:
        'The character with a wry confused smile walking out of the office at dusk, mixed emotions, ' +
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
  seedYi: ['摸鱼', '划水', '假装思考', '查文档'],
  seedJi: ['开会', '改PPT', '接电话'],
  levelTier: '划水侍郎',
  moyuScore: 72,
};

export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('mock')
    || new URLSearchParams(window.location.search).has('offline');
}
