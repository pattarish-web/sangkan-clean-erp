import crypto from 'crypto';

const QR_SECRET = process.env.QR_LOGIN_SECRET || 'sangkan-qr-dev-secret-change-in-prod';

export function makeQrToken(employeeId, password) {
  const payload = `${employeeId}:${String(password)}`;
  const sig = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').slice(0, 24);
  return Buffer.from(`${employeeId}.${sig}`).toString('base64url');
}

export function verifyQrToken(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const dot = decoded.lastIndexOf('.');
    if (dot < 1) return null;
    const employeeId = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    if (!employeeId || !sig) return null;
    return { employeeId, sig };
  } catch {
    return null;
  }
}

export function qrTokenMatches(employeeId, password, sig) {
  const payload = `${employeeId}:${String(password)}`;
  const expected = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').slice(0, 24);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
