'use client';

import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnderConstruction() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
        <Construction size={64} />
      </div>
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '16px' }}>ระบบกำลังอยู่ในระหว่างการพัฒนา</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '32px' }}>
        ฟังก์ชันนี้เป็นส่วนหนึ่งของเฟสถัดไป ทางทีมงานกำลังเร่งดำเนินการเพื่อเปิดให้ใช้งานได้เร็วๆ นี้ครับ
      </p>
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#f1f5f9', color: 'var(--text-main)', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
        <ArrowLeft size={18} /> ย้อนกลับ
      </button>
    </div>
  );
}
