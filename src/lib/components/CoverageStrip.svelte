<script lang="ts">
  import { BAND_COLORS } from '../map/color-ramp.ts';

  type Props = {
    measured: number;
    estimated: number;
    zone: number;
    none: number;
  };
  const { measured, estimated, zone, none }: Props = $props();
</script>

<aside class="strip" role="status">
  <span class="group">
    <span class="dot" style:background={BAND_COLORS.c}></span>
    <strong>{measured}</strong>
    measured
  </span>
  <span class="sep">·</span>
  <span class="group">
    <span class="dot" style:background={BAND_COLORS.c} style:opacity="0.45"></span>
    <strong>{estimated}</strong>
    estimated
  </span>
  <span class="sep">·</span>
  <span class="group">
    <span class="dot" style:background={BAND_COLORS.c} style:opacity="0.25"></span>
    <strong>{zone}</strong>
    zone est.
  </span>
  <span class="sep">·</span>
  <span class="group">
    <span class="dot" style:background={BAND_COLORS.x}></span>
    <strong>{none}</strong>
    no data
  </span>
</aside>

<style>
  .strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0.93 0.005 250);
    color: var(--ink-soft);
    font-family: var(--font-ui);
    font-size: 11px;
    padding: 11px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
  }
  .group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  strong {
    color: var(--ink);
    font-weight: 500;
  }
  .sep {
    color: var(--ink-faint);
  }
  @media (max-width: 480px) {
    .strip {
      font-size: 10px;
      padding: 9px 12px;
      gap: 6px;
    }
  }
</style>
