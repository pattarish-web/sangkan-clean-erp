'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, MoreHorizontal, FileText, X, Sparkles, Home, ShoppingBag } from 'lucide-react';
import { fetchQuotations } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function QuotationHistory() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchQuotations();
      if (data && data.length > 0) setQuotations(data);
    }
    loadData();
  }, []);

  // ปิด dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const updated = quotations.map(q => q.id === id ? { ...q, status: newStatus } : q);
    setQuotations(updated);
    setOpenMenuId(null);
    const { saveQuotation } = await import('@/utils/api');
    const q = updated.find(q => q.id === id);
    if (q) await saveQuotation(q);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'approved': return { bg: '#dcfce7', color: '#166534', label: 'อนุมัติแล้ว' };
      case 'pending': return { bg: '#fef9c3', color: '#854d0e', label: 'รอดำเนินการ' };
      case 'rejected': return { bg: '#fee2e2', color: '#991b1b', label: 'ปฏิเสธ' };
      default: return { bg: '#f1f5f9', color: '#475569', label: 'ไม่ทราบสถานะ' };
    }
  };

  const filtered = quotations.filter(q =>
    q.id.includes(searchQuery) ||
    (q.customer || '').includes(searchQuery) ||
    (q.projectName || '').includes(searchQuery)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>ประวัติใบเสนอราคา</h1>
          <p style={{ color: 'var(--text-muted)' }}>จัดการและตรวจสอบสถานะใบเสนอราคาทั้งหมดของคุณ</p>
          
          {/* แถบลิงก์เมนูเครื่องมือ CRM เพิ่มเติม */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <Link href="/operations/scheduler" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 ปฏิทินคิว Big Cleaning
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Link href="/finance/profitability" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📊 วิเคราะห์กำไร & ค่าคอม
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Link href="/settings" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚙️ ปรับราคากลางแอดมิน
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/quotation/survey" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e0f2fe', color: 'var(--primary-dark)', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', border: '1px solid #bae6fd', cursor: 'pointer' }}>
            📋 1. สำรวจหน้างาน & คำนวณต้นทุน
          </Link>
          <button onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
            <Plus size={20} /> 2. ออกใบเสนอราคาใหม่
          </button>
        </div>
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
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Filter size={20} /> ตัวกรอง
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>วันที่</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>เลขที่เอกสาร</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ชื่อลูกค้า / โปรเจ็ค</th>
              <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>ยอดรวมสุทธิ</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>สถานะ</th>
              <th style={{ padding: '16px', width: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => {
              const status = getStatusStyle(q.status);
              return (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/quotation/details?id=${q.id}`)}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>{q.date ? q.date.split('T')[0].split('-').reverse().join('-') : '-'}</td>
                  <td style={{ padding: '16px', fontWeight: '500', color: 'var(--primary-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} />{q.id}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--text-main)' }}>{q.customer || q.customerName || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{q.projectName || q.projectName || 'ไม่ได้ระบุโปรเจกต์'}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>{Number(q.total || q.subTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500' }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <div ref={openMenuId === q.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}
                        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      {openMenuId === q.id && (
                        <div style={{ position: 'absolute', right: 8, top: '100%', backgroundColor: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', borderRadius: '8px', padding: '8px 0', minWidth: '220px', zIndex: 100, border: '1px solid var(--border-color)' }}>
                          {q.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusChange(q.id, 'approved')} style={{ display: 'block', width: '100%', padding: '10px 16px', color: '#166534', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>✅ อนุมัติใบเสนอราคา</button>
                              <button onClick={() => handleStatusChange(q.id, 'rejected')} style={{ display: 'block', width: '100%', padding: '10px 16px', color: '#991b1b', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>❌ ปฏิเสธใบเสนอราคา</button>
                              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                            </>
                          )}
                          {q.status === 'approved' && (
                            <>
                              <Link href={`/quotation/deposit/create?ref=${q.id}`} onClick={() => setOpenMenuId(null)} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>💰 สร้างใบแจ้งรับมัดจำ</Link>
                              <Link href={`/quotation/invoice/create?ref=${q.id}`} onClick={() => setOpenMenuId(null)} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>🧾 สร้างใบวางบิล/ใบแจ้งหนี้</Link>
                              <Link href={`/quotation/tax-invoice/create?ref=${q.id}`} onClick={() => setOpenMenuId(null)} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>📄 สร้างใบเสร็จ/ใบกำกับภาษี</Link>
                              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                            </>
                          )}
                          <Link href={`/quotation/create?edit=true&id=${q.id}`} onClick={() => setOpenMenuId(null)} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>✏️ แก้ไขเอกสาร</Link>
                          <Link href={`/quotation/details?id=${q.id}`} onClick={() => setOpenMenuId(null)} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>🔍 ดูรายละเอียด</Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ไม่พบข้อมูลใบเสนอราคา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>เลือกหมวดหมู่บริการ</h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link href="/quotation/create?type=bigcleaning" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', backgroundColor: '#f8fafc' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '50%', color: 'var(--primary-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Sparkles size={24} /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>บริการ Big Cleaning</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>สำหรับงานทำความสะอาดครั้งใหญ่, ก่อนเข้าอยู่, หลังก่อสร้าง (มีระบบประเมินราคา)</p>
                </div>
              </Link>
              <Link href="/quotation/create?type=recurring" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', backgroundColor: '#f8fafc' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '50%', color: 'var(--primary-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Home size={24} /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>บริการจัดส่งแม่บ้าน</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>สำหรับงานแม่บ้านประจำ สำนักงาน อาคาร คอนโด (รายเดือน/สัญญา)</p>
                </div>
              </Link>
              <Link href="/quotation/create?type=others" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', backgroundColor: '#f8fafc' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '50%', color: 'var(--primary-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><ShoppingBag size={24} /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>บริการอื่นๆ / ขายสินค้าและน้ำยา</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>สำหรับงานขายขาดน้ำยาทำความสะอาด อุปกรณ์ หรือบริการรูปแบบพิเศษอื่นๆ</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
