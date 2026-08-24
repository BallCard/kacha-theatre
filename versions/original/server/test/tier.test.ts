import { describe, it, expect } from 'vitest';
import { scoreToTier, enforceTierConsistency, TIERS } from '../lib/tier.js';

describe('scoreToTier', () => {
  it.each([
    [0, '打工新丁'], [20, '打工新丁'],
    [21, '划水学徒'], [40, '划水学徒'],
    [41, '摸鱼修士'], [60, '摸鱼修士'],
    [61, '划水侍郎'], [80, '划水侍郎'],
    [81, '摸鱼大将军'], [95, '摸鱼大将军'],
    [96, '假寐天尊'], [100, '假寐天尊'],
  ])('score=%d → %s', (score, tier) => {
    expect(scoreToTier(score as number)).toBe(tier);
  });

  it('clamps out-of-range scores', () => {
    expect(scoreToTier(-5)).toBe('打工新丁');
    expect(scoreToTier(150)).toBe('假寐天尊');
  });
});

describe('enforceTierConsistency', () => {
  it('keeps tier when consistent with score', () => {
    expect(enforceTierConsistency(87, '摸鱼大将军')).toBe('摸鱼大将军');
  });
  it('overrides tier when inconsistent', () => {
    expect(enforceTierConsistency(87, '打工新丁')).toBe('摸鱼大将军');
  });
});

describe('TIERS', () => {
  it('has all 6 tiers in order', () => {
    expect(TIERS).toEqual([
      '打工新丁', '划水学徒', '摸鱼修士', '划水侍郎', '摸鱼大将军', '假寐天尊',
    ]);
  });
});
