'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, DollarSign, TrendingDown, Briefcase, Filter } from 'lucide-react';
import { fetchExpenses } from '@/utils/api';

const CATEGORIES = ['ทั้งหมด', 'ค่าเดินทาง', 'ค่าวัสดุอุปกรณ์', 'ค่าอาหาร/เลี้ยงรับรอง', 'ค่าจ้างแรงงาน', 'ค่าสาธารณูปโภค', 'เบ็ดเตล็ด'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ทั้งหมด');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchExpenses();
      setExpenses(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = expenses.filter(e =>
    (filterCategory === 'ทั้งหมด' || e.category === filterCategory) &&
    ((e.description || '').includes(searchQuery) || (e.projectName || '').includes(searchQuery) || (e.category || '').includes(searchQuery))
  );

  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const projectExpenses = filtered.filter(e => e.projectId).reduce((sum, e) => sum + (e.amount || 0), 0);
  const centralExpenses = filtered.filter(e => !e.projectId).reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryColors = {
    'ค่าเดินทาง': { bg: '#dbeafe', color: '#1e40af' },
    'ค่าวัสดุอุปกรณ์': { bg: '#dcfce7', color: '#166534' },
    'ค่าอาหาร/เลี้ยงรับรอง': { bg: '#fef9c3', color: '#854d0e' },
    'ค่าจ้างแรงงาน': { bg: '#f3e8ff', color: '#6b21a8' },
    'ค่าสาธารณูปโภค': { bg: '#ffedd5', color: '#9a3412' },
    'เบ็ดเตล็ด': { bg: '#f1f5f9', color: '#475569' },
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>การเงินและค่าใช้จ่าย (Finance)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ติดตามค่าใช้จ่าย ตรวจรับงบวางบิล และวิเคราะห์คอมมิชชัน</p>
          
          {/* แถบลิงก์การเงินเพิ่มเติม */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <Link href="/finance/profitability" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📊 วิเคราะห์กำไร & ค่าคอม
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Link href="/finance/billing" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🧾 3. ตรวจสอบงบ & จัดชุดวางบิล (Workflow)
            </Link>
          </div>
        </div>
        <Link href="/finance/expenses/create" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
          <Plus size={20} /> บันทึกค่าใช้จ่ายใหม่
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <TrendingDown size={24} color="#ef4444" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ค่าใช้จ่ายรวม</span>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Briefcase size={24} color="#f59e0b" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ค่าใช้จ่ายตามโปรเจ็ค</span>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>฿{projectExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #6b7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <DollarSign size={24} color="#6b7280" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ค่าใช้จ่ายส่วนกลาง</span>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>฿{centralExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="ค้นหารายการค่าใช้จ่าย..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white', cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>วันที่</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>รายการ</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>หมวดหมู่</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>โปรเจ็ค</th>
              <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ยอดเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((exp, idx) => {
              const catStyle = categoryColors[exp.category] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {exp.date ? exp.date.split('-').reverse().join('-') : '-'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '500', maxWidth: '320px' }}>
                    {exp.description || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ backgroundColor: catStyle.bg, color: catStyle.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {exp.category || 'เบ็ดเตล็ด'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {exp.projectId ? (
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '500' }}>{exp.projectId}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.projectName}</div>
                      </div>
                    ) : (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#6b7280', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>ส่วนกลาง</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444', fontSize: '1rem' }}>
                    ฿{(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ไม่พบรายการค่าใช้จ่าย
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid var(--border-color)' }}>
                <td colSpan="4" style={{ padding: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>รวมทั้งหมด</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444', fontSize: '1.1rem' }}>
                  ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
