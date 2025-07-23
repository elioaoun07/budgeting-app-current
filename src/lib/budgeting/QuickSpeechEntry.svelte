<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  let listening = false;
  let transcript = '';

  let recognition: SpeechRecognition;

  onMount(() => {
    const SpeechRec = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      transcript = e.results[0][0].transcript;
      listening = false;
      dispatch('spoken', transcript);      // bubble up
    };
    recognition.onend = () => (listening = false);
  });

  function toggle() {
    if (listening) {
      recognition.stop();
    } else {
      transcript = '';
      listening = true;
      recognition.start();
    }
  }
</script>

<button class="mic-btn" on:click={toggle}>
  {#if listening}
    ⏹️ Stop
  {:else}
    🎙️ Speak
  {/if}
</button>
{#if transcript}<small>{transcript}</small>{/if}

<style>
  .mic-btn{padding:6px 12px;border:none;border-radius:4px;background:#eee;cursor:pointer}
</style>