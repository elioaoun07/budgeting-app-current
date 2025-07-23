import { json } from '@sveltejs/kit';
import { addScheduledPayment, listScheduled } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
  const rows = await listScheduled();
  return json(rows.map(r => r._rawData));
}

export async function POST({ request }) {
  const rec = await request.json();
  await addScheduledPayment(rec);
  return json({ success: true });
}
