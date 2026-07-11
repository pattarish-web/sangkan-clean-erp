import { NextResponse } from 'next/server';
import { prisma, recordToObject } from '@/lib/prisma';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth-cookie';
import { verifyQrToken, qrTokenMatches } from '@/lib/qr-token';

export async function POST(request) {
  try {
    const { token } = await request.json();
    const parsed = verifyQrToken(token);
    if (!parsed) {
      return NextResponse.json({ error: 'QR Code ไม่ถูกต้องหรือหมดอายุ' }, { status: 401 });
    }

    const records = await prisma.dataRecord.findMany({ where: { sheet: 'employees' } });
    const employees = records.map(recordToObject);
    const emp = employees.find((e) => e.id === parsed.employeeId && e.status !== 'inactive');
    if (!emp || !qrTokenMatches(emp.id, emp.password || '1234', parsed.sig)) {
      return NextResponse.json({ error: 'QR Code ไม่ถูกต้อง' }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      employee: { id: emp.id, name: emp.name, position: emp.position || emp.role },
    });
    response.cookies.set(AUTH_COOKIE, emp.id, authCookieOptions(request));
    return response;
  } catch (error) {
    console.error('[API qr-login]', error);
    return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จ' }, { status: 500 });
  }
}
