<script lang="ts">
  import { BAND_COLORS, BAND_LABELS } from '../map/color-ramp.ts';
</script>

<div class="legend" role="note" aria-label="Rent burden legend">
  <div class="title">Rent burden, share of income</div>
  <div class="ramp" aria-hidden="true">
    <div class="step" style:background={BAND_COLORS.a}></div>
    <div class="step" style:background={BAND_COLORS.b}></div>
    <div class="step" style:background={BAND_COLORS.c}></div>
    <div class="step" style:background={BAND_COLORS.d}></div>
    <div class="step" style:background={BAND_COLORS.e}></div>
  </div>
  <div class="ticks" aria-hidden="true">
    <span></span>
    <span>30%</span>
    <span>40%</span>
    <span>50%</span>
    <span>70%</span>
    <span></span>
  </div>
  <div class="threshold">
    <span class="pill">30%</span>
    international affordability ceiling
  </div>
  <ul class="bands">
    <li><span class="dot" style:background={BAND_COLORS.a}></span>{BAND_LABELS.a}</li>
    <li><span class="dot" style:background={BAND_COLORS.b}></span>{BAND_LABELS.b}</li>
    <li><span class="dot" style:background={BAND_COLORS.c}></span>{BAND_LABELS.c}</li>
    <li><span class="dot" style:background={BAND_COLORS.d}></span>{BAND_LABELS.d}</li>
    <li><span class="dot" style:background={BAND_COLORS.e}></span>{BAND_LABELS.e}</li>
  </ul>
</div>

<style>
  .legend {
    position: absolute;
    left: 16px;
    bottom: 56px;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 6px;
    padding: 12px 14px;
    width: 240px;
    font-family: var(--font-ui);
    color: var(--ink-soft);
    box-shadow:
      0 1px 2px oklch(0.20 0.012 260 / 0.04),
      0 1px 3px oklch(0.20 0.012 260 / 0.06);
  }
  .title {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faint);
    margin-bottom: 8px;
  }
  .ramp {
    display: flex;
    height: 10px;
    border-radius: 2px;
    overflow: hidden;
  }
  .step {
    flex: 1;
  }
  .ticks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--ink-faint);
  }
  .ticks span {
    text-align: center;
  }
  .ticks span:first-child {
    text-align: left;
  }
  .ticks span:last-child {
    text-align: right;
  }
  .threshold {
    margin-top: 8px;
    font-size: 11px;
    color: var(--ink-soft);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pill {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 1px 7px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--ink);
  }
  .bands {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 12px;
    font-size: 10px;
    color: var(--ink-soft);
  }
  .bands li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  @media (max-width: 640px) {
    .legend {
      left: 12px;
      right: 12px;
      bottom: 80px;
      width: auto;
    }
  }
</style>
