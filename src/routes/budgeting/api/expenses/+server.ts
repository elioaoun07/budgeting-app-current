import { json } from '@sveltejs/kit';
import { appendExpense, getExpensesThisMonth } from '$lib/budgeting/server/gsheets.server';

export async function POST({ request, locals }) {
	const { date, category, subcategory, amount, description } = await request.json();

	const user = locals.user;
	const username = typeof user === 'string'
	    ? user
	    : user?.id;
	if (!username) return json({ error: 'unauthenticated' }, { status: 401 });

	try {
		await appendExpense(date, category, subcategory, amount, description, username);
		return json({ success: true });
	} catch (error) {
		return json({ success: false, error: String(error) }, { status: 500 });
	}
}

export async function GET() {
	try {
		const data = await getExpensesThisMonth();
		return json(data);
	} catch (e) {
		return json({ error: String(e) }, { status: 500 });
	}
}