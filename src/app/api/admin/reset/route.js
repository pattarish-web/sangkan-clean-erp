import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';
import { getAuthUserId, unauthorizedResponse } from '@/lib/require-auth';

export async function POST() {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();
  try {
    await prisma.dataRecord.deleteMany();
    await prisma.appSetting.deleteMany();
    await seedDatabase();
    return NextResponse.json({ ok: true, message: 'Database reset to seed data' });
  } catch (error) {
    console.error('[API reset]', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
