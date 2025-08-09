/*import { GoogleSpreadsheet } from 'google-spreadsheet';
import creds from '$lib/credentials.json';
//import { SPREADSHEET_ID } from '$env/static/private';

const SPREADSHEET_ID = '1CEUjttL4pz414ZjfCHzERR_FlTUIDnOwOiGV_Dk65Xg';

const SCHEDULED_TAB = 'Scheduled Payments';

export async function getDoc() {
	const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
	await doc.useServiceAccountAuth(creds as any);
	await doc.loadInfo();
	return doc;
}

export async function appendExpense(date: string, category: string, subcategory: string, amount: number, description : string, username : string) {
	const doc = await getDoc();
	const sheet = doc.sheetsByIndex[0];
	await sheet.addRow({ Date: date, Category: category, 'Type of Expense': subcategory, Amount: amount, Description: description || '', Username: username});
}

export async function setSalary(amount: number) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle['Salary'];
  if (!sheet) throw new Error('No Salary sheet');
  // overwrite first cell
  const rows = await sheet.getRows();
  if (rows.length) {
    rows[0]._rawData[0] = String(amount);
    await rows[0].save();
  } else {
    await sheet.addRow({ Salary: amount });
  }
}


export async function getSalary(): Promise<string | null> {
	const doc = await getDoc();
	const salarySheet = doc.sheetsByTitle['Salary'];
	if (!salarySheet) return null;
	const rows = await salarySheet.getRows();
	return rows[0]?._rawData[0] ?? null;
}

export async function getAllocations() {
	const doc = await getDoc();
	const sheet = doc.sheetsByTitle['Budget Allocation'];
	if (!sheet) throw new Error('Budget Allocation sheet not found');
	const rows = await sheet.getRows();

	return rows.map((row) => ({
		category: row['Category'],
		subcategory: row['Sub Category'],
		amount: row['Amount'] ?? '',
		percentage: row['Percentage'] ?? ''
	}));
}

export async function getExpensesThisMonth() {
	const doc = await getDoc();
	const sheet = doc.sheetsByIndex[0];
	const rows = await sheet.getRows();

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	return rows
		.filter((row) => {
			const date = new Date(row['Date']);
			return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
		})
		.map((row) => ({
			date: row['Date'],
			category: row['Category'],
			subcategory: row['Type of Expense'],
			amount: parseFloat(row['Amount']),
		}));
}

export async function getScheduledPayments() {
	const doc = await getDoc();
	const sheet = doc.sheetsByTitle['Scheduled Payments'];
	if (!sheet) throw new Error('Scheduled Payments sheet not found');
	const rows = await sheet.getRows();

	return rows.map(r => ({
		category:    r['Category'],
		subcategory: r['Sub Category'],
		amount:      +r['Amount'],
		frequency:   r['Frequency'],
		nextDate:    r['Next Payment'],
		lastPaid:    r['Last Paid'],
		reminder:    JSON.parse(r['Reminder'] || 'null')
	}));

}

export async function markScheduledAsPaid(category: string, subcategory: string, amount: number) {
	const doc = await getDoc();
	const sheet = doc.sheetsByTitle['Scheduled Payments'];
	if (!sheet) throw new Error('Scheduled Payments sheet not found');

	const today = new Date().toISOString().split('T')[0];

	const rows = await sheet.getRows();
	const match = rows.find(r => r['Category'] === category && r['Sub Category'] === subcategory);
	if (match) match['Last Paid'] = today;
	await match?.save();

	await appendExpense(today, category, subcategory, amount, '[Auto] Scheduled Payment');
}

export async function setLastPaid(category: string, sub: string, dateISO: string) {
  const doc    = await getDoc();
  const sheet  = doc.sheetsByTitle['Scheduled Payments'];
  const rows   = await sheet.getRows();

  const row = rows.find(
    (r) => r.Category === category && r['Sub Category'] === sub
  );

  if (!row) throw new Error('Scheduled payment not found');

  row['Last Paid'] = dateISO;
  await row.save();
}

export async function addScheduledPayment(rec: {
  category: string;
  sub: string;
  amount: number;
  frequency: 'Monthly' | 'Yearly';
  nextDate: string;
  reminder: null | {
    type: 'absolute' | 'relative';
    when?: string;
    value?: number; unit?: 'minute' | 'hour' | 'day';
  };
}) {
  const doc   = await getDoc();
  const sheet = doc.sheetsByTitle[SCHEDULED_TAB];
  if (!sheet) throw new Error(`Tab "${SCHEDULED_TAB}" not found`);

  await sheet.addRow({
	Category:       rec.category,
	'Sub Category': rec.sub,
	Amount:         rec.amount,
	Frequency:      rec.frequency,
	'Next Payment': rec.nextDate,
	'Last Paid':    '',
	Reminder:       JSON.stringify(rec.reminder)
	});
}

export async function listScheduled() {
  const doc   = await getDoc();
  const sheet = doc.sheetsByTitle[SCHEDULED_TAB];
  if (!sheet) throw new Error(`Tab "${SCHEDULED_TAB}" not found`);
  return await sheet.getRows();
}


// /** Optional: list them later */
// export async function listScheduled() {
//   const doc   = await getDoc();
//   const sheet = doc.sheetsByTitle['Scheduled'];
//   return await sheet.getRows();
// }*/
