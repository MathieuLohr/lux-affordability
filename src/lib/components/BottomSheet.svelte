<script lang="ts">
  import IncomeSlider from './IncomeSlider.svelte';
  import PresetGrid from './PresetGrid.svelte';
  import SizeControl from './SizeControl.svelte';

  const SNAPS = [25, 60, 95] as const;
  const DEFAULT_SNAP = 60;

  let snap = $state<number>(DEFAULT_SNAP);
  let dragging = $state(false);
  let dragStartY = 0;
  let dragStartSnap = DEFAULT_SNAP;
  let isMobile = $state(false);

  $effect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const apply = (): void => {
      isMobile = mq.matches;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  });

  function vh(): number {
    return window.visualViewport?.height ?? window.innerHeight;
  }

  function snapTo(closestTo: number): number {
    let best = SNAPS[0];
    let bestDist = Infinity;
    for (const s of SNAPS) {
      const d = Math.abs(s - closestTo);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  }

  function onPointerDown(e: PointerEvent): void {
    if (!isMobile) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging = true;
    dragStartY = e.clientY;
    dragStartSnap = snap;
    e.stopPropagation();
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const delta = e.clientY - dragStartY;
    const next = dragStartSnap - (delta / vh()) * 100;
    snap = Math.max(0, Math.min(100, next));
    e.stopPropagation();
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    snap = snapTo(snap);
    e.stopPropagation();
  }

  function onHandleKeydown(e: KeyboardEvent): void {
    if (!isMobile) return;
    const i = SNAPS.indexOf(snap as (typeof SNAPS)[number]);
    if (e.key === 'ArrowUp') {
      snap = SNAPS[Math.min(SNAPS.length - 1, (i < 0 ? 1 : i) + 1)];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      snap = SNAPS[Math.max(0, (i < 0 ? 1 : i) - 1)];
      e.preventDefault();
    }
  }
</script>

<aside
  class="sheet"
  class:dragging
  style:--snap-pct={100 - snap}
  aria-label="Scenario controls"
>
  <button
    type="button"
    class="handle"
    aria-label="Drag to resize panel"
    aria-hidden={!isMobile}
    tabindex={isMobile ? 0 : -1}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onkeydown={onHandleKeydown}
  >
    <span class="grabber" aria-hidden="true"></span>
  </button>
  <div class="panel-title">Set your income, see <em>where it fits</em>.</div>
  <div class="body">
    <IncomeSlider />
    <PresetGrid />
    <SizeControl />
  </div>
</aside>

<style>
  .sheet {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 280px;
    max-width: calc(100vw - 32px);
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow:
      0 1px 2px oklch(0.20 0.012 260 / 0.06),
      0 8px 24px oklch(0.20 0.012 260 / 0.08);
    z-index: 10;
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.3;
    letter-spacing: -0.01em;
    margin: 0;
  }
  .panel-title em {
    font-style: italic;
    font-variation-settings: 'opsz' 14, 'SOFT' 80, 'WONK' 0;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .handle {
    display: none;
  }

  @media (max-width: 600px) {
    .sheet {
      position: fixed;
      top: auto;
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      max-width: none;
      height: 100vh;
      padding: 0;
      gap: 0;
      border: none;
      border-top: 1px solid var(--rule);
      border-radius: 16px 16px 0 0;
      box-shadow:
        0 -1px 2px oklch(0.20 0.012 260 / 0.06),
        0 -8px 24px oklch(0.20 0.012 260 / 0.08);
      transform: translateY(calc(var(--snap-pct, 40) * 1vh));
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 20;
    }
    .sheet.dragging {
      transition: none;
    }

    .handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 44px;
      background: transparent;
      border: none;
      padding: 0;
      cursor: grab;
      touch-action: none;
      flex: 0 0 44px;
    }
    .handle:active {
      cursor: grabbing;
    }
    .handle:focus-visible {
      outline: 2px solid var(--ink);
      outline-offset: -4px;
      border-radius: 16px 16px 0 0;
    }
    .grabber {
      display: block;
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--rule);
    }

    .panel-title {
      padding: 4px 18px 0;
    }

    .body {
      padding: 12px 18px 24px;
      gap: 18px;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
      touch-action: pan-y;
    }
  }
</style>
