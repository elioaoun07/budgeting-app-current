<!-- 
─────────────────────────────────────────────────────────────
     src/lib/budgeting/AddAccountModal.svelte

  Purpose ▸ Small pop-up dialog that lets the user create a new 
            money “account” (wallet, cash, bank, credit-card …).

  Props   ▸ `open` (boolean, two-way bound) – true  → modal visible
                                            – false → hidden / closed

  Depends ▸ `createAccount()`  from store.ts  (adds the row then
            refreshes the Svelte store)

  Emits   ▸ none (state is lifted via the `open` prop)

  Used in ▸ Sidebar.svelte 

  UX      ▸ Esc key closes the modal;  “Add” button is disabled until
            the Name field is non-blank.
            “Type” select chooses between Income / Expense accounts.
───────────────────────────────────────────────────────────────── 
-->

<script lang="ts">
	import { createAccount } from './store';
	import { onMount } from 'svelte';

	export let open = false;
	let name = '';
	let type: 'income' | 'expense' = 'expense';

	// close the modal when Escape is pressed
	const esc = (e: KeyboardEvent) => e.key === 'Escape' && (open = false);
	onMount(() => window.addEventListener('keydown', esc));
</script>

{#if open}
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg p-6 w-80 space-y-4">
		<h2 class="text-lg font-semibold">New Account</h2>

		<label class="block">
			<span class="text-sm">Name</span>
			<input class="input" bind:value={name} placeholder="e.g. Wallet" autofocus />
		</label>

		<label class="block">
			<span class="text-sm">Type</span>
			<select class="input" bind:value={type}>
				<option value="expense">Expense</option>
				<option value="income">Income</option>
			</select>
		</label>

		<div class="flex justify-end gap-3 pt-2">
			<button class="btn" on:click={() => (open = false)}>Cancel</button>
			<button
				class="btn-primary"
				disabled={!name.trim()}
				on:click={() => {
					createAccount(name.trim(), type);
					name = '';
					open = false;
				}}
			>
				Add
			</button>
		</div>
	</div>
</div>
{/if}

<style>
  .input {
    margin-top: 0.25rem;        /* mt-1  →  0.25 rem */
    width: 100%;
    border: 1px solid #cbd5e1;  /* light gray */
    border-radius: 0.25rem;     /* rounded */
    padding: 0.25rem 0.5rem;    /* px-2 py-1 */
    box-sizing: border-box;
  }

  .btn {
    padding: 0.25rem 0.75rem;   /* px-3 py-1 */
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    background: #fff;
    cursor: pointer;
  }

  .btn-primary {
    /* “inherit base .btn styles” */
    border-color: #2563eb;      /* blue-600 */
    background:  #2563eb;
    color: #fff;
  }

  .btn:disabled,
  .btn:disabled:hover {
    opacity: .6;
    cursor: not-allowed;
  }

  .btn:hover:not(:disabled) {
    background: #f1f5f9;        /* light hover */
  }
</style>