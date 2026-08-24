export const TIERS = [
  '打工新丁', '划水学徒', '摸鱼修士', '划水侍郎', '摸鱼大将军', '假寐天尊',
] as const;

export type Tier = typeof TIERS[number];

export const SIGN_TYPES = [
  '下下签', '下签', '中签', '上签', '上上签',
] as const;

export type SignType = typeof SIGN_TYPES[number];

const TIER_RANGES: Array<[number, number, Tier]> = [
  [0, 20, '打工新丁'],
  [21, 40, '划水学徒'],
  [41, 60, '摸鱼修士'],
  [61, 80, '划水侍郎'],
  [81, 95, '摸鱼大将军'],
  [96, 100, '假寐天尊'],
];

const SIGN_RANGES: Array<[number, number, SignType]> = [
  [0, 20, '下下签'],
  [21, 40, '下签'],
  [41, 60, '中签'],
  [61, 80, '上签'],
  [81, 100, '上上签'],
];

export function scoreToTier(score: number): Tier {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  for (const [lo, hi, tier] of TIER_RANGES) {
    if (s >= lo && s <= hi) return tier;
  }
  return '摸鱼修士';
}

export function scoreToSign(score: number): SignType {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  for (const [lo, hi, sign] of SIGN_RANGES) {
    if (s >= lo && s <= hi) return sign;
  }
  return '中签';
}

export function enforceTierConsistency(score: number, _claimed: string): Tier {
  return scoreToTier(score);
}

export function enforceSignConsistency(score: number, _claimed: string): SignType {
  return scoreToSign(score);
}
