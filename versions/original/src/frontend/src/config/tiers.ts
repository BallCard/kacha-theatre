export interface TierDetail {
  readonly range: readonly [number, number];
  readonly color: string;
  readonly seal: string;
  readonly aura?: boolean;
}

export const TIER_CONFIG: Record<string, TierDetail> = {
  "打工新丁":    { range: [0, 20],   color: "#9aa1a8", seal: "tier_seal_01_xinding" },
  "划水学徒":    { range: [21, 40],  color: "#3b6fa0", seal: "tier_seal_02_xuetu" },
  "摸鱼修士":    { range: [41, 60],  color: "#3f8c5a", seal: "tier_seal_03_xiushi" },
  "划水侍郎":    { range: [61, 80],  color: "#7a3c8f", seal: "tier_seal_04_shilang" },
  "摸鱼大将军":  { range: [81, 95],  color: "#d4222b", seal: "tier_seal_05_dajiangjun" },
  "假寐天尊":    { range: [96, 100], color: "#d4222b", seal: "tier_seal_06_tianzun", aura: true }
} as const;

export type TierName = keyof typeof TIER_CONFIG;
