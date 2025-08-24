<!-- src/lib/budgeting/OtherSubcategoryItem.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let categoryName: string = '';
  export let selected: string | null = null;
  export let busy: boolean = false;

  const dispatch = createEventDispatcher();

  // visible label for the 'Other' item; starts as 'Other'
  let label = 'Other';
  let isEditing = false;
  let temp = '';
  let inputRef: HTMLInputElement | null = null;
  let _prevCategory = categoryName;

  onMount(() => {
    temp = label;
  });

  function startEdit() {
    isEditing = true;
    temp = label;
    // focus next tick
    queueMicrotask(() => inputRef?.focus());
  }

  function cancelEdit() {
    isEditing = false;
    temp = label;
  }

  function confirmEdit() {
    const name = (temp || '').trim();
    if (!name) return cancelEdit();
    // If unchanged, just stop editing
    if (name === label) {
      isEditing = false;
      return;
    }
    // Dispatch create event to parent: parent will insert the new subcategory
  dispatch('create', name);
  // keep this item's visible label as 'Other' (parent will insert the new named sub)
  isEditing = false;
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') confirmEdit();
    else if (e.key === 'Escape') cancelEdit();
  }

  // When user clicks the radio, tell parent to select the current label
  function handleSelect() {
    dispatch('select', label);
  }

  // container click handler: start edit when clicking text and label is 'Other'
  function handleContainerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // if user clicked the radio or pencil, ignore here (they have their own handlers)
    if (target.tagName === 'INPUT') return;
    if (target.closest('.pencil')) return;

    // If the visible label is the placeholder 'Other', clicking it should start edit.
    if (label.toLowerCase() === 'other') {
      e.stopPropagation();
      startEdit();
      return;
    }

    // otherwise select the current label
    handleSelect();
  }

  // If parent selects something else or switches category while we're editing,
  // cancel edit mode so the UI behaves like the user clicked cancel (red ×).
  $: if (isEditing && selected && selected !== label) {
    // user selected a different subcategory
    cancelEdit();
  }

  $: if (isEditing && categoryName !== _prevCategory) {
    // user switched to a different main category
    cancelEdit();
    _prevCategory = categoryName;
  }
</script>

  <label class="sub-label other-item" on:click={handleContainerClick}>
    <input
      class="sub-radio"
      name="subcategory"
      type="radio"
      value={label}
      checked={selected === label}
      on:change={handleSelect}
      on:click|stopPropagation
      aria-checked={selected === label}
    />

    {#if isEditing}
      <div class="edit-wrap">
        <input
          class="edit-input"
          bind:this={inputRef}
          bind:value={temp}
          on:keydown={handleKey}
          placeholder="Enter subcategory name"
        />
        <button class="confirm" on:click|stopPropagation={confirmEdit} aria-label="Confirm" disabled={busy}>
          {#if busy}
            <span class="spinner" aria-hidden>⏳</span>
          {:else}
            ✓
          {/if}
        </button>
        <button class="cancel" on:click|stopPropagation={cancelEdit} aria-label="Cancel">✕</button>
      </div>
    {:else}
      <span class="sub-text">{label}</span>
      <span class="sub-meta" aria-hidden></span>
      <button type="button" class="pencil" on:click|stopPropagation={startEdit} aria-label="Rename">✏️</button>
    {/if}
  </label>



<style>
  /* Use the same base layout as other radio rows for visual parity */
  .other-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background-color 0.12s ease;
    cursor: pointer;
  }
  .other-item:hover { background-color: rgba(59, 130, 246, 0.05); }
  .other-item .sub-radio { flex: none; width: 18px; height: 18px; }
  .sub-text { flex: 1; font-size: 0.85rem; color: #94a3b8; padding-left: 6px; }
  /* When checked, make text more prominent (matches other items when active) */
  .other-item .sub-radio:checked ~ .sub-text,
  .other-item .sub-radio:checked ~ .sub-text + .sub-meta ~ .sub-text {
    color: #e2e8f0;
    font-weight: 500;
  }
  .pencil { background: transparent; border: none; cursor: pointer; font-size: 0.95rem; color: #94a3b8; }
  .pencil:hover { color: #e2e8f0; }
  .edit-wrap { display:flex; gap:8px; align-items:center; flex:1; }
  .edit-input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(71,85,105,0.35); background: rgba(30,41,59,0.78); color: #e2e8f0; }
  .confirm, .cancel { width:32px; height:32px; border-radius:6px; border:none; cursor:pointer; }
  .confirm { background: rgba(16,185,129,0.12); color:#10b981; }
  .cancel { background: rgba(239,68,68,0.08); color:#ef4444; }
  .spinner { display:inline-block; transform:scale(0.9); }
</style>