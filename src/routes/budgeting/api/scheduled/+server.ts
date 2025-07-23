import { json } from '@sveltejs/kit';
import { getScheduledPayments, appendExpense, setLastPaid, addScheduledPayment } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
	try {
		const payments = await getScheduledPayments();
		return json(payments);
	} catch (e) {
		return json({ error: String(e) }, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	const { category, subcategory, amount } = await request.json();
	const username = locals.user;
	if (!username) return json({ error: 'unauthenticated' }, { status: 401 });

	try {
		const today = new Date().toISOString().split('T')[0];
		await appendExpense(today, category, subcategory, amount, 'Scheduled Payment', username);
		await setLastPaid(category, subcategory, today);
		return json({ success: true });
	} catch (error) {
		return json({ success: false, error: String(error) }, { status: 500 });
	}
}