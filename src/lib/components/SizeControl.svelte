<script lang="ts">
  import { scenario } from '../state/scenario.svelte.ts';

  type Seg = { value: number; label: string };

  const SEGS: Seg[] = [
    { value: 40, label: 'Studio' },
    { value: 55, label: '1-bed' },
    { value: 75, label: '2-bed' },
  ];
</script>

<div class="field">
  <span class="label">Apartment size</span>
  <div class="segmented" role="tablist" aria-label="Apartment size">
    {#each SEGS as s (s.value)}
      <button
        type="button"
        role="tab"
        class="seg"
        class:active={scenario.size === s.value}
        aria-selected={scenario.size === s.value}
        onclick={() => scenario.applySizePreset(s.value)}
      >
        {s.label}
        <span class="seg-sub">{s.value} m²</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .segmented {
    display: flex;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 6px;
    padding: 2px;
  }
  .seg {
    flex: 1;
    background: transparent;
    border: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-soft);
    padding: 7px 4px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
    line-height: 1.2;
  }
  .seg:hover {
    color: var(--ink);
  }
  .seg.active {
    background: var(--bg);
    color: var(--ink);
    box-shadow:
      0 1px 2px oklch(0.20 0.012 260 / 0.08),
      0 0 0 1px var(--rule);
  }
  .seg:focus-visible {
    outline: 2px solid oklch(0.52 0.18 30 / 0.5);
    outline-offset: 1px;
  }
  .seg-sub {
    display: block;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--ink-faint);
    margin-top: 1px;
    letter-spacing: 0.05em;
  }
</style>
