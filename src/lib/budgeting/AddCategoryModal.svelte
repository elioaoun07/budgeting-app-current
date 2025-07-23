<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon, { icons as IconOptions } from '$lib/icons/Icon.svelte';
  import { rawPrefs } from '$lib/budgeting/store';

  let name = '';
  let color = '#1e90ff';
  let selected = IconOptions[0] || '';

  const dispatch = createEventDispatcher<{
    save: { name: string; icon: string; color: string };
    cancel: void;
  }>();

  function choose(iconName: string) {
    selected = iconName;
  }

   function save() {
    if (!name.trim()) return;

    /* ⬇  push into the prefs store so it’s persisted */
    rawPrefs.update(p => ({
        ...p,
        added: [
            ...p.added,
            { name: name.trim(), icon: selected, color }
        ]
    }));

    /* Optional: if a parent wants to react, still fire the event */
    dispatch('save', { name: name.trim(), icon: selected, color });
 }

  function cancel() {
    dispatch('cancel');
  }
</script>

<div class="overlay" on:click={cancel}>
  <div class="modal" on:click|stopPropagation>
    <header>
      <h3>New Category</h3>
      <button class="close" on:click={cancel}>✕</button>
    </header>

    <div class="body">
      <label>
        Name
        <input type="text" bind:value={name} placeholder="e.g. Groceries" />
      </label>

      <label>
        Color
        <input type="color" bind:value={color} />
      </label>

      <label>
        Icon
        <div class="icon-grid">
          {#each IconOptions as key}
            <div
              class="icon-cell {selected === key ? 'selected' : ''}"
              on:click={() => choose(key)}
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
      <button class="btn primary" on:click={save}>Save</button>
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
  .icon-cell {
    padding: 6px; border: 2px solid transparent;
    border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .icon-cell.selected {
    border-color: currentColor;
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