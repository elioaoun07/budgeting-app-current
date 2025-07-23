<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { rawPrefs } from '$lib/budgeting/store';
  import Icon from '$lib/icons/Icon.svelte';
  import type { Category } from '$lib/budgeting/defaults';
  import { get } from 'svelte/store';
  import { categories as categoriesStore } from '$lib/budgeting/store';

  const dispatch = createEventDispatcher<{
    save: string[];           // new ordered list of category names
    cancel: void;
  }>();

  // Grab the current array of Category objects
  const initial: Category[] = get(categoriesStore);
  // Local mutable copy
  let items: Category[] = initial.map(c => ({ ...c }));

  function moveUp(i: number) {
    if (i === 0) return;
    [items[i-1], items[i]] = [items[i], items[i-1]];
  }
  function moveDown(i: number) {
    if (i === items.length - 1) return;
    [items[i+1], items[i]] = [items[i], items[i+1]];
  }
  function remove(i: number) {
    items.splice(i, 1);
  }
 function save() {
    const newOrder = items.map((c) => c.name);

    rawPrefs.update((p) => {
      /* defaults removed? → add to p.removed */
      const removedDefaults = initial
        .filter((c) => !newOrder.includes(c.name))
        .map((c) => c.name);

      /* if a user-added cat got deleted, drop it from p.added */
      const keptAdded = p.added.filter((c) => newOrder.includes(c.name));

      return {
        ...p,
        order: newOrder,
        removed: Array.from(new Set([...p.removed, ...removedDefaults])),
        added: keptAdded
      };
    });

    dispatch('save', newOrder);   // keep parent callback if you need it
  }

  function cancel() {
    dispatch('cancel');
  }
</script>

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
    display: flex; flex-direction: column;
  }
  header, footer {
    padding: 12px; border-bottom: 1px solid #eee;
  }
  footer { border-top: none; display: flex; justify-content: flex-end; gap: 8px; }
  .body { padding: 0 12px; max-height: 300px; overflow-y: auto; }
  .item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f0f0f0;
  }
  .info { display: flex; align-items: center; gap: 8px; }
  .actions button {
    background: none; border: none; cursor: pointer; margin-left: 4px;
  }
  .btn { padding: 6px 12px; border-radius: 4px; cursor: pointer; }
  .btn.primary   { background: #1e90ff; color: white; }
  .btn.secondary { background: #f7f7f7; }
  .close { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
</style>

<div class="overlay" on:click={cancel}>
  <div class="modal" on:click|stopPropagation>
    <header>
      <h3>Edit Categories</h3>
      <button class="close" on:click={cancel}>✕</button>
    </header>

    <div class="body">
      {#each items as cat, i}
        <div class="item">
          <div class="info">
            <Icon name={cat.icon} size={24} color={cat.color} />
            <span>{cat.name}</span>
          </div>
          <div class="actions">
            <button on:click={() => moveUp(i)} disabled={i === 0}>▲</button>
            <button on:click={() => moveDown(i)} disabled={i === items.length - 1}>▼</button>
            <button on:click={() => remove(i)}>✖️</button>
          </div>
        </div>
      {/each}
    </div>

    <footer>
      <button class="btn secondary" on:click={cancel}>Cancel</button>
      <button class="btn primary" on:click={save}>Save</button>
    </footer>
  </div>
</div>