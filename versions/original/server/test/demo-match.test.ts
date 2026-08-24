import { describe, it, expect } from 'vitest';
import { sha1OfBase64, matchDemoResult } from '../lib/demo-match.js';

describe('sha1OfBase64', () => {
  it('strips data url prefix before hashing', () => {
    const a = sha1OfBase64('data:image/jpeg;base64,SGVsbG8=');
    const b = sha1OfBase64('SGVsbG8=');
    expect(a).toBe(b);
    expect(a).toHaveLength(40);
  });
});

describe('matchDemoResult', () => {
  it('returns null when hash not in map', () => {
    expect(matchDemoResult('not-a-real-hash', {})).toBeNull();
  });
  it('returns the mapped result', () => {
    const fakeMap = {
      'abc123': { pose_type: '趴桌型' } as any,
    };
    expect(matchDemoResult('abc123', fakeMap)).toEqual({ pose_type: '趴桌型' });
  });
});
