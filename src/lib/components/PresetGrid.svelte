<script lang="ts">
  import { scenario } from '../state/scenario.svelte.ts';

  type Preset = { value: number; label: string; title: string };

  const PRESETS: Preset[] = [
    { value: 2300, label: 'Min. wage', title: 'Unqualified minimum wage net' },
    { value: 2650, label: 'Min. (qual.)', title: 'Qualified minimum wage net' },
    { value: 3540, label: 'Median', title: 'Median individual net income (STATEC)' },
    { value: 3800, label: 'Average', title: 'Average earner net' },
    { value: 5500, label: 'Couple', title: 'Two median earners' },
  ];
</script>

<div class="presets" role="group" aria-label="Income presets">
  {#each PRESETS as p (p.value)}
    <button
      type="button"
      class="preset"
      class:active={scenario.income === p.value}
      title={p.title}
      onclick={() => scenario.applyIncomePreset(p.value)}
    >
      {p.label}
    </button>
  {/each}
</div>

<style>
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .preset {
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 10px;
    background: transparent;
    color: var(--ink-soft);
    border: 1px solid var(--rule);
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
  }
  .preset:hover {
    border-color: var(--ink-soft);
    color: var(--ink);
  }
  .preset.active {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  .preset:focus-visible {
    outline: 2px solid oklch(0.52 0.18 30 / 0.5);
    outline-offset: 2px;
  }
</style>
