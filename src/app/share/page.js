'use client';

import React, { useState, useEffect } from 'react';
import { mergeCompanyProfile, defaultBank } from '@/lib/company-profile';

export default function SharePage() {
  const [profile, setProfile] = useState(() => mergeCompanyProfile(null));
  const bank = defaultBank(profile);
  const [docType, setDocType] = useState('quotation');
  const [docId, setDocId] = useState('');
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotosInPrint, setShowPhotosInPrint] = useState(true);

  const handlePrintWithoutPhotos = () => {
    setShowPhotosInPrint(false);
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => setShowPhotosInPrint(true), 500);
    });
  };

  const handlePrintWithPhotos = () => {
    setShowPhotosInPrint(true);
    requestAnimationFrame(() => window.print());
  };

  useEffect(() => {
    async function loadData() {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') || 'quotation';
      const id = params.get('id');

      if (!id) {
        setLoading(false);
        return;
      }

      setDocType(type);
      setDocId(id);

      try {
        const res = await fetch(`/api/share?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.doc) {
          setDocData(data.doc);
          if (data.companyProfile) setProfile(mergeCompanyProfile(data.companyProfile));
        } else {
          setDocData(null);
        }
      } catch (e) {
        console.error('Error loading shared document:', e);
        setDocData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>กำลังโหลดเอกสาร...</div>;
  }

  if (!docData) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'red' }}>ไม่พบเอกสารนี้ในระบบ หรือลิงก์หมดอายุแล้ว</div>;
  }

  let subTotal = 0;
  let vat = 0;
  let grandTotal = 0;
  let descriptionText = '';

  if (docType === 'quotation') {
    subTotal = docData.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || docData.total || 0;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
  } else if (docType === 'deposit') {
    subTotal = docData.total || 0;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
    descriptionText = `เงินมัดจำล่วงหน้า 50% สำหรับโครงการ ${docData.projectName || ''} (อ้างอิง ${docId})`;
  } else {
    subTotal = docData.total || 0;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
    descriptionText = `ค่าบริการสำหรับโครงการ ${docData.projectName || ''}`;
  }

  const getDocTitle = () => {
    switch (docType) {
      case 'deposit': return 'ใบแจ้งรับเงินมัดจำ (Deposit Invoice)';
      case 'invoice': return 'ใบวางบิล / ใบแจ้งหนี้ (Invoice)';
      case 'tax-invoice': return 'ใบเสร็จรับเงิน / ใบกำกับภาษี (Tax Invoice)';
      default: return 'ใบเสนอราคา (Quotation)';
    }
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} className="print-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
          <div>
            <img src="/logo.png" alt="Logo" style={{ width: '140px', marginBottom: '12px' }} />
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--primary-dark)' }}>{profile.name}</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{profile.address}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>โทร: {profile.phone} | แฟกซ์: {profile.fax} | เลขผู้เสียภาษี: {profile.taxId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '1.4rem', color: '#0ea5e9', margin: '0 0 8px 0' }}>{getDocTitle()}</h1>
            <p style={{ margin: 0, fontWeight: 'bold' }}>เลขที่: {docId}</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>ลูกค้า</h3>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{docData.customer}</p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{docData.address}</p>
        </div>

        {docType === 'quotation' && docData.items ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>รายละเอียด</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {docData.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', whiteSpace: 'pre-line' }}>{item.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ marginBottom: '24px', lineHeight: 1.6 }}>{descriptionText || docData.projectName}</p>
        )}

        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <p>Sub Total: {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p>VAT 7%: {vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#0ea5e9' }}>Grand Total: {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ชำระเงินผ่าน {bank.name} เลขที่ {bank.accNo} ชื่อบัญชี {bank.accName}
        </p>

        {showPhotosInPrint && docData.sitePhotos?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h4>รูปหน้างาน</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {docData.sitePhotos.map((p, i) => (
                <img key={i} src={typeof p === 'string' ? p : p.url} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '900px', margin: '24px auto 0', display: 'flex', gap: '12px', justifyContent: 'center' }} className="no-print">
        <button onClick={handlePrintWithPhotos} style={{ padding: '12px 24px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>พิมพ์ / บันทึก PDF</button>
        <button onClick={handlePrintWithoutPhotos} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>พิมพ์ไม่รวมรูป</button>
      </div>
    </div>
  );
}
