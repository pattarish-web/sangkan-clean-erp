'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, User, PenLine } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    position: '',
    phone: '',
    signature: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/login?next=/profile';
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'โหลดไม่สำเร็จ');
        setProfile({
          id: data.id || '',
          name: data.name || '',
          position: data.position || '',
          phone: data.phone || '',
          signature: data.signature || '',
        });
      } catch (e) {
        console.error(e);
        showToast('โหลดโปรไฟล์ไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          signature: profile.signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setProfile((prev) => ({ ...prev, ...data }));
      showToast('บันทึกโปรไฟล์และรายเซ็นเรียบร้อย', 'success');
    } catch (e) {
      showToast(e.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        กำลังโหลดโปรไฟล์...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#f1f5f9',
            color: 'var(--text-main)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 700 }}>จัดการบัญชี & รายเซ็น</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ตั้งรายเซ็นผู้เสนอราคาสำหรับแสดงบนใบเสนอราคา
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: saving ? '#94a3b8' : 'var(--primary-color)',
            color: 'white',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <User size={20} color="var(--primary-color)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>ข้อมูลบัญชี</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>รหัสพนักงาน</label>
              <input value={profile.id} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>ตำแหน่ง</label>
              <input value={profile.position} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>ชื่อ-นามสกุล</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>เบอร์โทร</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
        </section>

        <section style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <PenLine size={20} color="#0ea5e9" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>รายเซ็นผู้เสนอราคา</h2>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            แสดงในช่องลงนามผู้เสนอราคาเมื่อพิมพ์ใบเสนอราคา
          </p>
          <SignaturePad
            label="วาดรายเซ็น"
            value={profile.signature}
            onChange={(sig) => setProfile((p) => ({ ...p, signature: sig }))}
          />
          {profile.signature && (
            <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>✓ มีรายเซ็นบันทึกแล้ว</p>
          )}
        </section>
      </div>
    </div>
  );
}
