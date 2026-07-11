import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId, unauthorizedResponse } from '@/lib/require-auth';

export async function GET(request) {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();

  try {
    const key = new URL(request.url).searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'key query parameter is required' }, { status: 400 });
    }

    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return NextResponse.json(setting?.value ?? null);
  } catch (error) {
    console.error('[API GET settings]', error);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}

export async function POST(request) {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API POST settings]', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
