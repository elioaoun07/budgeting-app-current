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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    --color-bg-primary: rgba(15, 23, 42, 0.95);
    --color-bg-card: rgba(30, 41, 59, 0.8);
    --color-bg-glass: rgba(15, 23, 42, 0.98);
    --color-bg-elevated: rgba(51, 65, 85, 0.6);
    --color-border-subtle: rgba(71, 85, 105, 0.2);
    --color-border-accent: rgba(59, 130, 246, 0.4);
    --color-primary: #3b82f6;
    --color-primary-hover: #2563eb;
    --color-primary-light: rgba(59, 130, 246, 0.15);
    --color-text-primary: #f8fafc;
    --color-text-secondary: #e2e8f0;
    --color-text-muted: #94a3b8;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-5: 20px;
    --spacing-6: 24px;
    --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
    --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(6px);
  }

  .modal {
    background: var(--color-bg-glass);
    border-radius: var(--radius-xl);
    width: 400px;
    max-width: 95%;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 1px solid var(--color-border-subtle);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    user-select: none;
    outline: none;
  }

  header {
    padding: var(--spacing-5) var(--spacing-6);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-weight: 700;
    font-size: 1.25rem;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }

  .close {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
    padding: 0.4rem;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close:hover, .close:focus {
    color: var(--color-text-primary);
    background-color: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    outline: none;
    transform: translateY(-1px);
  }

  .body {
    padding: var(--spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
    overflow-y: auto;
    flex-grow: 1;
  }

  label {
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  input[type="text"], input[type="color"] {
    margin-top: var(--spacing-2);
    padding: var(--spacing-4);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s var(--ease-spring);
    backdrop-filter: blur(16px);
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
    min-height: 52px;
    -webkit-appearance: none;
    appearance: none;
    box-shadow: var(--shadow-sm);
  }

  input[type="text"]:focus, input[type="color"]:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    background: var(--color-bg-glass);
    transform: translateY(-1px);
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: var(--spacing-3);
    margin-top: var(--spacing-3);
    max-height: 300px;
    overflow-y: auto;
    padding: var(--spacing-2);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-subtle);
    backdrop-filter: blur(12px);
  }

  .icon-cell {
    padding: var(--spacing-3);
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.3s var(--ease-spring);
    min-height: 60px;
  }

  .icon-cell:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    transform: scale(1.05);
  }

  .icon-cell.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: scale(1.05);
  }

  .icon-cell:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  footer {
    padding: var(--spacing-5) var(--spacing-6);
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-3);
  }

  .btn {
    padding: var(--spacing-3) var(--spacing-5);
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.3s var(--ease-spring);
    border: 1px solid transparent;
    font-family: 'Inter', sans-serif;
    min-height: 44px;
  }

  .btn.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white;
    border-color: transparent;
    box-shadow: var(--shadow-md);
  }

  .btn.primary:hover, .btn.primary:focus {
    background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary));
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    outline: none;
  }

  .btn.primary:active {
    transform: translateY(0);
    box-shadow: var(--shadow-md);
  }

  .btn.primary:disabled {
    background: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
    opacity: 0.6;
  }

  .btn.secondary {
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
    border-color: var(--color-border-subtle);
  }

  .btn.secondary:hover, .btn.secondary:focus {
    background: var(--color-bg-glass);
    border-color: var(--color-primary);
    color: var(--color-text-primary);
    outline: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .btn.secondary:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 400px) {
    .modal {
      width: 95%;
      border-radius: var(--radius-lg);
    }
    header, .body, footer {
      padding-left: var(--spacing-4);
      padding-right: var(--spacing-4);
    }
  }
</style>
