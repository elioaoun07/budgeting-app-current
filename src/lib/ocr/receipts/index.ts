// src/lib/ocr/receipts/index.ts
import { spinneys } from './spinneys';
// import { carrefour } from './carrefour';   // later

export const receiptParsers = [
  spinneys,
  // carrefour,
] as const;