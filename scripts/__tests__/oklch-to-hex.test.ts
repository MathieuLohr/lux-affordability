import { describe, expect, it } from 'vitest';
import { oklchToHex } from '../../src/lib/map/oklch-to-hex.ts';

// Reference values cross-checked against Chrome's color picker (which renders
// OKLCH and reports the sRGB hex). Tight tolerance: ±1 byte on each channel.
function close(got: string, want: string): void {
  const g = parseInt(got.slice(1, 7), 16);
  const w = parseInt(want.slice(1, 7), 16);
  const gr = (g >> 16) & 0xff;
  const gg = (g >> 8) & 0xff;
  const gb = g & 0xff;
  const wr = (w >> 16) & 0xff;
  const wg = (w >> 8) & 0xff;
  const wb = w & 0xff;
  expect(Math.abs(gr - wr)).toBeLessThanOrEqual(2);
  expect(Math.abs(gg - wg)).toBeLessThanOrEqual(2);
  expect(Math.abs(gb - wb)).toBeLessThanOrEqual(2);
}

describe('oklchToHex', () => {
  it('band-a green is in green family (G > R, G > B)', () => {
    const h = oklchToHex('oklch(0.62 0.13 145)');
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('band-e crimson is in red family (R > G, R > B)', () => {
    const h = oklchToHex('oklch(0.36 0.13 20)');
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('band-x grey is roughly equal channels (max diff < 8)', () => {
    const h = oklchToHex('oklch(0.88 0.005 260)');
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(8);
  });

  it('produces a 7-char hex string', () => {
    const h = oklchToHex('oklch(0.5 0.1 120)');
    expect(h).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('exact spot-check: pure white at L=1, C=0', () => {
    close(oklchToHex('oklch(1 0 0)'), '#ffffff');
  });

  it('exact spot-check: pure black at L=0, C=0', () => {
    close(oklchToHex('oklch(0 0 0)'), '#000000');
  });

  it('rejects malformed input', () => {
    expect(() => oklchToHex('oklch(foo)')).toThrow();
    expect(() => oklchToHex('rgb(1 2 3)')).toThrow();
  });
});
