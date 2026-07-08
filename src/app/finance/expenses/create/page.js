'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchQuotations, saveExpense } from '@/utils/api';
import { useToast } from '@/components/Toast';

const CATEGORIES = ['ค่าเดินทาง', 'ค่าวัสดุอุปกรณ์', 'ค่าอาหาร/เลี้ยงรับรอง', 'ค่าจ้างแรงงาน', 'ค่าสาธารณูปโภค', 'เบ็ดเตล็ด'];

// โปรเจ็คที่ "จบแล้ว" จะมาจาก quotation ที่ status = rejected หรือ completed
// โปรเจ็คที่ "กำลังดำเนินการ" = approved / pending
const ACTIVE_STATUSES = ['approved', 'pending'];

export default function CreateExpensePage() {
  const router = useRouter();
  const showToast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ค่าเดินทาง');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      const quotations = await fetchQuotations();
      // ดึงเฉพาะโปรเจ็คที่กำลังดำเนินการ (ไม่เสร็จสิ้น)
      const active = quotations.filter(q => ACTIVE_STATUSES.includes(q.status));
      setProjects(active);
    }
    loadProjects();
  }, []);

  const selectedProject = projects.find(p => p.id === projectId);

  const handleSave = async () => {
    if (!description.trim()) { showToast('กรุณากรอกรายละเอียดค่าใช้จ่าย', 'error'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { showToast('กรุณากรอกยอดเงินให้ถูกต้อง', 'error'); return; }

    setSaving(true);
    const newId = 'EXP' + Date.now();
    const data = {
      id: newId,
      date,
      description: description.trim(),
      category,
      amount: Number(amount),
      projectId: projectId || null,
      projectName: selectedProject ? selectedProject.projectName : 'ส่วนกลาง',
      status: 'recorded'
    };
    await saveExpense(data);
    showToast('บันทึกค่าใช้จ่ายเรียบร้อยแล้ว!', 'success');
    setTimeout(() => router.push('/finance/expenses'), 1000);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/finance/expenses" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>บันทึกค่าใช้จ่ายใหม่</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>เลือกโปรเจ็คหรือไม่เลือกเพื่อบันทึกเป็นค่าใช้จ่ายส่วนกลาง</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* วันที่ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>วันที่ทำรายการ <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
          />
        </div>

        {/* รายละเอียด */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>รายละเอียดค่าใช้จ่าย <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            placeholder="เช่น ค่าน้ำมันรถ, ซื้อน้ำยาทำความสะอาด, ค่าอาหารพนักงาน..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
          />
        </div>

        {/* หมวดหมู่ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>หมวดหมู่ค่าใช้จ่าย <span style={{ color: '#ef4444' }}>*</span></label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem', backgroundColor: 'white', cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ยอดเงิน */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>ยอดเงิน (บาท) <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
          />
        </div>

        {/* เลือกโปรเจ็ค */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>ผูกกับโปรเจ็ค (ไม่บังคับ)</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem', backgroundColor: 'white', cursor: 'pointer' }}
          >
            <option value="">🏢 ส่วนกลาง / ค่าใช้จ่ายสำนักงาน (ไม่มีรหัสโครงการ)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                [{p.id}] {p.customer} — {p.projectName}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ไม่พบโปรเจ็คที่กำลังดำเนินการอยู่ในขณะนี้</p>
          )}
          {projectId && selectedProject && (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>
                📋 โปรเจ็ค: <strong>{selectedProject.projectName}</strong><br />
                👤 ลูกค้า: {selectedProject.customer}
              </p>
            </div>
          )}
        </div>

        {/* ปุ่ม */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: saving ? '#94a3b8' : 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
          >
            <Save size={20} /> {saving ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
          </button>
        </div>
      </div>
    </div>
  );
}
