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
// 互动剧情 Part 2 v2（替换旧 5 节点古风版）
// ============================================================

export const STORY_THEMES = ['宫斗剧', '穿越重生', '悬疑探案', '打脸', '爽文'] as const;
export type StoryTheme = (typeof STORY_THEMES)[number];

export const STORY_ART_STYLES = ['恋与深空', '蓝色监狱', '仙逆'] as const;
export type StoryArtStyle = (typeof STORY_ART_STYLES)[number];

export type StoryChoiceId = 'A' | 'B' | 'C';

export interface StoryNodeChoice {
  id: StoryChoiceId;
  text: string;
}

export interface StoryEnding {
  type: string;
  verdict: string;
  aWins: boolean;
}

export interface StoryNodeResponse {
  pathKey: string;
  imageHash: string;
  imageUrl: string;
  narration: string;
  characterLine?: string;
  imagePrompt: string;
  choices: StoryNodeChoice[] | null;
  ending: StoryEnding | null;
  shotUsed: string;
  modelUsed?: string;
  cacheHit: boolean;
}

export interface StoryWalkStep {
  pathKey: string;
  node: StoryNodeResponse;
  chosen?: StoryChoiceId;
}

