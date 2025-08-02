<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';

  /* single-array category model */
  import {
    categories as categoriesStore,
    saveCategories                // persist helper
  } from '$lib/budgeting/store';

  import Icon from '$lib/icons/Icon.svelte';
  import type { Category } from '$lib/budgeting/defaults';

  /* parent events */
  const dispatch = createEventDispatcher<{ save: string[]; cancel: void }>();

  /* working copy of current categories */
  const initial: Category[] = get(categoriesStore);
  let items: Category[] = initial.map(c => ({ ...c }));

  /* reorder / delete helpers */
  function moveUp(i: number)   { if (i > 0)                 [items[i-1], items[i]] = [items[i], items[i-1]]; }
  function moveDown(i: number) { if (i < items.length - 1)  [items[i], items[i+1]] = [items[i+1], items[i]]; }
  function remove(i: number)   { items.splice(i, 1); }

  /* Save → overwrite entire list in store & DB */
  async function save() {
    await saveCategories(items);                    // persist
    dispatch('save', items.map(c => c.name));       // still emit order if parent wants it
  }
  function cancel()  { dispatch('cancel'); }
</script>

<style>
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4);
             display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal   { background:#fff; border-radius:8px; width:360px; max-width:90%;
             box-shadow:0 4px 16px rgba(0,0,0,.2); display:flex; flex-direction:column; }
  header, footer { padding:12px; border-bottom:1px solid #eee; }
  footer { border-top:none; display:flex; justify-content:flex-end; gap:8px; }
  .body  { padding:0 12px; max-height:300px; overflow-y:auto; }
  .item  { display:flex; justify-content:space-between; align-items:center;
           padding:8px 0; border-bottom:1px solid #f0f0f0; }
  .info  { display:flex; align-items:center; gap:8px; }
  .actions button { background:none; border:none; cursor:pointer; margin-left:4px; }
  .btn { padding:6px 12px; border-radius:4px; cursor:pointer; }
  .btn.primary   { background:#1e90ff; color:#fff; }
  .btn.secondary { background:#f7f7f7; }
  .close { background:none; border:none; font-size:1.2rem; cursor:pointer; }
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
            <button on:click={() => moveUp(i)}   disabled={i === 0}>▲</button>
            <button on:click={() => moveDown(i)} disabled={i === items.length - 1}>▼</button>
            <button on:click={() => remove(i)}>✖️</button>
          </div>
        </div>
      {/each}
    </div>

    <footer>
      <button class="btn secondary" on:click={cancel}>Cancel</button>
      <button class="btn primary"   on:click={save}>Save</button>
    </footer>
  </div>
</div>