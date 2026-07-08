import { NextResponse } from 'next/server';
import { prisma, recordToObject } from '@/lib/prisma';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth-cookie';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' }, { status: 400 });
    }

    const records = await prisma.dataRecord.findMany({
      where: { sheet: 'employees' },
    });
    const employees = records.map(recordToObject);
    const user = username.trim();
    const pass = String(password).trim();

    const emp = employees.find(
      (e) =>
        (e.username === user || e.id === user) &&
        String(e.password) === pass &&
        e.status !== 'inactive'
    );

    if (!emp) {
      return NextResponse.json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      employee: { id: emp.id, name: emp.name, position: emp.position || emp.role },
    });

    response.cookies.set(AUTH_COOKIE, emp.id, authCookieOptions(request));

    return response;
  } catch (error) {
    console.error('[API auth login]', error);
    return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จ' }, { status: 500 });
  }
}
