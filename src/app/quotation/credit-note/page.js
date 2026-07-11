'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, FileText, X } from 'lucide-react';
import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function CreditNoteHistory() {
  const showToast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docTotal, setDocTotal] = useState('');
  const [refDoc, setRefDoc] = useState('');

  const loadData = async () => {
    try {
      const [cnData, custs] = await Promise.all([
        fetchData('CreditNotes'),
        fetchData('Customers')
      ]);
      setDocs(cnData || []);
      setCustomers(custs || []);
      if (custs && custs.length > 0) {
        setSelectedCustomer(custs[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      await loadData();
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (!ref) return;

      setRefDoc(ref);
      setIsModalOpen(true);

      try {
        const { fetchTaxInvoices, fetchInvoices } = await import('@/utils/api');
        const [taxInvoices, invoices] = await Promise.all([fetchTaxInvoices(), fetchInvoices()]);
        const ti = taxInvoices.find((t) => t.id === ref);
        const inv = invoices.find((i) => i.id === ref);
        const src = ti || inv;
        if (src) {
          if (src.customer) setSelectedCustomer(src.customer);
          const amt = src.total ?? src.price ?? 0;
          if (amt) setDocTotal(String(amt));
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('กรุณาเลือกชื่อลูกค้า', 'error');
      return;
    }
    if (!docTotal || isNaN(Number(docTotal)) || Number(docTotal) <= 0) {
      showToast('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'error');
      return;
    }

    const now = new Date(docDate);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `CN${year}${month}`;
    
    const thisMonthNums = docs
      .map(d => d.id)
      .filter(id => id && id.startsWith(prefix))
      .map(id => parseInt(id.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));
      
    let nextNum = 1;
    if (thisMonthNums.length > 0) {
      nextNum = Math.max(...thisMonthNums) + 1;
    }
    const docId = `${prefix}${nextNum.toString().padStart(3, '0')}`;

    const newDoc = {
      id: docId,
      date: docDate,
      customer: selectedCustomer,
      refInvoice: refDoc || 'ไม่มีการอ้างอิง',
      total: Number(docTotal),
      status: 'issued'
    };

    try {
      const updated = [...docs, newDoc];
      await saveData('CreditNotes', newDoc);
      setDocs(updated);
      setIsModalOpen(false);
      setDocTotal('');
      setRefDoc('');
      showToast(`สร้างใบลดหนี้ ${docId} เรียบร้อยแล้ว!`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'issued': return { bg: '#dcfce7', color: '#166534', label: 'ลดหนี้แล้ว' };
      case 'cancelled': return { bg: '#fee2e2', color: '#991b1b', label: 'ยกเลิก' };
      default: return { bg: '#f1f5f9', color: '#475569', label: 'ลดหนี้แล้ว' };
    }
  };

  const filtered = docs.filter(q =>
    (q.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.refInvoice || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>ประวัติใบลดหนี้ (Credit Note)</h1>
          <p style={{ color: 'var(--text-muted)' }}>จัดการเอกสารขอลดหนี้/คืนเงินให้ลูกค้าจากการบริการคลาดเคลื่อน</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}>
          <Plus size={20} />
          สร้างใบลดหนี้ใหม่
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาตามเลขที่เอกสาร, ชื่อลูกค้า หรืออ้างอิง..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลใบลดหนี้...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>เลขที่เอกสาร</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>อ้างอิงเอกสารเดิม</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ลูกค้า</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ยอดรวม (บาท)</th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => {
                const status = getStatusStyle(q.status);
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--primary-color)', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} />
                        {q.id}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{q.refInvoice}</td>
                    <td style={{ padding: '16px' }}>{q.customer}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>-{(q.total || 0).toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ไม่พบข้อมูลใบลดหนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================== Modal: สร้างใบลดหนี้ใหม่ ==================== */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreate} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>สร้างใบลดหนี้ใหม่</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ลูกค้า *</label>
                {customers.length > 0 ? (
                  <select 
                    value={selectedCustomer} 
                    onChange={e => setSelectedCustomer(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="กรอกชื่อลูกค้า..." 
                    value={selectedCustomer} 
                    onChange={e => setSelectedCustomer(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                    required
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>อ้างอิงใบแจ้งหนี้/ใบวางบิลเดิม</label>
                <input 
                  type="text" 
                  placeholder="เช่น INV202607001" 
                  value={refDoc} 
                  onChange={e => setRefDoc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>วันที่ทำรายการ *</label>
                <input 
                  type="date" 
                  value={docDate} 
                  onChange={e => setDocDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ยอดเงินลดหนี้ (บาท) *</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={docTotal} 
                  onChange={e => setDocTotal(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกรายการ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
