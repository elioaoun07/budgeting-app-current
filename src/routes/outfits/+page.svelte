<script lang="ts">
  import ThreeDMannequin, { TOPS, BOTTOMS } from './ThreeDMannequin.svelte';

  let selectedTop = 0;
  let selectedBottom = 0;

  const prev = (arr, i) => (i - 1 + arr.length) % arr.length;
  const next = (arr, i) => (i + 1) % arr.length;
</script>

<h1>👗 Outfit Selector</h1>

<ThreeDMannequin bind:selectedTop bind:selectedBottom />

<div class="controls">
  <button on:click={() => selectedTop = prev(TOPS, selectedTop)}>◀ Top</button>
  <span>{TOPS[selectedTop].split('/').pop()}</span>
  <button on:click={() => selectedTop = next(TOPS, selectedTop)}>Top ▶</button>
</div>

<div class="controls">
  <button on:click={() => selectedBottom = prev(BOTTOMS, selectedBottom)}>◀ Bottom</button>
  <span>{BOTTOMS[selectedBottom].split('/').pop()}</span>
  <button on:click={() => selectedBottom = next(BOTTOMS, selectedBottom)}>Bottom ▶</button>
</div>

<style>
  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  button {
    background: teal;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  span {
    min-width: 120px;
    text-align: center;
    font-weight: bold;
  }
</style>