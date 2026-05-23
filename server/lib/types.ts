import type { Tier } from './tier.js';

export const POSE_TYPES = [
  '趴桌型', '仰头型', '手撑头型', '椅背瘫型',
  '走神望天型', '假装思考型', '无人值守型',
] as const;

export type PoseType = typeof POSE_TYPES[number];

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnalyzeResult {
  pose_type: PoseType;
  desk_objects: string[];
  moyu_score: number;
  level_tier: Tier;
  title_candidates: [string, string, string];
  report: {
    paragraph: string;
    yi: [string, string, string];
    ji: [string, string, string];
  };
  face_boxes: FaceBox[];
}

export interface AnalyzeRequest {
  image: string;
  provider?: 'doubao' | 'gpt4o';
}
