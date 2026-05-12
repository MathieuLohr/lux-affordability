<script lang="ts">
  import { onMount } from 'svelte';

  type Item = { id: number; commune: string; canton: string };

  let items = $state<Item[]>([]);
  let query = $state('');
  let open = $state(false);
  let cursor = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();

  // IDs assigned by sequential index of the same /data/communes.geojson the map
  // island uses, so identity matches across islands without extra coordination.
  onMount(async () => {
    const res = await fetch('/data/communes.geojson');
    const fc = await res.json();
    items = (fc.features as Array<{ properties: { COMMUNE: string; CANTON: string } }>).map(
      (f, i) => ({
        id: i,
        commune: f.properties.COMMUNE,
        canton: f.properties.CANTON,
      }),
    );
  });

  const norm = (s: string): string =>
    s
      .toLocaleLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '');

  const matches = $derived.by(() => {
    const q = norm(query.trim());
    if (q.length === 0) return [] as Item[];
    return items
      .filter((it) => norm(it.commune).includes(q) || norm(it.canton).includes(q))
      .slice(0, 6);
  });

  function select(item: Item): void {
    window.dispatchEvent(new CustomEvent('lux:findcommune', { detail: { id: item.id } }));
    query = item.commune;
    open = false;
    cursor = 0;
    inputEl?.blur();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown' && matches.length > 0) {
      open = true;
      cursor = Math.min(matches.length - 1, cursor + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && matches.length > 0) {
      cursor = Math.max(0, cursor - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const hit = matches[cursor];
      if (hit) {
        select(hit);
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      open = false;
      cursor = 0;
      e.preventDefault();
    }
  }
</script>

<div class="search">
  <label class="label" for="commune-search">Find your commune</label>
  <input
    id="commune-search"
    bind:this={inputEl}
    type="text"
    placeholder="Luxembourg, Esch…"
    autocomplete="off"
    spellcheck="false"
    bind:value={query}
    oninput={() => {
      open = true;
      cursor = 0;
    }}
    onfocus={() => {
      if (matches.length > 0) open = true;
    }}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={onKeydown}
    role="combobox"
    aria-expanded={open && matches.length > 0}
    aria-autocomplete="list"
    aria-controls="commune-search-list"
    aria-activedescendant={open && matches[cursor]
      ? `commune-search-opt-${matches[cursor].id}`
      : undefined}
  />
  {#if open && matches.length > 0}
    <ul id="commune-search-list" class="list" role="listbox">
      {#each matches as it, i (it.id)}
        <li
          id={`commune-search-opt-${it.id}`}
          role="option"
          aria-selected={i === cursor}
          class:active={i === cursor}
        >
          <button
            type="button"
            onmousedown={(e) => {
              e.preventDefault();
              select(it);
            }}
          >
            <span class="name">{it.commune}</span>
            <span class="canton">{it.canton}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .search {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 13px;
    box-sizing: border-box;
  }
  input:focus {
    outline: 2px solid var(--ink);
    outline-offset: -1px;
  }
  .list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 6px;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    box-shadow: 0 8px 24px oklch(0.2 0.012 260 / 0.1);
    z-index: 30;
    max-height: 240px;
    overflow-y: auto;
  }
  .list li {
    margin: 0;
    padding: 0;
  }
  .list button {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--ink);
  }
  .list li.active button,
  .list button:hover {
    background: oklch(0.96 0.005 250);
  }
  .list .name {
    font-weight: 500;
  }
  .list .canton {
    color: var(--ink-faint);
    font-size: 11px;
  }

  @media (hover: none) and (pointer: coarse) {
    input {
      font-size: 16px; /* prevent iOS zoom on focus */
      padding: 10px 12px;
    }
    .list button {
      padding: 10px 12px;
      font-size: 13px;
    }
  }
</style>
