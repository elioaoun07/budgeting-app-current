<!-- src/routes/budgeting/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from "svelte/transition";
  import { flip } from 'svelte/animate';
  import { 
    currentAccount, 
    accounts, 
    selectAccount, 
    loadAccounts,
    categories,
    createCategory,
    saveCategories
  } from '$lib/budgeting/store';
  import { localParse, updateKeywordMap } from '$lib/budgeting/localNLP.js';
  import CalculatorModal from '$lib/budgeting/CalculatorModal.svelte';
  import AddAccountModal from '$lib/budgeting/AddAccountModal.svelte';
  import Icon from '$lib/icons/Icon.svelte';
 	import Sidebar from '$lib/budgeting/Sidebar.svelte';
  import AddCategoryModal from '$lib/budgeting/AddCategoryModal.svelte';
  import CategoryManagementModal from '$lib/budgeting/CategoryManagementModal.svelte';
  import OtherSubcategoryItem from '$lib/budgeting/OtherSubcategoryItem.svelte';
  import { addSubcategory } from '$lib/budgeting/store';

  // Keep keyword map in sync
  $: updateKeywordMap($categories);

  // UI state
  let showCalc: boolean = false;
  let calcPrefill: string = '';
  let showAccountDropdown: boolean = false;
  let showAddAccount: boolean = false;
  let submitting: boolean = false;
  let salary: number | null = null;

  // Expense data
  let selectedMain: string = '';
  let selectedSub: string = '';
  let amount: string = '';
  let description: string = '';
  let showSidebar = false;
  let showAddModal = false;
  let showEditCategories = false;
  let wiggleMode = false;
  let longPressTimer: number;

  // Drag and drop state
  let draggedCategory: string | null = null;
  let dragOverCategory: string | null = null;
  let categoryPositions = new Map();

  // Computed values
  $: currentCat = $categories.find(c => c.name === selectedMain);
  $: if (!selectedMain && $categories.length) {
    selectedMain = $categories[0].name;
  }

  // Quick actions
  function openCalculator() {calcPrefill = amount;showCalc = true;}
  function handleCalcResult(val: string) {amount = val;}
  function openSidebar() {showSidebar = true;}
  function closeSidebar() {showSidebar = false;}
  // Account switching
  function toggleAccountDropdown() { showAccountDropdown = !showAccountDropdown; }
  function handleAccountSelect(accountId: string) { selectAccount(accountId); showAccountDropdown = false; }
  function handleRequestAddCategory() { showAddModal = true; }
  function openAddAccountModal() { showAddAccount = true;showAccountDropdown = false; }
  function handleCancel() { showAddModal = false; }
  function openEditCategories() { showEditCategories = true; }

  // Long press handlers for wiggle mode
  function handleCategoryPointerDown(e: PointerEvent) {
    longPressTimer = window.setTimeout(() => {
      wiggleMode = true;
    }, 700); // 700ms long press
  }

  function handleCategoryPointerUp() {
    clearTimeout(longPressTimer);
  }

  function handleCategoryPointerLeave() {
    clearTimeout(longPressTimer);
  }

  function exitWiggleMode() {
    wiggleMode = false;
    draggedCategory = null;
    dragOverCategory = null;
  }

  function handleSaveCategories(event: CustomEvent<string[]>) {
		const newOrder = event.detail;

		const reordered = [...$categories].sort(
		(a, b) => newOrder.indexOf(a.name) - newOrder.indexOf(b.name)
		);

		saveCategories(reordered);          // persist  
		showEditCategories = false;
  	}

	function handleCancelEdit() {
		showEditCategories = false;
	}

  // Drag and drop handlers
  function handleDragStart(event: DragEvent, categoryName: string) {
    if (!wiggleMode) return;
    draggedCategory = categoryName;
    (event.target as HTMLElement).classList.add('dragging');
    event.dataTransfer?.setData('text/plain', categoryName);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDragEnter(event: DragEvent, categoryName: string) {
    if (!wiggleMode || !draggedCategory) return;
    dragOverCategory = categoryName;
    (event.target as HTMLElement).classList.add('drag-over');
  }

  function handleDragLeave(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('drag-over');
  }

  function handleDrop(event: DragEvent, targetCategory: string) {
    event.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;

    const oldIndex = $categories.findIndex(c => c.name === draggedCategory);
    const newIndex = $categories.findIndex(c => c.name === targetCategory);

    const newCategories = [...$categories];
    const [moved] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, moved);

    // Save with animation
    saveCategories(newCategories);
    
    // Clean up
    draggedCategory = null;
    dragOverCategory = null;
  }

  function handleDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    draggedCategory = null;
    dragOverCategory = null;
  }

  // Expense submission
  async function submit() {
    if (!selectedSub || !amount) {
      alert('Please fill all fields');
      return;
    }
    
    submitting = true;
    try {
      const res = await fetch('/budgeting/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          account_id: $currentAccount?.id ?? '',
          category: selectedMain,
          subcategory: selectedSub,
          amount,
          description
        })
      });
      
      const result = await res.json();
      if (result.success) {
        // Reset for next entry but keep category
        amount = '';
        selectedSub = '';
        description = '';
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Failed to submit: ${(error as Error).message}`);
    } finally {
      submitting = false;
    }
  }

  function handleAddCategoryFromModal(event: any) {
    // Work around type inconsistency in AddCategoryModal
    const { name, icon, color } = event.detail || {};
    if (name && icon && color) {
      createCategory(name, icon, color);
      showAddModal = false;
    }
  }

  // Initialize data
  onMount(() => {
    // Async initialization
    (async () => {
      try {
        await loadAccounts();
        
        const salRes = await fetch('/budgeting/api/salary');
        if (salRes.ok) {
          const salData = await salRes.json();
          salary = parseFloat(salData.salary || '0');
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    })();

    // Listen for edit categories request from layout
    const handleEditCategoriesRequest = () => {
      openEditCategories();
    };
    
    window.addEventListener('requestEditCategories', handleEditCategoriesRequest);
    
    return () => {
      window.removeEventListener('requestEditCategories', handleEditCategoriesRequest);
    };
  });

  // Handler when OtherSubcategoryItem requests creation of a new sub
  async function handleCreateSub(event: CustomEvent<string>) {
    const name = (event.detail || '').trim();
    if (!name || !selectedMain) return;
    try {
      await addSubcategory(selectedMain, name);
      selectedSub = name;
    } catch (err) {
      console.error('Failed to add subcategory', err);
    }
  }

  function handleSelectSub(event: CustomEvent<string>) {
    const name = event.detail;
    if (name) selectedSub = name;
  }

  // Keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    // Ctrl+Enter to submit
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
    // Escape to close modals
    else if (e.key === 'Escape') {
      showCalc = false;
    }
  }

  // Capture positions for FLIP animation
  function captureCategoryPositions() {
    categoryPositions.clear();
    const categoryElements = document.querySelectorAll('.cat-button');
    categoryElements.forEach(el => {
      const name = el.querySelector('div')?.textContent;
      if (name) {
        categoryPositions.set(name, el.getBoundingClientRect());
      }
    });
  }

  // Apply FLIP animation after update
  function applyFlipAnimation() {
    const categoryElements = document.querySelectorAll('.cat-button');
    categoryElements.forEach(el => {
      const name = el.querySelector('div')?.textContent;
      if (name && categoryPositions.has(name)) {
        const oldPos = categoryPositions.get(name);
        const newPos = el.getBoundingClientRect();
        const deltaX = oldPos.left - newPos.left;
        const deltaY = oldPos.top - newPos.top;
        
        el.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: 'translate(0, 0)' }
          ],
          {
            duration: 300,
            easing: 'ease-out'
          }
        );
      }
    });
  }

  // Capture positions before drag
  function handleDragStartWithPosition(e, categoryName) {
    captureCategoryPositions();
    handleDragStart(e, categoryName);
  }

  // Apply animation after drop
  function handleDropWithAnimation(e, targetCategory) {
    handleDrop(e, targetCategory);
    setTimeout(applyFlipAnimation, 0);
  }
</script>

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

  .page {
    font-family: 'Inter', sans-serif;
    max-width: 100%;
    margin: 0;
    padding: var(--spacing-4);
    background: var(--color-bg-glass);
    backdrop-filter: blur(24px);
    border-radius: 0;
    margin-top: 60px;
    min-height: calc(100vh - 60px);
    position: relative;
  }

  @media (min-width: 768px) {
    .page {
      max-width: 500px;
      margin: var(--spacing-6) auto;
      padding: var(--spacing-6);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl);
      margin-top: 100px;
      box-shadow: var(--shadow-lg);
    }
  }

  .header {
    display: flex; 
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-5);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-subtle);
    backdrop-filter: blur(16px);
    position: relative;
    z-index: 10;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
    opacity: 0.5;
  }

  .header h1 {
    color: var(--color-text-primary);
    font-weight: 800;
    margin: 0;
    font-size: 1.75rem;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--color-text-primary), var(--color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .account-switcher {
    position: relative;
    display: inline-block;
    z-index: 20000;
  }

  .account-selector {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    cursor: pointer;
    border-radius: var(--radius-lg);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s var(--ease-spring);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    min-height: 48px;
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    min-width: 160px;
    justify-content: space-between;
  }

  .account-selector:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }

  .account-name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
  }

  .account-title {
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: -0.01em;
  }

  .account-arrow {
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    transition: transform 0.3s var(--ease-spring);
  }

  .account-selector.open .account-arrow {
    transform: rotate(180deg);
  }

  .account-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: var(--color-bg-glass);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-lg);
    z-index: 20001;
    overflow: hidden;
    max-height: 280px;
    overflow-y: auto;
  }

  .account-option {
    width: 100%;
    padding: var(--spacing-4);
    background: none;
    border: none;
    color: var(--color-text-primary);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s var(--ease-out-cubic);
    border-bottom: 1px solid var(--color-border-subtle);
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .account-option:last-child {
    border-bottom: none;
  }

  .account-option:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }

  .account-option.selected {
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 600;
  }

  .account-option.selected::after {
    content: '✓';
    color: var(--color-primary);
    font-weight: 700;
  }

  .add-account-option {
    width: 100%;
    padding: var(--spacing-4);
    background: var(--color-primary-light);
    border: none;
    color: var(--color-primary);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s var(--ease-out-cubic);
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    border-top: 1px solid var(--color-border-subtle);
  }

  .add-account-option:hover {
    background: var(--color-primary);
    color: white;
  }

  .add-account-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .section {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--spacing-5);
    margin-bottom: var(--spacing-5);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
    opacity: 0.3;
  }

  .section-title {
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 var(--spacing-4) 0;
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-2);
  }

  .cat-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    backdrop-filter: blur(12px);
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    min-height: 70px;
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    box-shadow: var(--shadow-sm);
  }

  .cat-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary-light), transparent, var(--color-primary-light));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }

  .cat-button:hover {
    transform: translateY(-2px) scale(1.03);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  .cat-button:hover::before {
    opacity: 0.15;
  }

  .cat-button.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px) scale(1.02);
  }

  .cat-button.selected::before {
    opacity: 0.25;
    background: linear-gradient(135deg, var(--color-primary), transparent, var(--color-primary));
  }

  .cat-button div {
    font-size: 0.65rem;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-1);
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .cat-button.selected div {
    color: var(--color-primary);
    font-weight: 700;
  }

  /* iPhone-style wiggle animation */
  @keyframes wiggle {
    0%, 100% { 
      transform: rotate(-1.5deg) translateY(-2px) scale(1.02);
    }
    25% { 
      transform: rotate(1.8deg) translateY(-3px) scale(1.03);
    }
    50% { 
      transform: rotate(-2deg) translateY(-2px) scale(1.02);
    }
    75% { 
      transform: rotate(1.5deg) translateY(-3px) scale(1.03);
    }
  }

  .wiggle-mode .cat-button {
    animation: wiggle 0.6s ease-in-out infinite;
    z-index: 10;
    cursor: grab;
  }

  .wiggle-mode .cat-button:nth-child(2n) {
    animation-delay: 0.1s;
  }

  .wiggle-mode .cat-button:nth-child(3n) {
    animation-delay: 0.2s;
  }

  .wiggle-mode .cat-button:nth-child(4n) {
    animation-delay: 0.15s;
  }

  .wiggle-mode .add-category-chip {
    animation: wiggle 0.7s ease-in-out infinite;
    animation-delay: 0.3s;
  }

  /* Drag and drop styles */
  .cat-button.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .cat-button.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: scale(1.05);
  }

  /* Exit wiggle button */
  .exit-wiggle {
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    background: rgba(239, 68, 68, 0.9);
    border: none;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(12px);
    transition: all 0.3s var(--ease-spring);
    z-index: 1001;
  }

  .exit-wiggle:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  }

  /* --- Expert-Level Add Category Chip --- */
  .add-category-chip {
    /* Inherit base .cat-button styles for consistency */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-1);
    border: 2px dotted var(--color-border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    backdrop-filter: blur(12px);
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    min-height: 70px;
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    box-shadow: var(--shadow-sm);
    
    /* Continuous diagonal stripes angled right (like /) */
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(59, 130, 246, 0.04) 0px,
      rgba(59, 130, 246, 0.04) 6px,
      rgba(148, 163, 184, 0.04) 6px,
      rgba(148, 163, 184, 0.04) 12px
    );
  }

  .add-category-chip:hover {
    transform: translateY(-2px) scale(1.03);
    border-color: var(--color-primary);
    border-style: dotted;
    box-shadow: var(--shadow-md);
    
    /* Enhanced stripes on hover with same angle */
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(59, 130, 246, 0.1) 0px,
      rgba(59, 130, 246, 0.1) 6px,
      rgba(148, 163, 184, 0.06) 6px,
      rgba(148, 163, 184, 0.06) 12px
    );
  }

  .add-category-chip::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary-light), transparent, var(--color-primary-light));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }

  .add-category-chip:hover::before {
    opacity: 0.1;
  }

  .add-category-chip span {
    font-size: 24px;
    color: var(--color-text-muted);
    transition: all 0.3s ease;
    margin-bottom: var(--spacing-1);
    z-index: 2;
    position: relative;
  }

  .add-category-chip:hover span {
    color: var(--color-primary);
    transform: scale(1.1);
  }

  .add-category-chip div {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;
    line-height: 1.2;
    letter-spacing: -0.01em;
    z-index: 2;
    position: relative;
  }

  .add-category-chip:hover div {
    color: var(--color-primary);
    font-weight: 700;
  }

  .subcategory-list {
    max-height: 200px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-2);
  }

  .subcategory-item {
    padding: var(--spacing-3) var(--spacing-2);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--color-border-subtle);
    background: var(--color-bg-elevated);
    text-align: center;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .subcategory-item:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  .subcategory-item.selected {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 600;
  }

  .form-group {
    margin-bottom: var(--spacing-5);
    position: relative;
  }

  .label {
    display: block;
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: var(--spacing-2);
  }

  .input-field {
    width: 100%;
    padding: var(--spacing-4) var(--spacing-5);
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
    position: relative;
    box-shadow: var(--shadow-sm);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    background: var(--color-bg-glass);
    transform: translateY(-1px);
  }

  .amount-row {
    display: flex;
    align-items: stretch;
    gap: var(--spacing-2);
  }

  .amount-input {
    flex: 1;
  }

  .calc-btn {
    width: 44px;
    border: 1px solid var(--color-border-accent);
    background: var(--color-bg-elevated);
    color: var(--color-primary);
    border-radius: var(--radius-md);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    min-width: 44px;
    min-height: 52px;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }

  .calc-btn:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    background: var(--color-primary);
    color: white;
  }

  .submit-btn {
    width: 100%;
    padding: var(--spacing-4) var(--spacing-5);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    border: none;
    border-radius: var(--radius-lg);
    color: white;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.4s var(--ease-spring);
    margin-top: var(--spacing-4);
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
    min-height: 52px;
    backdrop-filter: blur(20px);
  }

  .submit-btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg);
    background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  }

  .submit-btn:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 0.1s;
  }

  .submit-btn:disabled {
    background: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
    opacity: 0.6;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease-in-out infinite;
    margin-right: var(--spacing-2);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .shortcut-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: var(--spacing-3);
  }

  .menu-btn {
    position: fixed;
    top: 1rem;
    left: 1rem;
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    z-index: 1000;
    color: var(--color-text-primary);
  }
</style>

<svelte:window on:keydown={handleKeyDown} />

<div class="page">
  <div class="header">
    <h1>Quick Expense</h1>
    <div class="account-switcher">
      <button
        class="account-selector"
        class:open={showAccountDropdown}
        on:click={toggleAccountDropdown}
        aria-expanded={showAccountDropdown}
        aria-haspopup="listbox"
      >
        <div class="account-name">
          <div class="account-title">
            {$currentAccount?.name || 'Select Account'}
          </div>
        </div>
        <div class="account-arrow">▼</div>
      </button>
      {#if showAccountDropdown}
        <div class="account-dropdown" transition:fly={{ y: -10, duration: 200 }}>
          {#each $accounts as account (account.id)}
            <button
              class="account-option"
              class:selected={$currentAccount?.id === account.id}
              on:click={() => handleAccountSelect(account.id)}
            >
              <span>{account.name}</span>
            </button>
          {/each}
          <button
            class="add-account-option"
            on:click={openAddAccountModal}
          >
            <span class="add-account-icon">+</span>
            Add New Account
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if showAddModal}
    <AddCategoryModal
      on:save={handleAddCategoryFromModal}
      on:cancel={handleCancel}
    />
  {/if}

  <div class="section">
    <h3 class="section-title">Category</h3>
    <div class="category-grid" class:wiggle-mode={wiggleMode}>
      {#each $categories as cat, i (cat.name)}
        <button
          type="button"
          class="cat-button"
          class:selected={cat.name === selectedMain}
          on:click={() => !wiggleMode && (selectedMain = cat.name)}
          on:pointerdown={handleCategoryPointerDown}
          on:pointerup={handleCategoryPointerUp}
          on:pointerleave={handleCategoryPointerLeave}
          aria-pressed={cat.name === selectedMain}
          in:fly={{ y: 10, duration: 300, delay: i * 30 }}
          
          draggable={wiggleMode}
          on:dragstart={(e) => handleDragStartWithPosition(e, cat.name)}
          on:dragover|preventDefault={handleDragOver}
          on:dragenter={(e) => handleDragEnter(e, cat.name)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDropWithAnimation(e, cat.name)}
          on:dragend={handleDragEnd}
        >
          <Icon name={cat.icon} size={24} color={cat.color} />
          <div>{cat.name}</div>
        </button>
      {/each}

      <!-- Add New Category Button -->
      <button
        type="button"
        class="cat-chip add-category-chip"
        on:click={() => !wiggleMode && handleRequestAddCategory()}
        on:pointerdown={handleCategoryPointerDown}
        on:pointerup={handleCategoryPointerUp}
        on:pointerleave={handleCategoryPointerLeave}
      >
        <span style="font-size: 24px;">➕</span>
        <div>Add Category</div>
      </button>
    </div>
  </div>

  {#if currentCat?.subs}
    <div class="section">
      <h3 class="section-title">Subcategory</h3>
      <div class="subcategory-list">
        {#each currentCat.subs as sub (sub)}
          <div
            class="subcategory-item"
            class:selected={sub === selectedSub}
            on:click={() => selectedSub = sub}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && (selectedSub = sub)}
          >
            {sub}
          </div>
        {/each}
        <!-- Render the editable "Other" row which can create a new subcategory -->
        <OtherSubcategoryItem
          categoryName={selectedMain}
          selected={selectedSub}
          on:create={handleCreateSub}
          on:select={handleSelectSub}
        />
      </div>
    </div>
  {/if}

  <div class="section">
    <div class="form-group">
      <label class="label" for="amount">Amount</label>
      <div class="amount-row">
        <input
          id="amount"
          type="number"
          bind:value={amount}
          placeholder="0.00"
          class="input-field amount-input"
          step="0.01"
          autocomplete="off"
        />
        <button class="calc-btn" on:click={openCalculator}>🧮</button>
      </div>
    </div>

    <div class="form-group">
      <label class="label" for="description">Description (Optional)</label>
      <input
        id="description"
        type="text"
        bind:value={description}
        placeholder="What was this for?"
        class="input-field"
        autocomplete="off"
      />
    </div>

    <button 
      class="submit-btn" 
      on:click={submit} 
      disabled={submitting || !selectedSub || !amount}
    >
      {#if submitting}
        <div class="loading-spinner"></div>
        Adding...
      {:else}
        Add Expense
      {/if}
    </button>
  </div>

 <div style="position: fixed; top: 10px; left: 10px; z-index: 1000;">
    <button on:click={openSidebar} style="font-size: 24px; background:none; border:none; cursor:pointer; color:aliceblue">
      ☰
    </button>
  </div>

  <Sidebar
    visible={showSidebar}
    on:close={closeSidebar}
  />

  <CalculatorModal
    visible={showCalc}
    prefill={calcPrefill}
    onResult={handleCalcResult}
    onClose={() => (showCalc = false)}
  />

  <!-- Add the actual AddAccountModal component with two-way binding -->
  <AddAccountModal bind:open={showAddAccount} />

  <!-- Category Management Modal -->
  {#if showEditCategories}
    <CategoryManagementModal
      on:save={handleSaveCategories}
      on:cancel={handleCancelEdit}
    />
  {/if}

  <!-- Exit wiggle mode button -->
  {#if wiggleMode}
    <button
      class="exit-wiggle"
      on:click={exitWiggleMode}
      transition:fade={{ duration: 200 }}
      title="Exit edit mode"
    >
      ✕
    </button>
  {/if}

</div>