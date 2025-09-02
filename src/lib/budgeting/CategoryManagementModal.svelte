<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/CategoryManagementModal.svelte

Purpose ▸ Modal for editing, reordering, and removing budget categories.
           Lets the user change category order, delete categories, and save changes.
           Persists updates via saveCategories and dispatches 'save' or 'cancel' events.

Exports ▸
  • Svelte component – CategoryManagementModal
    – Props: none
    – Events: 'save', 'cancel'

Depends ▸
  • $lib/budgeting/store – categoriesStore, saveCategories
  • $lib/icons/Icon.svelte – icon rendering

Used in ▸
  • Budgeting dashboard UI (category management)

Notes   ▸ Modal overlays the page, traps focus, closes on Escape/click outside.
          Uses svelte-dnd-action for smooth drag and drop.
──────────────────────────────────────────────────────────────
-->
<!-- Enhanced Category Management Modal -->
<!-- Enhanced Category Management Modal -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { categories as categoriesStore, saveCategories, accounts, currentAccount, selectAccount } from '$lib/budgeting/store';
  import Icon from '$lib/icons/Icon.svelte';
  import type { Category } from '$lib/budgeting/defaults';

  // --- Import latest svelte-dnd-action with advanced features ---
  import { dndzone, TRIGGERS, SOURCES } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const dispatch = createEventDispatcher<{ save: string[]; cancel: void }>();
  
  // Create items with unique IDs for optimal tracking
  const initialCategories: Category[] = get(categoriesStore);
  let items = $state(
    initialCategories.map((c, index) => ({ 
      ...c, 
      id: `category-${c.name}-${index}`, // Unique stable ID
      originalIndex: index,
      subItems: (c.subs || []).map((s, idx) => ({ id: `sub-${c.id}-${idx}-${s}`, name: s }))
    }))
  );

  // Keep the modal in sync with the global selected account/categories.
  // Use $effect (runes mode) instead of $: reactive statements.
  $effect(() => {
    if (!$currentAccount) return;
    const cats = $categoriesStore || [];
    items = cats.map((c, index) => ({
      ...c,
      id: `category-${c.name}-${index}`,
      originalIndex: index,
      subItems: (c.subs || []).map((s, idx) => ({ id: `sub-${c.id}-${idx}-${s}`, name: s }))
    }));
    // reset open state when changing account
    expandedCategories = new Set();
  });

  let isDragActive = $state(false);
  let editingIndex = $state<number | null>(null);
  let editingNameIndex = $state<number | null>(null);
  let editingNameValue = $state('');
  let editingSub = $state<{ catIndex: number; subIndex: number; value: string } | null>(null);
  let expandedCategories = $state(new Set<string>());
  // Local selected account id for safe bind
  let selectedAccountId = $state('');

  // Keep the local select in sync with the global currentAccount
  $effect(() => {
    selectedAccountId = $currentAccount ? $currentAccount.id : '';
  });

  // When user changes the select, call selectAccount only if different
  $effect(() => {
    if (!selectedAccountId) return;
    if ($currentAccount?.id !== selectedAccountId) {
      selectAccount(selectedAccountId);
    }
  });

  // Function to handle index changes
  function handleIndexChange(currentIndex: number, newPosition: string) {
    const newIndex = parseInt(newPosition) - 1; // Convert to 0-based index
    
    if (isNaN(newIndex) || newIndex < 0) {
      return; // Invalid input, ignore
    }

    // If user inputs number greater than list length, move to last position
    const targetIndex = newIndex >= items.length ? items.length - 1 : newIndex;
    
    if (targetIndex === currentIndex) {
      editingIndex = null; // Just exit edit mode if same position
      return;
    }

    // Reorder items array
    const item = items[currentIndex];
    const newItems = [...items];
    
    // Remove item from current position
    newItems.splice(currentIndex, 1);
    // Insert at new position
    newItems.splice(targetIndex, 0, item);
    
    items = newItems;
    editingIndex = null; // Exit edit mode
  }

  function startEditing(index: number) {
    editingIndex = index;
  }

  function startEditingName(index: number) {
    editingNameIndex = index;
    editingNameValue = items[index]?.name ?? '';
  }

  function saveName(index: number) {
    if (editingNameIndex === null) return;
    items[index].name = editingNameValue;
    editingNameIndex = null;
    editingNameValue = '';
  }

  function handleNameKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      editingNameIndex = null;
      editingNameValue = '';
    }
  }

  function handleIndexKeydown(event: KeyboardEvent, currentIndex: number) {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      handleIndexChange(currentIndex, target.value);
    } else if (event.key === 'Escape') {
      editingIndex = null;
    }
  }

  // Toggle category expansion
  function toggleCategoryExpansion(categoryId: string) {
    if (expandedCategories.has(categoryId)) {
      expandedCategories.delete(categoryId);
    } else {
      expandedCategories.add(categoryId);
    }
  // Reassign to a new Set so Svelte notices the mutation and updates the UI
  expandedCategories = new Set(expandedCategories);
  }

  // Handle nested-sub dnd consider/finalize for a specific category index
  function handleSubDndConsider(catIndex: number, e: CustomEvent) {
    const { items: newSubItems } = e.detail;
    items[catIndex].subItems = newSubItems;
    items[catIndex].subs = newSubItems.map(item => item.name);
  }

  function handleSubDndFinalize(catIndex: number, e: CustomEvent) {
    const { items: newSubItems } = e.detail;
    items[catIndex].subItems = newSubItems;
    items[catIndex].subs = newSubItems.map(item => item.name);
  }

  // Reactive configuration for optimal UX that updates with items
  const dndConfig = $derived({
    items,
    flipDurationMs: 250,
    morphDisabled: false,
    dropTargetStyle: { 
      outline: '2px solid #3b82f6', 
      outlineOffset: '2px',
      backgroundColor: 'rgba(59, 130, 246, 0.08)' 
    },
    dragDisabled: editingIndex !== null,
    zoneTabIndex: -1,
    dropFromOthersDisabled: true,
    transformDraggedElement: (element: HTMLElement | undefined, data: any) => {
      if (!element) return;
      element.style.transform = 'rotate(2deg) scale(1.05)';
      element.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.7)';
      element.style.zIndex = '1000';
      element.style.opacity = '0.95';
      element.style.backdropFilter = 'blur(8px)';
      element.style.borderRadius = '12px';
    },
    centreDraggedOnCursor: true
  });

  // Enhanced event handlers with better state management
  function handleDndConsider(e: CustomEvent) {
    const { items: newItems, info } = e.detail;
    items = newItems;
    
    if (info.source === SOURCES.KEYBOARD || info.source === SOURCES.POINTER) {
      isDragActive = info.trigger === TRIGGERS.DRAG_START;
    }
  }

  function handleDndFinalize(e: CustomEvent) {
    const { items: newItems, info } = e.detail;
    items = newItems;
    isDragActive = false;
    
    if (navigator.vibrate && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      navigator.vibrate(50);
    }
  }

  // --- Enhanced Functions ---
  function remove(index: number) {
    const itemToRemove = items[index];
    const element = document.querySelector(`[data-category-id="${itemToRemove.id}"]`);
    if (element) {
      element.classList.add('removing');
      setTimeout(() => {
        items = items.filter((_, i) => i !== index);
      }, 200);
    } else {
      items = items.filter((_, i) => i !== index);
    }
  }

  function removeSub(categoryIndex: number, subIndex: number) {
    const cat = items[categoryIndex];
    cat.subItems.splice(subIndex, 1);
    cat.subs = cat.subItems.map(item => item.name);
  }

  function startEditingSub(catIndex: number, subIndex: number) {
    editingSub = { catIndex, subIndex, value: items[catIndex]?.subItems?.[subIndex]?.name ?? '' };
    // focus via autofocus on input after DOM update
  }

  function saveSubName(catIndex: number, subIndex: number) {
    if (!editingSub) return;
    const newName = editingSub.value.trim();
    if (newName.length) {
      items[catIndex].subItems[subIndex].name = newName;
      items[catIndex].subs = items[catIndex].subItems.map(item => item.name);
    }
    editingSub = null;
  }

  function handleSubNameKeydown(event: KeyboardEvent, catIndex: number, subIndex: number) {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      editingSub = null;
    }
  }

  function addSub(categoryIndex: number) {
    const cat = items[categoryIndex];
    const newSub = { id: `sub-${cat.id}-${Date.now()}`, name: 'New subcategory' };
    cat.subItems = cat.subItems || [];
    cat.subItems.push(newSub);
    cat.subs = cat.subItems.map(item => item.name);
  // ensure the category is opened so the new sub is visible
  expandedCategories.add(cat.id);
  // Reassign to trigger Svelte reactivity
  expandedCategories = new Set(expandedCategories);
  }

  async function save() {
    const categoriesToSave = items.map(({ id, originalIndex, subItems, ...category }) => category);
    await saveCategories(categoriesToSave);
    dispatch('save', items.map(c => c.name));
  }

  function cancel() {
    dispatch('cancel');
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancel();
    }
  }
</script>

<div class="modal-overlay" onclick={cancel} onkeydown={handleKeyDown} role="button" tabindex="0">
  <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-title" tabindex="0">
    <div class="modal-header">
      <h2 id="modal-title">Edit Categories</h2>
  <button class="close-button" onclick={cancel} aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <!-- Account selector: show current account and allow switching -->
      <div class="account-selector">
        <label class="small muted">Account</label>
          <div class="account-row">
          <select
            aria-label="Select account"
            bind:value={selectedAccountId}
          >
            {#each $accounts as a}
              <option value={a.id} selected={($currentAccount && a.id === $currentAccount.id)}>{a.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <p class="instructions">
        {#if isDragActive}
          <span class="drag-active-hint">🎯 Drop to reorder • Release to place</span>
        {:else}
          Drag categories by the handle or <strong>click the number</strong> to set position
        {/if}
      </p>
      
      <!-- Enhanced dndzone with latest configuration -->
      <div 
        class="category-list"
        class:drag-active={isDragActive}
        use:dndzone={dndConfig}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
      >
        {#each items as cat, i (cat.id)}
          <div animate:flip={{ duration: 250, easing: (t) => t * (2 - t) }}>
            <div 
              class="category-item" 
              data-category-id={cat.id}
              role="listitem"
              tabindex="-1"
            >
              <!-- Enhanced Drag Handle -->
              <div class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder" onclick={(e) => e.stopPropagation()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5H11M8 12H11M8 19H11M13 5H16M13 12H16M13 19H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>

              <!-- Category Info -->
              <div class="category-info">
                <div class="category-icon" style="cursor:pointer;">
                  <Icon name={cat.icon} size={24} color={cat.color} />
                </div>
                
                {#if editingNameIndex === i}
                  <input
                    class="category-name-input"
                    value={editingNameValue}
                    oninput={(e) => editingNameValue = e.target.value}
                    onblur={() => saveName(i)}
                    onkeydown={(e) => handleNameKeydown(e, i)}
                    autofocus
                  />
                {:else}
                  <div class="category-name" title="Click to edit category name" onclick={() => startEditingName(i)}>{cat.name}</div>
                {/if}
                
                <!-- Category Actions -->
                <div class="category-inline-actions">
                  <button 
                    class="expand-toggle" 
                    onclick={() => toggleCategoryExpansion(cat.id)}
                    title={expandedCategories.has(cat.id) ? 'Collapse subcategories' : 'Expand subcategories'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class:rotated={expandedCategories.has(cat.id)}>
                      <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <!-- Editable Category Index -->
                <div class="category-index-container">
                  {#if editingIndex === i}
                    <input 
                      type="number"
                      class="category-index-input"
                      value={i + 1}
                      min="1"
                      max={items.length}
                      onblur={(e) => handleIndexChange(i, e.target.value)}
                      onkeydown={(e) => handleIndexKeydown(e, i)}
                      aria-label={`Position for ${cat.name}`}
                      autofocus
                    />
                  {:else}
                    <button 
                      class="category-index"
                      onclick={(e) => { e.stopPropagation(); startEditing(i); }}
                      title="Click to edit position"
                      aria-label={`Position ${i + 1}, click to edit`}
                    >
                      #{i + 1}
                    </button>
                  {/if}
                </div>
              </div>

              <!-- Delete Action -->
              <div class="category-actions">
                <button 
                  class="action-button delete"
                  onclick={(e) => { e.stopPropagation(); remove(i); }}
                  aria-label={`Delete category ${cat.name}`}
                  title={`Delete ${cat.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94209 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <!-- Pencil edit button (rename) -->
                <button
                  class="action-button"
                  onclick={(e) => { e.stopPropagation(); startEditingName(i); }}
                  aria-label={`Rename category ${cat.name}`}
                  title="Rename"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Subcategory Section -->
            {#if expandedCategories.has(cat.id)}
              <div class="subcategory-section">
                {#if Array.isArray(cat.subs) && cat.subs.length > 0}
                  <div 
                    class="subcategory-list"
                    use:dndzone={{ items: cat.subItems, flipDurationMs: 180, dropFromOthersDisabled: true }}
                    onconsider={(e) => handleSubDndConsider(i, e)}
                    onfinalize={(e) => handleSubDndFinalize(i, e)}
                  >
                    {#each cat.subItems as sub, si (sub.id)}
                      <div class="subcategory-item" role="listitem">
                        <div class="subcategory-content">
                          <!-- Subcategory Drag Handle -->
                          <div class="subcategory-drag-handle" aria-label="Drag subcategory" title="Drag subcategory" onclick={(e) => e.stopPropagation()}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5H11M8 12H11M8 19H11M13 5H16M13 12H16M13 19H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                          </div>
                          
                          <!-- Subcategory Name -->
                          <div class="subcategory-name">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="opacity: 0.7; margin-right: 8px;">
                              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            {#if editingSub && editingSub.catIndex === i && editingSub.subIndex === si}
                              <input
                                class="subcategory-input"
                                bind:value={editingSub.value}
                                onblur={() => saveSubName(i, si)}
                                onkeydown={(e) => handleSubNameKeydown(e, i, si)}
                                autofocus
                              />
                            {:else}
                              <div onclick={() => startEditingSub(i, si)} style="cursor:text;">{sub.name}</div>
                            {/if}
                          </div>

                          <!-- Delete Action -->
                          <div class="subcategory-actions">
                            <button 
                              class="action-button delete"
                              onclick={() => removeSub(i, si)}
                              aria-label={`Delete subcategory ${sub.name}`}
                              title={`Delete ${sub.name}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94209 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </button>
                          </div>
                            <div>
                              <button
                                class="action-button"
                                onclick={(e) => { e.stopPropagation(); startEditingName(si); }}
                                aria-label={`Rename category ${sub.name}`}
                                title="Rename"
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </button>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="no-subcategories">
                    <div class="no-sub-inner">
                      <div style="font-weight:600">No subcategories</div>
                      <small>Add a new subcategory to this category</small>
                    </div>
                    <button class="add-sub" onclick={() => addSub(i)}>Add</button>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
  {/each}
        
        {#if items.length === 0}
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="empty-icon">
              <path d="M9 2C8.44772 2 8 2.44772 8 3V4H6C4.89543 4 4 4.89543 4 6V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V6C20 4.89543 19.1046 4 18 4H16V3C16 2.44772 15.5523 2 15 2H9Z" stroke="currentColor" stroke-width="2"/>
              <path d="M8 10H16M8 14H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>No categories to manage</p>
            <small>Add some categories first!</small>
          </div>
        {/if}
      </div>
    </div>

    <div class="modal-footer">
  <button class="btn secondary" onclick={cancel}>Cancel</button>
  <button class="btn primary" onclick={save}>Save Changes</button>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: rgba(15, 23, 42, 0.98);
    border-radius: 12px;
    width: 420px;
    max-width: 95%;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    border: 1px solid rgba(59, 130, 246, 0.14);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    max-height: 86vh;
    user-select: none;
  }

  .modal-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(71, 85, 105, 0.18);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.85);
  }

  .modal-header h2 {
    margin: 0;
    color: #f8fafc;
    font-weight: 700;
    font-size: 1.15rem;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.01em;
  }

  .close-button {
    background: rgba(30, 41, 59, 0.55);
    border: 1px solid rgba(71, 85, 105, 0.22);
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.15s ease;
    padding: 0.2rem;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover, .close-button:focus {
    color: #f1f5f9;
    background-color: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.2);
    outline: none;
    transform: translateY(-1px);
  }

  .modal-body {
    padding: 1rem 1.25rem;
    overflow-y: auto;
    flex-grow: 1;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  }

  .instructions {
    color: #cbd5e1;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
    text-align: center;
    font-weight: 500;
    transition: all 0.2s ease;
    min-height: 20px;
    padding: 0.55rem;
    background: rgba(59, 130, 246, 0.06);
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.12);
  }

  .account-selector { margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
  .account-row { display:flex; align-items:center; gap:0.6rem; }
  .account-selector select { background: rgba(10,14,20,0.75); color: #e2e8f0; border: 1px solid rgba(59,130,246,0.12); padding: 0.4rem 0.6rem; border-radius: 8px; font-weight:600; }

  .drag-active-hint {
    color: #3b82f6;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    animation: pulse 2.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* More compact category list */
  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-list.drag-active {
    background-color: rgba(59, 130, 246, 0.03);
    border-radius: 10px;
    padding: 0.5rem;
    margin: -0.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 2rem 0.75rem;
    gap: 0.75rem;
    background-color: rgba(30, 41, 59, 0.22);
    border-radius: 10px;
    border: 2px dashed rgba(71, 85, 105, 0.18);
  }

  .empty-state p { font-size: 1rem; margin: 0; }

  .category-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 1rem;
    border-radius: 10px;
    position: relative;
    background: linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.82) 100%);
    border: 1px solid rgba(59,130,246,0.06);
    cursor: grab;
    backdrop-filter: blur(6px);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .category-item:hover {
    background: linear-gradient(180deg, rgba(17,24,39,0.95), rgba(14,21,36,0.9));
    border-color: rgba(59, 130, 246, 0.22);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(2,6,23,0.45);
  }

  .drag-handle {
    color: #94a3b8;
    cursor: grab;
    padding: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    opacity: 0.75;
    background: rgba(30,41,59,0.22);
    border: 1px solid rgba(59,130,246,0.08);
    min-width: 24px;
    min-height: 24px;
    font-size: 0.9rem;
  }

  .drag-handle:hover { opacity: 1; color: #e2e8f0; }

  .category-info { display: flex; align-items: center; gap: 0.75rem; overflow: hidden; flex: 1; }

  .category-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.06));
    border: 1px solid rgba(59,130,246,0.16);
    transition: all 0.15s ease;
  }

  .category-name {
    color: #f8fafc;
    font-size: 0.98rem;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    flex-grow: 1;
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .category-index {
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 600;
    background: rgba(71, 85, 105, 0.28);
    padding: 0.28rem 0.45rem;
    border-radius: 8px;
    min-width: 28px;
    text-align: center;
    border: 1px solid rgba(71, 85, 105, 0.18);
    cursor: pointer;
  }

  .category-index:hover, .category-index:focus { transform: scale(1.03); }

  .category-index-input { width: 42px; height: 28px; font-size: 0.85rem; }

  .category-name-input {
    background: rgba(10,14,20,0.75);
    border: 1px solid rgba(59, 130, 246, 0.42);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.98rem;
    font-weight: 600;
    padding: 0.32rem 0.45rem;
    width: 100%;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }

  .category-inline-actions { display: flex; align-items: center; gap: 0.4rem; }

  .expand-toggle { width: 30px; height: 30px; padding: 0.25rem; color: #94a3b8; background: rgba(30,41,59,0.12); border: 1px solid rgba(71,85,105,0.08); border-radius: 8px; display:flex; align-items:center; justify-content:center; }
  .expand-toggle:hover { color: #e2e8f0; background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.14); }

  .action-button {
    background: linear-gradient(180deg, rgba(30,41,59,0.6), rgba(17,24,39,0.6));
    border: 1px solid rgba(71, 85, 105, 0.12);
    padding: 0.28rem;
    border-radius: 8px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .action-button:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(6,8,23,0.45); }

  .delete { color: #ff7b7b; background: linear-gradient(180deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02)); border-color: rgba(248,113,113,0.12); }

  .delete:hover { background: rgba(239,68,68,0.12); color: #fff; box-shadow: 0 6px 18px rgba(239,68,68,0.18); }

  /* Ensure SVG icons use currentColor so they follow the button color */
  .action-button svg, .expand-toggle svg, .drag-handle svg, .category-icon svg {
    width: 16px; height: 16px; display: block; color: inherit; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }

  /* Tweak chevron color specifically to match muted palette */
  .expand-toggle svg { color: #475569; }
  .expand-toggle:hover svg { color: #e2e8f0; }

  .subcategory-section {
    margin-top: 0.75rem;
    margin-left: 2.25rem;
    padding-left: 1rem;
    border-left: 2px solid rgba(59,130,246,0.14);
    padding-bottom: 0.5rem;
  }

  .subcategory-list {
    gap: 0.5rem;
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
  }

  .subcategory-item {
    padding: 0.55rem 0.8rem;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(71, 85, 105, 0.3);
    cursor: grab;
    transition: all 0.2s ease;
  }

  .subcategory-item:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  .subcategory-content {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    width: 100%;
    gap: 0.6rem;
  }

  .subcategory-drag-handle {
    color: #64748b;
    cursor: grab;
    padding: 0.2rem;
    margin-right: 0.5rem;
    opacity: 0.5;
    transition: all 0.2s ease;
    border-radius: 2px;
  }

  .subcategory-drag-handle:hover {
    color: #3b82f6;
    opacity: 1;
    background: rgba(59, 130, 246, 0.1);
  }

  .subcategory-name {
    color: #e2e8f0;
    font-size: 0.92rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .subcategory-input {
    background: rgba(10,14,20,0.75);
    border: 1px solid rgba(59,130,246,0.12);
    color: #e2e8f0;
    padding: 0.28rem 0.45rem;
    border-radius: 6px;
    font-weight: 600;
    width: 100%;
  }

  .subcategory-actions {
    display: flex;
    gap: 0.3rem;
  }

  .modal-footer {
    padding: 0.9rem 1rem;
    gap: 0.6rem;
  }

  .btn {
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .btn.secondary {
    background-color: rgba(17,24,39,0.8);
    color: #cbd5e1;
    border: 1px solid rgba(71,85,105,0.08);
  }
  .btn.secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(2,6,23,0.45);
  }

  .btn.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 8px 26px rgba(59,130,246,0.18);
    border: 1px solid rgba(37,99,235,0.08);
  }
  .btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(37,99,235,0.22);
  }

  @media (max-width: 420px) {
    .modal-content { width: 95%; border-radius: 12px; }
    .modal-header, .modal-body, .modal-footer { padding-left: 0.75rem; padding-right: 0.75rem; }
  }
</style>