import { NextResponse } from 'next/server';
import { prisma, normalizeSheet, recordToObject } from '@/lib/prisma';
import { mergeCompanyProfile } from '@/lib/company-profile';

async function loadSheet(sheet) {
  const records = await prisma.dataRecord.findMany({
    where: { sheet: normalizeSheet(sheet) },
  });
  return records.map(recordToObject);
}

/** Public read-only endpoint for customer-facing share links */
export async function GET(request) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'quotation';
    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 });
    }

    const [quotations, drafts, invoices, taxInvoices] = await Promise.all([
      loadSheet('quotations'),
      loadSheet('documentdrafts'),
      loadSheet('invoices'),
      loadSheet('taxinvoices'),
    ]);

    let doc = null;

    if (type === 'quotation') {
      doc = quotations.find((q) => q.id === id);
    } else if (type === 'deposit') {
      const qtId = id.replace('DP', 'QT');
      const qt = quotations.find((q) => q.id === qtId);
      const parsed = drafts.find((d) => d.id === id && d.draftType === 'deposit');
      if (qt || parsed) {
        doc = {
          ...(qt || {}),
          id: qtId,
          customer: parsed?.customerName || parsed?.customer || qt?.customer,
          address: parsed?.customerAddress || parsed?.address || qt?.address,
          total: parsed?.price != null ? Number(parsed.price) : qt?.total,
          projectName: parsed?.projectName || qt?.projectName || '',
          items: qt?.items,
        };
      }
    } else if (type === 'invoice') {
      const inv = invoices.find((i) => i.id === id);
      const parsed = drafts.find((d) => d.id === id && d.draftType === 'invoice');
      const qtId = inv?.refQuotation || id.replace('INV', 'QT');
      const qt = quotations.find((q) => q.id === qtId);
      if (inv || parsed) {
        doc = {
          ...(qt || {}),
          id: qtId,
          customer: inv?.customer || parsed?.customerName || qt?.customer,
          address: inv?.address || parsed?.customerAddress || qt?.address,
          total: inv?.total ?? inv?.price ?? parsed?.price ?? qt?.total ?? 0,
          projectName: inv?.projectName || parsed?.projectName || qt?.projectName || '',
        };
      }
    } else if (type === 'tax-invoice') {
      const ti = taxInvoices.find((t) => t.id === id);
      const parsed = drafts.find((d) => d.id === id && d.draftType === 'tax-invoice');
      const qtId = ti?.refQuotation || id.replace('TI', 'QT').replace('INV', 'QT');
      const qt = quotations.find((q) => q.id === qtId);
      if (ti || parsed) {
        doc = {
          ...(qt || {}),
          id: qtId,
          customer: ti?.customer || parsed?.customerName || qt?.customer,
          address: ti?.address || parsed?.customerAddress || qt?.address,
          total: ti?.total ?? ti?.price ?? parsed?.price ?? qt?.total ?? 0,
          projectName: ti?.projectName || parsed?.projectName || qt?.projectName || '',
        };
      }
    }

    if (!doc) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const settingsRow = await prisma.appSetting.findUnique({ where: { key: 'sangkan_settings' } });
    let companyProfile = mergeCompanyProfile(null);
    if (settingsRow?.value) {
      try {
        const parsed = typeof settingsRow.value === 'string' ? JSON.parse(settingsRow.value) : settingsRow.value;
        companyProfile = mergeCompanyProfile(parsed?.companyProfile);
      } catch {
        /* use defaults */
      }
    }

    return NextResponse.json({ type, docId: id, doc, companyProfile });
  } catch (error) {
    console.error('[API share]', error);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 });
  }
}
