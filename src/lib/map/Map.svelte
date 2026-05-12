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
  import Tooltip from '../components/Tooltip.svelte';
  import Legend from '../components/Legend.svelte';

  type Props = {
    scenario: { income: number; size: number };
    dataUrl: string;
  };
  const { scenario, dataUrl }: Props = $props();

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

  let mapContainer: HTMLDivElement;
  let map: MaplibreMap | undefined = $state(undefined);
  let hover: HoverState | null = $state(null);
  let pinnedId: number | string | null = $state(null);
  let features: Array<{ id: number | string; props: CommuneProps }> = [];

  const HATCH_PATTERN_ID = 'hatch-estimated';

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
    (window as unknown as { __map?: unknown }).__map = m;
    m.on('error', (e) =>
      console.error('[map error]', (e as { error?: { message?: string } }).error?.message ?? e),
    );

    m.on('load', async () => {
      try {
        console.log('[map] load fired');
        const res = await fetch(dataUrl);
        const fc = await res.json();
        console.log('[map] fetched', fc.features.length, 'features');
        fc.features.forEach((f: { id?: number; properties: CommuneProps }, i: number) => {
          f.id = i;
        });
        features = fc.features.map((f: { id: number; properties: CommuneProps }) => ({
          id: f.id,
          props: f.properties,
        }));

        m.addSource(SOURCE_ID, { type: 'geojson', data: fc });
        console.log('[map] source added');

        const hatchImg = makeHatchImageData();
        m.addImage(HATCH_PATTERN_ID, hatchImg, { pixelRatio: 1 });
        console.log('[map] hatch added');

        m.addLayer(noDataLayer());
        m.addLayer(measuredLayer());
        m.addLayer(estimatedLayer());
        m.addLayer(estimatedHatchLayer(HATCH_PATTERN_ID));
        m.addLayer(outlineLayer());
        console.log('[map] layers added');

        applyBurden(m);
        console.log('[map] burden applied');
      } catch (e) {
        console.error('[map] load handler threw:', e);
      }

      m.on('mousemove', INTERACTIVE_LAYER_IDS, (e) => {
        if (pinnedId !== null) return;
        const feat = e.features?.[0];
        if (!feat) return;
        m.getCanvas().style.cursor = 'pointer';
        hover = toHoverState(feat, e.point.x, e.point.y, false);
      });
      m.on('mouseleave', INTERACTIVE_LAYER_IDS, () => {
        if (pinnedId !== null) return;
        m.getCanvas().style.cursor = '';
        hover = null;
      });

      m.on('click', INTERACTIVE_LAYER_IDS, (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const id = feat.id;
        if (id === undefined || id === null) return;
        if (pinnedId === id) {
          setPinned(m, null);
          hover = null;
        } else {
          setPinned(m, id);
          hover = toHoverState(feat, e.point.x, e.point.y, true);
        }
      });

      m.on('click', (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: INTERACTIVE_LAYER_IDS });
        if (hits.length === 0) {
          setPinned(m, null);
          hover = null;
        }
      });
    });

    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape' && pinnedId !== null) {
        setPinned(m, null);
        hover = null;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  $effect(() => {
    if (!map || features.length === 0) return;
    applyBurden(map);
    if (hover && !hover.pinned) {
      // refresh values shown in cursor tooltip if scenario changed mid-hover
      const r = burden(hover.props.rent_per_m2, scenario);
      hover = {
        ...hover,
        burden: r,
        band: burdenToBand(r),
        monthly_rent: hover.props.rent_per_m2 === null ? null : hover.props.rent_per_m2 * scenario.size,
      };
    }
  });

  onDestroy(() => {
    map?.remove();
  });
</script>

<div class="map-root">
  <div class="map" bind:this={mapContainer} aria-label="Map of Luxembourg communes colored by rent burden"></div>
  {#if hover}
    <Tooltip state={hover} bandLabel={BAND_LABELS[hover.band] ?? 'no data'} onClose={() => { if (map) { setPinned(map, null); hover = null; } }} />
  {/if}
  <Legend />
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
</style>
