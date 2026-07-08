'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Download, CreditCard, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function InvoiceDetails() {
  const showToast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [docNo, setDocNo] = useState('INV202607001');
  const [customerName, setCustomerName] = useState('บจก. อัลฟ่า เทค (สำนักงานใหญ่)');
  const [customerAddress, setCustomerAddress] = useState('99/9 ถ.สาธรเหนือ แขวงสีลม เขตบางรัก กทม 10500');
  const [description, setDescription] = useState('ค่าบริการแม่บ้านทำความสะอาดประจำ ประจำเดือนกรกฎาคม 2026 (จำนวน 1 อัตรา)');
  const [price, setPrice] = useState(6500);

  useEffect(() => {
    async function loadData() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id') || 'INV202607001';
      setDocNo(id);

      try {
        const { fetchInvoices } = await import('@/utils/api');
        const allData = await fetchInvoices();
        const found = allData.find(inv => inv.id === id);

        if (found) {
          setCustomerName(found.customer || 'ไม่ได้ระบุชื่อลูกค้า');
          setCustomerAddress(found.address || '');
          setDescription(found.description || found.projectName || '');
          setPrice(found.total ?? found.price ?? 0);
        }
      } catch (e) {
        console.error("Error loading invoice data:", e);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const { fetchInvoices, saveInvoice } = await import('@/utils/api');
      const allData = await fetchInvoices();
      const existing = allData.find(inv => inv.id === docNo) || { id: docNo };
      const updated = {
        ...existing,
        customer: customerName,
        address: customerAddress,
        description,
        total: Number(price) || 0,
        price: Number(price) || 0,
      };
      await saveInvoice(updated);
      showToast('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว!', 'success');
    } catch (e) {
      showToast('ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const subTotal = Number(price) || 0;
  const vat = subTotal * 0.07;
  const grandTotal = subTotal + vat;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/quotation/invoice" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>รายละเอียดใบวางบิล / ใบแจ้งหนี้</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{docNo} {isEditing && <span style={{ color: '#0ea5e9', fontWeight: 'bold', marginLeft: '8px' }}>(กำลังแก้ไข)</span>}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                <X size={18} /> ยกเลิก
              </button>
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                <Save size={18} /> บันทึก
              </button>
            </>
          ) : (
            <>
              <button onClick={() => {
                const url = `${window.location.origin}/share?type=invoice&id=${docNo}`;
                navigator.clipboard.writeText(url);
                showToast('คัดลอกลิงก์สำหรับส่งให้ลูกค้าเรียบร้อยแล้ว', 'success');
              }} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: 'var(--primary-dark)', border: '1px solid var(--primary-dark)', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🔗 คัดลอกลิงก์ส่งลูกค้า
              </button>
              <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Edit2 size={18} /> แก้ไขเอกสาร
              </button>
              <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                <Printer size={18} /> พิมพ์
              </button>
            </>
          )}
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
                    <h1 style={{ fontSize: '1.5rem', color: '#0ea5e9', margin: '0 0 12px 0', maxWidth: '300px', lineHeight: '1.3' }}>ใบวางบิล / ใบแจ้งหนี้ (Invoice)</h1>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>เลขที่: {docNo}</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>วันที่: 06 กรกฎาคม 2026</p>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>วันครบกำหนดชำระ: 05 สิงหาคม 2026</p>
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
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>ลูกค้า (Bill To)</h3>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', width: '100%', fontWeight: 'bold' }} />
                        <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', width: '100%' }} />
                      </div>
                    ) : (
                      <>
                        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{customerName}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{customerAddress}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>เงื่อนไขการวางบิล</h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}><strong>เครดิตการชำระเงิน:</strong> 30 วัน</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>สถานะ:</strong> <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>รอรับชำระเงิน</span></p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8' }}>
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>ลำดับ</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>รายละเอียดรายการ (Description)</th>
                      <th style={{ padding: '12px', textAlign: 'right', width: '150px' }}>จำนวนเงิน (THB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '16px 12px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {isEditing ? (
                          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', width: '100%', height: '60px', outline: 'none', resize: 'vertical' }} />
                        ) : (
                          description
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', width: '120px', textAlign: 'right' }} />
                        ) : (
                          subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ width: '50%' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>วิธีการชำระเงิน:</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      ธนาคารกสิกรไทย บัญชีกระแสรายวัน เลขที่ 123-1-12345-6 <br />
                      ชื่อบัญชี บจก. สั่งการ คลีน (กรุณาส่งใบระบุหลักฐานการโอนมาที่อีเมล accounting@sangkan.com)
                    </p>
                  </div>
                  <div style={{ width: '40%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span>รวมยอดวางบิล (Sub Total)</span>
                      <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                      <span>{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #94a3b8', fontWeight: 'bold', fontSize: '1.2rem', color: '#0ea5e9' }}>
                      <span>Grand Total</span>
                      <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Action */}
        <div style={{ marginTop: '40px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => showToast('ระบบบันทึกการรับชำระเงินและตัดยอดหนี้แล้ว', 'success')} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '12px 32px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
            <CreditCard size={20} /> บันทึกการรับชำระเงิน (ตัดหนี้สูญ/รับโอน)
          </button>
        </div>
      </div>
    </div>
  );
}
