<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/Sidebar.svelte

Purpose ▸ Sidebar panel for account and budgeting actions.
           Lets the user switch accounts, add new accounts, and access main budgeting features.
           Dispatches events for salary edit, recurring payments, receipt scanning, and category addition.

Exports ▸
  • Svelte component – Sidebar
    – Props: visible, username
    – Events: 'close', 'editsalary', 'addrecurring', 'requestAddCategory'

Depends ▸
  • Svelte transitions (slide)
  • $app/navigation – for route changes
  • ./store – accounts, currentAccount, selectAccount
  • AddAccountModal.svelte – for account creation

Used in ▸
  • Budgeting dashboard UI (main navigation/sidebar)

Notes   ▸ Modal overlays the page, closes on Escape or backdrop click.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { createEventDispatcher, onMount } from 'svelte';

  import {
    accounts,
    currentAccount,
    selectAccount
  } from './store';               // ⇠ the store we added earlier
  import AddAccountModal from './AddAccountModal.svelte';

  /** Props passed from parent */
  export let visible = false;
  export let username: string | null = null;

  /** Internal state */
  let showAddAccount = false;     // controls the modal

  /** Event dispatchers to parent */
  const dispatch = createEventDispatcher();
  const close        = () => dispatch('close');
  const editSalary   = () => { dispatch('editsalary');   close(); };
  const addRecurring = () => { dispatch('addrecurring'); };
  const addCategory  = () => { dispatch('requestAddCategory'); };
  const scanReceipt  = () => { close(); goto('/budgeting/receipt'); };

  /** Close on Escape */
  onMount(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  });
</script>

{#if visible}
  <aside
    class="panel"
    transition:slide={{ x: -300, duration: 250 }}
    on:click|self={close}
  >
    <div class="inner" on:click|stopPropagation>
      {#if username}
        <div class="user">👤 {username}</div>
      {/if}

      <!-- --- Accounts --- -->
      <section class="accounts">
        <header class="acc-hdr">
          <span>Accounts</span>
          <button title="Add account" class="add-btn" on:click={() => (showAddAccount = true)}>
            ＋
          </button>
        </header>

        {#if $accounts.length}
          <ul class="acc-list">
            {#each $accounts as acc}
              <li>
                <button
                  class="acc-item { $currentAccount?.id === acc.id ? 'active' : '' }"
                  on:click={() => selectAccount(acc.id)}
                >
                  {acc.name}
                  <small>[{acc.type}]</small>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="acc-empty">No accounts yet.</p>
        {/if}
      </section>

      <!-- --- Main menu --- -->
      <h2 class="title">Menu</h2>
      <button class="item" on:click={editSalary}>💰 Edit Salary</button>
      <button class="item" on:click={addRecurring}>➕ Recurring payment</button>
      <button class="item" on:click={scanReceipt}>📸 Scan receipt</button>
      <button class="item" on:click={addCategory}>🗂️ Add Category</button>
    </div>
  </aside>

  <!-- Account creation modal -->
  <AddAccountModal bind:open={showAddAccount} />
{/if}

<style>
  /* panel */
  .panel {
    position: fixed;
    inset: 0 auto 0 0;
    width: 100%;
    max-width: 260px;
    height: 100vh;
    background: #fff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, .12);
    z-index: 999;
  }
  .inner { padding: 24px; overflow-y: auto; }

  /* user banner */
  .user { margin-bottom: 1rem; font-weight: 500; }

  /* accounts block */
  .accounts { margin-bottom: 1.5rem; }
  .acc-hdr { display: flex; justify-content: space-between; font-size: .9rem; font-weight: 600; color: #555; }
  .add-btn { border: none; background: none; font-size: 1rem; cursor: pointer; }
  .acc-list { list-style: none; margin: .5rem 0 0; padding: 0; }
  .acc-item { width: 100%; text-align: left; padding: 6px 0; border: none; background: none; cursor: pointer; }
  .acc-item small { margin-left: 4px; color: #888; }
  .acc-item.active { font-weight: 600; background: #eef6ff; }
  .acc-item:hover:not(.active) { background: #f3f4f6; }
  .acc-empty { font-size: .85rem; color: #888; margin-top: .5rem; }

  /* main menu */
  .title { margin: 1rem 0 .5rem; font-size: 1.25rem; font-weight: 600; }
  .item { display: block; width: 100%; text-align: left; padding: 10px 0; border: none; background: none; font-size: 1rem; cursor: pointer; }
  .item:hover { color: teal; }
</style>