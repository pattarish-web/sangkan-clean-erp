import { NextResponse } from 'next/server';
import { prisma, normalizeSheet, recordToObject } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';
import { getAuthUserId, unauthorizedResponse } from '@/lib/require-auth';

const SENSITIVE_SHEETS = new Set(['employees']);

function sanitizeRecord(sheet, record) {
  if (sheet === 'employees' && record && typeof record === 'object') {
    const { password, ...rest } = record;
    return rest;
  }
  return record;
}

async function ensureSeeded() {
  if (process.env.NODE_ENV === 'production') return;
  const count = await prisma.dataRecord.count();
  if (count === 0) {
    await seedDatabase();
  }
}

export async function GET(_request, context) {
  try {
    const uid = await getAuthUserId();
    if (!uid) return unauthorizedResponse();

    const { sheet } = await context.params;
    const normalized = normalizeSheet(sheet);

    await ensureSeeded();
    const records = await prisma.dataRecord.findMany({
      where: { sheet: normalized },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(records.map((r) => sanitizeRecord(normalized, recordToObject(r))));
  } catch (error) {
    console.error('[API GET data]', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request, context) {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();

  try {
    const { sheet } = await context.params;
    const normalized = normalizeSheet(sheet);
    const body = await request.json();

    if (!body?.id) {
      return NextResponse.json({ error: 'Record id is required' }, { status: 400 });
    }

    await prisma.dataRecord.upsert({
      where: {
        sheet_recordId: { sheet: normalized, recordId: String(body.id) },
      },
      create: {
        sheet: normalized,
        recordId: String(body.id),
        data: body,
      },
      update: {
        data: body,
      },
    });

    return NextResponse.json({ ok: true, id: body.id });
  } catch (error) {
    console.error('[API POST data]', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();

  try {
    const { sheet } = await context.params;
    const normalized = normalizeSheet(sheet);
    const id = new URL(request.url).searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    await prisma.dataRecord.delete({
      where: {
        sheet_recordId: { sheet: normalized, recordId: id },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    console.error('[API DELETE data]', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
