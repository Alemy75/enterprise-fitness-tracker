import { describe, expect, it } from 'vitest';
import { CursorPageQuery, Uuid } from './common.js';

describe('Uuid', () => {
  it('accepts UUIDv7', () => {
    expect(Uuid.safeParse('019a0f3c-7b2e-7c1a-9f3e-2b4d6a8c0e12').success).toBe(true);
  });

  it('rejects UUIDv4', () => {
    expect(Uuid.safeParse('9b2f6c1e-4d3a-4b8e-9f2a-1c3e5a7b9d0f').success).toBe(false);
  });
});

describe('CursorPageQuery', () => {
  it('defaults limit and coerces strings from the query string', () => {
    expect(CursorPageQuery.parse({})).toEqual({ limit: 50 });
    expect(CursorPageQuery.parse({ limit: '10' })).toEqual({ limit: 10 });
  });

  it('caps limit at 200', () => {
    expect(CursorPageQuery.safeParse({ limit: 500 }).success).toBe(false);
  });
});
