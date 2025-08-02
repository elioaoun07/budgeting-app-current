<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import CalculatorModal from '$lib/budgeting/CalculatorModal.svelte';
  import ScheduledPopup from '$lib/budgeting/ScheduledPopup.svelte';
  import Sidebar from '$lib/budgeting/Sidebar.svelte';
  import SalaryModal from '$lib/budgeting/SalaryModal.svelte';
  import RecurringModal from '$lib/budgeting/RecurringModal.svelte';
  import QuickSpeechEntry from '$lib/budgeting/QuickSpeechEntry.svelte';
  import { localParse } from '$lib/budgeting/localNLP.js';
  import CameraModal from '$lib/budgeting/CameraModal.svelte';
  import AddCategoryModal from '$lib/budgeting/AddCategoryModal.svelte';
  import CategoryManagementModal from '$lib/budgeting/CategoryManagementModal.svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import { categories, rawPrefs } from '$lib/budgeting/store';
  import { defaultCategories }    from '$lib/budgeting/defaults';
  import type { Category }        from '$lib/budgeting/defaults';


  export let data: {
    username: string | null;
    accounts: { id: string; name: string }[];
  };
  
  let selectedAccountId = data.accounts?.[0]?.id ?? '';

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
    tithing         = salary * 0.11;
    const remaining = salary - tithing;

    needs  = remaining * 0.50;
    wants  = remaining * 0.30;
    saving = remaining * 0.20;
  }

  let currentCat: Category | undefined;
  $: currentCat = $categories.find(c => c.name === selectedMain);

  $: if (!selectedMain && $categories.length) {
    selectedMain = $categories[0].name;
  }

  const handleAddRecurring = () => (showRecModal = true);

  function handleCalcResult(val: string) {amount = val;}
  function openSidebar() { showSidebar = true; }
  function closeSidebar() { showSidebar = false; }
  function openSalaryModal() { showSalaryModal = true; }
  function closeSalaryModal() { showSalaryModal = false; }
  function openCamera() { showCam = true; }
  function handleRequestAddCategory() {showAddModal = true;}
  function handleCancel() {showAddModal = false;}


  let showEditCategories = false;
    function openEditCategories() {
      showEditCategories = true;
    }
    function handleSaveCategories(event: CustomEvent<string[]>) {
      const newOrder = event.detail;
      rawPrefs.update(p => {
        // keep only those added categories still in newOrder
        const keptAdded = p.added.filter(c => newOrder.includes(c.name));
        // compute which defaults were removed
        const removed = defaultCategories
          .map(d => d.name)
          .filter(name => !newOrder.includes(name));
        return {
          added:   keptAdded,
          removed,
          order:   newOrder
        };
      });
      showEditCategories = false;
    }
    function handleCancelEdit() {
      showEditCategories = false;
  }
    
  function handleAddCategory({ detail: { name, icon, color } }) {
    rawPrefs.update(p => ({
      added:   [...p.added, { name, icon, color }],
      removed: p.removed.filter(r => r !== name),
      order:   [...p.order, name]
    }));
    showAddModal = false;
  }

    function removeCategory(name: string) {
    rawPrefs.update(p => ({
      added:   p.added.filter(c => c.name !== name),
      removed: [...p.removed, name],
      order:   p.order.filter(n => n !== name)
    }));
  }

  function reorder(newOrder: string[]) {
    rawPrefs.update(p => ({ ...p, order: newOrder }));
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
        paid.getMonth()   === next.getMonth()      // same month
      : paid.getFullYear() === next.getFullYear();  // yearly: same year
  }

  function reminderTriggered(row) {
    if (!row.reminder) return false;

    const now  = new Date();
    const next = new Date(row.nextDate);

    if (row.reminder.type === 'absolute') {
      return now >= new Date(row.reminder.when);
    }

    // relative
    const offsetMs = row.reminder.value * {
      minute: 60_000,
      hour:   3_600_000,
      day:    86_400_000
    }[row.reminder.unit];

    return now >= new Date(next.getTime() - offsetMs);
  }

  function urgency(row) {
    const d = daysUntilNext(row);
    if (d < 0)  return 'overdue';   // red
    if (d <= 3) return 'due';       // yellow
    return 'ok';                    // green
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
    calcPrefill = amount;   // whatever is currently in the Amount field
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

    if (parsed.amount)      amount       = String(parsed.amount);
    if (parsed.category)    selectedMain = parsed.category;
    if (parsed.subcategory) selectedSub  = parsed.subcategory;
    description = parsed.description;    // keep transcript
  }

  function handleOCR(e) {
    const text   = e.detail as string;
    console.log('OCR raw:', text);

    const parsed = localParse(text) || {};
    if (parsed.amount)      amount       = String(parsed.amount);
    if (parsed.category)    selectedMain = parsed.category;
    if (parsed.subcategory) selectedSub  = parsed.subcategory;
    description = parsed.description ?? text;
  }
  
</script>

<style>
  .page {
    max-width: 600px;
    margin: auto;
    padding: 20px;
    font-family: sans-serif;
  }
  .cat-icons {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    margin-bottom: 16px;
  }
  .cat-button {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
    width: 70px;
    background-color: #f0f0f0;
    cursor: pointer;
  }
  .cat-button.selected {
    border-color: teal;
    background-color: #d1f3f1;
  }
  .radio-list label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
  }
  .input-field {
    margin-top: 16px;
    padding: 8px;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .round-btn {
    flex: 1;
    padding: 6px 0;
    font-size: 1.1rem;
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }
  .round-btn:hover {
    background: #ddd; 
  }

  .submit-btn {
    margin-top: 16px;
    padding: 10px 20px;
    background-color: teal;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .salary-line {
    margin-top: 24px;
    font-size: 0.9rem;
    text-align: right;
    opacity: 0.9;
  }

  .salary-text input {
    width: 100px;
    padding: 4px 8px;
    font-size: 1em;
  }

  .notif-drawer {
    position: absolute;   /* inside the bell container */
    right: 0;
    top: 36px;
    min-width: 200px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,.15);
    z-index: 1001;
  }

  .notif-row {
    padding: 6px 10px;
    cursor: pointer;
    font-size: 0.9rem;
    border-bottom: 1px solid #eee;
  }
  .notif-row:last-child { border-bottom: none; }

  /* urgency colors */
  .notif-row.ok      { background: #e7f9ef; }   /* light green */
  .notif-row.due     { background: #fff4e5; }   /* light orange */
  .notif-row.overdue { background: #fdecea; }   /* light red  */

  .notif-row:hover { background: #ddd; }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .edit-cats-btn {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0.7;
  }
  .edit-cats-btn:hover { opacity: 1; }

</style>

<div class="page">
  <div class="header">
    <h1>Edit Categories</h1>
    <button
      class="edit-cats-btn"
      on:click={openEditCategories}
      title="Edit categories"
    >✏️</button>
  </div>

  {#if showEditCategories}
    <CategoryManagementModal
      {categories}
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
      <label>
        <input type="radio" bind:group={selectedSub} value={sub} />
        {sub}
        <span style="font-size:0.8em; color:gray;">
          (Spent: ${getSpent(selectedMain, sub).toFixed(0)} – 
          Allocated: ${getAllocation(selectedMain, sub).toFixed(0)})
        </span>
      </label>
    {/each}
  </div>

  <div style="display: flex; align-items: center; gap: 8px;">
    <button class="input-field" on:click={openCalculator}>
      🧮 Open Calculator
    </button>
    <button class="input-field" on:click={openCamera}>📷 Scan receipt</button>
    <QuickSpeechEntry on:spoken={handleSpeech}/>
    <CalculatorModal
      visible={showCalc}
      prefill={calcPrefill}
      onResult={handleCalcResult}
      onClose={() => (showCalc = false)}
    />
  </div>

  <input
    type="number"
    bind:value={amount}
    placeholder="Enter amount"
    class="input-field"
  />

 <div style="display:flex; gap:8px; margin-top:4px;">
    <button class="round-btn" on:click={() => stepFive('down')}>‹</button>
    <button class="round-btn" on:click={() => stepFive('up')}>›</button>
  </div>

  <textarea
    bind:value={description}
    placeholder="Add a note (optional)"
    class="input-field"
    rows="3"
  />

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