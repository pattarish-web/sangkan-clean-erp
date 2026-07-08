'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Download, CheckCircle, XCircle, Edit } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function QuotationDetails() {
  const showToast = useToast();
  const [docNo, setDocNo] = useState('QT202607003');
  const [customerName, setCustomerName] = useState('บมจ. เบต้า อินดัสทรี');
  const [customerAddress, setCustomerAddress] = useState('88/8 นิคมอุตสาหกรรมเบต้า ชลบุรี 20000');
  const [customerTaxId, setCustomerTaxId] = useState('01055xxxxxxxx');
  const [date, setDate] = useState('05 กรกฎาคม 2026');
  const [items, setItems] = useState([
    { id: 1, description: 'บริการทำความสะอาดโรงงาน (Big Cleaning) แบบครบวงจร พื้นที่ 1,500 ตรม.', qty: 1, unit: 'งาน', price: 45000 }
  ]);

  const [rawQuotation, setRawQuotation] = useState(null);
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
      const qid = params.get('id');
      if (qid) {
        setDocNo(qid);

        try {
          const allData = await fetchQuotations();
          const found = allData.find(q => q.id === qid);
          
          if (found) {
            setRawQuotation(found);
            setCustomerName(found.customer || found.customerName || 'ไม่ได้ระบุชื่อลูกค้า');
            setCustomerAddress(found.address || '');
            setCustomerTaxId(found.taxId || '');
            const formattedDate = found.date && found.date.includes('T') ? found.date.split('T')[0] : (found.date || '05 กรกฎาคม 2026');
            setDate(formattedDate);
            setItems(found.items || []);
          }
        } catch (e) {
          console.error("Error fetching data", e);
        }
      }
    }
    loadData();
  }, []);

  const safeItems = Array.isArray(items) ? items : [];
  const calculatedSubTotal = safeItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  const subTotal = calculatedSubTotal || Number(rawQuotation?.subTotal || rawQuotation?.total || 0);
  const vat = calculatedSubTotal ? (subTotal * 0.07) : Number(rawQuotation?.vat || 0);
  const grandTotal = calculatedSubTotal ? (subTotal + vat) : Number(rawQuotation?.total || 0);

  const handleUpdateStatus = async (newStatus) => {
    if (!rawQuotation) return;
    const updated = { ...rawQuotation, status: newStatus };
    try {
      const { saveQuotation } = await import('@/utils/api');
      await saveQuotation(updated);
      setRawQuotation(updated);
      showToast(newStatus === 'approved' ? 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว' : 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว', newStatus === 'approved' ? 'success' : 'warning');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการบันทึกสถานะ', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/quotation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
             <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>รายละเอียดใบเสนอราคา</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{docNo}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => {
            const url = `${window.location.origin}/share?type=quotation&id=${docNo}`;
            navigator.clipboard.writeText(url);
            showToast('คัดลอกลิงก์สำหรับส่งให้ลูกค้าเรียบร้อยแล้ว', 'success');
          }} style={{ backgroundColor: 'white', color: 'var(--primary-dark)', border: '1px solid var(--primary-dark)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
            🔗 คัดลอกลิงก์ส่งลูกค้า
          </button>
          <Link href={`/quotation/create?edit=true&id=${docNo}`} style={{ backgroundColor: 'white', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
            <Edit size={18} /> แก้ไขเอกสาร
          </Link>
          <button onClick={handlePrintWithoutPhotos} style={{ backgroundColor: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <Printer size={18} /> พิมพ์เฉพาะใบเสนอราคา
          </button>
          {rawQuotation?.sitePhotos && rawQuotation.sitePhotos.length > 0 && (
            <button onClick={handlePrintWithPhotos} style={{ backgroundColor: '#f0f9ff', color: 'var(--primary-dark)', border: '1px solid var(--primary-color)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
              📸 พิมพ์ใบเสนอราคา + รูปสำรวจ
            </button>
          )}
          <button onClick={() => showToast('กำลังดาวน์โหลดเอกสาร PDF...', 'info')} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <Download size={18} /> ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      {/* Document View */}
      <div className="print-area" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        {/* ใช้โครงสร้างตารางหลักเพื่อสั่งพิมพ์หัวกระดาษซ้ำทุกหน้า */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <thead style={{ display: 'table-header-group' }}>
            <tr>
              <td style={{ border: 'none', padding: 0 }}>
                {/* Header */}
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
                    <h1 style={{ fontSize: '1.8rem', color: '#0ea5e9', margin: '0 0 12px 0', maxWidth: '300px', lineHeight: '1.3' }}>ใบเสนอราคา (Quotation)</h1>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>เลขที่: {docNo}</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>วันที่: {date}</p>
                  </div>
                </div>
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={{ border: 'none', padding: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px', marginTop: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>เสนอราคาให้ลูกค้า (Customer)</h3>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{customerName}</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{customerAddress}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>เลขผู้เสียภาษี: {customerTaxId}</p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>เงื่อนไข (Conditions)</h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}><strong>กำหนดยืนราคา:</strong> 30 วัน</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>กำหนดชำระเงิน:</strong> เครดิต 30 วัน</p>
                  </div>
                </div>

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
                    {safeItems.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '16px 12px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{item.description}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ width: '50%' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>หมายเหตุ:</p>
                    {rawQuotation && (rawQuotation.note || rawQuotation.remarks) ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {rawQuotation.note || rawQuotation.remarks}
                      </p>
                    ) : (
                      <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
                        <li>ราคานี้รวมค่าอุปกรณ์และน้ำยาทำความสะอาดแล้ว</li>
                        <li>หากมีการเพิ่มพื้นที่หน้างาน จะคิดราคาเพิ่มตารางเมตรละ 30 บาท</li>
                      </ul>
                    )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #94a3b8', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-dark)' }}>
                      <span>จำนวนเงินสุทธิ (Grand Total)</span>
                      <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* พื้นที่ลงนามผู้เสนอราคาและผู้รับบริการ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', textAlign: 'center' }}>
                  <div style={{ width: '40%' }}>
                    <div style={{ borderBottom: '1px dashed var(--border-color)', marginBottom: '12px', height: '40px' }}></div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>ผู้รับเอกสาร / ผู้สั่งจ้าง (Customer)</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>วันที่: _____/_____/_____</p>
                  </div>
                  <div style={{ width: '40%' }}>
                    <div style={{ borderBottom: '1px dashed var(--border-color)', marginBottom: '12px', height: '40px' }}></div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>ผู้มีอำนาจลงนาม / ผู้เสนอราคา (Authorized Signature)</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>บริษัท สั่งการ คลีน จำกัด</p>
                  </div>
                </div>

                {/* รูปภาพสำรวจหน้างานแนบท้ายใบเสนอราคา */}
                {rawQuotation && rawQuotation.sitePhotos && rawQuotation.sitePhotos.length > 0 && (
                  <div className={showPhotosInPrint ? '' : 'no-print'} style={{ marginTop: '40px', borderTop: '2px solid var(--border-color)', paddingTop: '20px', pageBreakBefore: 'always' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>📷 รูปภาพสำรวจหน้างานแนบท้ายเอกสาร (Attached Site Survey Photos)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                      {rawQuotation.sitePhotos.map((photo, index) => (
                        <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                          <img src={photo} alt={`Site Survey Attached ${index + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                          <div style={{ padding: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                            รูปภาพที่ {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Action Buttons for Pending State */}
        {rawQuotation && rawQuotation.status === 'pending' && (
          <div className="no-print" style={{ marginTop: '40px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => handleUpdateStatus('approved')} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', padding: '12px 32px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
              <CheckCircle size={20} /> อนุมัติใบเสนอราคานี้
            </button>
            <button onClick={() => handleUpdateStatus('rejected')} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#ef4444', padding: '12px 32px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #ef4444', cursor: 'pointer', fontSize: '1.1rem' }}>
              <XCircle size={20} /> ปฏิเสธ (ลูกค้าไม่ทำ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
