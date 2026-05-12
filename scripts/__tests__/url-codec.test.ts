import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INCOME,
  DEFAULT_SIZE,
  INCOME_MAX,
  INCOME_MIN,
  SIZE_MAX,
  SIZE_MIN,
  decode,
  encode,
} from '../../src/lib/state/url-codec.ts';

function p(qs: string): URLSearchParams {
  return new URLSearchParams(qs);
}

describe('url-codec / decode', () => {
  it('returns defaults for empty params', () => {
    expect(decode(p(''))).toEqual({ income: DEFAULT_INCOME, size: DEFAULT_SIZE });
  });

  it('reads valid in-range integers', () => {
    expect(decode(p('i=4500&s=75'))).toEqual({ income: 4500, size: 75 });
  });

  it('rounds non-integer numerics', () => {
    expect(decode(p('i=4500.6&s=75.4'))).toEqual({ income: 4501, size: 75 });
  });

  it('falls back on garbage strings', () => {
    expect(decode(p('i=foo&s=bar'))).toEqual({ income: DEFAULT_INCOME, size: DEFAULT_SIZE });
  });

  it('falls back on out-of-range values', () => {
    expect(decode(p(`i=${INCOME_MIN - 1}`)).income).toBe(DEFAULT_INCOME);
    expect(decode(p(`i=${INCOME_MAX + 1}`)).income).toBe(DEFAULT_INCOME);
    expect(decode(p(`s=${SIZE_MIN - 1}`)).size).toBe(DEFAULT_SIZE);
    expect(decode(p(`s=${SIZE_MAX + 1}`)).size).toBe(DEFAULT_SIZE);
  });

  it('accepts boundary values', () => {
    expect(decode(p(`i=${INCOME_MIN}&s=${SIZE_MIN}`))).toEqual({
      income: INCOME_MIN,
      size: SIZE_MIN,
    });
    expect(decode(p(`i=${INCOME_MAX}&s=${SIZE_MAX}`))).toEqual({
      income: INCOME_MAX,
      size: SIZE_MAX,
    });
  });

  it('falls back on empty string values', () => {
    expect(decode(p('i=&s='))).toEqual({ income: DEFAULT_INCOME, size: DEFAULT_SIZE });
  });

  it('ignores unknown params', () => {
    expect(decode(p('i=4500&junk=x&s=75'))).toEqual({ income: 4500, size: 75 });
  });
});

describe('url-codec / encode', () => {
  it('emits empty string for defaults', () => {
    expect(encode({ income: DEFAULT_INCOME, size: DEFAULT_SIZE })).toBe('');
  });

  it('emits only non-default keys', () => {
    expect(encode({ income: 4500, size: DEFAULT_SIZE })).toBe('i=4500');
    expect(encode({ income: DEFAULT_INCOME, size: 75 })).toBe('s=75');
  });

  it('round-trips a non-default scenario', () => {
    const s = { income: 4500, size: 75 };
    expect(decode(p(encode(s)))).toEqual(s);
  });

  it('clamps out-of-range to defaults on encode', () => {
    expect(encode({ income: 99999, size: 75 })).toBe('s=75');
    expect(encode({ income: 4500, size: 1 })).toBe('i=4500');
  });
});
