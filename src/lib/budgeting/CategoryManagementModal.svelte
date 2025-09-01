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
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { categories as categoriesStore, saveCategories } from '$lib/budgeting/store';
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

  let isDragActive = $state(false);
  let editingIndex = $state<number | null>(null);
  // Track which categories are expanded to show their subcategories
  let expandedCategories = $state(new Set<string>());

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
    // Create new Set to trigger reactivity
    expandedCategories = new Set(expandedCategories);
  }

  // Handle nested-sub dnd consider/finalize for a specific category index
  function handleSubDndConsider(catIndex: number, e: CustomEvent) {
    // We update the visual order immediately for better feedback
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
    flipDurationMs: 250, // Smooth flip animation
    morphDisabled: false, // Enable morphing for smoother transitions
    dropTargetStyle: { 
      outline: '2px solid #3b82f6', 
      outlineOffset: '2px',
      backgroundColor: 'rgba(59, 130, 246, 0.08)' 
    },
    dragDisabled: editingIndex !== null, // Disable drag when editing index
    zoneTabIndex: -1,
    dropFromOthersDisabled: true, // Only allow internal reordering
    transformDraggedElement: (element: HTMLElement | undefined, data: any) => {
      // Custom transform for dragged element with null check
      if (!element) return;
      element.style.transform = 'rotate(2deg) scale(1.05)';
      element.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.7)';
      element.style.zIndex = '1000';
      element.style.opacity = '0.95';
      element.style.backdropFilter = 'blur(8px)';
      element.style.borderRadius = '12px';
    },
    centreDraggedOnCursor: true // Center the drag image on cursor
  });

  // Enhanced event handlers with better state management
  function handleDndConsider(e: CustomEvent) {
    const { items: newItems, info } = e.detail;
    items = newItems;
    
    // Track drag state for visual feedback
    if (info.source === SOURCES.KEYBOARD || info.source === SOURCES.POINTER) {
      isDragActive = info.trigger === TRIGGERS.DRAG_STARTED;
    }
  }

  function handleDndFinalize(e: CustomEvent) {
    const { items: newItems, info } = e.detail;
    items = newItems;
    isDragActive = false;
    
    // Optional: Add haptic feedback for mobile devices
    if (navigator.vibrate && info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      navigator.vibrate(50); // Subtle vibration feedback
    }
  }


  // --- Enhanced Functions ---
  function remove(index: number) {
    // Add smooth removal animation
    const itemToRemove = items[index];
    
    // Temporarily mark for removal animation
    const element = document.querySelector(`[data-category-id="${itemToRemove.id}"]`);
    if (element) {
      element.classList.add('removing');
      
      setTimeout(() => {
        items = items.filter((_, i) => i !== index);
      }, 200); // Allow animation to complete
    } else {
      items = items.filter((_, i) => i !== index);
    }
  }

  function removeSub(categoryIndex: number, subIndex: number) {
    const cat = items[categoryIndex];
    cat.subItems.splice(subIndex, 1);
    cat.subs = cat.subItems.map(item => item.name);
  }

  async function save() {
    // Convert back to original Category format (remove our added properties)
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
        {#each items as cat, i (cat.id)} <!-- Use unique stable ID -->
          <div animate:flip={{ duration: 250, easing: (t) => t * (2 - t) }}>
            <div 
              class="category-item" 
              data-category-id={cat.id}
              role="listitem"
              tabindex="-1"
            >
              
              <!-- Enhanced Drag Handle -->
              <div class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5H11M8 12H11M8 19H11M13 5H16M13 12H16M13 19H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>

              <!-- Category Info -->
              <div class="category-info">
                                <div class="category-icon" onclick={() => toggleCategoryExpansion(cat.id)} style="cursor:pointer;">
                  <Icon name={cat.icon} size={28} color={cat.color} />
                </div>
                                <span class="category-name" onclick={() => toggleCategoryExpansion(cat.id)} style="cursor:pointer;">{cat.name}</span>
                
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
                      onclick={() => startEditing(i)}
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
                  onclick={() => remove(i)}
                  aria-label={`Delete category ${cat.name}`}
                  title={`Delete ${cat.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94209 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Subcategories Section -->
            {#if expandedCategories.has(cat.id) && Array.isArray(cat.subs) && cat.subs.length > 0}
              <div class="subcategory-section">
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
                        <div class="subcategory-drag-handle" aria-label="Drag to reorder" title="Drag to reorder">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5H11M8 12H11M8 19H11M13 5H16M13 12H16M13 19H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </div>
                        
                        <!-- Subcategory Name -->
                        <div class="subcategory-name">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="opacity: 0.7; margin-right: 8px;">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          {sub.name}
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
                      </div>
                    </div>
                  {/each}
                </div>
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(6px);
  }

  .modal-content {
    background: rgba(15, 23, 42, 0.92);
    border-radius: 18px;
    width: 380px;
    max-width: 95%;
    box-shadow: 
      0 30px 60px -15px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(59, 130, 246, 0.25),
      0 0 0 2px rgba(30, 58, 138, 0.1);
    overflow: hidden;
    border: 1px solid rgba(59, 130, 246, 0.15);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    user-select: none; /* Prevent text selection during drag */
  }

  .modal-header {
    padding: 1.25rem 1.5rem; /* More padding */
    border-bottom: 1px solid rgba(71, 85, 105, 0.25); /* Slightly more opaque */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    color: #f1f5f9; /* Lighter text */
    font-weight: 700; /* Bolder */
    font-size: 1.3rem;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em; /* Slight negative tracking for crispness */
  }

  .close-button {
    background: rgba(30, 41, 59, 0.6); /* Subtle background */
    border: 1px solid rgba(71, 85, 105, 0.3);
    color: #94a3b8;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
    padding: 0.4rem;
    border-radius: 8px; /* More rounded */
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover, .close-button:focus {
    color: #f1f5f9;
    background-color: rgba(239, 68, 68, 0.15); /* Red background on hover */
    border-color: rgba(239, 68, 68, 0.3);
    outline: none;
    transform: translateY(-1px); /* Subtle lift */
  }
  .close-button:active {
    transform: translateY(0);
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    /* Enhance scrolling performance */
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  }
  
  .instructions {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
    font-style: italic;
    transition: all 0.3s ease;
    min-height: 20px; /* Prevent layout shift */
  }

  .drag-active-hint {
    color: #3b82f6;
    font-weight: 600;
    font-style: normal;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Enhanced category list with modern CSS Grid for stability */
  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative;
    transition: all 0.2s ease;
    /* Use CSS Grid for more stable layouts during drag */
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
    /* Contain layout shifts */
    contain: layout style;
  }

  .category-list.drag-active {
    /* Subtle visual feedback when drag is active */
    background-color: rgba(59, 130, 246, 0.02);
    border-radius: 12px;
    padding: 0.5rem;
    margin: -0.5rem;
    transition: all 0.3s ease;
  }

  /* Enhanced empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 3rem 1rem;
    gap: 1rem;
    background-color: rgba(30, 41, 59, 0.3);
    border-radius: 12px;
    border: 2px dashed rgba(71, 85, 105, 0.3);
  }

  .empty-state .empty-icon {
    color: #475569;
    opacity: 0.7;
  }

  .empty-state p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .empty-state small {
    color: #64748b;
    font-size: 0.85rem;
  }

  .category-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.875rem 1rem;
    border-radius: 12px;
    position: relative;
    background: linear-gradient(135deg, 
      rgba(30, 41, 59, 0.8) 0%, 
      rgba(51, 65, 85, 0.6) 50%,
      rgba(30, 41, 59, 0.8) 100%
    );
    border: 1px solid rgba(71, 85, 105, 0.3);
    cursor: grab;
    
    /* Modern glassmorphism effect */
    backdrop-filter: blur(16px) saturate(180%);
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    
    /* Modern CSS for optimal performance */
    contain: layout style paint;
    will-change: transform, box-shadow, background-color;
    
    /* Advanced transitions using latest easing functions */
    transition: 
      transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
      background 0.25s ease,
      border-color 0.25s ease,
      opacity 0.2s ease,
      backdrop-filter 0.25s ease;

    transform-style: preserve-3d;
  }

  .category-item:hover {
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.12) 0%, 
      rgba(30, 41, 59, 0.9) 30%,
      rgba(79, 70, 229, 0.08) 70%,
      rgba(30, 41, 59, 0.9) 100%
    );
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.2),
      0 4px 16px rgba(59, 130, 246, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px) saturate(200%);
  }

  .category-item:active {
    cursor: grabbing;
    transform: translateY(-1px) scale(1.03);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Modern CSS for optimal drag handle UX */
  .drag-handle {
    color: #64748b;
    cursor: grab;
    padding: 0.25rem;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    opacity: 0.3;
    background: linear-gradient(135deg, 
      rgba(71, 85, 105, 0.1) 0%, 
      rgba(51, 65, 85, 0.05) 100%
    );
    border: 1px solid rgba(71, 85, 105, 0.08);
    
    /* Modern touch targets for accessibility */
    min-width: 24px;
    min-height: 24px;
    
    /* Enhance for modern browsers */
    contain: layout style;
    transform-style: preserve-3d;
    backdrop-filter: blur(3px);
  }

  .drag-handle:hover {
    color: #e2e8f0;
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.2) 0%, 
      rgba(79, 70, 229, 0.12) 50%,
      rgba(59, 130, 246, 0.1) 100%
    );
    opacity: 1;
    transform: scale(1.1) translateZ(0);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px) saturate(140%);
  }

  .category-item:active .drag-handle {
    cursor: grabbing;
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.3) 0%, 
      rgba(79, 70, 229, 0.2) 50%,
      rgba(59, 130, 246, 0.15) 100%
    );
    color: #3b82f6;
    transform: scale(1.05) translateZ(0);
    box-shadow: 
      0 6px 16px rgba(59, 130, 246, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  /* Enhanced category info layout */
  .category-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    overflow: hidden; /* Prevent text overflow issues */
  }

  .category-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.15) 0%, 
      rgba(79, 70, 229, 0.08) 100%
    );
    border: 1px solid rgba(59, 130, 246, 0.2);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(8px);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .category-item:hover .category-icon {
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.25) 0%, 
      rgba(79, 70, 229, 0.15) 100%
    );
    border-color: rgba(59, 130, 246, 0.4);
    transform: scale(1.1) rotateY(10deg);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .category-name {
    color: #f1f5f9;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .category-index {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 600;
    background: linear-gradient(135deg, 
      rgba(71, 85, 105, 0.3) 0%, 
      rgba(51, 65, 85, 0.2) 100%
    );
    padding: 0.25rem 0.4rem;
    border-radius: 6px;
    min-width: 24px;
    text-align: center;
    font-family: 'Inter', monospace;
    border: 1px solid rgba(71, 85, 105, 0.2);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(6px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .category-index:hover, .category-index:focus {
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.3) 0%, 
      rgba(79, 70, 229, 0.2) 100%
    );
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.5);
    outline: none;
    transform: scale(1.1) translateY(-2px);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .category-index-container {
    flex-shrink: 0;
  }

  .category-index-input {
    width: 40px;
    height: 28px;
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.2) 0%, 
      rgba(79, 70, 229, 0.1) 100%
    );
    border: 2px solid #3b82f6;
    border-radius: 6px;
    color: #f1f5f9;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
    font-family: 'Inter', monospace;
    outline: none;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(10px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: 
      0 2px 8px rgba(59, 130, 246, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .category-index-input:focus {
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.3) 0%, 
      rgba(79, 70, 229, 0.2) 100%
    );
    border-color: #2563eb;
    box-shadow: 
      0 0 0 4px rgba(59, 130, 246, 0.25),
      0 8px 20px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: scale(1.1) translateY(-2px);
  }

  .category-index-input::-webkit-outer-spin-button,
  .category-index-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .category-index-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .category-actions {
    display: flex;
    gap: 0.3rem;
  }

  .action-button {
    background: linear-gradient(135deg, 
      rgba(51, 65, 85, 0.25) 0%, 
      rgba(30, 41, 59, 0.15) 100%
    );
    border: 1px solid rgba(71, 85, 105, 0.15);
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 0.4rem;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    backdrop-filter: blur(6px);
    
    /* Modern touch targets */
    min-width: 32px;
    min-height: 32px;
    
    box-shadow: 
      0 1px 4px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .action-button:hover, .action-button:focus {
    color: #f1f5f9;
    background: linear-gradient(135deg, 
      rgba(239, 68, 68, 0.2) 0%, 
      rgba(220, 38, 38, 0.15) 100%
    );
    border-color: rgba(239, 68, 68, 0.4);
    outline: none;
    transform: translateY(-3px) scale(1.1);
    box-shadow: 
      0 6px 16px rgba(239, 68, 68, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .action-button:active {
    transform: translateY(0) scale(1.02);
  }

  .delete {
    color: #f87171;
  }

  .delete:hover, .delete:focus {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.15);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }

  /* Subcategory Styles */
  .subcategory-section {
    margin-top: 0.5rem;
    margin-left: 2.5rem;
    border-left: 2px solid rgba(59, 130, 246, 0.3);
    padding-left: 1rem;
  }

  .subcategory-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .subcategory-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.2);
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
    color: #cbd5e1;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .subcategory-actions {
    display: flex;
    gap: 0.3rem;
  }

  .modal-footer {
    padding: 1.25rem 1.5rem; /* More padding */
    border-top: 1px solid rgba(71, 85, 105, 0.25);
    display: flex;
    justify-content: flex-end;
    gap: 0.85rem; /* Increased gap */
  }

  .btn {
    padding: 0.6rem 1.25rem; /* More padding */
    border-radius: 8px; /* More rounded */
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600; /* Bolder text */
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smoother */
    border: 1px solid transparent;
    font-family: 'Inter', sans-serif;
  }

  .btn.secondary {
    background-color: rgba(30, 41, 59, 0.7);
    color: #cbd5e1;
    border-color: rgba(71, 85, 105, 0.4);
  }

  .btn.secondary:hover, .btn.secondary:focus {
    background-color: rgba(30, 41, 59, 0.9);
    border-color: rgba(59, 130, 246, 0.5);
    color: #f1f5f9;
    outline: none;
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  .btn.secondary:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .btn.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8); /* Richer blue gradient */
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); /* Subtle shadow */
  }

  .btn.primary:hover, .btn.primary:focus {
    background: linear-gradient(135deg, #2563eb, #1e40af); /* Darker on hover */
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); /* Enhanced shadow */
    outline: none;
  }
  .btn.primary:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
  }

  @media (max-width: 400px) {
    .modal-content {
      width: 95%;
      border-radius: 16px;
    }
    .modal-header, .modal-body, .modal-footer {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
</style>