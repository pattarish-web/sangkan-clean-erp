'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { fetchData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function RequisitionList() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [prList, setPrList] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData('PurchaseRequests');
      setPrList(data || []);
    };
    load();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>ใบขอเบิกสินค้า (PR)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>จัดการรายการเบิกของเข้าไซต์งานและอนุมัติใบเบิก</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/inventory/requisition/approve" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#10b981', border: '1px solid #10b981', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
            <CheckCircle size={20} /> โหมดอนุมัติ (สำหรับ ผจก.)
          </Link>
          <Link href="/inventory/requisition/create" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 2px 4px rgba(14,165,233,0.2)' }}>
            <Plus size={20} /> สร้างใบเบิกใหม่ (พนักงาน)
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหา รหัสใบเบิก, ชื่อผู้เบิก, โปรเจกต์..." 
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <button onClick={() => showToast('ระบบกำลังโหลดตัวกรองสถานะ...', 'warning')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Filter size={18} /> กรองสถานะ
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>รหัสใบเบิก</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>วันที่</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>ผู้เบิก</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>โปรเจกต์ (ไซต์งาน)</th>
              <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'right' }}>มูลค่ารวม</th>
              <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'center' }}>สถานะ</th>
              <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {prList.map((pr) => (
              <tr key={pr.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 20px', color: '#0ea5e9', fontWeight: '500' }}>{pr.id}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-main)' }}>{pr.date}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-main)' }}>{pr.by}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{pr.project}</td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '500' }}>฿{pr.amount.toLocaleString('th-TH')}</td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {pr.status === 'pending' && <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> รออนุมัติ</span>}
                  {pr.status === 'approved' && <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> อนุมัติแล้ว</span>}
                  {pr.status === 'rejected' && <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500' }}>ไม่อนุมัติ (ตีกลับ)</span>}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {pr.status === 'pending' ? (
                    <Link href={`/inventory/requisition/approve?id=${pr.id}`} style={{ color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      ตรวจสอบ <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <span onClick={() => showToast(`กำลังเปิดดูรายละเอียดของใบเบิกสินค้า ${pr.id}...`, 'warning')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}>ดูรายละเอียด</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
