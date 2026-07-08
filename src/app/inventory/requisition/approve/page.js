'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { CheckCircle, XCircle, ArrowLeft, BarChart2, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

function GMApproveRequisitionContent() {
  const showToast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prId = searchParams.get('id');

  const [comment, setComment] = useState('');
  const [reqData, setReqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!prId) {
        setLoading(false);
        return;
      }
      try {
        const all = await fetchData('PurchaseRequests');
        const found = all.find(pr => pr.id === prId);
        setReqData(found || null);
        if (found?.managerComment) {
          setComment(found.managerComment);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prId]);

  const handleApprove = async () => {
    if (!reqData) return;
    setSaving(true);
    try {
      const updated = { ...reqData, status: 'approved', managerComment: comment, approvedAt: new Date().toISOString().split('T')[0] };
      await saveData('PurchaseRequests', updated);
      showToast(`อนุมัติใบขอเบิก ${reqData.id} สำเร็จ! ระบบได้ส่งใบขอเบิกไปยังฝ่ายจัดซื้อเรียบร้อยแล้ว`, 'success');
      router.push('/inventory/requisition');
    } catch (e) {
      showToast('บันทึกการอนุมัติไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!reqData) return;
    setSaving(true);
    try {
      const updated = { ...reqData, status: 'rejected', managerComment: comment || 'ไม่มีคอมเมนต์เพิ่มเติม' };
      await saveData('PurchaseRequests', updated);
      showToast(`ได้ส่งข้อความตีกลับใบเบิก ${reqData.id} ไปยังสายตรวจแล้ว`, 'warning');
      router.push('/inventory/requisition');
    } catch (e) {
      showToast('บันทึกการตีกลับไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดใบเบิก...</div>;
  }

  if (!prId || !reqData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>ไม่พบใบเบิกที่ระบุ หรือยังไม่ได้เลือกรายการ</p>
        <Link href="/inventory/requisition" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>← กลับรายการใบเบิก</Link>
      </div>
    );
  }

  const items = reqData.items || [];
  const totalCost = items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  const headcount = reqData.headcount || 1;
  const costPerHead = totalCost / headcount;
  const targetCostPerHead = 450;
  const isOverBudget = costPerHead > targetCostPerHead;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/inventory/requisition" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>อนุมัติใบเบิกสินค้า (ระดับผู้จัดการ)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>รหัส: {reqData.id} | โปรเจกต์: {reqData.project}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              รายการสินค้าที่ขอเบิก
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontWeight: '500' }}>สินค้า</th>
                  <th style={{ padding: '12px', fontWeight: '500', textAlign: 'center' }}>จำนวน</th>
                  <th style={{ padding: '12px', fontWeight: '500', textAlign: 'right' }}>ต้นทุน/หน่วย</th>
                  <th style={{ padding: '12px', fontWeight: '500', textAlign: 'right' }}>รวม</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: '500', color: 'var(--text-main)' }}>{item.name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>{item.qty} {item.unit}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>฿{(item.price || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>฿{((item.price || 0) * (item.qty || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td colSpan={3} style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>รวมมูลค่าเบิกทั้งหมด:</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>฿{totalCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} /> คอมเมนต์ตอบกลับสายตรวจ (กรณีตีกลับให้แก้ไข)
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุเหตุผล เช่น 'กระดาษชำระขอเยอะเกินไป ให้ลดลงครึ่งนึง'"
              style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)' }}>
              <BarChart2 size={24} /> วิเคราะห์ต้นทุน
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>จำนวนแม่บ้านในไซต์:</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{headcount} คน</span>
            </div>

            {reqData.inspector && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>สายตรวจ:</span>
                <span style={{ fontWeight: '500' }}>{reqData.inspector}</span>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>ต้นทุนเฉลี่ยต่อหัว (Cost per Head):</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: isOverBudget ? '#ef4444' : '#10b981', lineHeight: '1' }}>฿{costPerHead.toFixed(2)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', paddingBottom: '4px' }}>/ คน</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>เป้าหมายบริษัท (ต่อเดือน):</span>
                <span style={{ fontWeight: '500' }}>฿{targetCostPerHead.toFixed(2)}</span>
              </div>

              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((costPerHead / targetCostPerHead) * 100, 100)}%`,
                  backgroundColor: isOverBudget ? '#ef4444' : '#10b981',
                  transition: 'width 0.5s ease-in-out'
                }} />
              </div>

              {isOverBudget && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', color: '#ef4444', fontSize: '0.85rem', alignItems: 'center' }}>
                  <AlertCircle size={16} /> ต้นทุนต่อหัวสูงกว่าเกณฑ์ที่ตั้งไว้
                </div>
              )}
            </div>
          </div>

          {reqData.status === 'pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleApprove}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <CheckCircle size={20} /> อนุมัติใบเบิก (ส่งไปจัดซื้อ)
              </button>
              <button
                onClick={handleReject}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <XCircle size={20} /> ตีกลับให้สายตรวจแก้ไข
              </button>
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: reqData.status === 'approved' ? '#dcfce7' : '#fef2f2', color: reqData.status === 'approved' ? '#166534' : '#991b1b', fontWeight: 'bold', textAlign: 'center' }}>
              สถานะ: {reqData.status === 'approved' ? 'อนุมัติแล้ว' : 'ตีกลับแล้ว'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GMApproveRequisition() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลด...</div>}>
      <GMApproveRequisitionContent />
    </Suspense>
  );
}
