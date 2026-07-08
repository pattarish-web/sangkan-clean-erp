import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma, recordToObject } from '@/lib/prisma';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get(AUTH_COOKIE)?.value;
    if (!uid) {
      return NextResponse.json(null);
    }

    const record = await prisma.dataRecord.findUnique({
      where: { sheet_recordId: { sheet: 'employees', recordId: uid } },
    });

    if (!record) {
      return NextResponse.json(null);
    }

    const emp = recordToObject(record);
    if (emp.status === 'inactive') {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: emp.id,
      name: emp.name,
      position: emp.position || emp.role,
    });
  } catch (error) {
    console.error('[API auth session]', error);
    return NextResponse.json(null);
  }
}
