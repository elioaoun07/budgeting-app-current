<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let visible = false;

  const dispatch  = createEventDispatcher();
  let videoEl: HTMLVideoElement;
  let stream: MediaStream | null = null;

  let isBusy   = false;
  let progress = 0;

  /* ---------- camera helpers ---------- */
  async function startCamera() {
    if (stream) return;                       // already running
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (e) {
      alert('Camera access denied');
      close();
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
  }

  /* mount → nothing; camera is started by the reactive block below */
  onDestroy(stopCamera);

  /* 🔴  watch “visible” each time it changes  */
  $: if (visible) startCamera();   // open
  $: if (!visible) stopCamera();   // close

  /* ---------- capture + OCR ---------- */
  async function capture() {
    if (!videoEl || isBusy) return;
    isBusy = true;

    /* frame → canvas */
    const canvas   = document.createElement('canvas');
    canvas.width   = videoEl.videoWidth;
    canvas.height  = videoEl.videoHeight;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0);

    /* canvas → blob */
    const blob: Blob = await new Promise(res =>
      canvas.toBlob(b => res(b!), 'image/png')
    );

    /* lazy-load Tesseract */
    const Tesseract: any = (await import('tesseract.js')).default;

    const { data } = await Tesseract.recognize(blob, 'eng', {
      logger: (m: any) =>
        m.status === 'recognizing text' && (progress = Math.round(m.progress * 100))
    });

    dispatch('result', data.text);
    close();
  }

  function close() {
    stopCamera();
    isBusy = false;
    progress = 0;
    dispatch('close');
  }
</script>

{#if visible}
  <div class="backdrop" on:click={close}/>
  <div class="modal">
    {#if !isBusy}
      <video bind:this={videoEl} playsinline muted></video>
      <button class="scan-btn" on:click={capture}>📸 Scan</button>
    {:else}
      <p class="progress">Scanning… {progress}%</p>
    {/if}
  </div>
{/if}

<style>
  .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;}
  .modal   {position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            width:340px;background:#fff;padding:16px;border-radius:10px;
            display:flex;flex-direction:column;align-items:center;z-index:1000;}
  video    {width:100%;border-radius:6px;}
  .scan-btn{margin-top:12px;width:100%;padding:10px;border:none;border-radius:6px;
            background:teal;color:#fff;font-size:1rem;cursor:pointer;}
  .progress{margin:40px 0;font-size:1rem;}
</style>