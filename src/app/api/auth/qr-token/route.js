import { NextResponse } from 'next/server';
import { prisma, recordToObject } from '@/lib/prisma';
import { makeQrToken } from '@/lib/qr-token';
import { getAuthUserId } from '@/lib/require-auth';

export async function GET(request) {
  const authId = await getAuthUserId();
  if (!authId) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบก่อน' }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('user')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'ไม่พบรหัสพนักงาน' }, { status: 400 });
  }

  try {
    const records = await prisma.dataRecord.findMany({ where: { sheet: 'employees' } });
    const employees = records.map(recordToObject);
    const emp = employees.find((e) => e.id === userId && e.status !== 'inactive');
    if (!emp) {
      return NextResponse.json({ error: 'ไม่พบพนักงาน' }, { status: 404 });
    }

    const token = makeQrToken(emp.id, emp.password || '1234');
    return NextResponse.json({ token });
  } catch (error) {
    console.error('[API qr-token]', error);
    return NextResponse.json({ error: 'สร้าง QR token ไม่สำเร็จ' }, { status: 500 });
  }
}
