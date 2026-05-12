<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import type { Map as MaplibreMap, MapGeoJSONFeature } from 'maplibre-gl';
  import {
    INTERACTIVE_LAYER_IDS,
    SOURCE_ID,
    estimatedHatchLayer,
    estimatedLayer,
    measuredLayer,
    noDataLayer,
    outlineLayer,
  } from './layers.ts';
  import { LUX_CENTER, LUX_ZOOM, STYLE_URL } from './style.ts';
  import { makeHatchImageData } from './hatch-pattern.ts';
  import { burden } from './burden.ts';
  import { burdenToBand, BAND_LABELS, type BandKey } from './color-ramp.ts';
  import { scenario } from '../state/scenario.svelte.ts';
  import Tooltip from '../components/Tooltip.svelte';
  import Legend from '../components/Legend.svelte';

  type Props = {
    dataUrl: string;
  };
  const { dataUrl }: Props = $props();

  type CommuneProps = {
    COMMUNE: string;
    CANTON: string;
    LAU2: string;
    rent_per_m2: number | null;
    rent_source: 'measured' | 'estimated' | null;
    rent_offers: number | null;
    sale_per_m2: number | null;
    sales_n: number | null;
  };

  type HoverState = {
    props: CommuneProps;
    burden: number | null;
    band: BandKey;
    monthly_rent: number | null;
    x: number;
    y: number;
    pinned: boolean;
  };

  type BBox = [[number, number], [number, number]];
  type Feat = { id: number | string; props: CommuneProps; bbox: BBox };

  let mapContainer: HTMLDivElement;
  let map: MaplibreMap | undefined = $state(undefined);
  let pinnedHover: HoverState | null = $state(null);
  let floatingHover: HoverState | null = $state(null);
  let pinnedId: number | string | null = $state(null);
  let features: Feat[] = $state([]);
  let listEl: HTMLUListElement | undefined = $state();
  let announcement = $state('');
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  const HATCH_PATTERN_ID = 'hatch-estimated';

  function computeBbox(geom: { type: string; coordinates: unknown }): BBox {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    const visit = (c: unknown): void => {
      if (Array.isArray(c) && typeof c[0] === 'number') {
        const lng = c[0] as number;
        const lat = c[1] as number;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(c)) {
        for (const item of c) visit(item);
      }
    };
    visit(geom.coordinates);
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }

  function applyBurden(m: MaplibreMap): void {
    for (const f of features) {
      const ratio = burden(f.props.rent_per_m2, scenario);
      const burden_pct = ratio === null ? -1 : ratio * 100;
      m.setFeatureState({ source: SOURCE_ID, id: f.id }, { burden_pct });
    }
  }

  function setPinned(m: MaplibreMap, id: number | string | null): void {
    if (pinnedId !== null) m.setFeatureState({ source: SOURCE_ID, id: pinnedId }, { pinned: false });
    pinnedId = id;
    if (id !== null) m.setFeatureState({ source: SOURCE_ID, id }, { pinned: true });
  }

  function toHoverState(feat: MapGeoJSONFeature, x: number, y: number, pinned: boolean): HoverState {
    const props = feat.properties as unknown as CommuneProps;
    const ratio = burden(props.rent_per_m2, scenario);
    return {
      props,
      burden: ratio,
      band: burdenToBand(ratio),
      monthly_rent: props.rent_per_m2 === null ? null : props.rent_per_m2 * scenario.size,
      x,
      y,
      pinned,
    };
  }

  function toHoverFromProps(props: CommuneProps): HoverState {
    const ratio = burden(props.rent_per_m2, scenario);
    return {
      props,
      burden: ratio,
      band: burdenToBand(ratio),
      monthly_rent: props.rent_per_m2 === null ? null : props.rent_per_m2 * scenario.size,
      x: 0,
      y: 0,
      pinned: true,
    };
  }

  function announceFor(id: number | string): string {
    const f = features.find((x) => x.id === id);
    if (!f) return '';
    const ratio = burden(f.props.rent_per_m2, scenario);
    const pct = ratio === null ? 'no published data' : `${Math.round(ratio * 100)} percent of income`;
    const band = ratio === null ? '' : `, ${BAND_LABELS[burdenToBand(ratio)] ?? ''}`;
    const prov =
      f.props.rent_source === 'measured'
        ? ', measured'
        : f.props.rent_source === 'estimated'
          ? ', estimated from sale price'
          : '';
    return `${f.props.COMMUNE}, ${f.props.CANTON}. ${pct}${band}${prov}.`;
  }

  function pinCommune(id: number | string): void {
    if (!map) return;
    const f = features.find((x) => x.id === id);
    if (!f) return;
    setPinned(map, id);
    pinnedHover = toHoverFromProps(f.props);
    floatingHover = null;
  }

  function flyToCommune(id: number | string): void {
    if (!map) return;
    const f = features.find((x) => x.id === id);
    if (!f) return;
    map.fitBounds(f.bbox, { padding: 60, duration: 600, maxZoom: 12 });
  }

  function onListKeydown(e: KeyboardEvent): void {
    if (!listEl) return;
    const buttons = [...listEl.querySelectorAll<HTMLButtonElement>('button[data-commune-id]')];
    const current = document.activeElement;
    const i = buttons.indexOf(current as HTMLButtonElement);
    if (i < 0) return;
    let next = i;
    switch (e.key) {
      case 'ArrowDown':
        next = Math.min(buttons.length - 1, i + 1);
        break;
      case 'ArrowUp':
        next = Math.max(0, i - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = buttons.length - 1;
        break;
      case 'PageDown':
        next = Math.min(buttons.length - 1, i + 10);
        break;
      case 'PageUp':
        next = Math.max(0, i - 10);
        break;
      default:
        return;
    }
    e.preventDefault();
    buttons[next]?.focus();
  }

  onMount(async () => {
    const maplibre = await import('maplibre-gl');
    // Wait one frame so the fixed-positioned host has its computed size before
    // MapLibre snapshots container dimensions in the constructor.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const m = new maplibre.Map({
      container: mapContainer,
      style: STYLE_URL,
      center: LUX_CENTER,
      zoom: LUX_ZOOM,
      minZoom: 8,
      maxZoom: 13,
    });
    map = m;

    m.on('load', async () => {
      const res = await fetch(dataUrl);
      const fc = await res.json();
      fc.features.forEach((f: { id?: number; properties: CommuneProps }, i: number) => {
        f.id = i;
      });
      features = fc.features.map(
        (f: {
          id: number;
          properties: CommuneProps;
          geometry: { type: string; coordinates: unknown };
        }) => ({
          id: f.id,
          props: f.properties,
          bbox: computeBbox(f.geometry),
        }),
      );

      m.addSource(SOURCE_ID, { type: 'geojson', data: fc });

      const hatchImg = makeHatchImageData();
      m.addImage(HATCH_PATTERN_ID, hatchImg, { pixelRatio: 1 });

      m.addLayer(noDataLayer());
      m.addLayer(measuredLayer());
      m.addLayer(estimatedLayer());
      m.addLayer(estimatedHatchLayer(HATCH_PATTERN_ID));
      m.addLayer(outlineLayer());

      applyBurden(m);

      m.on('mousemove', INTERACTIVE_LAYER_IDS, (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        m.getCanvas().style.cursor = 'pointer';
        // Floating tooltip follows cursor; pinned dialog persists at top-right.
        // Skip floating when hovering the pinned commune itself (avoids duplicate).
        if (feat.id !== undefined && feat.id !== null && feat.id === pinnedId) {
          floatingHover = null;
          return;
        }
        floatingHover = toHoverState(feat, e.point.x, e.point.y, false);
      });
      m.on('mouseleave', INTERACTIVE_LAYER_IDS, () => {
        m.getCanvas().style.cursor = '';
        floatingHover = null;
      });

      m.on('click', INTERACTIVE_LAYER_IDS, (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const id = feat.id;
        if (id === undefined || id === null) return;
        if (pinnedId === id) {
          setPinned(m, null);
          pinnedHover = null;
        } else {
          setPinned(m, id);
          pinnedHover = toHoverFromProps(feat.properties as unknown as CommuneProps);
          floatingHover = null;
        }
      });

      m.on('click', (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: INTERACTIVE_LAYER_IDS });
        if (hits.length === 0) {
          setPinned(m, null);
          pinnedHover = null;
        }
      });
    });

    const onFind = (ev: Event): void => {
      const detail = (ev as CustomEvent<{ id: number | string }>).detail;
      if (!detail || detail.id === undefined || detail.id === null) return;
      flyToCommune(detail.id);
      pinCommune(detail.id);
    };
    window.addEventListener('lux:findcommune', onFind);

    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape' && pinnedId !== null) {
        setPinned(m, null);
        pinnedHover = null;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('lux:findcommune', onFind);
    };
  });

  $effect(() => {
    // Touch scenario deps upfront so they're tracked even when we early-return.
    // applyBurden reads scenario.income and scenario.size via burden(); reading
    // here makes the dependency explicit and survives features-empty boot.
    const _income = scenario.income;
    const _size = scenario.size;
    void _income;
    void _size;
    if (!map || features.length === 0) return;
    applyBurden(map);
  });

  $effect(() => {
    // Read all deps upfront so Svelte tracks them regardless of branching.
    const id = pinnedId;
    const income = scenario.income;
    const size = scenario.size;
    void income;
    void size;
    clearTimeout(announceTimer);
    if (id === null) {
      announcement = '';
      return;
    }
    announceTimer = setTimeout(() => {
      announcement = announceFor(id);
    }, 500);
  });

  const sortedFeatures = $derived(
    [...features].sort((a, b) => a.props.COMMUNE.localeCompare(b.props.COMMUNE)),
  );

  onDestroy(() => {
    map?.remove();
  });
</script>

<div class="map-root">
  <div class="map" bind:this={mapContainer} aria-label="Map of Luxembourg communes colored by rent burden"></div>
  {#if pinnedHover}
    {@const pRatio = burden(pinnedHover.props.rent_per_m2, scenario)}
    {@const pBand = burdenToBand(pRatio)}
    <Tooltip
      state={{
        ...pinnedHover,
        burden: pRatio,
        band: pBand,
        monthly_rent:
          pinnedHover.props.rent_per_m2 === null ? null : pinnedHover.props.rent_per_m2 * scenario.size,
      }}
      bandLabel={BAND_LABELS[pBand] ?? 'no data'}
      onClose={() => {
        if (map) {
          setPinned(map, null);
          pinnedHover = null;
        }
      }}
    />
  {/if}
  {#if floatingHover}
    {@const fRatio = burden(floatingHover.props.rent_per_m2, scenario)}
    {@const fBand = burdenToBand(fRatio)}
    <Tooltip
      state={{
        ...floatingHover,
        burden: fRatio,
        band: fBand,
        monthly_rent:
          floatingHover.props.rent_per_m2 === null ? null : floatingHover.props.rent_per_m2 * scenario.size,
      }}
      bandLabel={BAND_LABELS[fBand] ?? 'no data'}
      onClose={() => {}}
    />
  {/if}
  <Legend />

  {#if sortedFeatures.length > 0}
    <ul
      bind:this={listEl}
      class="sr-only commune-list"
      aria-label="Communes, sorted alphabetically. Use arrow keys to move and Enter to pin."
      onkeydown={onListKeydown}
    >
      {#each sortedFeatures as f (f.id)}
        <li>
          <button
            type="button"
            data-commune-id={f.id}
            onclick={() => pinCommune(f.id)}
            onfocus={() => pinCommune(f.id)}
          >
            {f.props.COMMUNE}, {f.props.CANTON}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>

<style>
  .map-root {
    position: relative;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .map {
    position: absolute;
    inset: 0;
  }
  :global(.maplibregl-ctrl-attrib) {
    font-family: var(--font-ui);
    font-size: 10px;
    color: var(--ink-faint);
  }
  :global(.maplibregl-ctrl-attrib a) {
    color: var(--ink-soft);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  /* When a keyboard user tabs into the hidden list, surface the focused
     button to sighted users so the focus indicator isn't invisible. */
  .commune-list :global(button:focus-visible) {
    position: fixed;
    top: 64px;
    left: 16px;
    width: auto;
    height: auto;
    padding: 6px 10px;
    margin: 0;
    clip: auto;
    white-space: normal;
    background: var(--ink);
    color: oklch(0.985 0.003 250);
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    z-index: 50;
    overflow: visible;
  }
</style>
