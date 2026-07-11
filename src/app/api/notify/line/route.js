import { NextResponse } from 'next/server';
import { getAuthUserId, unauthorizedResponse } from '@/lib/require-auth';

/**
 * ส่งข้อความเข้ากลุ่ม LINE (Messaging API)
 */
export async function POST(request) {
  const uid = await getAuthUserId();
  if (!uid) return unauthorizedResponse();

  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const groupId = body?.groupId || process.env.LINE_ACCOUNTING_GROUP_ID;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!message) {
      return NextResponse.json({ ok: false, error: 'missing message' }, { status: 400 });
    }

    if (!token || !groupId) {
      console.warn('[LINE notify] missing LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCOUNTING_GROUP_ID — skipped');
      return NextResponse.json({
        ok: false,
        skipped: true,
        error: 'LINE env not configured',
      });
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[LINE notify] failed', res.status, text);
      return NextResponse.json({ ok: false, error: text || res.statusText }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[LINE notify]', error);
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
