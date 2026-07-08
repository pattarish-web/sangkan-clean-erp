'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, MoreHorizontal, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoiceHistory() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { fetchInvoices, fetchQuotations } = await import('@/utils/api');
      
      const invData = await fetchInvoices();
      if (invData && invData.length > 0) {
        setInvoices(invData);
      }

      const qtData = await fetchQuotations();
      if (qtData && qtData.length > 0) {
        setQuotations(qtData);
      }
    }
    loadData();
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'paid': return { bg: '#dcfce7', color: '#166534', label: 'ชำระแล้ว' };
      case 'unpaid': return { bg: '#fef9c3', color: '#854d0e', label: 'รอชำระเงิน' };
      case 'overdue': return { bg: '#fee2e2', color: '#991b1b', label: 'เกินกำหนด' };
      default: return { bg: '#f1f5f9', color: '#475569', label: 'ไม่ทราบสถานะ' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>ประวัติใบวางบิล/ใบแจ้งหนี้</h1>
          <p style={{ color: 'var(--text-muted)' }}>จัดการเอกสารเรียกเก็บเงินจากลูกค้า</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}>
          <Plus size={20} />
          สร้างใบแจ้งหนี้ใหม่
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาตามเลขที่เอกสาร หรือชื่อลูกค้า..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}>
            <Filter size={20} /> ตัวกรอง
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>วันที่</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>เลขที่เอกสาร</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ชื่อลูกค้า/ชื่อโปรเจ็ค</th>
              <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ยอดรวมสุทธิ</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>สถานะ</th>
              <th style={{ padding: '16px', width: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter(q => q.id.includes(searchQuery) || (q.customer || '').includes(searchQuery) || (q.projectName || '').includes(searchQuery)).map(q => {
              const status = getStatusStyle(q.status);
              return (
                <tr 
                  key={q.id} 
                  onClick={() => router.push(`/quotation/invoice/details?id=${q.id}`)}
                  style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} 
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} 
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>{q.date ? q.date.split('T')[0].split('-').reverse().join('-') : '-'}</td>
                  <td style={{ padding: '16px', fontWeight: '500', color: 'var(--primary-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} />
                      {q.id}
                    </div>
                    {q.refQuotation && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '24px' }}>
                        อ้างอิง: {q.refQuotation}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--text-main)' }}>{q.customer || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{q.projectName || 'ไม่ได้ระบุชื่อโปรเจกต์'}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>{(q.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500' }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                      <button style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <MoreHorizontal size={20} />
                      </button>
                      <div className="action-menu-dropdown" style={{
                        display: 'none',
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        padding: '8px 0',
                        minWidth: '200px',
                        zIndex: 10
                      }}>
                        {q.status === 'unpaid' && (
                          <>
                            <Link href={`/quotation/tax-invoice/create?ref=${q.id}`} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', textAlign: 'left', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              สร้างใบเสร็จ / ใบกำกับภาษี
                            </Link>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>
                          </>
                        )}
                        <Link href={`/quotation/invoice/details?id=${q.id}`} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', textAlign: 'left', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>ดูรายละเอียด</Link>
                      </div>
                      <style>{`
                        .action-menu-container:hover .action-menu-dropdown {
                          display: block !important;
                        }
                      `}</style>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
