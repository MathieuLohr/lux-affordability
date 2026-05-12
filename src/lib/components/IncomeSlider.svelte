<script lang="ts">
  import { scenario } from '../state/scenario.svelte.ts';
  import { INCOME_MIN, INCOME_MAX } from '../state/url-codec.ts';

  // Step of 10 keeps every preset (2300, 2650, 3540, 3800, 5500) and the
  // 3540 default exactly on the slider grid. The prototype used 50 and
  // silently snapped 3540 to 3550 on first paint; that's not worth keeping.
  const STEP = 10;

  const fmt = new Intl.NumberFormat('en-US');

  function onInput(e: Event): void {
    scenario.income = Number((e.currentTarget as HTMLInputElement).value);
  }
</script>

<div class="field">
  <div class="row">
    <label class="label" for="income-slider">Net monthly income</label>
    <span class="value">€{fmt.format(scenario.income)}</span>
  </div>
  <input
    id="income-slider"
    type="range"
    min={INCOME_MIN}
    max={INCOME_MAX}
    step={STEP}
    value={scenario.income}
    oninput={onInput}
    aria-label="Monthly net income"
  />
  <div class="ticks">
    <span>€{fmt.format(INCOME_MIN)}</span>
    <span>€{fmt.format(INCOME_MAX)}</span>
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .value {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: var(--rule);
    border-radius: 2px;
    margin: 6px 0 4px;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--ink);
    cursor: pointer;
    border: none;
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }
  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.18);
  }
  input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--ink);
    cursor: pointer;
    border: none;
  }
  input[type='range']:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px oklch(0.52 0.18 30 / 0.3);
  }
  .ticks {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--ink-faint);
    letter-spacing: 0.04em;
  }
</style>
