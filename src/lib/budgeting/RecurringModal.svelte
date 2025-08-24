<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/RecurringModal.svelte

Purpose ▸ Modal for creating a new recurring payment or bill.
           Lets the user enter category, amount, frequency, next date, and reminder options.
           Dispatches 'save' with payment details and 'close' to close the modal.

Exports ▸
  • Svelte component – RecurringModal
    – Props: visible
    – Events: 'save', 'close'

Depends ▸
  • Svelte createEventDispatcher

Used in ▸
  • Budgeting dashboard UI (recurring payments/bills)

Notes   ▸ Modal overlays the page, closes on backdrop click.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let visible = false;

  let category = '';
  let sub = '';
  let amount = '';
  let frequency = 'Monthly';
  let nextDate = '';
  let remind = false;
  let remindType = 'relative';
  let relValue = 1;
  let relUnit = 'day';
  let absDate = '';

  const dispatch = createEventDispatcher();
  const close = () => dispatch('close');
  const save = () => {
    dispatch('save', {
      category,
      sub,
      amount: parseFloat(amount),
      frequency,
      nextDate,
      reminder:
        remind &&
        (remindType === 'absolute'
          ? { type: 'absolute', when: absDate }
          : { type: 'relative', value: relValue, unit: relUnit })
    });
    close();
  };
</script>

{#if visible}
  <div class="backdrop" on:click={close}></div>
  <div class="modal">
    <h2>New Recurring Payment</h2>

    <div class="row">
      <label>Category</label>
      <input bind:value={category} placeholder="Home" />
    </div>

    <div class="row">
      <label>Sub-category</label>
      <input bind:value={sub} placeholder="Rent" />
    </div>

    <div class="row">
      <label>Amount</label>
      <input type="number" min="0" bind:value={amount} />
    </div>

    <div class="row">
      <label>Frequency</label>
      <select bind:value={frequency}>
        <option>Monthly</option>
        <option>Yearly</option>
      </select>
    </div>

    <div class="row">
      <label>Next Payment Date</label>
      <input type="date" bind:value={nextDate} />
    </div>

    <hr />

    <div class="row checkbox">
      <label><input type="checkbox" bind:checked={remind} /> Add Reminder</label>
    </div>

    {#if remind}
      <div class="reminder-box">
        <div class="radio-row">
          <label><input type="radio" bind:group={remindType} value="relative" /> Relative</label>
          <div class="inline-row" style="margin-left: 10px;">
            <input type="number" min="1" bind:value={relValue} />
            <select bind:value={relUnit}>
              <option value="minute">minutes before</option>
              <option value="hour">hours before</option>
              <option value="day">days before</option>
            </select>
          </div>
        </div>

        <div class="radio-row">
          <label><input type="radio" bind:group={remindType} value="absolute" /> Absolute</label>
          <input type="datetime-local" bind:value={absDate} />
        </div>
      </div>
    {/if}

    <div class="actions">
      <button on:click={save}>Save</button>
      <button class="secondary" on:click={close}>Cancel</button>
    </div>
  </div>
{/if}

<style>
.backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999;}
.modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;background:#fff;padding:24px;border-radius:10px;font-family:sans-serif;z-index:1000;}
h2{margin-top:0;font-size:1.2rem;}
.row{margin-bottom:14px;display:flex;flex-direction:column;}
.row.checkbox{flex-direction:row;align-items:center;gap:10px;}
label{font-size:0.9rem;margin-bottom:4px;color:#333;}
input,select{padding:8px 10px;font-size:0.95rem;border:1px solid #ccc;border-radius:4px;width:100%;box-sizing:border-box;}
input[type="checkbox"],input[type="radio"]{width:16px;height:16px;margin-right:6px;vertical-align:middle;accent-color:teal;}
.reminder-box{border:1px solid #ddd;border-radius:6px;padding:12px;background:#f9f9f9;}
.radio-row{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;}
.inline-row{display:flex;align-items:center;gap:10px;flex-grow:1;}
.inline-row input[type='number']{width:60px;}
.actions{margin-top:20px;display:flex;justify-content:flex-end;gap:12px;}
button{padding:8px 14px;font-size:0.9rem;border:none;border-radius:4px;cursor:pointer;}
button.secondary{background:#eee;color:#333;}
</style>