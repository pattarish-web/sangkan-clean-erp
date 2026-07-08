'use client';

import React, { useState } from 'react';
import { Search, MapPin, AlertCircle, Wrench, RefreshCw, Filter } from 'lucide-react';

export default function EquipmentTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // จำลองข้อมูลทะเบียนคุมอุปกรณ์ประจำไซต์
  const trackingData = [
    {
      siteId: 'PRJ-202601-012',
      siteName: 'อาคารสำนักงาน เบต้า',
      endDate: '31 ธ.ค. 2026',
      status: 'active',
      equipments: [
        { name: 'เครื่องดูดฝุ่น', code: 'EQ-001', assignedDate: '01 ม.ค. 2026' },
        { name: 'รถเข็นแม่บ้าน', code: 'EQ-042', assignedDate: '01 ม.ค. 2026' },
        { name: 'ถังบีบม็อบ25ลิตร/สีเหลือง', code: 'EQ-105', assignedDate: '15 ก.พ. 2026' }
      ]
    },
    {
      siteId: 'PRJ-202602-008',
      siteName: 'คอนโด แกรนด์ วิว',
      endDate: '15 ก.ค. 2026', // ใกล้หมดสัญญา
      status: 'expiring',
      equipments: [
        { name: 'เครื่องขัดพื้น 18 นิ้ว', code: 'EQ-018', assignedDate: '01 ก.พ. 2026' },
        { name: 'เครื่องดูดฝุ่น', code: 'EQ-005', assignedDate: '01 ก.พ. 2026' }
      ]
    },
    {
      siteId: 'PRJ-202606-005',
      siteName: 'โรงแรม แกรนด์ พาราไดซ์',
      endDate: '07 ก.ค. 2026',
      status: 'completed', // เสร็จสิ้นแล้ว แต่ยังไม่ได้คืนของ
      equipments: [
        { name: 'เครื่องฉีดน้ำแรงดันสูง', code: 'EQ-077', assignedDate: '05 ก.ค. 2026' },
        { name: 'บันไดอลูมิเนียม 8 ฟุต', code: 'EQ-211', assignedDate: '05 ก.ค. 2026' }
      ]
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>ทะเบียนคุมอุปกรณ์ (Equipment Tracking)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ติดตามเครื่องจักรและอุปกรณ์ประจำไซต์ แจ้งเตือนเมื่อหมดสัญญา</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ backgroundColor: '#ef4444', padding: '12px', borderRadius: '50%', color: 'white' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#991b1b', fontWeight: 'bold' }}>รอรับคืน 1 ไซต์งาน</h3>
            <p style={{ margin: 0, color: '#dc2626', fontSize: '0.9rem' }}>โปรเจกต์เสร็จสิ้นแล้ว แต่อุปกรณ์ยังไม่ถูกส่งกลับคลัง (2 ชิ้น)</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef08a', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ backgroundColor: '#f59e0b', padding: '12px', borderRadius: '50%', color: 'white' }}>
            <MapPin size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#92400e', fontWeight: 'bold' }}>เตรียมหมดสัญญา 1 ไซต์งาน</h3>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem' }}>มีกำหนดหมดสัญญาในอีก 15 วัน (2 ชิ้น)</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '50%', color: '#0ea5e9' }}>
            <Wrench size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>กำลังใช้งาน 1 ไซต์งาน</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>อุปกรณ์ประจำไซต์ที่ใช้งานปกติ (3 ชิ้น)</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหา ชื่อไซต์งาน, รหัสอุปกรณ์..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Filter size={18} /> กรองสถานะ
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {trackingData.map((site, index) => (
            <div key={index} style={{ marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: site.status === 'completed' ? '#fef2f2' : site.status === 'expiring' ? '#fffbeb' : '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>{site.siteName} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>({site.siteId})</span></h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>สิ้นสุดสัญญา: {site.endDate}</div>
                </div>
                <div>
                  {site.status === 'completed' && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>หมดสัญญาแล้ว - รอรับคืน</span>}
                  {site.status === 'expiring' && <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>ใกล้หมดสัญญา - เตรียมรับคืน</span>}
                  {site.status === 'active' && <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>กำลังใช้งานปกติ</span>}
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'white', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>รหัสอุปกรณ์</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>ชื่ออุปกรณ์/เครื่องจักร</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>วันที่ส่งมอบ</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500', width: '150px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {site.equipments.map((eq, i) => (
                    <tr key={i} style={{ borderBottom: i === site.equipments.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{eq.code}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-main)', fontWeight: '500' }}>{eq.name}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{eq.assignedDate}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'white', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', width: '100%' }}>
                          <RefreshCw size={14} /> ทำเรื่องรับคืน
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
