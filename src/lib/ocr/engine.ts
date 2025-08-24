// ──────────────────────────────────────────────────────────────
// src/lib/ocr/engine.ts
//
// Purpose ▸ Provides OCR extraction using Tesseract.js.
//            Exports a helper to recognize text from images or blobs.
//
// Exports ▸
//   • recognise(file) – returns raw OCR text from image/blob
//
// Depends ▸
//   • tesseract.js – OCR engine
//
// Used in ▸
//   • OCR pipeline for receipts, documents, etc.
//
// Notes   ▸ Logs progress to console. Language: English.
// ──────────────────────────────────────────────────────────────

import Tesseract from 'tesseract.js';

/** OCR an image / Blob and return the raw text. */
export async function recognise(file: File | Blob): Promise<string> {
  const {
    data: { text }
  } = await Tesseract.recognize(file, 'eng', {
    logger: m => console.log('[OCR]', m)   // progress output (optional)
  });
  return text;
}