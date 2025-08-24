<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/SalaryModal.svelte

Purpose ▸ Modal for editing the user's salary.
           Lets the user enter a monthly salary amount and save it.
           Dispatches 'save' with the new salary and 'close' to close the modal.

Exports ▸
  • Svelte component – SalaryModal
    – Props: visible, salary
    – Events: 'save', 'close'

Depends ▸
  • Svelte createEventDispatcher
  • Svelte transitions (fly, fade)

Used in ▸
  • Budgeting dashboard UI (salary entry/edit)

Notes   ▸ Modal overlays the page, closes on backdrop click.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  export let visible = false;
  export let salary: number | null = null;

  let salaryInput = '';
  const dispatch = createEventDispatcher();

  // keep field in sync with current salary whenever modal is opened
  $: if (visible) salaryInput = salary !== null ? String(salary) : '';

  function close() { dispatch('close'); }

  function save() {
    const newSalary = parseFloat(salaryInput);
    if (isNaN(newSalary)) {
      alert('Please enter a valid number');
      return;
    }
    dispatch('save', newSalary);
  }
</script>

{#if visible}
  <div class="backdrop" transition:fade on:click={close} />

  <div class="modal" transition:fly="{{ y: 32, duration: 250 }}">
    <h2>Edit Salary</h2>
    <input
      type="number"
      bind:value={salaryInput}
      class="field"
      placeholder="Monthly salary"
      on:keydown={(e) => e.key === 'Enter' && save()}
    />
    <div class="actions">
      <button on:click={save}>Save</button>
      <button class="secondary" on:click={close}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.3);
    z-index: 998;
  }
  .modal {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    width: 320px;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(0,0,0,.15);
  }
  h2 { margin: 0 0 16px; }
  .field {
    width: 100%; padding: 8px;
    border: 1px solid #ccc; border-radius: 4px;
  }
  .actions {
    margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end;
  }
  button {
    padding: 8px 16px;
    border: none; border-radius: 4px;
    cursor: pointer;
    background: teal; color: white;
  }
  .secondary { background: #eee; color: #333; }
</style>