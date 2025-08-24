<!--
──────────────────────────────────────────────────────────────
src/lib/budgeting/CalculatorModal.svelte

Purpose ▸ Modal calculator for quick math and tip calculation.
           Lets the user enter expressions, calculate results, and add a 10% tip.
           Calls onResult with the result and onClose to close the modal.

Exports ▸
  • Svelte component – CalculatorModal
    – Props: visible, prefill, onResult, onClose

Depends ▸
  • mathjs – for expression evaluation

Used in ▸
  • Budgeting dashboard UI (amount entry, tip calculation)

Notes   ▸ Modal overlays the page, closes on backdrop click.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">

import { evaluate } from 'mathjs';
  export let visible = false;
  export let prefill  = '';
  export let onResult: (value: string) => void = () => {};
  export let onClose: () => void = () => {};

  let input = '';
  let tipApplied = false;
  let tipBase: number | null = null;

  $: if (visible) {
  input = prefill ? String(prefill) : '';
  // reset tip state whenever modal is opened
  tipApplied = false;
  tipBase = null;
  }

  function press(char: string) {
    // Any manual change after tip should re-enable Tip functionality
    if (tipApplied) {
      tipApplied = false;
      tipBase = null;
    }
    input += char;
  }

  function clear() {
  input = '';
  tipApplied = false;
  tipBase = null;
  }

  function backspace() {
  input = input.slice(0, -1);
  tipApplied = false;
  tipBase = null;
  }

  function calculate() {
	try {
  const result = evaluate(input);
  // set internal input to the evaluated result and clear tip state
  input = String(result);
  tipApplied = false;
  tipBase = null;
  // propagate result to parent and close
  onResult(String(result));
  clear();
  onClose();
	} catch (error) {
		console.error('Eval error:', error);
		alert('Invalid expression');
	}
}

   function addTip() {
    try {
      // Prevent cumulative tips: only apply if not already applied
      if (tipApplied) return;
      const base = evaluate(input || '0');
      const totalWithTip = (base * 1.1);
      // store base so we can detect changes and avoid re-applying
      tipBase = Number(base);
      // format to 2 decimals for monetary display
      input = totalWithTip.toFixed(2);
      tipApplied = true;
    } catch {
      alert('Enter a valid number first');
    }
  }

</script>

{#if visible}

  <div class="modal-backdrop" on:click={onClose} />

  <div class="modal">
    <div class="calculator">
      <input class="display" bind:value={input} readonly />

      <div class="buttons">
        <!-- digits / ops -->
        {#each ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+'] as ch}
          <button on:click={() => press(ch)}>{ch}</button>
        {/each}

  <!-- full-width TIP row -->
  <button class="tip" on:click={addTip} disabled={tipApplied} aria-pressed={tipApplied} title={tipApplied ? 'Tip applied' : 'Add 10% tip'}>Tip 10 %</button>

        <!-- C, ←, = -->
        <button on:click={clear}>C</button>
        <button on:click={backspace}>←</button>
        <button class="equal" on:click={calculate}>=</button>
      </div>
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
    top: 18%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95); /* app card bg */
    padding: 1rem;
    border-radius: 12px;
    z-index: 1000;
    width: 360px;
    box-shadow: 0 10px 30px rgba(2,6,23,0.6);
    border: 1px solid rgba(30,58,138,0.12);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .calculator {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .display {
    font-size: 1.6rem;
    padding: 0.6rem 0.75rem;
    text-align: right;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71,85,105,0.35);
    color: #e2e8f0;
    font-weight: 600;
    box-sizing: border-box;
  }
  .buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .buttons button {
    font-size: 1.05rem;
    padding: 0.7rem;
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid rgba(71,85,105,0.28);
    background: rgba(30,41,59,0.7);
    color: #cbd5e1;
    transition: transform 0.08s ease, box-shadow 0.12s ease, background 0.12s ease;
    box-shadow: 0 2px 6px rgba(2,6,23,0.25);
  }
  .buttons button:active { transform: translateY(1px) scale(0.997); }
  .buttons button:hover { background: rgba(59,130,246,0.06); color: #e2e8f0; }
  
  .tip {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff;
    border: none;
    font-weight: 600;
  }

  .tip[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    filter: none;
    background: linear-gradient(135deg, rgba(5,150,105,0.35), rgba(16,185,129,0.35));
  }

  .equal {
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    color: #fff;
    font-weight: 700;
    border: none;
  }

  /* small tweaks for special buttons */
  .buttons button[disabled] { opacity: 0.6; cursor: not-allowed; }
</style>
