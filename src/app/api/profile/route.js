import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma, recordToObject } from '@/lib/prisma';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

async function getCurrentEmployee() {
  const cookieStore = await cookies();
  const uid = cookieStore.get(AUTH_COOKIE)?.value;
  if (!uid) return null;

  const record = await prisma.dataRecord.findUnique({
    where: { sheet_recordId: { sheet: 'employees', recordId: uid } },
  });
  if (!record) return null;

  const emp = recordToObject(record);
  if (emp.status === 'inactive') return null;
  return emp;
}

async function loadCompanySignature() {
  const row = await prisma.appSetting.findUnique({ where: { key: 'sangkan_settings' } });
  const settings = row?.value && typeof row.value === 'object' ? row.value : {};
  return {
    companySignature: settings.companySignature || '',
    companySignatoryName: settings.companySignatoryName || 'บริษัท สั่งการ คลีน จำกัด',
  };
}

export async function GET() {
  try {
    const emp = await getCurrentEmployee();
    if (!emp) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const company = await loadCompanySignature();

    return NextResponse.json({
      id: emp.id,
      name: emp.name,
      position: emp.position || emp.role || '',
      phone: emp.phone || '',
      signature: emp.signature || '',
      ...company,
    });
  } catch (error) {
    console.error('[API profile GET]', error);
    return NextResponse.json({ error: 'โหลดโปรไฟล์ไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const emp = await getCurrentEmployee();
    if (!emp) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};

    if (body.signature !== undefined) {
      updates.signature = String(body.signature || '');
    }
    if (body.name !== undefined) {
      updates.name = String(body.name || '').trim();
    }
    if (body.phone !== undefined) {
      updates.phone = String(body.phone || '').trim();
    }

    if (Object.keys(updates).length > 0) {
      const merged = { ...emp, ...updates };
      await prisma.dataRecord.upsert({
        where: { sheet_recordId: { sheet: 'employees', recordId: String(emp.id) } },
        create: {
          sheet: 'employees',
          recordId: String(emp.id),
          data: merged,
        },
        update: { data: merged },
      });
    }

    // รายเซ็นผู้ขาย / บริษัท (เก็บใน settings กลาง)
    if (body.companySignature !== undefined || body.companySignatoryName !== undefined) {
      const row = await prisma.appSetting.findUnique({ where: { key: 'sangkan_settings' } });
      const current =
        row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {};
      const next = {
        ...current,
        ...(body.companySignature !== undefined ? { companySignature: String(body.companySignature || '') } : {}),
        ...(body.companySignatoryName !== undefined
          ? { companySignatoryName: String(body.companySignatoryName || '').trim() }
          : {}),
      };
      await prisma.appSetting.upsert({
        where: { key: 'sangkan_settings' },
        create: { key: 'sangkan_settings', value: next },
        update: { value: next },
      });
    }

    const company = await loadCompanySignature();
    const fresh = await getCurrentEmployee();

    return NextResponse.json({
      ok: true,
      id: fresh.id,
      name: fresh.name,
      position: fresh.position || fresh.role || '',
      phone: fresh.phone || '',
      signature: fresh.signature || '',
      ...company,
    });
  } catch (error) {
    console.error('[API profile PATCH]', error);
    return NextResponse.json({ error: 'บันทึกโปรไฟล์ไม่สำเร็จ' }, { status: 500 });
  }
}
