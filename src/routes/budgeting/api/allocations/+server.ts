import { json } from '@sveltejs/kit';
import { getAllocations } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
	try {
		const data = await getAllocations();
		return json(data);
	} catch (e) {
		return json({ error: String(e) }, { status: 500 });
	}
}