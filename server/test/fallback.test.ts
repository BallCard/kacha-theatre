import { describe, it, expect } from 'vitest';
import { FALLBACK_RESULT, makeFallback } from '../lib/fallback.js';
import { validateAnalyzeResult } from '../lib/schema.js';

describe('FALLBACK_RESULT', () => {
  it('passes schema validation', () => {
    const r = validateAnalyzeResult(FALLBACK_RESULT);
    expect(r.ok).toBe(true);
  });
});

describe('makeFallback', () => {
  it('returns a deep clone (no shared reference)', () => {
    const a = makeFallback();
    const b = makeFallback();
    a.title_candidates[0] = 'mutated';
    expect(b.title_candidates[0]).not.toBe('mutated');
  });
});
