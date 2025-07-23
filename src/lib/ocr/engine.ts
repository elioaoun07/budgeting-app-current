// src/lib/ocr/engine.ts
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