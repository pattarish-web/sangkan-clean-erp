import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth-cookie';

export async function POST(request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, '', authCookieOptions(request, 0));
  return response;
}
