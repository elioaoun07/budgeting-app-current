<!--
──────────────────────────────────────────────────────────────
src/routes/budgeting/+page.svelte

Purpose ▸ Main budgeting dashboard page.
           Lets the user enter expenses, view allocations, see reminders, and manage categories.
           Shows salary breakdown, category/subcategory selection, and quick entry tools.

Exports ▸
  • Svelte page – Budgeting dashboard

Depends ▸
  • $lib/budgeting/store – account/category stores, helpers
  • $lib/budgeting/localNLP.js – localParse
  • $lib/budgeting/* – modals and UI components
  • $lib/icons/Icon.svelte – icon rendering

Used in ▸
  • Budgeting dashboard (main expense entry and overview)

Notes   ▸ Responsive design, salary breakdown, reminders, quick entry (speech, OCR, calculator).
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
  import { fly, fade } from "svelte/transition";
	import { currentAccount, accounts, selectAccount, loadAccounts } from '$lib/budgeting/store';
	import CalculatorModal from '$lib/budgeting/CalculatorModal.svelte';
	import ScheduledPopup from '$lib/budgeting/ScheduledPopup.svelte';
	import Sidebar from '$lib/budgeting/Sidebar.svelte';
	import SalaryModal from '$lib/budgeting/SalaryModal.svelte';
	import RecurringModal from '$lib/budgeting/RecurringModal.svelte';
	import QuickSpeechEntry from '$lib/budgeting/QuickSpeechEntry.svelte';
  import { localParse, updateKeywordMap } from '$lib/budgeting/localNLP.js';
	import CameraModal from '$lib/budgeting/CameraModal.svelte';
	import AddCategoryModal from '$lib/budgeting/AddCategoryModal.svelte';
  import OtherSubcategoryItem from '$lib/budgeting/OtherSubcategoryItem.svelte';
	import CategoryManagementModal from '$lib/budgeting/CategoryManagementModal.svelte';
	import Icon from '$lib/icons/Icon.svelte';
  import { categories, createCategory, saveCategories, rawPrefs } from '$lib/budgeting/store';
// Keep the keyword map in sync with categories
$: updateKeywordMap($categories);
	import type { Category } from '$lib/budgeting/defaults';

	/* REACTIVE: current selected account ID */
	$: selectedAccountId = $currentAccount?.id ?? '';

	export let data: {
		username: string | null;
		accounts: { id: string; name: string }[];
	};

	/* --------------------------------------------------------- */
	/* Everything below is unchanged from your previous version. */
	/* --------------------------------------------------------- */

	/* UI state */
	let showCalc = false;
	let calcPrefill = '';
	let editingSalary = false;
	let salaryInput = '';
	let showSidebar = false;
	let showSalaryModal = false;
	let showRecModal = false;
	let showCam = false;
	let showAddModal = false;
	let tithing = 0, needs = 0, wants = 0, saving = 0;

	$: if (salary !== null) {
		tithing = salary * 0.11;
		const remaining = salary - tithing;
		needs = remaining * 0.50;
		wants = remaining * 0.30;
		saving = remaining * 0.20;
	}

	let currentCat: Category | undefined;
	$: currentCat = $categories.find(c => c.name === selectedMain);
	$: if (!selectedMain && $categories.length) {
		selectedMain = $categories[0].name;
	}

	const handleAddRecurring = () => (showRecModal = true);

	function handleCalcResult(val: string) { amount = val; }
	function openSidebar() { showSidebar = true; }
	function closeSidebar() { showSidebar = false; }
	function openSalaryModal() { showSalaryModal = true; }
	function closeSalaryModal() { showSalaryModal = false; }
	function openCamera() { showCam = true; }
	function handleRequestAddCategory() { showAddModal = true; }
	function handleCancel() { showAddModal = false; }

	let showEditCategories = false;
	let showAccountDropdown = false;

	// Load accounts on mount
	onMount(async () => {
		try {
			await loadAccounts();
		} catch (error) {
			console.error('Failed to load accounts:', error);
		}

		// Click outside handler for account dropdown
		const handleClickOutside = (event: MouseEvent) => {
			if (showAccountDropdown && !event.target?.closest?.('.account-switcher')) {
				showAccountDropdown = false;
			}
		};

		// Listen for custom events from navigation
		const handleNavigationAddCategory = () => {
			handleRequestAddCategory();
		};

		const handleNavigationAddAccount = () => {
			// Open the sidebar which contains the Add Account functionality
			showSidebar = true;
		};

		document.addEventListener('click', handleClickOutside);
		window.addEventListener('requestAddCategory', handleNavigationAddCategory);
		window.addEventListener('requestAddAccount', handleNavigationAddAccount);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
			window.removeEventListener('requestAddCategory', handleNavigationAddCategory);
			window.removeEventListener('requestAddAccount', handleNavigationAddAccount);
		};
	});

	function openEditCategories() {
		showEditCategories = true;
	}

	function toggleAccountDropdown() {
		showAccountDropdown = !showAccountDropdown;
	}

	function handleAccountSelect(accountId: string) {
		selectAccount(accountId);
		showAccountDropdown = false;
	}

	function handleAccountKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showAccountDropdown = false;
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleAccountDropdown();
		}
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

	function handleAddCategory({ detail: { name, icon, color } }) {
		createCategory(name, icon, color);  // persist + update store
		showAddModal = false;
	}

	function removeCategory(name: string) {
		const filtered = $categories.filter(c => c.name !== name);
		saveCategories(filtered);
	}


	function reorder(newOrder: string[]) {
		const reordered = [...$categories].sort(
		(a, b) => newOrder.indexOf(a.name) - newOrder.indexOf(b.name)
		);
		saveCategories(reordered);
	}

  let featureInProgress = true;
  let showToast = false;
  let toastText = "🚧 Feature in progress";

  function showHelpToast(message = "🚧 Feature in progress") {
    toastText = message;
    showToast = true;
    clearTimeout(showHelpToast._t);
    showHelpToast._t = setTimeout(() => (showToast = false), 2600);
  }

  function handleAction(action, inProgressMessage) {
    if (featureInProgress) {
      showHelpToast(inProgressMessage ?? "🚧 Feature in progress");
      return;
    }
    action?.();
  }

  // Block keyboard activation when aria-disabled
  function blockIfDisabled(event) {
    if (featureInProgress && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      showHelpToast();
    }
  }

	// const categoryDefinitions = {
	//   Shopping: ['Supermarket', 'Home utilities'],
	//   Car: ['Fuel', 'Insurance', 'Repairs'],
	//   Home: ['Electricity', 'Generator', 'Maintenance','Water'],
	//   Entertainment: ['Dining Out', 'Movies', 'Outing'],
	//   Personal: ['Shopping', 'Selfcare'],
	//   Gifts: ['Birthday', 'Wedding', 'Christmas'],
	//   Healthcare: ['Doctor Visit', 'Pharmacy', 'Skincare','Health Insurance'],
	//   Travel: ['Flight', 'Hotel', 'Car Rental']
	// };

	// const iconDefinitions = {
	//   Shopping: '🥗',
	//   Car: '🚗',
	//   Home: '🏠',
	//   Entertainment: '🍿',
	//   Personal: '👤',
	//   Healthcare: '🏥',
	//   Travel: '✈️',
	//   Gifts: '🎁'
	// };

	let selectedMain = '';
	$: if (!selectedMain && $categories.length) {
		selectedMain = $categories[0].name;
	}

	let selectedSub = '';
	let amount = '';
	let description = '';
	let salary: number | null = null;
	let submitting = false;

  // optimistic UI helpers
  let pendingCreates = {}; // record pending creation per category name
  let newlyAdded: string[] = []; // subs just added for animation
  let announcement = '';
	let allocations: any[] = [];
	let expenses: any[] = [];
	let reminders: any[] = [];
	let popupItem: any = null;
	let initialCheckDone = false;
	let showNotifs = false;
	let today = new Date();

	/* how many days left before/after the next due date */
	function daysUntilNext(row) {
		const next = new Date(row.nextDate);
		const today = new Date();
		return Math.floor((next.getTime() - today.getTime()) / 86_400_000);
	}

	function isPaidForCycle(row) {
		if (!row.lastPaid) return false;
		const paid = new Date(row.lastPaid);
		const next = new Date(row.nextDate);
		return row.frequency === 'Monthly'
			? paid.getFullYear() === next.getFullYear() &&
				paid.getMonth() === next.getMonth()
			: paid.getFullYear() === next.getFullYear();
	}

	function reminderTriggered(row) {
		if (!row.reminder) return false;
		const now = new Date();
		const next = new Date(row.nextDate);
		if (row.reminder.type === 'absolute') {
			return now >= new Date(row.reminder.when);
		}
		// relative
		const offsetMs = row.reminder.value * {
			minute: 60_000,
			hour: 3_600_000,
			day: 86_400_000
		}[row.reminder.unit];
		return now >= new Date(next.getTime() - offsetMs);
	}

	function urgency(row) {
		const d = daysUntilNext(row);
		if (d < 0) return 'overdue';   // red
		if (d <= 3) return 'due';      // yellow
		return 'ok';                   // green
	}

	function stepFive(direction: 'up' | 'down') {
		let num = parseFloat(amount);
		if (isNaN(num)) {
			alert('Enter a valid amount first');
			return;
		}
		if (direction === 'up') {
			num = num % 5 === 0 ? num + 5 : Math.ceil(num / 5) * 5;
		} else {
			num = num % 5 === 0 ? num - 5 : Math.floor(num / 5) * 5;
			if (num < 0) num = 0;
		}
		amount = Number.isInteger(num) ? String(num) : num.toFixed(2);
	}

	function openCalculator() {
		calcPrefill = amount;
		showCalc = true;
	}

	// Fetch initial data on mount
	onMount(() => {
		const interval = setInterval(checkScheduled, 30000);
		checkScheduled(true);
		(async () => {
			try {
				const [salRes, allocRes, expRes] = await Promise.all([
					fetch('/budgeting/api/salary'),
					fetch('/budgeting/api/allocations'),
					fetch('/budgeting/api/transactions'),
				]);
				if (!salRes.ok || !allocRes.ok || !expRes.ok) {
					console.error('One or more API calls failed');
					return;
				}
				const salData = await salRes.json();
				salary = parseFloat(salData.salary || '0');
				salaryInput = String(salary);
				allocations = await allocRes.json();
				expenses = await expRes.json();
			} catch (e) {
				console.error('Error fetching initial data:', e);
			}
		})();
		return () => clearInterval(interval);
	});

	async function submit() {
		if (!selectedSub || !amount) {
			alert('Please fill all fields');
			return;
		}
		submitting = true;
		const res = await fetch('/budgeting/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				date: new Date().toISOString().split('T')[0],
				account_id: selectedAccountId,
				category: selectedMain,
				subcategory: selectedSub,
				amount,
				description
			})
		});
		const result = await res.json();
		submitting = false;
		if (result.success) {
			amount = '';
			selectedSub = '';
			alert('Expense added ✅');
		} else {
			alert('Failed to submit: ' + result.error);
		}
	}

	async function checkScheduled(showOnLoad = false) {
		try {
			const res = await fetch('/budgeting/api/scheduled');
			if (!res.ok) return console.error('Scheduled API failed');
			const data = await res.json();
			if (!Array.isArray(data)) return console.error('Bad response', data);
			/* keep unpaid items whose next date is ≤ 30 days away */
			reminders = data.filter(
				r => !isPaidForCycle(r) && daysUntilNext(r) <= 30
			);
			/* first UI decision */
			if (showOnLoad && !initialCheckDone && reminders.length) {
				const auto = reminders.find(reminderTriggered);
				if (auto) {
					popupItem = auto;               // auto-popup
				} else if (reminders.some(r => urgency(r) === 'overdue')) {
					showNotifs = true;              // open drawer if something is red
				} else {
					popupItem = reminders[0];       // fallback: first item
				}
				initialCheckDone = true;
			}
		} catch (err) {
			console.error('Failed to fetch scheduled payments:', err);
		}
	}

	async function markAsPaid(item) {
		const res = await fetch('/budgeting/api/scheduled', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				category: item.category,
				subcategory: item.subcategory,
				amount: item.amount
			})
		});
		const result = await res.json();
		if (result.success) {
			alert(`${item.category} - ${item.subcategory} marked as paid ✅`);
			popupItem = null;
			checkScheduled();
		}
	}

	function getAllocation(cat: string, sub: string): number {
		const direct = allocations.find(a => a.category === cat && a.subcategory === sub);
		if (direct) return parseFloat(direct.amount || '0');
		const master = allocations.find(a => a.category === cat && a.subcategory === 'Master');
		if (master?.percentage && salary !== null) {
			return (parseFloat(master.percentage) / 100) * salary;
		}
		return 0;
	}

	function getSpent(cat: string, sub: string): number {
		return expenses
			.filter(e => e.category === cat && e.subcategory === sub)
			.reduce((sum, e) => sum + e.amount, 0);
	}

	async function saveNewSalary(newVal: number) {
		const res = await fetch('/budgeting/api/salary', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ salary: newVal })
		});
		if (res.ok) {
			salary = newVal;
			alert('Salary updated ✅');
		} else {
			alert('Failed to save salary');
		}
		closeSalaryModal();
	}

	// Save edited salary
	async function saveSalary() {
		const newSalary = parseFloat(salaryInput);
		if (isNaN(newSalary)) {
			alert('Please enter a valid number');
			return;
		}
		const res = await fetch('/budgeting/api/salary', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ salary: newSalary })
		});
		if (res.ok) {
			salary = newSalary;
			editingSalary = false;
			alert('Salary updated ✅');
		} else {
			alert('Failed to save salary');
		}
	}

	async function saveRecurring(e) {
		const rec = e.detail;
		const res = await fetch('/budgeting/api/recurring', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(rec)
		});
		alert((await res.json()).success ? 'Saved ✅' : 'Error ❌');
	}

  async function handleCreateSubcategory(payload: any) {
   // payload may be a string (old API) or an event with .detail
   const newSubName = typeof payload === 'string' ? payload : payload?.detail;
   if (!selectedMain || !newSubName || !newSubName.trim()) return;
   const trimmed = newSubName.trim();

    // 1. Find the category in the local store ($categories)
    const categoryToUpdateIndex = $categories.findIndex(c => c.name === selectedMain);
    if (categoryToUpdateIndex === -1) {
      console.error("Category not found in local store:", selectedMain);
      alert("Error: Could not find category to update.");
      return;
    }

    // 2. Update the local store's category object (optimistic)
    const originalCategories = JSON.parse(JSON.stringify($categories));
    const updatedCategories = [...$categories];
    const categoryToUpdate = { ...updatedCategories[categoryToUpdateIndex] };
    if (!categoryToUpdate.subs) categoryToUpdate.subs = [];

    // Remove any stored 'Other' placeholder from persistence
    categoryToUpdate.subs = categoryToUpdate.subs.filter(s => s.toLowerCase() !== 'other');

    // Avoid duplicates (case-insensitive)
    if (categoryToUpdate.subs.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      // Already present — just select it
      selectedSub = categoryToUpdate.subs.find(s => s.toLowerCase() === trimmed.toLowerCase())!;
      announcement = `${selectedSub} selected`;
      return;
    }

    // Optimistically insert new sub at end
    categoryToUpdate.subs = [...categoryToUpdate.subs, trimmed];
    updatedCategories[categoryToUpdateIndex] = categoryToUpdate;

    // Apply optimistic update to store so UI updates immediately
    try {
      // set local store immediately for optimistic UI
      saveCategories(updatedCategories); // note: saveCategories will also set the store after POST
      // mark pending and animation
      pendingCreates[selectedMain] = true;
      newlyAdded.push(trimmed);
      selectedSub = trimmed;
      announcement = `${trimmed} added`;

      // wait for save to complete (saveCategories already awaited the POST inside it in original impl)
      // If saveCategories throws, it will be caught below — but since we didn't await it, we add a safety check
      // For reliability, call the API directly to observe result
      const res = await fetch(`/budgeting/api/user/categories?accountId=${encodeURIComponent(selectedAccountId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategories)
      });
      if (!res.ok) throw new Error(await res.text());

      // success: clear pending flag and remove animation after short delay
      delete pendingCreates[selectedMain];
      setTimeout(() => {
        newlyAdded = newlyAdded.filter(s => s !== trimmed);
      }, 700);
    } catch (error) {
      // rollback
      console.error('Failed to save new subcategory:', error);
      // restore previous categories
      await saveCategories(originalCategories);
      delete pendingCreates[selectedMain];
      newlyAdded = newlyAdded.filter(s => s !== trimmed);
      announcement = `Failed to add ${trimmed}`;
      alert('Failed to save new subcategory. Please try again.');
    }
  }

	async function handleSpeech(e) {
		const text = e.detail;
		/* DEBUG: show raw speech */
		description = text;
		console.log('Speech transcript:', text);
		const parsed = localParse(text);
		console.log('Local NLP result:', parsed);
		if (!parsed) {
			alert('Could not understand; please edit manually.');
			return;
		}
		if (parsed.amount) amount = String(parsed.amount);
		if (parsed.category) selectedMain = parsed.category;
		if (parsed.subcategory) selectedSub = parsed.subcategory;
		description = parsed.description; // keep transcript
	}

	function handleOCR(e) {
		const text = e.detail as string;
		console.log('OCR raw:', text);
		const parsed = localParse(text) || {};
		if (parsed.amount) amount = String(parsed.amount);
		if (parsed.category) selectedMain = parsed.category;
		if (parsed.subcategory) selectedSub = parsed.subcategory;
		description = parsed.description ?? text;
	}
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  /* Design System Variables - Expert Level */
  :root {
    /* Color Palette - Sophisticated Dark Theme */
    --color-bg-primary: rgba(15, 23, 42, 0.95);
    --color-bg-card: rgba(30, 41, 59, 0.8);
    --color-bg-glass: rgba(15, 23, 42, 0.98);
    --color-bg-elevated: rgba(51, 65, 85, 0.6);
    --color-bg-input: rgba(30, 41, 59, 0.9);
    --color-border-subtle: rgba(71, 85, 105, 0.2);
    --color-border-accent: rgba(59, 130, 246, 0.4);
    --color-border-focus: rgba(59, 130, 246, 0.6);
    
    /* Brand Colors */
    --color-primary: #3b82f6;
    --color-primary-hover: #2563eb;
    --color-primary-light: rgba(59, 130, 246, 0.15);
    --color-primary-dark: rgba(59, 130, 246, 0.8);
    
    /* Semantic Colors */
    --color-success: #10b981;
    --color-success-light: rgba(16, 185, 129, 0.1);
    --color-warning: #f59e0b;
    --color-warning-light: rgba(245, 158, 11, 0.1);
    --color-error: #ef4444;
    --color-error-light: rgba(239, 68, 68, 0.1);
    
    /* Typography */
    --color-text-primary: #f8fafc;
    --color-text-secondary: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-text-inverse: #1e293b;
    
    /* Elevation System */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
    --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
    
    /* Border Radius System */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 20px;
    --radius-full: 9999px;
    
    /* Spacing System */
    --spacing-0: 0px;
    --spacing-1: 4px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-5: 20px;
    --spacing-6: 24px;
    --spacing-8: 32px;
    --spacing-10: 40px;
    --spacing-12: 48px;
    --spacing-16: 64px;
    
    /* Animation Curves */
    --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
    --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
    --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  /* --- Expert-Level Page Container --- */
  .page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    margin: 0;
    padding: var(--spacing-4);
    background: var(--color-bg-glass);
    backdrop-filter: blur(24px);
    border-radius: 0;
    margin-top: 60px;
    margin-bottom: 0;
    min-height: calc(100vh - 60px);
    animation: pageEntrance 0.8s var(--ease-out-cubic);
    position: relative;
  }

  /* Desktop Enhancement */
  @media (min-width: 768px) {
    .page {
      max-width: 1000px;
      margin: var(--spacing-6) auto;
      padding: var(--spacing-8);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-2xl);
      margin-top: 100px;
      margin-bottom: var(--spacing-8);
      min-height: auto;
      box-shadow: var(--shadow-2xl);
    }
  }

  @keyframes pageEntrance {
    from { 
      opacity: 0; 
      transform: translateY(30px) scale(0.98);
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1);
    }
  }

  /* --- Expert Header Design --- */
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
    overflow: visible;
    z-index: 1000;
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

  .header-right {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    width: 100%;
    align-items: stretch;
  }

  @media (min-width: 480px) {
    .header-right {
      flex-direction: row;
      align-items: center;
      width: auto;
      gap: var(--spacing-3);
    }
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

  .header-subtitle {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0;
    font-weight: 400;
    opacity: 0.8;
  }

  /* Desktop header enhancement */
  @media (min-width: 768px) {
    .header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-6) var(--spacing-8);
    }

    .header h1 {
      font-size: 2rem;
    }

    .header-subtitle {
      font-size: 1rem;
      margin: var(--spacing-1) 0 0 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }
  }

   .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
  }

  .wrap {
    position: relative;
    display: inline-block;
  }

  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--btn-border, #e5e7eb);
    background: var(--btn-bg, #fff);
    color: var(--btn-fg, #111827);
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.95rem;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    transition: transform .06s ease, box-shadow .15s ease, opacity .15s ease;
  }

  .btn:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }

  /* Visually disabled but still focusable/clickable */
  .btn[aria-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
    filter: grayscale(15%);
  }
  .btn[aria-disabled="true"]:hover {
    transform: none;
    box-shadow: none;
  }

  /* Tooltip */
  .hint {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    transform: translateX(-50%) translateY(4px);
    background: #111;
    color: #fff;
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s ease, transform .15s ease;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  }
  .hint::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    width: 8px; height: 8px;
    background: #111;
    transform: translateX(-50%) rotate(45deg);
    border-radius: 2px;
  }
  .wrap:hover .hint,
  .wrap:focus-within .hint {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* Toast */
  .toast {
    position: fixed;
    right: 20px;
    bottom: 20px;
    background: #1f2937; /* slate-800 */
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 0.95rem;
    box-shadow: 0 14px 32px rgba(0,0,0,0.28);
    z-index: 1000;
  }

  .edit-cats-btn {
    background: var(--color-primary-light);
    border: 1px solid var(--color-border-accent);
    color: var(--color-text-primary);
    cursor: pointer;
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s var(--ease-spring);
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    min-height: 44px;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .edit-cats-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }
  
  .edit-cats-btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }

  .edit-cats-btn:hover::before {
    opacity: 1;
  }

  .edit-cats-btn:hover {
    color: white;
  }

  .edit-cats-btn:active {
    transform: translateY(0) scale(0.98);
  }

  @media (min-width: 768px) {
    .edit-cats-btn {
      font-size: 0.9rem;
      min-height: auto;
      padding: var(--spacing-3) var(--spacing-5);
    }
  }

  /* --- Expert-Level Account Switcher --- */
  .account-switcher {
    position: relative;
    display: inline-block;
    z-index: 10000;
  }

  .account-selector {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-soft);
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

  .account-selector::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary-light), transparent, var(--color-success-light));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }

  .account-selector:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary-light);
    backdrop-filter: blur(16px);
  }

  .account-selector:hover::before {
    opacity: 0.15;
  }

  .account-selector:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 0.1s;
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

  .account-type {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 500;
    opacity: 0.8;
    text-transform: capitalize;
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
    top: calc(100% + var(--spacing-2));
    left: 0;
    right: 0;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    backdrop-filter: blur(20px);
    z-index: 99999;
    overflow: hidden;
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary-light) transparent;
  }

  .account-dropdown::-webkit-scrollbar {
    width: 6px;
  }

  .account-dropdown::-webkit-scrollbar-track {
    background: transparent;
  }

  .account-dropdown::-webkit-scrollbar-thumb {
    background: var(--color-primary-light);
    border-radius: var(--radius-full);
  }

  .account-option {
    width: 100%;
    padding: var(--spacing-4) var(--spacing-5);
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 0.9rem;
    position: relative;
    overflow: hidden;
    text-align: left;
  }

  .account-option::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
    transition: width 0.3s var(--ease-spring);
  }

  .account-option:hover {
    background: var(--color-bg-glass);
    transform: translateX(4px);
  }

  .account-option:hover::before {
    width: 4px;
  }

  .account-option.selected {
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 700;
  }

  .account-option.selected::before {
    width: 4px;
    background: var(--color-primary);
  }

  .account-option-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
  }

  .account-option-name {
    font-weight: 600;
    margin-bottom: var(--spacing-1);
  }

  .account-option-type {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: capitalize;
    opacity: 0.8;
  }

  .account-option-badge {
    background: var(--color-success-light);
    color: var(--color-success);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  @media (min-width: 768px) {
    .account-selector {
      min-width: 200px;
      padding: var(--spacing-4) var(--spacing-5);
      font-size: 1rem;
    }

    .account-title {
      font-size: 1rem;
    }

    .account-type {
      font-size: 0.8rem;
    }

    .account-option {
      padding: var(--spacing-5) var(--spacing-6);
      font-size: 1rem;
    }
  }

  /* --- Expert-Level Category Grid --- */
  .cat-icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-4);
    background: var(--color-bg-glass);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm);
    perspective: 1000px;
    position: relative;
    overflow: hidden;
  }

  .cat-icons::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-glass-accent), transparent, var(--color-glass-accent));
    opacity: 0.05;
    pointer-events: none;
  }

  @media (min-width: 768px) {
    .cat-icons {
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: var(--spacing-4);
      margin-bottom: var(--spacing-8);
      padding: var(--spacing-6);
      border-radius: var(--radius-xl);
      backdrop-filter: blur(20px);
      box-shadow: var(--shadow-md);
    }
  }
  
  .cat-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-2);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    backdrop-filter: blur(12px);
    cursor: pointer;
    transition: all 0.4s var(--ease-spring);
    min-height: 88px;
    min-width: 44px;
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transform-style: preserve-3d;
    animation: categoryButtonEntrance 0.5s ease-out forwards;
    animation-delay: calc(var(--index, 0) * 0.05s);
    opacity: 0;
    transform: translateY(15px) rotateX(15deg);
    box-shadow: var(--shadow-xs);
  }

  @keyframes categoryButtonEntrance {
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0);
    }
  }

  @media (min-width: 768px) {
    .cat-button {
      padding: var(--spacing-4) var(--spacing-3);
      border-radius: var(--radius-lg);
      min-height: 110px;
      transition: all 0.4s var(--ease-spring);
      box-shadow: var(--shadow-sm);
    }
  }
  
  .cat-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary-light), transparent, var(--color-primary-light));
    opacity: 0;
    transition: opacity 0.3s var(--ease-out-cubic);
    border-radius: inherit;
  }
  
  .cat-button:hover {
    transform: translateY(-4px) scale(1.05) rotateX(5deg);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(16px);
  }
  
  .cat-button:hover::before {
    opacity: 0.15;
  }

  .cat-button:active {
    transform: translateY(-1px) scale(0.98);
    transition-duration: 0.1s;
  }
  
  .cat-button.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px) scale(1.02);
    backdrop-filter: blur(20px);
  }
  
  .cat-button.selected::before {
    opacity: 0.25;
    background: linear-gradient(135deg, var(--color-primary), transparent, var(--color-primary));
  }
  
  .cat-button div {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-2);
    font-weight: 600;
    text-align: center;
    transition: all 0.3s var(--ease-out-cubic);
    line-height: 1.2;
    letter-spacing: -0.01em;
    position: relative;
    z-index: 1;
  }

  @media (min-width: 768px) {
    .cat-button div {
      font-size: 0.8rem;
      margin-top: var(--spacing-3);
    }
  }
  
  .cat-button.selected div {
    color: var(--color-primary);
    font-weight: 700;
    transform: scale(1.05);
  }

  .cat-button:hover div {
    color: var(--color-text-primary);
    transform: scale(1.02);
  }

  /* --- Expert-Level Subcategory List --- */
  .radio-list {
    margin-bottom: var(--spacing-8);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    padding: var(--spacing-5);
    max-height: 320px;
    overflow-y: auto;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-md);
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary-light) transparent;
  }

  .radio-list::-webkit-scrollbar {
    width: 6px;
  }

  .radio-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .radio-list::-webkit-scrollbar-thumb {
    background: var(--color-primary-light);
    border-radius: var(--radius-full);
  }

  .radio-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
  }

  .radio-list label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) var(--spacing-5);
    margin-bottom: var(--spacing-2);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    border: 1px solid var(--color-border-soft);
    background: var(--color-bg-glass);
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
    min-height: 52px;
  }

  .radio-list label::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
    transition: width 0.3s var(--ease-spring);
  }

  .radio-list label:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-primary-light);
    transform: translateX(4px) translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .radio-list label:hover::before {
    width: 4px;
  }

  .radio-list input[type="radio"] {
    accent-color: var(--color-primary);
    width: 20px;
    height: 20px;
    flex: none;
    margin-right: var(--spacing-4);
    transform: scale(1.1);
    cursor: pointer;
  }

  .radio-list input[type="radio"]:checked + .sub-text {
    color: var(--color-primary);
    font-weight: 600;
  }

  .sub-text {
    color: var(--color-text-primary);
    font-weight: 500;
    flex: 1;
    font-size: 0.9rem;
  }

  .sub-meta {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 400;
  }

  .sub-meta {
    font-size: 0.78rem;
    color: #9ca3af;
    margin-left: 8px;
    white-space: nowrap;
  }

  /* --- Expert-Level Form Elements --- */
  .input-group {
    margin-bottom: var(--spacing-5);
    position: relative;
  }

  @media (min-width: 768px) {
    .input-group {
      margin-bottom: var(--spacing-6);
    }
  }

  .input-field {
    width: 100%;
    padding: var(--spacing-4) var(--spacing-5);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s var(--ease-spring);
    backdrop-filter: blur(16px);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    box-sizing: border-box;
    min-height: 56px;
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    box-shadow: var(--shadow-xs);
  }

  @media (min-width: 768px) {
    .input-field {
      border-radius: var(--radius-xl);
      font-size: 1.1rem;
      min-height: 60px;
      padding: var(--spacing-5) var(--spacing-6);
    }
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    background: var(--color-bg-glass);
    transform: translateY(-2px) scale(1.01);
  }

  .input-field::placeholder {
    color: var(--color-text-muted);
    opacity: 0.8;
    font-weight: 400;
    transition: all 0.3s ease;
  }

  .input-field:focus::placeholder {
    opacity: 0.5;
    transform: translateX(4px);
  }

  /* --- Expert-Level Amount Controls --- */
  .amount-row {
    display: flex;
    align-items: stretch;
    gap: var(--spacing-3);
  }

  @media (min-width: 768px) {
    .amount-row {
      gap: var(--spacing-4);
    }
  }

  .amount-input {
    flex: 1;
  }

  .amount-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .compact-btn {
    width: 44px;
    height: 28px;
    border: 1px solid var(--color-border-accent);
    background: var(--color-bg-elevated);
    color: var(--color-primary);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    min-width: 44px;
    min-height: 44px;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-xs);
    position: relative;
    overflow: hidden;
  }

  .compact-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }

  .compact-btn:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .compact-btn:hover::before {
    opacity: 1;
  }

  .compact-btn:hover {
    color: white;
  }

  .compact-btn:active {
    transform: translateY(0) scale(0.95);
    transition-duration: 0.1s;
  }

  @media (min-width: 768px) {
    .compact-btn {
      width: 48px;
      height: 30px;
      font-size: 0.85rem;
      min-width: auto;
      min-height: auto;
      border-radius: var(--radius-lg);
    }
  }

  .compact-btn:hover {
    background: var(--color-primary);
    color: white;
    transform: scale(1.05);
  }

  .compact-btn:active {
    transform: scale(0.95);
  }

  /* --- Premium Action Buttons --- */
  .action-button {
    text-align: left;
    cursor: pointer;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    font-weight: 500;
  }

  .action-button:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  /* --- Expert-Level Submit Button --- */
  .submit-btn {
    width: 100%;
    padding: var(--spacing-5) var(--spacing-6);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    border: none;
    border-radius: var(--radius-xl);
    color: white;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.4s var(--ease-spring);
    margin-top: var(--spacing-6);
    margin-bottom: var(--spacing-6);
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
    min-height: 56px;
    backdrop-filter: blur(20px);
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(-100%);
  }

  .submit-btn:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-2xl);
    background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  }

  .submit-btn:hover::before {
    opacity: 1;
    transform: translateX(100%);
    transition-duration: 0.6s;
  }

  .submit-btn:active {
    transform: translateY(-1px) scale(0.98);
    transition-duration: 0.1s;
  }

  .submit-btn:disabled {
    background: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
    opacity: 0.6;
  }

  .submit-btn:disabled::before {
    opacity: 0;
    transform: translateX(-100%);
  }

  @media (min-width: 768px) {
    .submit-btn {
      font-size: 1.2rem;
      min-height: 64px;
      margin-top: var(--spacing-8);
      margin-bottom: var(--spacing-8);
    }
  }

  /* Additional premium styles */
  .header-left h1 {
    margin: 0;
  }
  
  .header-subtitle {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: var(--spacing-xs) 0 0 0;
    font-weight: 400;
  }

  .section-title {
    color: var(--color-text-primary);
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 var(--spacing-md) 0;
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  /* --- Mobile-First Quick Actions --- */
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  @media (min-width: 768px) {
    .quick-actions {
      flex-direction: row;
      flex-wrap: wrap;
      margin-bottom: var(--spacing-xl);
    }
  }

  .form-section {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    backdrop-filter: blur(10px);
  }

  @media (min-width: 768px) {
    .form-section {
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
  }

  .input-label {
    display: block;
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }

  @media (min-width: 768px) {
    .input-label {
      font-size: 0.9rem;
    }
  }

  /* Loading spinner animation */
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease-in-out infinite;
    margin-right: var(--spacing-sm);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Textarea specific adjustments */
  textarea.input-field {
    min-height: 100px;
    resize: vertical;
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* --- Mobile Optimization --- */
  @media (max-width: 767px) {
    .radio-list {
      max-height: 200px;
      padding: var(--spacing-sm);
    }

    .radio-list label {
      padding: var(--spacing-sm);
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }

    .sub-meta {
      font-size: 0.75rem;
      margin-left: 0;
      opacity: 0.8;
    }

    .amount-controls {
      flex-direction: row;
      gap: var(--spacing-xs);
    }

    .compact-btn {
      flex: 1;
    }

    .section-title {
      font-size: 1rem;
      margin-bottom: var(--spacing-sm);
    }

    .submit-btn {
      margin-top: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      font-size: 1.1rem;
      padding: var(--spacing-md) var(--spacing-lg);
      min-height: 48px; /* Larger touch target on mobile */
    }

    .salary-line {
      font-size: 0.8rem;
      text-align: center;
      margin-top: var(--spacing-md);
    }
  }

  /* Desktop enhancements */
  @media (min-width: 768px) {
    .cat-button:hover {
      transform: translateY(-2px) scale(1.02);
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }

    .radio-list label:hover {
      transform: translateX(2px);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }

  /* --- Submit Button --- */
  .submit-btn {
    width: 100%;
    /* Match the primary button gradient from main layout */
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    color: white;
    border: none;
    padding: 0.85rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 6px rgba(30, 58, 138, 0.2);
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .submit-btn:hover:not(:disabled) {
    /* Slightly different gradient on hover */
    background: linear-gradient(135deg, #2c5282, #4299e1);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(30, 58, 138, 0.3);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* --- Salary Line --- */
  .salary-line {
    margin-top: 24px;
    font-size: 0.9rem;
    text-align: right;
    opacity: 0.9;
    /* Match text color */
    color: #cbd5e1;
    padding: 10px;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(71, 85, 105, 0.2);
  }

  /* --- Notification Drawer --- */
  .notif-drawer {
    position: absolute;
    right: 0;
    top: 36px;
    min-width: 200px;
    /* Match main layout card style */
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(30, 58, 138, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1001;
  }

  .notif-row {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(30, 58, 138, 0.1);
    color: #e2e8f0;
    transition: background-color 0.2s ease;
    font-family: inherit;
  }
  .notif-row:last-child {
    border-bottom: none;
  }
  .notif-row:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  /* Urgency colors adjusted to theme */
  .notif-row.ok {
    background: rgba(72, 187, 120, 0.1);
    border-left: 3px solid #48bb78;
  }
  .notif-row.due {
    background: rgba(234, 179, 8, 0.1);
    border-left: 3px solid #eab308;
  }
  .notif-row.overdue {
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
  }

</style>

<div class="page">
  <!-- Enhanced Header with better visual hierarchy -->
  <div class="header">
    <div class="header-left">
      <h1>Budget Dashboard</h1>
      <p class="header-subtitle">Track expenses and manage your categories</p>
    </div>
    <div class="header-right">
      <!-- Expert Account Switcher -->
      <div class="account-switcher">
        <button
          class="account-selector {showAccountDropdown ? 'open' : ''}"
          on:click={toggleAccountDropdown}
          on:keydown={handleAccountKeydown}
          aria-expanded={showAccountDropdown}
          aria-haspopup="listbox"
          title="Switch account"
        >
          <div class="account-name">
            <div class="account-title">
              {$currentAccount?.name || 'Select Account'}
            </div>
            {#if $currentAccount?.type}
              <div class="account-type">{$currentAccount.type}</div>
            {/if}
          </div>
          <div class="account-arrow">▼</div>
        </button>

        {#if showAccountDropdown && $accounts.length > 0}
          <div class="account-dropdown" transition:fly={{ y: -10, duration: 200 }}>
            {#each $accounts as account (account.id)}
              <button
                class="account-option {$currentAccount?.id === account.id ? 'selected' : ''}"
                on:click={() => handleAccountSelect(account.id)}
                role="option"
                aria-selected={$currentAccount?.id === account.id}
              >
                <div class="account-option-details">
                  <div class="account-option-name">{account.name}</div>
                  <div class="account-option-type">{account.type}</div>
                </div>
                {#if $currentAccount?.id === account.id}
                  <div class="account-option-badge">Active</div>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <button
        class="edit-cats-btn"
        on:click={openEditCategories}
        title="Edit categories"
        aria-label="Edit categories"
      >
        ✏️ Edit Categories
      </button>
    </div>
  </div>

  {#if showEditCategories}
    <CategoryManagementModal
      categories={$categories}
      on:save={handleSaveCategories}
      on:cancel={handleCancelEdit}
    />
  {/if}

  {#if popupItem}
    <ScheduledPopup
      item={popupItem}
      on:close={() => (popupItem = null)}
      on:confirm={(e) => markAsPaid(e.detail)}
    />
  {/if}

  {#if reminders.length}
    <div style="position: fixed; top: 10px; right: 10px;">
      <button
        on:click={() => (showNotifs = !showNotifs)}
        style="cursor: pointer;"
      >🔔 {reminders.length}</button>
    </div>
  {/if}

  {#if showNotifs && reminders.length}
    <div class="notif-drawer">
      {#each reminders as r}
        <button
          class="notif-row {urgency(r)}"
          on:click={() => {
            popupItem = r;
            showNotifs = false;
          }}
        >
          {r.category} – {r.subcategory}  ${r.amount}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Enhanced Category Grid -->
  <div class="cat-icons">
    {#each $categories as cat, index (cat.name)}
      <div
        class="cat-button {cat.name === selectedMain ? 'selected' : ''}"
        on:click={() => {selectedMain = cat.name; selectedSub = '';}}
        on:keydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectedMain = cat.name;
            selectedSub = '';
          }
        }}
        role="button"
        tabindex="0"
        aria-pressed={cat.name === selectedMain}
        style="animation-delay: {index * 50}ms"
        in:fly={{ y: 20, duration: 300, delay: index * 50 }}
      >
        <Icon name={cat.icon} size={32} color={cat.color} />
        <div>{cat.name}</div>
      </div>
    {/each}
  </div>
  
  <!-- Enhanced Subcategory Selection -->
  {#if currentCat}
    <div class="radio-list" in:fade={{ duration: 200 }}>
      <h3 class="section-title">{selectedMain} Subcategories</h3>
      {#each currentCat?.subs ?? [] as sub, index}
        <label class="sub-label" style="animation-delay: {index * 25}ms" in:fly={{ x: -10, duration: 200, delay: index * 25 }}>
          <input class="sub-radio" name="subcategory" type="radio" bind:group={selectedSub} value={sub} />
          <span class="sub-text">{sub}</span>
          <span class="sub-meta">
            Spent: ${getSpent(selectedMain, sub).toFixed(0)} • Allocated: ${getAllocation(selectedMain, sub).toFixed(0)}
          </span>
        </label>
      {/each}

      <OtherSubcategoryItem
        categoryName={selectedMain}
        selected={selectedSub}
        busy={!!pendingCreates[selectedMain]}
        on:create={handleCreateSubcategory}
        on:select={(e) => { selectedSub = e.detail; }}
      />
    </div>
  {/if}

  <!-- Enhanced Quick Actions Row -->
  <div class="quick-actions" in:fade={{ duration: 300, delay: 200 }}>
    <button class="input-field action-button" on:click={openCalculator}>
      🧮 Calculator
    </button>
    <span class="wrap">
      <button
        class="input-field action-button btn"
        aria-disabled={featureInProgress}
        tabindex="0"
        on:click={() => handleAction(openCamera, "📷 Scan Receipt is in progress")}
        on:keydown={blockIfDisabled}
      >
        📷 Scan Receipt
      </button>
      {#if featureInProgress}
        <span class="hint">🚧 Feature in progress</span>
      {/if}
    </span>
    <QuickSpeechEntry on:spoken={handleSpeech}/>
  </div>

  <!-- Enhanced Form Section -->
  <div class="form-section" in:fade={{ duration: 300, delay: 300 }}>
    <h3 class="section-title">Quick Entry</h3>
    
    <!-- accessibility announcements -->
    <div aria-live="polite" class="sr-only">{announcement}</div>
    
    <div class="input-group">
      <label class="input-label" for="amount-input">Amount</label>
      <div class="amount-row">
        <input
          id="amount-input"
          type="number"
          bind:value={amount}
          placeholder="0.00"
          class="input-field amount-input"
          aria-label="Enter amount"
        />
        <div class="amount-controls" role="group" aria-label="Adjust amount">
          <button class="compact-btn" on:click={() => stepFive('up')} aria-label="Increase by step" title="Increase">▲</button>
          <button class="compact-btn" on:click={() => stepFive('down')} aria-label="Decrease by step" title="Decrease">▼</button>
        </div>
      </div>
    </div>

    <div class="input-group">
      <label class="input-label" for="description-input">Description</label>
      <textarea
        id="description-input"
        bind:value={description}
        placeholder="Add a note (optional)"
        class="input-field"
        rows="3"
      ></textarea>
    </div>

    <button on:click={submit} class="submit-btn" disabled={submitting}>
      {#if submitting}
        <span class="loading-spinner"></span>
        Submitting...
      {:else}
        Add Expense
      {/if}
    </button>
  </div>

  {#if showToast}
    <div class="toast" transition:fly={{ y: 30, duration: 300 }}>
      🚧 Feature in progress
    </div>
  {/if}

  {#if salary !== null}
    <div class="salary-line">
      💰 Salary&nbsp;${salary.toFixed(0)} • 
      Tithing&nbsp;${tithing.toFixed(0)} • 
      Needs&nbsp;${needs.toFixed(0)} • 
      Wants&nbsp;${wants.toFixed(0)} • 
      Saving&nbsp;${saving.toFixed(0)}
    </div>
  {/if}

  <div style="position: fixed; top: 10px; left: 10px; z-index: 1000;">
    <button on:click={openSidebar} style="font-size: 24px; background:none; border:none; cursor:pointer; color:aliceblue">
      ☰
    </button>
  </div>

  <Sidebar
    visible={showSidebar}
    on:close={closeSidebar}
    on:editsalary={openSalaryModal}
    on:addrecurring={handleAddRecurring}
      username={data.username}
    on:requestAddCategory={handleRequestAddCategory}
  />

  {#if showAddModal}
    <AddCategoryModal
      on:save={handleAddCategory}
      on:cancel={handleCancel}
    />
  {/if}

  <RecurringModal
    visible={showRecModal}
    on:close={() => (showRecModal = false)}
    on:save={saveRecurring}
  />

  <SalaryModal
    visible={showSalaryModal}
    {salary}
    on:close={closeSalaryModal}
    on:save={(e) => saveNewSalary(e.detail)}
  />

  <CameraModal
    visible={showCam}
    on:close={() => (showCam = false)}
    on:result={handleOCR}
  />

  <CalculatorModal
    visible={showCalc}
    prefill={calcPrefill}
    onResult={handleCalcResult}
    onClose={() => (showCalc = false)}
  />
</div>