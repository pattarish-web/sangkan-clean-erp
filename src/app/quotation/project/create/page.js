'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Briefcase, Calendar, MapPin, Users, Settings } from 'lucide-react';
import { fetchQuotations } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function CreateJobOrder() {
  const router = useRouter();
  const showToast = useToast();
  const [jobType, setJobType] = useState('bigclean');
  const [refQt, setRefQt] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [scopeText, setScopeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const ref = params.get('ref');
    if (type === 'maid') setJobType('maid');
    if (!ref) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setRefQt(ref);

    async function load() {
      try {
        const all = await fetchQuotations();
        const qt = all.find((q) => q.id === ref);
        if (!qt) {
          setNotFound(true);
          return;
        }
        setCustomerName(qt.customer || '');
        setSiteAddress(qt.address || '');
        setContactPhone(qt.contactPhone || qt.contacts?.[0]?.phone || '');
        const items = qt.items || [];
        const scope = items
          .map((it, i) => `${i + 1}. ${it.description || it.name || ''}`)
          .join('\n');
        setScopeText(
          scope ||
            `บริการ ${qt.projectName || 'ตามใบเสนอราคา'}\n(รายละเอียดจาก ${ref} — ไม่แสดงราคาให้ทีมปฏิบัติการ)`
        );
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      const { saveData } = await import('@/utils/api');
      const now = new Date();
      const jobId = `JO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      await saveData('operations_bigcleaning', {
        id: jobId,
        refQuotation: refQt,
        customer: customerName,
        contactPhone,
        siteAddress,
        scopeText,
        jobType,
        status: 'รอเริ่มงาน',
        createdAt: now.toISOString().split('T')[0],
      });
      showToast(`บันทึกใบงาน ${jobId} เรียบร้อย`, 'success');
      router.push('/operations');
    } catch (e) {
      showToast('บันทึกใบงานไม่สำเร็จ', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>;
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>ไม่พบใบเสนอราคาอ้างอิง</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          เปิดหน้านี้จากใบเสนอราคาที่อนุมัติแล้ว (พารามิเตอร์ ?ref=QT...)
        </p>
        <Link href="/quotation" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
          ← กลับรายการใบเสนอราคา
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link
          href="/quotation"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'white',
            color: 'var(--text-main)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>
            สร้างใบงาน (Job Order)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            อ้างอิงจากใบเสนอราคา {refQt} (ซ่อนข้อมูลราคาสำหรับทีมปฏิบัติการ)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary-color)" /> ข้อมูลลูกค้า
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  ชื่อลูกค้า / นิติบุคคล
                </label>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  เบอร์โทรศัพท์ติดต่อหน้างาน
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    outlineColor: 'var(--primary-color)',
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MapPin size={16} /> สถานที่ปฏิบัติงาน
                </label>
                <textarea
                  rows="2"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    outlineColor: 'var(--primary-color)',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--primary-color)" /> กำหนดขอบเขตงาน ({jobType === 'bigclean' ? 'Big Cleaning' : 'แม่บ้านประจำ'})
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                รายละเอียดงาน (ซ่อนราคา)
              </label>
              <textarea
                rows="8"
                value={scopeText}
                onChange={(e) => setScopeText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  outlineColor: 'var(--primary-color)',
                  resize: 'vertical',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  backgroundColor: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary-color)" /> การมอบหมายทีมงาน
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar size={16} /> วันที่เริ่มงาน
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    outlineColor: 'var(--primary-color)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  วันที่สิ้นสุด (ถ้ามี)
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    outlineColor: 'var(--primary-color)',
                  }}
                />
              </div>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              การมอบหมายทีมงานเชื่อมกับโมดูล Operations — กำลังพัฒนา
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: 'white',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          zIndex: 100,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Link
          href="/quotation"
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '500',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'white',
            textDecoration: 'none',
          }}
        >
          ยกเลิก
        </Link>
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '500',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Save size={20} />
          บันทึกและสร้างใบงาน
        </button>
      </div>
    </div>
  );
}
