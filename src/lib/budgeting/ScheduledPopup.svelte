<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/ScheduledPopup.svelte

Purpose ▸ Popup reminder for scheduled payments.
           Shows category, subcategory, amount, and next payment date.
           Lets the user confirm payment or cancel.

Exports ▸
  • Svelte component – ScheduledPopup
    – Props: item (category, subcategory, amount, nextDate)
    – Events: 'confirm', 'close'

Depends ▸
  • Svelte createEventDispatcher

Used in ▸
  • Budgeting dashboard UI (scheduled payment reminders)

Notes   ▸ Modal overlays the page, closes on backdrop click.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let item: {
    category: string;
    subcategory: string;
    amount: number;
    nextDate: string;      // <-- make sure you pass this
  };

  const dispatch = createEventDispatcher();
  const confirm = () => dispatch('confirm', item);
  const close   = () => dispatch('close');
</script>

{#if item}
  <div class="modal-backdrop" on:click={close}/>
  <div class="modal">
    <h2>Scheduled Payment Reminder</h2>

    <p><strong>{item.category} – {item.subcategory}</strong></p>

    <!-- NEW line -->
    <p style="font-size:0.9rem;opacity:.8;">
      Next payment: {item.nextDate}
    </p>

    <input type="number" bind:value={item.amount} class="input"/>

    <div class="buttons">
      <button on:click={confirm}>Paid</button>
      <button class="secondary" on:click={close}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
  }
  .modal {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 1000;
    width: 300px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }
  .input {
    width: 100%;
    margin: 10px 0;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .buttons {
    display: flex;
    justify-content: space-between;
  }
  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background: teal;
    color: white;
    cursor: pointer;
  }
</style>