<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/AddCategoryModal.svelte

Purpose ▸ Modal dialog for creating a new budget category.
           Lets the user enter a name, pick a color, and select an icon.
           On save, calls createCategory and dispatches 'save' event.

Exports ▸
  • Svelte component – AddCategoryModal
    – Props: none
    – Events: 'save', 'cancel'

Depends ▸
  • $lib/budgeting/store – createCategory
  • $lib/icons/Icon.svelte – icon rendering

Used in ▸
  • Budgeting dashboard UI (category management)

Notes   ▸ Modal overlays the page, traps focus, closes on Escape/click outside.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon, { icons as IconOptions } from '$lib/icons/Icon.svelte';
  import { createCategory } from '$lib/budgeting/store';

  let name = '';
  let color = '#1e90ff';
  let selected = IconOptions[0] || '';

  const dispatch = createEventDispatcher<{ save: void; cancel: void }>();

  // ⬇️ Remove per-cell on:click handlers; use one grid handler instead
  function handleGridClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    const cell = target?.closest<HTMLElement>('.icon-cell');
    const key = cell?.dataset.key;
    if (key && IconOptions.includes(key)) {
      selected = key;
    }
  }

  // Inside AddCategoryModal.svelte
  async function save() {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    dispatch('save', { name: trimmedName, icon: selected, color });
  }

  function cancel() { dispatch('cancel'); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter') save();
  }

  let firstInput: HTMLInputElement | null = null;
  onMount(() => firstInput?.focus());
</script>

<div class="overlay" on:click={cancel}>
  <div class="modal" on:click|stopPropagation on:keydown={handleKeydown} tabindex="0" role="dialog" aria-label="Add category">
    <header>
      <h3>New Category</h3>
      <button class="close" on:click={cancel} aria-label="Close">✕</button>
    </header>

    <div class="body">
      <label>
        Name
        <input type="text" bind:value={name} placeholder="e.g. Groceries" bind:this={firstInput} />
      </label>

      <label>
        Color
        <input type="color" bind:value={color} />
      </label>

      <label>
        Icon
        <!-- ⬇️ One click handler on the grid -->
        <div class="icon-grid" on:click={handleGridClick} role="listbox" aria-label="Choose an icon">
          {#each IconOptions as key (key)}
            <div
              class="icon-cell"
              data-key={key}
              class:selected={selected === key}
              style={selected === key ? `--sel:${color}` : ''}
              role="option"
              aria-selected={selected === key}
              tabindex="0"
            >
              <Icon
                name={key}
                size={32}
                color={selected === key ? color : '#888'}
              />
            </div>
          {/each}
        </div>
      </label>
    </div>

    <footer>
      <button class="btn secondary" on:click={cancel}>Cancel</button>
      <button class="btn primary" on:click={save} disabled={!name.trim()}>Save</button>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white; border-radius: 8px;
    width: 360px; max-width: 90%;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    overflow: hidden;
    outline: none;
  }
  header {
    padding: 12px; border-bottom: 1px solid #eee;
    display: flex; justify-content: space-between; align-items: center;
  }
  .body {
    padding: 16px; display: flex; flex-direction: column; gap: 12px;
  }
  label {
    display: flex; flex-direction: column; font-size: 0.9rem;
  }
  input[type="text"], input[type="color"] {
    margin-top: 4px; padding: 6px 8px; font-size: 1rem;
  }

  .icon-grid {
    display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px;
  }

  /* ⬇️ Make clicks super reliable and comfy */
  .icon-cell {
    padding: 6px; border: 2px solid transparent;
    border-radius: 8px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent;
    user-select: none;          /* no text selection drag */
    -webkit-tap-highlight-color: transparent;
  }
  .icon-cell:focus-visible {
    outline: 2px solid var(--sel, #1e90ff);
    outline-offset: 2px;
  }
  .icon-cell.selected {
    border-color: var(--sel, currentColor);
  }

  footer {
    padding: 12px; border-top: 1px solid #eee;
    display: flex; justify-content: flex-end; gap: 8px;
  }
  .btn {
    padding: 8px 16px; border: none; border-radius: 4px;
    cursor: pointer;
  }
  .btn.primary { background: #1e90ff; color: white; }
  .btn.secondary { background: #f7f7f7; }
  .close { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
</style>
