export const TIERS = [
  '打工新丁', '划水学徒', '摸鱼修士', '划水侍郎', '摸鱼大将军', '假寐天尊',
] as const;

export type Tier = typeof TIERS[number];

const TIER_RANGES: Array<[number, number, Tier]> = [
  [0, 20, '打工新丁'],
  [21, 40, '划水学徒'],
  [41, 60, '摸鱼修士'],
  [61, 80, '划水侍郎'],
  [81, 95, '摸鱼大将军'],
  [96, 100, '假寐天尊'],
];

export function scoreToTier(score: number): Tier {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  for (const [lo, hi, tier] of TIER_RANGES) {
    if (s >= lo && s <= hi) return tier;
  }
  return '摸鱼修士';
}

export function enforceTierConsistency(score: number, _claimed: string): Tier {
  return scoreToTier(score);
}
