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
