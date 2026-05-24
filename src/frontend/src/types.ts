export interface CanvasItem {
  id: string;
  type: 'sticker' | 'text';
  src?: string; // Specific SVG / image URL for stickers
  stickerType?: string; // For analytics / key mapping
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontFamily?: string;
}

export interface AnalyzeResult {
  pose_type: string;
  desk_objects: string[];
  moyu_score: number;
  level_tier: "打工新丁" | "划水学徒" | "摸鱼修士" | "划水侍郎" | "摸鱼大将军" | "假寐天尊";
  title_candidates: string[];
  report: {
    paragraph: string;
    yi: string[];
    ji: string[];
  };
  face_boxes: { x: number; y: number; w: number; h: number }[];
}

export interface StickerDefinition {
  id: string;
  name: string;
  category: 'seal' | 'bubble' | 'tag' | 'special';
  svgString: string;
}

// ============================================================
// 互动剧情游戏 (theme-agnostic)
// ============================================================

/**
 * 主题无关的剧情上下文。任何上游分析模块（当前是摸鱼主题，未来可换校园/乙游/悬疑等）
 * 都通过一个 adapter 把自己的分析结果转成 StoryContext 喂给剧情引擎。
 */
export interface StoryContext {
  theme: {
    id: string;                    // 'moyu-yushi' | 'campus' | 'otome' | ...
    name: string;                  // "摸鱼·御史房"
    visualStyle: string;           // 喂给图生图的风格锚词（"chinese ancient court painting, ukiyo-e meets anime"）
    languageStyle: string;         // 喂给 LLM 的语气描述（"半文半白、玄学占卜、互联网梗"）
  };
  protagonist: {
    role: string;                  // "御史房新进员外郎"
    name?: string;                 // 玩家自己填的姓名/化名（可选，缺省时旁白会用"该员/卿"等称呼）
    referenceImageBase64: string;  // 原照片（dataURL 或纯 base64），传给 gpt-image-2 做 reference
    appearanceHint: string;        // 外观特征描述（发型/穿着/气质），用于图生图 prompt
  };
  scene: {
    description: string;           // "黄昏的御史房，工位上的冷美式凝结成霜"
    keyObjects: string[];          // 关键道具列表
  };
  tags: string[];                  // 初始标签
  initialStats: Record<string, number>;  // 初始数值，如 { 摸鱼值: 87, 警觉度: 12 }
  // Part 2 增量：宜忌种子 + 段位（来自 Part 1 奏折）。剧情引擎用这些做选项强约束 + 结局判定。
  seedYi?: string[];               // Part 1 奏折的"宜"清单
  seedJi?: string[];               // Part 1 奏折的"忌"清单
  levelTier?: '打工新丁' | '划水学徒' | '摸鱼修士' | '划水侍郎' | '摸鱼大将军' | '假寐天尊';
  moyuScore?: number;              // 摸鱼分（0-100），影响剧情基调
}

// ============================================================
// Part 2 增量：策略 / 宜忌 / 结局类型
// ============================================================
export type ChoiceStrategy = '顺应天命' | '逆天而行' | '中立观望';
export type YijiMatch = 'yi' | 'ji' | 'neutral';
export type ChoiceOutcome = 'success' | 'fail' | 'neutral';
export type EndingType =
  | '天降祥瑞'
  | '御史降罚'
  | '逆天改命'
  | '贵人相助'
  | '天命应验'
  | '哭笑不得';

/**
 * 单个分镜：连环画的一页。
 */
export interface PanelSpec {
  narration: string;               // 旁白（top overlay）
  characterLine?: string;          // 角色对白（bottom overlay）
  imagePrompt: string;             // 英文场景 prompt，传给图生图
  imageUrl?: string;               // 惰性填充，base64 dataURL 或远程 URL
}

/**
 * 互动节点：分镜 + 选项。
 */
export interface StoryNode extends PanelSpec {
  id: string;                      // "node-0" / "node-1" / ...
  sceneTitle?: string;             // 8-12 字，带时辰前缀，如"辰时·御史临朝"
  timeSlot?: '辰时' | '午前' | '未时' | '申时' | '酉时';
  choices: StoryChoice[];          // 3 个选项（Part 2 硬约束）
}

/**
 * 选项：标签 + 数值变化 + 下一节点。
 */
export interface StoryChoice {
  label: string;                   // "推说在写汇报"
  statDelta: Record<string, number>;  // { 摸鱼值: -5, 警觉度: +10 }
  nextNodeId: string;              // 下一个节点 id；指向 "ending:<key>" 时跳结局
  // Part 2 增量
  strategy?: ChoiceStrategy;       // 顺应天命 / 逆天而行 / 中立观望
  yijiMatch?: YijiMatch;           // 'yi' = 命中今日宜；'ji' = 命中今日忌；'neutral' = 中性
  yijiKeyword?: string | null;     // 命中的关键词（必须来自 Part 1 奏折的 yi/ji 列表）
}

/**
 * 结局规格。
 */
export interface EndingSpec {
  key: string;                     // "good" / "bad" / "weird"
  title: string;                   // "假寐天尊·神隐结局"
  narration: string;               // 结局长文案
  imagePrompt: string;
  imageUrl?: string;
  // Part 2 增量
  endingType?: EndingType;         // 6 种结局之一
  titleAward?: string;             // 4-6 字额外封号，比 Part 1 称号更戏剧性
}

/**
 * 完整剧情树。由 generateStoryArc 一次性生成。
 */
export interface StoryArc {
  introPanel: PanelSpec;           // 世界观入口页
  nodes: StoryNode[];              // 3 个互动节点
  endings: Record<string, EndingSpec>;  // 至少 2 个结局
}

/**
 * 玩家运行时状态。
 */
export interface StoryRunState {
  arc: StoryArc;
  context: StoryContext;
  currentNodeId: string | null;    // null = intro 页；'ending:xxx' = 结局
  currentStats: Record<string, number>;
  choiceHistory: { nodeId: string; choiceIndex: number }[];
}
