import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

export async function getAuthUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value || null;
}

export function unauthorizedResponse(message = 'กรุณาเข้าสู่ระบบ') {
  return NextResponse.json({ error: message }, { status: 401 });
}
