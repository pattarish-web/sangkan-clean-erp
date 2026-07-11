'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DepositReceiptHistory() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { fetchDeposits } = await import('@/utils/api');
        const data = await fetchDeposits();
        const paid = (data || []).filter((d) => d.status === 'paid' || d.receiptIssued);
        setReceipts(
          paid.map((d) => ({
            id: d.receiptId || `DR${d.id.replace(/^DP/, '')}`,
            date: d.receiptDate || d.paidDate || d.date,
            refDeposit: d.id,
            customer: d.customer,
            total: d.total ?? d.price ?? 0,
            status: 'issued',
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'issued':
        return { bg: '#dcfce7', color: '#166534', label: 'ออกเอกสารแล้ว' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#991b1b', label: 'ยกเลิก' };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: 'ไม่ทราบสถานะ' };
    }
  };

  const filtered = receipts.filter(
    (q) =>
      q.id.includes(searchQuery) ||
      (q.customer || '').includes(searchQuery) ||
      (q.refDeposit || '').includes(searchQuery)
  );

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
            ประวัติใบเสร็จรับมัดจำ
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>แสดงใบมัดจำที่รับชำระแล้ว (ออกใบเสร็จจากหน้ารายละเอียดใบมัดจำ)</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={20}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่เอกสาร หรือชื่อลูกค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.95rem',
              }}
            />
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
            }}
          >
            <Filter size={20} /> ตัวกรอง
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <FileSignature size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>ยังไม่มีใบเสร็จรับมัดจำ — บันทึกการรับชำระจากหน้าใบแจ้งรับมัดจำก่อน</p>
            <Link
              href="/quotation/deposit"
              style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary-color)', fontWeight: '600' }}
            >
              ไปที่ใบแจ้งรับมัดจำ →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  เลขที่เอกสาร
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  อ้างอิงใบแจ้งรับมัดจำ
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  ลูกค้า
                </th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  ยอดมัดจำ (บาท)
                </th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  สถานะ
                </th>
                <th style={{ padding: '16px', width: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const status = getStatusStyle(q.status);
                return (
                  <tr
                    key={q.id}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => router.push(`/quotation/deposit/details?id=${q.refDeposit}`)}
                  >
                    <td style={{ padding: '16px', fontWeight: '500', color: 'var(--primary-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSignature size={16} />
                        {q.id}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{q.refDeposit}</td>
                    <td style={{ padding: '16px' }}>{q.customer}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>{q.total.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: status.bg,
                          color: status.color,
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
