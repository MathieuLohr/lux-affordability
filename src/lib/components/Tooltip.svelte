<script lang="ts">
  import type { BandKey } from '../map/color-ramp.ts';

  type CommuneProps = {
    COMMUNE: string;
    CANTON: string;
    rent_per_m2: number | null;
    rent_source: 'measured' | 'estimated' | 'zone' | null;
    rent_offers: number | null;
    sale_per_m2: number | null;
    zone_label: string | null;
  };

  type Props = {
    state: {
      props: CommuneProps;
      burden: number | null;
      band: BandKey;
      monthly_rent: number | null;
      x: number;
      y: number;
      pinned: boolean;
    };
    bandLabel: string;
    onClose: () => void;
  };

  const { state, bandLabel, onClose }: Props = $props();

  const fmtPct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
  const fmtEur = (n: number | null) => (n === null ? '—' : `€${Math.round(n).toLocaleString('fr-FR')}`);
  const fmtPerM2 = (n: number | null) => (n === null ? '—' : `€${n.toFixed(2)}/m²`);

  const provenanceLabel = $derived(() => {
    if (state.props.rent_source === 'measured') return 'measured';
    if (state.props.rent_source === 'estimated') return 'estimated';
    if (state.props.rent_source === 'zone') {
      return state.props.zone_label
        ? `zone estimate · ${state.props.zone_label}`
        : 'zone estimate';
    }
    return 'no data';
  });

  // Both pinned and floating tooltips position absolutely near the click /
  // cursor. Clamp x/y so the box stays inside the viewport — the floating
  // tooltip used to clip off the right edge, and the pinned dialog used to
  // park top-right regardless of click location, which felt detached from the
  // commune the user actually clicked.
  const TT_W = 260;
  const TT_H = 180;
  const placement = $derived.by(() => {
    if (typeof window === 'undefined') {
      return { x: state.x + 14, y: state.y + 14 };
    }
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = state.x + 14;
    let y = state.y + 14;
    if (x + TT_W + margin > vw) x = Math.max(margin, state.x - TT_W - 14);
    if (y + TT_H + margin > vh) y = Math.max(margin, state.y - TT_H - 14);
    return { x, y };
  });
  const placementStyle = $derived(`transform: translate(${placement.x}px, ${placement.y}px);`);
</script>

<div
  class="tt"
  class:pinned={state.pinned}
  style={placementStyle}
  role={state.pinned ? 'dialog' : 'tooltip'}
  aria-live="polite"
>
  <div class="head">
    <span class="name">{state.props.COMMUNE}</span>
    <span class="canton">· {state.props.CANTON}</span>
    {#if state.pinned}
      <button class="close" type="button" onclick={onClose} aria-label="Unpin">× close</button>
    {/if}
  </div>

  {#if state.burden !== null}
    <div class="ratio">
      <span class="pct">{fmtPct(state.burden)}</span>
      <span class="ratio-label">of income</span>
    </div>
    <div class="band-label">{bandLabel}</div>
    {#if state.props.rent_source === 'zone'}
      <div class="zone-note">
        Rent and sale below the Observatoire publication threshold. Estimate uses the zone-level sale average × national median yield.
      </div>
    {/if}
  {:else}
    <div class="nodata">No published data. Below 30-listing threshold.</div>
  {/if}

  <dl class="grid">
    <dt>Monthly rent</dt>
    <dd>{fmtEur(state.monthly_rent)}</dd>
    <dt>Rent / m²</dt>
    <dd>{fmtPerM2(state.props.rent_per_m2)}</dd>
    {#if state.props.rent_source === 'measured'}
      <dt>Listings</dt>
      <dd>{state.props.rent_offers ?? '—'}</dd>
    {/if}
    {#if state.props.sale_per_m2 !== null}
      <dt>Sale / m²</dt>
      <dd>{fmtPerM2(state.props.sale_per_m2)}</dd>
    {/if}
  </dl>

  <div class="provenance">{provenanceLabel()}</div>
</div>

<style>
  .tt {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    background: var(--ink);
    color: oklch(0.985 0.003 250);
    border-radius: 6px;
    padding: 10px 12px;
    min-width: 200px;
    max-width: 260px;
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 1.4;
    box-shadow:
      0 1px 2px oklch(0.20 0.012 260 / 0.04),
      0 12px 32px oklch(0.20 0.012 260 / 0.18);
    z-index: 10;
  }
  .tt.pinned {
    pointer-events: auto;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .name {
    font-weight: 500;
    font-size: 13px;
  }
  .canton {
    color: oklch(0.985 0.003 250 / 0.6);
    font-size: 11px;
  }
  .close {
    margin-left: auto;
    background: transparent;
    border: 0;
    color: oklch(0.985 0.003 250 / 0.7);
    font-family: var(--font-ui);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    padding: 2px 4px;
  }
  .close:hover {
    color: oklch(0.985 0.003 250);
  }
  .ratio {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 2px;
  }
  .pct {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 500;
  }
  .ratio-label {
    font-size: 11px;
    color: oklch(0.985 0.003 250 / 0.7);
  }
  .band-label {
    font-size: 11px;
    color: oklch(0.985 0.003 250 / 0.7);
    margin-bottom: 8px;
  }
  .nodata {
    font-size: 11px;
    color: oklch(0.985 0.003 250 / 0.7);
    padding: 4px 0 8px;
  }
  .zone-note {
    font-size: 10px;
    line-height: 1.45;
    color: oklch(0.985 0.003 250 / 0.6);
    padding: 0 0 6px;
    border-left: 1px solid oklch(0.985 0.003 250 / 0.18);
    padding-left: 8px;
    margin: 2px 0 4px;
  }
  .grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 12px;
    margin: 4px 0;
    font-size: 11px;
  }
  .grid dt {
    color: oklch(0.985 0.003 250 / 0.55);
  }
  .grid dd {
    margin: 0;
    font-family: var(--font-mono);
    text-align: right;
  }
  .provenance {
    margin-top: 6px;
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: oklch(0.985 0.003 250 / 0.45);
  }
</style>
