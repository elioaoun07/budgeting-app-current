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
	import { currentAccount } from '$lib/budgeting/store';
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

	function openEditCategories() {
		showEditCategories = true;
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

  /* --- Updated Styles to Match Main Layout --- */

  .page {
    /* Inherit font from main layout */
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: auto;
    padding: 20px;
    /* Match the main content background slightly */
    background: rgba(15, 23, 42, 0.3);
    border-radius: 12px;
    margin-top: 80px; /* Space for fixed header elements */
    margin-bottom: 20px;
  }

  .header h1 {
    /* Match page title color and weight */
    color: #e2e8f0;
    font-weight: 600;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

 .edit-cats-btn {
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.5);
    color: #e2e8f0;
    cursor: pointer;
    border-radius: 8px;
    padding: 3px 10px;
    line-height: 1.5;
    font-size: 0.95rem;
    transition: all .2s ease;
  }
  .edit-cats-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    box-shadow: 0 0 0 2px rgba(59,130,246,.25);
  }

  /* --- Category Icons --- */
  .cat-icons {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 8px; /* Prevent scrollbar clipping */
  }
  .cat-button {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 8px; /* Slightly more padding */
    /* Match main layout input styles */
    border: 1px solid rgba(71, 85, 105, 0.4);
    border-radius: 8px;
    width: 70px;
    /* Match main layout card background */
    background-color: rgba(30, 41, 59, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .cat-button:hover {
    /* Subtle hover effect */
    background-color: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
  }
  .cat-button.selected {
    /* Match primary color for selection */
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.15);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .cat-button div {
    /* Adjust font size and color */
    font-size: 12px;
    color: #cbd5e1;
    margin-top: 4px;
  }

  /* --- Radio List --- */
  .radio-list {
    margin-bottom: 1rem;
  }
  .radio-list label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
    cursor: pointer;
  }
  .radio-list label:hover {
    background-color: rgba(59, 130, 246, 0.05);
  }
  .radio-list input[type="radio"] {
    /* Style the radio button to match */
    accent-color: #3b82f6; /* Blue color for the dot */
    width: 18px;
    height: 18px;
    flex: none;
  }
  .sub-text {
    font-size: 0.85rem;
    color: #94a3b8;
    flex: 1;
    padding-left: 6px;
  }
  .sub-meta {
    font-size: 0.78rem;
    color: #9ca3af;
    margin-left: 8px;
    white-space: nowrap;
  }

  /* --- Input Fields --- */
  .input-group {
    margin-bottom: 1.25rem; /* Consistent spacing */
  }

  /* Base input field styles matching main layout */
  .input-field {
    width: 100%;
    padding: 0.85rem 1rem;
    /* Match main layout input background and border */
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(71, 85, 105, 0.4);
    border-radius: 8px;
    font-size: 1rem;
    color: #e2e8f0;
    box-sizing: border-box;
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  }

  .input-field:focus {
    outline: none;
    /* Match main layout focus state */
    border-color: rgba(59, 130, 246, 0.8);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    background: rgba(30, 41, 59, 0.9);
  }

  .input-field::placeholder {
    /* Match placeholder color */
    color: #94a3b8;
    opacity: 1;
  }

  /* Amount input with compact up/down controls */
  .amount-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .amount-input { flex: 1; }
  .amount-controls {
    display: flex;
    flex-direction: row; /* place buttons side-by-side */
    gap: 6px;
    align-items: center;
  }
  .compact-btn {
    width: 36px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    border: 1px solid rgba(71,85,105,0.4);
    background: rgba(30,41,59,0.7);
    color: #cbd5e1;
    font-size: 1rem;
    cursor: pointer;
  }
  .compact-btn:hover { background: rgba(59,130,246,0.08); color: #e2e8f0; }

  /* Specific styles for action buttons that look like inputs */
  .action-button {
    text-align: left;
    cursor: pointer;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(71, 85, 105, 0.4);
    color: #cbd5e1;
    transition: all 0.2s ease;
  }
  .action-button:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    color: #e2e8f0;
  }

  /* Textarea specific adjustments */
  textarea.input-field {
    min-height: 100px;
    resize: vertical;
  }

  /* --- Round Buttons (Step Amount) --- */
  .round-btn {
    flex: 1;
    padding: 8px 0; /* Slightly larger padding */
    font-size: 1.2rem;
    /* Match main layout button styles subtly */
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(71, 85, 105, 0.4);
    border-radius: 8px;
    cursor: pointer;
    color: #cbd5e1;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  .round-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
    color: #e2e8f0;
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
  .salary-line span {
    font-weight: 500;
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
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(30, 58, 138, 0.1);
    color: #e2e8f0;
    transition: background-color 0.2s ease;
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
  <div class="header" style="display:flex; align-items:center; gap:8px;">
    <h1>Edit Categories</h1>
    <button
      class="edit-cats-btn"
      on:click={openEditCategories}
      title="Edit categories"
      aria-label="Edit categories"
    >
      ✏️
    </button>
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
        <div
          class="notif-row {urgency(r)}"
          on:click={() => {
            popupItem = r;
            showNotifs = false;
          }}
        >
          {r.category} – {r.subcategory}  ${r.amount}
        </div>
      {/each}
    </div>
  {/if}

  <div class="cat-icons">
    {#each $categories as cat (cat.name)}
      <div
        class="cat-button {cat.name === selectedMain ? 'selected' : ''}"
        on:click={() => {selectedMain = cat.name; selectedSub  = '';
       }}
      >
        <Icon name={cat.icon} size={32} color={cat.color} />
        <div style="font-size:12px">{cat.name}</div>
      </div>
    {/each}
  </div>
  
   <div class="radio-list">
        {#each currentCat?.subs ?? [] as sub}
          <label class="sub-label">
            <input class="sub-radio" name="subcategory" type="radio" bind:group={selectedSub} value={sub} />
            <span class="sub-text">{sub}</span>
            <span class="sub-meta">
              (Spent: ${getSpent(selectedMain, sub).toFixed(0)} – Allocated: ${getAllocation(selectedMain, sub).toFixed(0)})
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

  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
    <button class="input-field action-button" on:click={openCalculator}>
      🧮 Open Calculator
    </button>
    <button class="input-field action-button" on:click={openCamera}>📷 Scan receipt</button>
    <QuickSpeechEntry on:spoken={handleSpeech}/>
    <CalculatorModal
      visible={showCalc}
      prefill={calcPrefill}
      onResult={handleCalcResult}
      onClose={() => (showCalc = false)}
    />
  </div>

      <!-- accessibility announcements -->
      <div aria-live="polite" class="sr-only">{announcement}</div>
  <div class="input-group">
    <div class="amount-row">
      <input
        type="number"
        bind:value={amount}
        placeholder="Enter amount"
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
    <textarea
      bind:value={description}
      placeholder="Add a note (optional)"
      class="input-field"
      rows="3"
    />
  </div>

  <button on:click={submit} class="submit-btn" disabled={submitting}>
    {submitting ? 'Submitting...' : 'Submit'}
  </button>

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
    <button on:click={openSidebar} style="font-size: 24px; background:none; border:none; cursor:pointer;">
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
</div>