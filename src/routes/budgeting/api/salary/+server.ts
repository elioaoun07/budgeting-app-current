import { json } from '@sveltejs/kit';
import { getSalary, setSalary } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
	try {
		const salary = await getSalary();
		return json({ salary });
	} catch (error) {
		return json({ error: String(error) }, { status: 500 });
	}
}

export async function POST({ request }) {
  const { salary } = await request.json();
  try {
    await setSalary(salary);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 500 });
  }
}