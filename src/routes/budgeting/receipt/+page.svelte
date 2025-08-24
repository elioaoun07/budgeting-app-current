<!--
──────────────────────────────────────────────────────────────
src/routes/budgeting/receipt/+page.svelte

Purpose ▸ Receipt scanning page for budgeting.
           Lets the user upload a receipt image, runs OCR, and parses the total amount.
           Shows the detected store and extracted amount, or an error message.

Exports ▸
  • Svelte page – Receipt scanner

Depends ▸
  • $lib/ocr/engine – OCR extraction
  • $lib/ocr/receipts – receipt parsers

Used in ▸
  • Budgeting dashboard (receipt scanning)

Notes   ▸ Uses device camera if available. Shows feedback and errors.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { recognise }      from '$lib/ocr/engine';
  import { receiptParsers } from '$lib/ocr/receipts';

  // use two variables: the FileList from the input, and the actual File you need
  let files: FileList | null = null;
  let file:  File | null     = null;
  let msg = '';

  // grab the first file whenever the user chooses / changes
  $: file = files?.[0] ?? null;

  async function scan() {
    if (!file) { msg = 'Pick an image first'; return; }

    msg = 'Scanning…';
    try {
      const text   = await recognise(file);          // ⬅️ now a real File/Blob
      const p      = receiptParsers.find(p => p.matches(text));
      const amount = p?.extractTotal(text);

      msg = p
        ? `Parsed ${p.name} – \$${amount?.toFixed(2) ?? 'total not found'}`
        : 'No parser matched this receipt';
    } catch (err) {
      console.error(err);
      msg = '❌ Could not read image (format or resolution problem)';
    }
  }
</script>

<h2>Scan a receipt</h2>

<input type="file" accept="image/*"  capture="environment" bind:files={files}/>
<button on:click={scan}>Scan</button>

<p>{msg}</p>