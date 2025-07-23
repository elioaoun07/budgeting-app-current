<script lang="ts">

import { evaluate } from 'mathjs';
  export let visible = false;
  export let prefill  = '';
  export let onResult: (value: string) => void = () => {};
  export let onClose: () => void = () => {};

  let input = '';

  $: if (visible) {
    input = prefill ? String(prefill) : '';
  }

  function press(char: string) {
    input += char;
  }

  function clear() {
    input = '';
  }

  function backspace() {
    input = input.slice(0, -1);
  }

  function calculate() {
	try {
		const result = evaluate(input);
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
      const base = evaluate(input || '0');
      const totalWithTip = (base * 1.1).toFixed(2);
      input = totalWithTip;
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
        <button class="tip" on:click={addTip}>Tip 10 %</button>

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
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 1000;
    width: 300px;
  }
  .calculator {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .display {
    font-size: 1.5rem;
    padding: 0.5rem;
    text-align: right;
  }
  .buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .buttons button {
    font-size: 1.2rem;
    padding: 0.75rem;
    cursor: pointer;
  }
  
  .tip {
    grid-column: 1 / -1;
    background: teal;
    color: #fff;
  }

  .equal { background: #ffd24d; }
</style>
