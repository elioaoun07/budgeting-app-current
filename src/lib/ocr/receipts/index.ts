// ──────────────────────────────────────────────────────────────
// src/lib/ocr/receipts/index.ts
//
// Purpose ▸ Exports all available receipt parsers for OCR extraction.
//            Each parser handles a specific store's receipt format.
//
// Exports ▸
//   • receiptParsers – array of parser modules
//
// Depends ▸
//   • ./spinneys – Spinneys receipt parser
//   • ./carrefour – Carrefour receipt parser (future)
//
// Used in ▸
//   • OCR pipeline for receipts
//
// Notes   ▸ Add new parsers here as needed.
// ──────────────────────────────────────────────────────────────

import { spinneys } from './spinneys';
// import { carrefour } from './carrefour';   // later

export const receiptParsers = [
  spinneys,
  // carrefour,
] as const;