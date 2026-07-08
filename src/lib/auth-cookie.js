export const AUTH_COOKIE = 'sangkan_uid';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function authCookieOptions(request, maxAge = AUTH_MAX_AGE) {
  const proto = request.headers.get('x-forwarded-proto');
  const isHttps = proto === 'https' || new URL(request.url).protocol === 'https:';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge,
  };
}
