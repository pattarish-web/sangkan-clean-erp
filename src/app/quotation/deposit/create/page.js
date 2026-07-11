'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchDeposits, nextSequentialDocId } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function CreateDepositPage() {
  const router = useRouter();
  const showToast = useToast();
  const [docNo, setDocNo] = useState('');
  const [refId, setRefId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refNotFound, setRefNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setRefId(ref);
        try {
          const [allData, deposits] = await Promise.all([fetchQuotations(), fetchDeposits()]);
          setDocNo(nextSequentialDocId('DP', deposits.map((d) => d.id)));
          const found = allData.find(q => q.id === ref);

          if (!found) {
            setRefNotFound(true);
            showToast(`ไม่พบใบเสนอราคา ${ref} — ไม่สามารถสร้างใบมัดจำได้`, 'error');
          } else {
            setCustomerName(found.customer || '');
            setCustomerAddress(found.address || '');
            setProjectName(found.projectName || '');
            setTotalAmount(found.total || 0);
            setDepositAmount((found.total || 0) * 0.5);
          }
        } catch (e) {
          console.error(e);
          setRefNotFound(true);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (refNotFound || !refId) {
      showToast('ไม่พบใบเสนอราคาอ้างอิง — ไม่สามารถบันทึกได้', 'error');
      return;
    }
    const dataToSave = {
      id: docNo,
      date: new Date().toISOString().split('T')[0],
      refQuotation: refId,
      customer: customerName,
      address: customerAddress,
      projectName: projectName,
      description: `เงินมัดจำล่วงหน้า 50% สำหรับโครงการ ${projectName} (อ้างอิง ${refId})`,
      price: depositAmount,
      total: depositAmount,
      status: 'unpaid'
    };
    
    // Save to the main list
    const { saveDeposit, saveData } = await import('@/utils/api');
    await saveDeposit(dataToSave);
    await saveData('DocumentDrafts', {
      ...dataToSave,
      draftType: 'deposit',
      customerName,
      customerAddress,
    });
    
    showToast('สร้างใบแจ้งรับเงินมัดจำเรียบร้อยแล้ว!', 'success');
    router.push(`/quotation/deposit/details?id=${docNo}`);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/quotation/deposit" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>สร้างใบแจ้งรับเงินมัดจำ (Deposit)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>สร้างจากใบเสนอราคาอ้างอิง</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>อ้างอิงใบเสนอราคา</label>
            <input type="text" value={refId} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>เลขที่เอกสารมัดจำ</label>
            <input type="text" value={docNo} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ชื่อลูกค้า</label>
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ที่อยู่</label>
          <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ชื่องาน / โครงการ</label>
          <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ยอดเงินรวมจากใบเสนอราคา</label>
            <input type="number" value={totalAmount} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ยอดเรียกเก็บมัดจำ (ค่าเริ่มต้น 50%)</label>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            ยกเลิก
          </button>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Save size={20} /> บันทึกและสร้างเอกสาร
          </button>
        </div>
      </div>
    </div>
  );
}
