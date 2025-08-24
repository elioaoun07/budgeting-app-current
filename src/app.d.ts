// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
//
// Purpose ▸ Type definitions for SvelteKit app.
//            Extends App.Locals to include user info for authentication.
//
// Depends ▸
//   • SvelteKit types
//
// Used in ▸
//   • All server endpoints and hooks
//
// Notes   ▸ Extend as needed for custom types.
// ──────────────────────────────────────────────────────────────
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};

declare namespace App {
  interface Locals {
    user: { id: string } | null;
  }
}