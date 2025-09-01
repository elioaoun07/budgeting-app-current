<!-- src/lib/budgeting/AddAccountModal.svelte -->

<script lang="ts">
	import { createAccount } from './store';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	export let open = false;
	let name = '';
	let type: 'income' | 'expense' = 'expense';

	// close the modal when Escape is pressed
	const esc = (e: KeyboardEvent) => e.key === 'Escape' && (open = false);
	onMount(() => window.addEventListener('keydown', esc));

	async function handleAddAccount() {
		if (!name.trim()) return;
		
		try {
			await createAccount(name.trim(), type);
			name = '';
			open = false;
		} catch (error) {
			console.error('Failed to create account:', error);
			alert('Failed to create account. Please try again.');
		}
	}
</script>

{#if open}
<div class="modal-backdrop" transition:fade={{ duration: 200 }}>
	<div class="modal-content" transition:fly={{ y: 20, duration: 300 }}>
		<h2 class="modal-title">Add New Account</h2>

		<div class="form-group">
			<label class="label">
				<span>Account Name</span>
				<input 
					class="input-field" 
					bind:value={name} 
					placeholder="e.g. Bank Account, Cash, Credit Card" 
					autofocus 
				/>
			</label>
		</div>

		<div class="form-group">
			<label class="label">
				<span>Account Type</span>
				<select class="input-field" bind:value={type}>
					<option value="expense">Expense Account</option>
					<option value="income">Income Account</option>
				</select>
			</label>
		</div>

		<div class="modal-actions">
			<button class="btn-secondary" on:click={() => (open = false)}>Cancel</button>
			<button
				class="btn-primary"
				disabled={!name.trim()}
				on:click={handleAddAccount}
			>
				Add Account
			</button>
		</div>
	</div>
</div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  :root {
    --color-bg-primary: rgba(15, 23, 42, 0.95);
    --color-bg-card: rgba(30, 41, 59, 0.9);
    --color-bg-glass: rgba(15, 23, 42, 0.98);
    --color-bg-elevated: rgba(51, 65, 85, 0.8);
    --color-border-subtle: rgba(71, 85, 105, 0.3);
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
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04);
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

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50000;
    padding: var(--spacing-4);
    font-family: 'Inter', sans-serif;
  }

  .modal-content {
    background: var(--color-bg-glass);
    backdrop-filter: blur(24px);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-xl);
    position: relative;
  }

  .modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
    opacity: 0.5;
  }

  .modal-title {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-5) 0;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, var(--color-text-primary), var(--color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .form-group {
    margin-bottom: var(--spacing-5);
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
    padding: var(--spacing-4) var(--spacing-4);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s var(--ease-spring);
    backdrop-filter: blur(16px);
    font-family: inherit;
    box-sizing: border-box;
    min-height: 48px;
    box-shadow: var(--shadow-sm);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    background: var(--color-bg-glass);
    transform: translateY(-1px);
  }

  .input-field::placeholder {
    color: var(--color-text-muted);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-3);
    margin-top: var(--spacing-6);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border-subtle);
  }

  .btn-secondary {
    padding: var(--spacing-3) var(--spacing-5);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sm);
    font-family: inherit;
  }

  .btn-secondary:hover {
    transform: translateY(-1px);
    border-color: var(--color-primary);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-md);
  }

  .btn-primary {
    padding: var(--spacing-3) var(--spacing-5);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    border: none;
    border-radius: var(--radius-lg);
    color: white;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s var(--ease-spring);
    box-shadow: var(--shadow-md);
    font-family: inherit;
    letter-spacing: -0.01em;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  }

  .btn-primary:disabled {
    background: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
    opacity: 0.6;
  }

  select.input-field {
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23e2e8f0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
  }
</style>