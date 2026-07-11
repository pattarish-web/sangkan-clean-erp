'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchInvoices, fetchTaxInvoices, nextSequentialDocId } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function CreateTaxInvoicePage() {
  const router = useRouter();
  const showToast = useToast();
  const [docNo, setDocNo] = useState('');
  const [refId, setRefId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refNotFound, setRefNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setRefId(ref);
        try {
          const [allData, invoices, taxInvoices] = await Promise.all([
            fetchQuotations(),
            fetchInvoices(),
            fetchTaxInvoices(),
          ]);
          setDocNo(nextSequentialDocId('TI', taxInvoices.map((t) => t.id)));

          const inv = invoices.find((i) => i.id === ref);
          const baseRef = inv?.refQuotation || ref.replace(/^INV/, 'QT').replace(/^TI/, 'QT');
          const found = allData.find((q) => q.id === baseRef);

          if (!found && !inv) {
            setRefNotFound(true);
            showToast(`ไม่พบเอกสารอ้างอิง ${ref}`, 'error');
          } else {
            const src = inv || found;
            setCustomerName(src?.customer || found?.customer || '');
            setCustomerAddress(src?.address || found?.address || '');
            setProjectName(src?.projectName || found?.projectName || '');
            const amt = inv?.total ?? inv?.price ?? found?.total ?? 0;
            setTotalAmount(amt);
            setInvoiceAmount(amt);
          }
        } catch (e) {
          console.error(e);
          setRefNotFound(true);
        }
      } else {
        try {
          const taxInvoices = await fetchTaxInvoices();
          setDocNo(nextSequentialDocId('TI', taxInvoices.map((t) => t.id)));
        } catch (e) {
          console.error(e);
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
      refInvoice: refId,
      customer: customerName,
      address: customerAddress,
      projectName: projectName,
      description: `ชำระค่าบริการสำหรับโครงการ ${projectName} (อ้างอิง ${refId})`,
      price: invoiceAmount,
      total: invoiceAmount,
      status: 'issued'
    };
    
    // Save to the main list
    const { saveTaxInvoice, saveData } = await import('@/utils/api');
    await saveTaxInvoice(dataToSave);
    await saveData('DocumentDrafts', {
      ...dataToSave,
      draftType: 'tax-invoice',
      customerName,
      customerAddress,
    });
    
    showToast('สร้างใบเสร็จรับเงิน / ใบกำกับภาษีเรียบร้อยแล้ว!', 'success');
    router.push(`/quotation/tax-invoice/details?id=${docNo}`);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/quotation/tax-invoice" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>สร้างใบเสร็จรับเงิน / ใบกำกับภาษี</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>สร้างจากเอกสารอ้างอิง</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {refNotFound && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#991b1b' }}>
            ไม่พบใบเสนอราคาอ้างอิง — ไม่สามารถสร้างเอกสารได้
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>อ้างอิงเอกสาร</label>
            <input type="text" value={refId} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>เลขที่ใบเสร็จ</label>
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ยอดเงินรวมจากเอกสารเดิม</label>
            <input type="number" value={totalAmount} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ยอดรับชำระจริง</label>
            <input type="number" value={invoiceAmount} onChange={e => setInvoiceAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={refNotFound} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: refNotFound ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: refNotFound ? 'not-allowed' : 'pointer' }}>
            <Save size={20} /> บันทึกและสร้างเอกสาร
          </button>
        </div>
      </div>
    </div>
  );
}
