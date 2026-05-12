/**
 * OKLCH → sRGB hex conversion. MapLibre 5.x style spec rejects OKLCH strings;
 * we keep OKLCH as the source of truth in tokens and convert here for the map.
 *
 * Math: Ottosson's OKLCH spec (https://bottosson.github.io/posts/oklab/) —
 * OKLCH → OKLab via polar conversion, OKLab → linear sRGB via published
 * matrix, linear → gamma-encoded sRGB → 0..255 → hex.
 */

function parseOklch(s: string): { L: number; C: number; h: number; a?: number } {
  // Accepts: "oklch(L C h)" or "oklch(L C h / alpha)" with bare numbers.
  const m = s
    .trim()
    .replace(/^oklch\(\s*/, '')
    .replace(/\s*\)$/, '');
  const [main, alphaPart] = m.split('/').map((x) => x.trim());
  const parts = main.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`bad oklch: ${s}`);
  }
  const [L, C, h] = parts;
  const a = alphaPart === undefined ? undefined : Number(alphaPart);
  return { L, C, h, a };
}

function linearToSrgb(u: number): number {
  if (u <= 0.0031308) return 12.92 * u;
  return 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function toByte(c: number): string {
  return clamp(Math.round(c * 255), 0, 255).toString(16).padStart(2, '0');
}

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

export function oklchToHex(input: string): string {
  const { L, C, h, a } = parseOklch(input);
  const hr = (h * Math.PI) / 180;
  const ax = C * Math.cos(hr);
  const ay = C * Math.sin(hr);

  const Lp = L + 0.3963377774 * ax + 0.2158037573 * ay;
  const Mp = L - 0.1055613458 * ax - 0.0638541728 * ay;
  const Sp = L - 0.0894841775 * ax - 1.291485548 * ay;

  const L3 = Lp ** 3;
  const M3 = Mp ** 3;
  const S3 = Sp ** 3;

  const rLin = 4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3;
  const gLin = -1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3;
  const bLin = -0.0041960863 * L3 - 0.7034186147 * M3 + 1.707614701 * S3;

  const r = clamp01(linearToSrgb(rLin));
  const g = clamp01(linearToSrgb(gLin));
  const b = clamp01(linearToSrgb(bLin));

  const hex = `#${toByte(r)}${toByte(g)}${toByte(b)}`;
  if (a !== undefined && a < 1) {
    return `${hex}${toByte(a)}`;
  }
  return hex;
}
