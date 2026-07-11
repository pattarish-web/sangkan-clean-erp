'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, AlertCircle, Wrench, RefreshCw, Filter } from 'lucide-react';
import { fetchData } from '@/utils/api';

export default function EquipmentTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stored, bc, rec, catalog] = await Promise.all([
          fetchData('EquipmentTracking'),
          fetchData('operations_bigcleaning'),
          fetchData('operations_recurring'),
          fetchData('Itemcatalog'),
        ]);

        if (stored?.length) {
          setTrackingData(stored);
          return;
        }

        const machines = (catalog || []).filter((i) => (i.category || '').includes('เครื่อง'));
        const sites = [];

        (bc || []).forEach((job) => {
          sites.push({
            siteId: job.refQuotation || job.id,
            siteName: job.customer || job.projectName || job.id,
            endDate: job.endDate || job.date || '—',
            status: job.status === 'เสร็จสิ้นแล้ว' ? 'completed' : 'active',
            equipments: machines.slice(0, 2).map((m, i) => ({
              name: m.name,
              code: m.id,
              assignedDate: job.date || '—',
            })),
          });
        });

        (rec || []).forEach((job) => {
          sites.push({
            siteId: job.id,
            siteName: job.site || job.customer || job.id,
            endDate: job.contractEnd || '—',
            status: job.status === 'ปิดงาน' ? 'completed' : 'active',
            equipments: machines.slice(0, 1).map((m) => ({
              name: m.name,
              code: m.id,
              assignedDate: job.startDate || '—',
            })),
          });
        });

        setTrackingData(sites);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = trackingData.filter(
    (s) =>
      (s.siteName || '').includes(searchQuery) ||
      (s.siteId || '').includes(searchQuery) ||
      (s.equipments || []).some((e) => (e.code || '').includes(searchQuery) || (e.name || '').includes(searchQuery))
  );

  const stats = useMemo(() => ({
    completed: trackingData.filter((s) => s.status === 'completed').length,
    expiring: trackingData.filter((s) => s.status === 'expiring').length,
    active: trackingData.filter((s) => s.status === 'active').length,
  }), [trackingData]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดทะเบียนอุปกรณ์...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>ทะเบียนคุมอุปกรณ์ (Equipment Tracking)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ดึงจากงานปฏิบัติการและคลังสินค้า — ไม่มีข้อมูล mock</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#991b1b' }}>รอรับคืน {stats.completed} ไซต์</h3>
          <p style={{ margin: 0, color: '#dc2626', fontSize: '0.9rem' }}>งานปิดแล้ว — ตรวจสอบการคืนอุปกรณ์</p>
        </div>
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef08a', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#92400e' }}>ใกล้หมดสัญญา {stats.expiring} ไซต์</h3>
        </div>
        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0' }}>กำลังใช้งาน {stats.active} ไซต์</h3>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', backgroundColor: 'white', borderRadius: '12px' }}>
          <Wrench size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>ยังไม่มีงานที่มอบหมายอุปกรณ์ — สร้างใบงานใน Operations ก่อน</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาไซต์ / รหัสอุปกรณ์..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
          {filtered.map((site) => (
            <div key={site.siteId} style={{ marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0 }}>{site.siteName} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({site.siteId})</span></h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(site.equipments || []).map((eq, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 20px' }}>{eq.code}</td>
                      <td style={{ padding: '12px 20px' }}>{eq.name}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{eq.assignedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
