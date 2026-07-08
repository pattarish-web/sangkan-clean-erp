'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, FileText, ChevronDown, ShoppingCart, Users, DollarSign, X, TrendingUp, Calendar, Clock, Package } from 'lucide-react';
import { fetchQuotations, fetchExpenses, fetchData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function PeakStyleProjectHistory() {
  const showToast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recurringMaids, setRecurringMaids] = useState([]);
  const [bigCleaningJobs, setBigCleaningJobs] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedProject, setSelectedProject] = useState(null);

  const loadAllData = async () => {
    try {
      const [qs, exps, recOps, bcOps, reqs] = await Promise.all([
        fetchQuotations(),
        fetchExpenses(),
        fetchData('operations_recurring'),
        fetchData('operations_bigcleaning'),
        fetchData('PurchaseRequests')
      ]);

      // กรองเฉพาะใบเสนอราคาที่ได้รับอนุมัติ (approved) เพื่อแปลงเป็นโปรเจกต์
      const approvedQuotations = qs.filter(q => q.status === 'approved');

      // แมปเป็นโปรเจกต์ออบเจกต์
      const projectList = approvedQuotations.map(q => {
        // คำนวณค่าใช้จ่ายของโปรเจกต์นี้
        const projectExps = exps.filter(e => e.projectId === q.id);
        const actualCost = projectExps.reduce((sum, e) => sum + (e.amount || 0), 0);

        // ดึงกำลังพลที่ได้รับมอบหมาย
        const maids = recOps.filter(r => r.refQuotation === q.id);
        const jobs = bcOps.filter(j => j.refQuotation === q.id);

        // ดึงรายการใบเบิกอุปกรณ์
        const projectReqs = reqs.filter(r => r.projectId === q.id);

        return {
          id: q.id,
          name: q.projectName || 'ไม่ได้ระบุชื่อโปรเจกต์',
          customer: q.customer || 'ไม่ได้ระบุลูกค้า',
          estRevenue: q.total || 0,
          actualRevenue: q.total || 0, // สมมติว่ารายได้ได้เต็มตามใบเสนอราคาเมื่อได้รับอนุมัติ
          actualCost: actualCost,
          status: q.status === 'approved' ? 'in-progress' : 'completed', // maps approved to in-progress
          rawQuotation: q,
          expenses: projectExps,
          workforce: { maids, jobs },
          requisitions: projectReqs
        };
      });

      setProjects(projectList);
      setExpenses(exps);
      setRecurringMaids(recOps);
      setBigCleaningJobs(bcOps);
      setRequisitions(reqs);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรเจกต์', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'in-progress': return { bg: '#e0f2fe', color: '#0284c7', label: 'กำลังดำเนินการ' };
      case 'completed': return { bg: '#dcfce7', color: '#166534', label: 'เสร็จสิ้น' };
      case 'cancelled': return { bg: '#fee2e2', color: '#991b1b', label: 'ยกเลิก' };
      default: return { bg: '#f1f5f9', color: '#475569', label: 'กำลังดำเนินการ' };
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'in-progress', label: 'กำลังดำเนินการ' },
    { id: 'completed', label: 'เสร็จสิ้น' }
  ];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>โปรเจกต์และโครงการ (Projects)</h1>
          <p style={{ color: 'var(--text-muted)' }}>ติดตามรายได้ ค่าใช้จ่ายจริง กำลังพล และใบเบิกของแต่ละไซต์งานแบบเรียลไทม์</p>
        </div>
        <Link href="/quotation/create" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '10px 20px', borderRadius: '4px', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
          <Plus size={20} /> สร้างโปรเจกต์ใหม่
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc', padding: '0 16px' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : 'normal',
                color: activeTab === tab.id ? '#0ea5e9' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid #0ea5e9' : '3px solid transparent',
                fontSize: '0.95rem'
              }}
            >
              {tab.label} {tab.id === 'all' && `(${projects.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังดึงข้อมูลและคำนวณต้นทุน...</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="ค้นหา รหัสโปรเจกต์, ชื่อโครงการ, ชื่อลูกค้า..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '600' }}>รหัสโปรเจกต์</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '600' }}>ชื่อโครงการ / ลูกค้า</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>มูลค่าสัญญา (รายได้)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>ค่าใช้จ่ายจริง (ต้นทุน)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>กำไรสุทธิ</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600' }}>สถานะ</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600' }}>ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => {
                  const status = getStatusStyle(p.status);
                  const profit = p.actualRevenue - p.actualCost;
                  const profitMargin = p.actualRevenue > 0 ? (profit / p.actualRevenue) * 100 : 0;
                  const isProfitable = profit >= 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 8px', color: '#0ea5e9', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {p.id}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>ลูกค้า: {p.customer}</div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '500' }}>
                        ฿{formatCurrency(p.estRevenue)}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>
                        ฿{formatCurrency(p.actualCost)}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ color: isProfitable ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                          ฿{formatCurrency(profit)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          มาร์จิ้น: {profitMargin.toFixed(1)}%
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedProject(p)}
                          style={{ border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                        >
                          🔍 ตรวจสอบ
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      ไม่พบข้อมูลโปรเจกต์
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Drawer / Modal: ตรวจสอบรายละเอียดโปรเจกต์อย่างละเอียด ===== */}
      {selectedProject && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button 
              onClick={() => setSelectedProject(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.85rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {selectedProject.id}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px 0' }}>{selectedProject.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>ลูกค้า: {selectedProject.customer}</p>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.85rem', color: '#166534', display: 'block', marginBottom: '4px' }}>รายได้ตามสัญญา</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#15803d' }}>฿{formatCurrency(selectedProject.estRevenue)}</span>
              </div>
              <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '0.85rem', color: '#991b1b', display: 'block', marginBottom: '4px' }}>ค่าใช้จ่ายสะสม</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b91c1c' }}>฿{formatCurrency(selectedProject.actualCost)}</span>
              </div>
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <span style={{ fontSize: '0.85rem', color: '#0369a1', display: 'block', marginBottom: '4px' }}>กำไรคงเหลือ</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0369a1' }}>฿{formatCurrency(selectedProject.estRevenue - selectedProject.actualCost)}</span>
              </div>
            </div>

            {/* Sections Tab Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Workforce Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--primary-color)" /> 1. รายละเอียดกำลังพล (Workforce Assigned)
                </h3>
                
                {/* Recurring Maids */}
                {selectedProject.workforce.maids.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontWeight: '600', margin: '0 0 6px 0', fontSize: '0.9rem', color: '#0284c7' }}>แม่บ้านประจำหน่วยงาน:</p>
                    {selectedProject.workforce.maids.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '4px', fontSize: '0.85rem' }}>
                        <span>👤 {m.maid}</span>
                        <span style={{ color: 'var(--text-muted)' }}>ตาราง: {m.schedule} ({m.status})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Big Cleaning Jobs */}
                {selectedProject.workforce.jobs.length > 0 && (
                  <div>
                    <p style={{ fontWeight: '600', margin: '0 0 6px 0', fontSize: '0.9rem', color: '#d97706' }}>ทีม Big Cleaning:</p>
                    {selectedProject.workforce.jobs.map(j => (
                      <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '4px', fontSize: '0.85rem' }}>
                        <span>📅 วันเข้างาน: {j.date} ({j.time})</span>
                        <span style={{ fontWeight: 'bold' }}>👥 จำนวน {j.teamSize} คน ({j.status})</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProject.workforce.maids.length === 0 && selectedProject.workforce.jobs.length === 0 && (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>ยังไม่มีการลงบันทึกกำลังพลในตารางปฏิบัติการหน้างาน</p>
                )}
              </div>

              {/* 2. Expenses Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="#dc2626" /> 2. รายการค่าใช้จ่ายที่เกิดขึ้นจริง (Expenses Breakdown)
                </h3>
                
                {selectedProject.expenses.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 12px' }}>วันที่</th>
                        <th style={{ padding: '10px 12px' }}>รายละเอียดค่าใช้จ่าย</th>
                        <th style={{ padding: '10px 12px' }}>หมวดหมู่</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProject.expenses.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{e.date}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '500' }}>{e.description}</td>
                          <td style={{ padding: '10px 12px' }}>{e.category}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>฿{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>ยังไม่มีรายการบันทึกค่าใช้จ่ายสำหรับโปรเจกต์นี้</p>
                )}
              </div>

              {/* 3. Requisitions Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} color="#9333ea" /> 3. ใบเบิกอุปกรณ์/น้ำยาเข้าหน้างาน (Material Requisitions)
                </h3>
                
                {selectedProject.requisitions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedProject.requisitions.map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#9333ea' }}>{r.id}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>เบิกโดย: {r.by || 'พนักงาน'} | วันที่: {r.date}</span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>มูลค่า: ฿{formatCurrency(r.amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>ยังไม่มีรายการขอเบิกอุปกรณ์สำหรับโปรเจกต์นี้</p>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
              <button 
                onClick={() => setSelectedProject(null)}
                style={{ padding: '10px 24px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
