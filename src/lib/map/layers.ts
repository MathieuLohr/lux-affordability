import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import { BAND_COLORS } from './color-ramp.ts';
import { oklchToHex } from './oklch-to-hex.ts';

export const SOURCE_ID = 'communes';

export const LAYER_IDS = {
  measured: 'communes-measured',
  estimated: 'communes-estimated',
  estimatedHatch: 'communes-estimated-hatch',
  zone: 'communes-zone',
  zoneHatch: 'communes-zone-hatch',
  noData: 'communes-no-data',
  outline: 'communes-outline',
} as const;

const INK_OUTLINE = 'oklch(0.20 0.012 260)';

/**
 * MapLibre 5.x style spec rejects OKLCH color strings. Convert via math.
 * Pure CSS usage (Svelte styles, legend) keeps OKLCH as source of truth.
 */
const hexCache = new Map<string, string>();
function toMapColor(cssColor: string): string {
  const cached = hexCache.get(cssColor);
  if (cached) return cached;
  const hex = cssColor.trim().startsWith('oklch(') ? oklchToHex(cssColor) : cssColor;
  hexCache.set(cssColor, hex);
  return hex;
}

/**
 * Step expression on the feature-state "burden_pct" channel.
 * setFeatureState updates this on scenario changes without rebuilding the source.
 */
function burdenStepColor(): unknown {
  return [
    'step',
    ['coalesce', ['feature-state', 'burden_pct'], -1],
    toMapColor(BAND_COLORS.x), // -1 sentinel (no data) → grey
    0,
    toMapColor(BAND_COLORS.a), // 0 - 30
    30,
    toMapColor(BAND_COLORS.b), // 30 - 40
    40,
    toMapColor(BAND_COLORS.c), // 40 - 50
    50,
    toMapColor(BAND_COLORS.d), // 50 - 70
    70,
    toMapColor(BAND_COLORS.e), // 70+
  ];
}

function alphaBoostOnPinned(base: number): unknown {
  return ['case', ['boolean', ['feature-state', 'pinned'], false], base + 0.05, base];
}

export function measuredLayer(): FillLayerSpecification {
  return {
    id: LAYER_IDS.measured,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], 'measured'],
    paint: {
      'fill-color': burdenStepColor() as never,
      'fill-opacity': alphaBoostOnPinned(0.85) as never,
    },
  };
}

export function estimatedLayer(): FillLayerSpecification {
  return {
    id: LAYER_IDS.estimated,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], 'estimated'],
    paint: {
      'fill-color': burdenStepColor() as never,
      'fill-opacity': alphaBoostOnPinned(0.72) as never,
    },
  };
}

export function estimatedHatchLayer(patternId: string): FillLayerSpecification {
  return {
    id: LAYER_IDS.estimatedHatch,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], 'estimated'],
    paint: {
      'fill-pattern': patternId,
      'fill-opacity': 0.55,
    },
  };
}

export function zoneLayer(): FillLayerSpecification {
  return {
    id: LAYER_IDS.zone,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], 'zone'],
    paint: {
      'fill-color': burdenStepColor() as never,
      'fill-opacity': alphaBoostOnPinned(0.55) as never,
    },
  };
}

export function zoneHatchLayer(patternId: string): FillLayerSpecification {
  return {
    id: LAYER_IDS.zoneHatch,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], 'zone'],
    paint: {
      'fill-pattern': patternId,
      'fill-opacity': 0.7,
    },
  };
}

export function noDataLayer(): FillLayerSpecification {
  return {
    id: LAYER_IDS.noData,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'rent_source'], null],
    paint: {
      'fill-color': toMapColor(BAND_COLORS.x),
      'fill-opacity': 0.6,
    },
  };
}

export function outlineLayer(): LineLayerSpecification {
  return {
    id: LAYER_IDS.outline,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': toMapColor(INK_OUTLINE),
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'pinned'], false],
        1.5,
        0.5,
      ] as never,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'pinned'], false],
        1,
        0.35,
      ] as never,
    },
  };
}

export const INTERACTIVE_LAYER_IDS = [
  LAYER_IDS.measured,
  LAYER_IDS.estimated,
  LAYER_IDS.zone,
  LAYER_IDS.noData,
];
