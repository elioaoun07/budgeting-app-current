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
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { categories as categoriesStore, saveCategories } from '$lib/budgeting/store';
  import Icon from '$lib/icons/Icon.svelte';
  import type { Category } from '$lib/budgeting/defaults';

  const dispatch = createEventDispatcher<{ save: string[]; cancel: void }>();
  const initialCategories: Category[] = get(categoriesStore);
  let items = $state(initialCategories.map(c => ({ ...c })));

  // Drag and drop state
  let dragIndex = $state<number | null>(null);
  let dropIndicator = $state<{ index: number; position: 'above' | 'below' } | null>(null);

  // --- Enhanced Drag and Drop ---
  function handleDragStart(e: DragEvent, index: number) {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString()); // Required for Firefox
    dragIndex = index;
    
    // Improve drag ghost image
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('dragging');
      // Create a custom drag image for better UX
      const dragImage = e.target.cloneNode(true) as HTMLElement;
      dragImage.style.width = e.target.offsetWidth + 'px';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px'; // Move off-screen
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      // Clean up the temporary element after a short delay
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  }

  // Inside handleDragOver, simplify the midpoint logic:
  function handleDragOver(e: DragEvent, index: number) {
      e.preventDefault();
      if (!e.dataTransfer || dragIndex === null || dragIndex === index) {
          dropIndicator = null;
          return;
      }

      const itemElement = e.currentTarget as HTMLElement;
      const rect = itemElement.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY <= midpoint) {
          dropIndicator = { index, position: 'above' }; // Always 'above' for top half
      } else {
          dropIndicator = { index, position: 'below' }; // Always 'below' for bottom half
      }
  }

  function handleDragLeave() {
    dropIndicator = null;
  }

  function handleDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) {
      resetDragState();
      return;
    }

    // Calculate the actual insert index based on drop position
    let insertIndex = targetIndex;
    if (dropIndicator?.position === 'below' && targetIndex >= dragIndex) {
      insertIndex = targetIndex + 1;
    } else if (dropIndicator?.position === 'above' && targetIndex > dragIndex) {
      insertIndex = targetIndex;
    } else if (dropIndicator?.position === 'below' && targetIndex < dragIndex) {
      insertIndex = targetIndex + 1;
    }

    // Perform the reorder
    const draggedItem = items[dragIndex];
    items.splice(dragIndex, 1);
    // Adjust insert index after removal
    const finalIndex = insertIndex > dragIndex ? insertIndex - 1 : insertIndex;
    items.splice(finalIndex, 0, draggedItem);

    resetDragState();
  }

  function handleDragEnd(e: DragEvent) {
    resetDragState();
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('dragging');
    }
  }

  function resetDragState() {
    dragIndex = null;
    dropIndicator = null;
  }

  // --- Original Functions ---
  function remove(index: number) {
    // Add a subtle animation for removal?
    items.splice(index, 1);
  }

  async function save() {
    await saveCategories(items);
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

<div class="modal-overlay" on:click={cancel} on:keydown={handleKeyDown}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Edit Categories</h2>
      <button class="close-button" on:click={cancel} aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <!-- Instructions for drag and drop -->
      <p class="instructions">Drag categories to reorder them</p>
      
      <div class="category-list">
        {#each items as cat, i (cat.name)}
          <div
            class="category-item"
            class:drag-over-above={dropIndicator?.index === i && dropIndicator?.position === 'above'}
            class:drag-over-below={dropIndicator?.index === i && dropIndicator?.position === 'below'}
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, i)}
            on:dragover={(e) => handleDragOver(e, i)}
            on:dragleave={handleDragLeave}
            on:drop={(e) => handleDrop(e, i)}
            on:dragend={handleDragEnd}
            role="listitem"
          >
            <!-- Drag Handle -->
            <div class="drag-handle" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 5H11M8 12H11M8 19H11M13 5H16M13 12H16M13 19H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>

            <!-- Category Info -->
            <div class="category-info">
              <Icon name={cat.icon} size={24} color={cat.color} />
              <span class="category-name">{cat.name}</span>
            </div>

            <!-- Delete Action -->
            <div class="category-actions">
              <button 
                class="action-button delete"
                on:click={() => remove(i)}
                aria-label={`Delete category ${cat.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94209 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            
            <!-- Drop Indicators -->
            {#if dropIndicator?.index === i && dropIndicator?.position === 'above'}
              <div class="drop-indicator above"></div>
            {/if}
            {#if dropIndicator?.index === i && dropIndicator?.position === 'below'}
              <div class="drop-indicator below"></div>
            {/if}
          </div>
          
          <!-- Standalone indicator for end of list -->
          {#if i === items.length - 1 && dropIndicator?.index === i && dropIndicator?.position === 'below'}
            <div class="drop-indicator standalone-below"></div>
          {/if}
        {/each}
        
        <!-- Indicator for dropping at the very end if list is empty or if needed -->
        {#if items.length === 0}
          <div class="empty-state">No categories yet</div>
        {/if}
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn secondary" on:click={cancel}>Cancel</button>
      <button class="btn primary" on:click={save}>Save Changes</button>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6); /* Darker for better contrast */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(6px); /* Slightly less blur for performance */
  }

  .modal-content {
    background: rgba(15, 23, 42, 0.92); /* Slightly less transparent */
    border-radius: 18px; /* Slightly less rounded for a more professional look */
    width: 380px; /* Slightly wider */
    max-width: 95%;
    box-shadow: 
      0 30px 60px -15px rgba(0, 0, 0, 0.5), /* Stronger shadow */
      0 0 0 1px rgba(59, 130, 246, 0.25), /* More prominent border */
      0 0 0 2px rgba(30, 58, 138, 0.1);
    overflow: hidden;
    border: 1px solid rgba(59, 130, 246, 0.15);
    backdrop-filter: blur(16px); /* More blur */
    display: flex;
    flex-direction: column;
    max-height: 90vh; /* Prevent modal from being taller than viewport */
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
    padding: 1.25rem 1.5rem; /* More padding */
    overflow-y: auto;
    flex-grow: 1; /* Take available space */
  }
  
  .instructions {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
    font-style: italic;
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative; /* For absolute positioning of indicators */
  }
  
  .empty-state {
    color: #64748b;
    text-align: center;
    padding: 2rem 1rem;
    font-style: italic;
  }

  .category-item {
    display: flex;
    align-items: center;
    padding: 0.85rem 0.75rem; /* Adjusted padding */
    border-radius: 10px; /* Rounded corners */
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smoother transition */
    position: relative;
    background-color: rgba(30, 41, 59, 0.4); /* Subtle background */
    border: 1px solid rgba(71, 85, 105, 0.2);
    margin-bottom: 0.5rem; /* Space between items */
  }

  .category-item:last-child {
    margin-bottom: 0;
  }

  /* Visual feedback for the item being dragged */
  .category-item.dragging {
    opacity: 0.6;
    transform: scale(0.99);
    box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.3);
    z-index: 2; /* Ensure it's above others */
  }

  /* Visual feedback for the drop target area */
  .category-item.drag-over-above {
    border-top: 2px solid #3b82f6;
  }
  .category-item.drag-over-below {
    border-bottom: 2px solid #3b82f6;
  }

  /* Drag Handle */
  .drag-handle {
    color: #64748b; /* Muted color */
    cursor: grab;
    padding: 0.3rem;
    margin-right: 0.75rem; /* Increased space */
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent shrinking */
  }

  .drag-handle:hover {
    color: #e2e8f0;
  }

  .category-item:active .drag-handle {
    cursor: grabbing;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 0.85rem; /* Increased gap */
    flex-grow: 1;
  }

  .category-name {
    color: #f1f5f9; /* Lighter text */
    font-size: 1rem; /* Slightly larger */
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  }

  .category-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.2s ease;
    padding: 0.4rem;
    border-radius: 6px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent shrinking */
  }

  .action-button:hover, .action-button:focus {
    color: #f1f5f9;
    background-color: rgba(239, 68, 68, 0.1);
    outline: none;
    transform: translateY(-1px);
  }
  .action-button:active {
    transform: translateY(0);
  }

  .delete {
    color: #f87171;
  }

  .delete:hover, .delete:focus {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.15);
  }

  /* Drop Indicators */
  .drop-indicator {
    position: absolute;
    height: 3px;
    background-color: #3b82f6;
    border-radius: 2px;
    left: 0;
    right: 0;
    z-index: 3; /* Above items */
    pointer-events: none; /* Don't interfere with drag events */
  }
  .drop-indicator.above {
    top: -2px;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  }
  .drop-indicator.below {
    bottom: -2px;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  }
  .drop-indicator.standalone-below {
    position: relative;
    top: 0.25rem;
    margin-left: 3rem; /* Align with item content */
    margin-right: 3rem;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
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