// // ──────────────────────────────────────────────────────────────
// // src/routes/budgeting/api/allocations/+server.ts
// //
// // Purpose ▸ API endpoint for fetching budget allocations from Google Sheets.
// //            Handles GET requests and returns allocation data.
// //
// // Exports ▸
// //   • GET – returns allocation data
// //
// // Depends ▸
// //   • $lib/budgeting/server/gsheets.server – getAllocations
// //   • @sveltejs/kit – SvelteKit API helpers
// //
// // Used in ▸
// //   • Budgeting dashboard (allocation display)
// //
// // Notes   ▸ Returns error 500 if fetching fails.
// // ──────────────────────────────────────────────────────────────

// import { json } from '@sveltejs/kit';
// import { getAllocations } from '$lib/budgeting/server/gsheets.server';

// export async function GET() {
//     try {
//         const data = await getAllocations();
//         return json(data);
//     } catch (e) {
//         return json({ error: String(e) }, { status: 500 });
//     }
// }