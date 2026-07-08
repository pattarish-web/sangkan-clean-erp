'use client';

import React, { useState, useEffect } from 'react';
import { fetchQuotations, fetchData } from '@/utils/api';

export default function SharePage() {
  const [docType, setDocType] = useState('quotation');
  const [docId, setDocId] = useState('');
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotosInPrint, setShowPhotosInPrint] = useState(true);

  const handlePrintWithoutPhotos = () => {
    setShowPhotosInPrint(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setShowPhotosInPrint(true);
      }, 1000);
    }, 100);
  };

  const handlePrintWithPhotos = () => {
    setShowPhotosInPrint(true);
    setTimeout(() => {
      window.print();
    }, 100);
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
        const allData = await fetchQuotations();
        
        let qtId = id;
        if (type === 'deposit') qtId = id.replace('DP', 'QT');
        if (type === 'invoice') qtId = id.replace('INV', 'QT');
        if (type === 'tax-invoice') qtId = id.replace('TI', 'QT');

        let found = allData.find(q => q.id === qtId);
        
        // Fallback for mock data testing if not found in Database
        if (!found) {
          found = {
            id: qtId,
            customer: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
            address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
            date: '2026-07-03',
            items: [
              { description: 'บริการทำความสะอาด (Big Cleaning)', qty: 1, price: 6500 }
            ],
            total: 6500
          };
        }

        const drafts = await fetchData('DocumentDrafts');

        if (type === 'deposit') {
          const parsed = drafts.find(d => d.id === id && d.draftType === 'deposit');
          if (parsed) {
            found.customer = parsed.customerName || parsed.customer || found.customer;
            found.address = parsed.customerAddress || parsed.address || found.address;
            found.total = parsed.price * 2;
            found.projectName = parsed.description?.split('โครงการ ')[1]?.split(' (')[0] || parsed.projectName || '';
          }
        } else if (type === 'invoice') {
          const parsed = drafts.find(d => d.id === id && d.draftType === 'invoice');
          if (parsed) {
            found.customer = parsed.customerName || parsed.customer || found.customer;
            found.address = parsed.customerAddress || parsed.address || found.address;
            found.total = parsed.price;
            found.projectName = parsed.description?.split('โครงการ ')[1]?.split(' (')[0] || parsed.projectName || '';
          }
        } else if (type === 'tax-invoice') {
          const parsed = drafts.find(d => d.id === id && d.draftType === 'tax-invoice');
          if (parsed) {
            found.customer = parsed.customerName || parsed.customer || found.customer;
            found.address = parsed.customerAddress || parsed.address || found.address;
            found.total = parsed.price;
            found.projectName = parsed.description?.split('โครงการ ')[1]?.split(' (')[0] || parsed.projectName || '';
          }
        }

        setDocData(found);
      } catch (e) {
        console.error("Error loading shared document:", e);
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

  // Calculate totals based on document type
  let subTotal = 0;
  let vat = 0;
  let grandTotal = 0;
  let descriptionText = '';
  
  if (docType === 'quotation') {
    subTotal = docData.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
  } else if (docType === 'deposit') {
    subTotal = (docData.total || 0) * 0.5;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
    descriptionText = `เงินมัดจำล่วงหน้า 50% สำหรับโครงการ ${docData.projectName || ''} (อ้างอิง ${docData.id})`;
  } else {
    // Invoice and Tax Invoice
    subTotal = docData.total || 0;
    vat = subTotal * 0.07;
    grandTotal = subTotal + vat;
    descriptionText = `ค่าบริการสำหรับโครงการ ${docData.projectName || ''} (อ้างอิง ${docData.id})`;
  }

  const getDocTitle = () => {
    switch (docType) {
      case 'deposit': return 'ใบแจ้งรับเงินมัดจำ (Deposit Invoice)';
      case 'invoice': return 'ใบแจ้งหนี้ / ใบวางบิล (Invoice)';
      case 'tax-invoice': return 'ใบเสร็จรับเงิน / ใบกำกับภาษี (Tax Invoice / Receipt)';
      default: return 'ใบเสนอราคา (Quotation)';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Document Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <img src="/logo.png" alt="Sangkan Clean Logo" style={{ width: '150px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ color: 'var(--primary-dark)', margin: '0 0 8px 0', fontSize: '1.6rem' }}>บริษัท สั่งการ คลีน จำกัด</h2>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม 10110</p>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>โทร: 02-123-4567 | แท็กซ์: 01055xxxxxxxx</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '20px' }}>
          <h1 style={{ fontSize: '1.5rem', color: docType === 'tax-invoice' ? '#10b981' : 'var(--text-main)', margin: '0 0 12px 0', maxWidth: '300px', lineHeight: '1.3' }}>{getDocTitle()}</h1>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>เลขที่:</span>
            <span style={{ fontWeight: 'bold' }}>{docId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>วันที่:</span>
            <span style={{ color: 'var(--text-muted)' }}>{docData.date || 'ไม่ระบุวันที่'}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 12px 0', color: 'var(--primary-dark)' }}>ลูกค้า (Customer):</p>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{docData.customer || 'ไม่ได้ระบุชื่อลูกค้า'}</p>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>{docData.address || '-'}</p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>เลขประจำตัวผู้เสียภาษี: {docData.taxId || '-'}</p>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8' }}>
            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>ลำดับ</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>รายละเอียด (Description)</th>
            <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>จำนวน</th>
            <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>ราคา/หน่วย</th>
            <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {docType === 'quotation' ? (
            docData.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '16px 12px', whiteSpace: 'pre-line' }}>{item.description}</td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>{item.qty}</td>
                <td style={{ padding: '16px 12px', textAlign: 'right' }}>{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '16px 12px', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))
          ) : (
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '16px 12px', textAlign: 'center' }}>1</td>
              <td style={{ padding: '16px 12px' }}>{descriptionText}</td>
              <td style={{ padding: '16px 12px', textAlign: 'center' }}>1</td>
              <td style={{ padding: '16px 12px', textAlign: 'right' }}>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: '16px 12px', textAlign: 'right' }}>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '50%' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>หมายเหตุ:</p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
            <li>เอกสารฉบับนี้สร้างโดยระบบอัตโนมัติ</li>
            {docType === 'quotation' && <li>กรุณาชำระเงินมัดจำ 50% เพื่อยืนยันการเริ่มงาน</li>}
            {docType !== 'quotation' && <li>กรุณาชำระเงินภายใน 7 วัน นับจากวันที่บนเอกสาร</li>}
          </ul>
        </div>
        <div style={{ width: '40%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
            <span>รวมเป็นเงิน (Sub Total)</span>
            <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
            <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
            <span>{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #94a3b8', fontWeight: 'bold', fontSize: '1.2rem', color: docType === 'tax-invoice' ? '#10b981' : 'var(--primary-dark)' }}>
            <span>จำนวนเงินสุทธิ (Grand Total)</span>
            <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Signature Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', textAlign: 'center' }}>
        <div style={{ width: '40%' }}>
          <div style={{ borderBottom: '1px dashed var(--border-color)', marginBottom: '12px', height: '40px' }}></div>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>ผู้รับเอกสาร / ผู้ชำระเงิน</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>วันที่: _____/_____/_____</p>
        </div>
        <div style={{ width: '40%' }}>
          <div style={{ borderBottom: '1px dashed var(--border-color)', marginBottom: '12px', height: '40px' }}></div>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>ผู้มีอำนาจลงนาม / ผู้รับเงิน</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>บริษัท สั่งการ คลีน จำกัด</p>
        </div>
      </div>

      {/* รูปภาพสำรวจหน้างานแนบท้ายเอกสาร */}
      {docData && docData.sitePhotos && docData.sitePhotos.length > 0 && (
        <div className={showPhotosInPrint ? '' : 'no-print'} style={{ marginTop: '40px', borderTop: '2px solid var(--border-color)', paddingTop: '20px', pageBreakBefore: 'always' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', fontWeight: '600' }}>📷 รูปภาพสำรวจหน้างานแนบท้ายเอกสาร (Attached Site Survey Photos)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {docData.sitePhotos.map((photo, index) => (
              <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <img src={photo} alt={`Site Survey Attached ${index + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                <div style={{ padding: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                  รูปภาพที่ {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Help Banner (Non-printable) */}
      <div className="no-print" style={{ marginTop: '40px', padding: '16px', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '8px', border: '1px solid #fcd34d', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>💡 เคล็ดลับการพิมพ์ (Print)</p>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem' }}>เอกสารนี้จัดรูปแบบมาเพื่อพิมพ์บนกระดาษ A4 กรุณากดปุ่มพิมพ์ (Ctrl+P) ในเบราว์เซอร์ของคุณ</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button onClick={handlePrintWithoutPhotos} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            🖨️ พิมพ์เฉพาะใบเสนอราคา
          </button>
          {docData?.sitePhotos && docData.sitePhotos.length > 0 && (
            <button onClick={handlePrintWithPhotos} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              📸 พิมพ์ใบเสนอราคา + รูปสำรวจ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
