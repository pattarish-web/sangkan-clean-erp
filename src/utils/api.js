// =====================================================================
// Sangkan Clean - Data Manager (SQLite + Prisma via API)
// =====================================================================

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

function sheetPath(sheetName) {
  return `/api/data/${encodeURIComponent(sheetName)}`;
}

export async function fetchData(sheetName) {
  const res = await fetch(sheetPath(sheetName), { cache: 'no-store', credentials: 'include' });
  const data = await parseJsonResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function saveData(sheetName, record) {
  const res = await fetch(sheetPath(sheetName), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
    credentials: 'include',
  });
  await parseJsonResponse(res);
  return true;
}

export async function deleteData(sheetName, id) {
  const res = await fetch(`${sheetPath(sheetName)}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await parseJsonResponse(res);
  return true;
}

export async function fetchSetting(key) {
  const res = await fetch(`/api/settings?key=${encodeURIComponent(key)}`, { cache: 'no-store', credentials: 'include' });
  return parseJsonResponse(res);
}

export async function saveSetting(key, value) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
    credentials: 'include',
  });
  await parseJsonResponse(res);
  return true;
}

export async function resetDatabase() {
  const res = await fetch('/api/admin/reset', { method: 'POST', credentials: 'include' });
  await parseJsonResponse(res);
  return true;
}

// Alias functions
export async function fetchQuotations() { return fetchData('Quotations'); }
export async function saveQuotation(q) { return saveData('Quotations', q); }

export async function fetchDeposits() { return fetchData('Deposits'); }
export async function saveDeposit(d) { return saveData('Deposits', d); }

export async function fetchInvoices() { return fetchData('Invoices'); }
export async function saveInvoice(inv) { return saveData('Invoices', inv); }

export async function fetchTaxInvoices() { return fetchData('Taxinvoices'); }
export async function saveTaxInvoice(ti) { return saveData('Taxinvoices', ti); }

export async function fetchExpenses() { return fetchData('Expenses'); }
export async function saveExpense(exp) { return saveData('Expenses', exp); }

export async function fetchCustomers() { return fetchData('Customers'); }
export async function saveCustomer(c) { return saveData('Customers', c); }

export async function fetchItemCatalog() { return fetchData('Itemcatalog'); }
export async function saveItemCatalog(item) { return saveData('Itemcatalog', item); }

/** Generate next doc id e.g. DP202607002 from existing ids */
export function nextSequentialDocId(prefix, existingIds) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const p = `${prefix}${year}${month}`;
  const nums = (existingIds || [])
    .map((id) => String(id))
    .filter((id) => id.startsWith(p))
    .map((id) => parseInt(id.replace(p, ''), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${p}${String(next).padStart(3, '0')}`;
}
