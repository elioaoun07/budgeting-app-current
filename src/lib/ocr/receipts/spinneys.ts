// ──────────────────────────────────────────────────────────────
// src/lib/ocr/receipts/spinneys.ts
//
// Purpose ▸ Parser for Spinneys receipts for OCR extraction.
//            Detects Spinneys receipts and extracts the total amount in USD.
//
// Exports ▸
//   • spinneys – ReceiptParser object
//
// Depends ▸
//   • ./types – ReceiptParser type
//
// Used in ▸
//   • OCR pipeline for receipts
//
// Notes   ▸ Matches “spinneys” with OCR slip tolerance, and “Rate USD” + “Total USD”.
//           Extracts first “Total USD” value, handling decimal/thousands separators.
// ──────────────────────────────────────────────────────────────

import type { ReceiptParser } from './types';

export const spinneys: ReceiptParser = {
  name: 'Spinneys',

  /**
   * Decide whether this chunk of OCR text looks like a Spinneys receipt.
   *
   * Strategy:
   *  1. Try to spot “spinneys” (allowing common OCR slips).
   *  2. Fallback: the combo “Rate USD” + “Total USD” is a pattern unique to
   *     Spinneys Lebanon cash registers (other stores show “Exchange Rate”).
   */
  matches(text) {
    const flat = text.replace(/\s+/g, '').toLowerCase();

    const looksLikeName =
      /spinneys/.test(flat)     ||   // perfect
      /sp1nne?ys/.test(flat)    ||   // 1 ↔ i / missing y
      /spinney\$/.test(flat);        // $ seen as s

    const hasUsdBlock =
      /rate\s*usd/i.test(text) && /total\s*usd/i.test(text);

    return looksLikeName || hasUsdBlock;
  },

  /**
   * Extract the numeric amount after the *first* “Total USD”.
   * Accept both dot and comma as decimal separators, ignore spaces/commas used
   * as thousands separators.
   */
  extractTotal(text) {
    const lineMatch = text.match(/total\s*usd[^\d\-]*([0-9][0-9.,]*)/i);
    if (!lineMatch) return null;

    const raw = lineMatch[1]
      .replace(/\s+/g, '')      // strip spaces inside numbers
      .replace(/,(?=\d{2}$)/, '.') // comma used as decimal → dot
      .replace(/,/g, '');          // leftover thousands separators

    const amount = parseFloat(raw);
    return isFinite(amount) ? amount : null;
  }
};