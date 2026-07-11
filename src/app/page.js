'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckCircle, AlertTriangle, RefreshCw, Briefcase, DollarSign, ArrowRight, UserPlus, Package } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchInvoices, fetchExpenses, fetchData, resetDatabase } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function Home() {
  const showToast = useToast();
  const [stats, setStats] = useState({
    revenue: 0,
    activeJobs: 0,
    completedJobs: 0,
    lowStockCount: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // 1. Load data from API
      const [quotations, invoices, expenses, inventory, employees, recurringOps, bcOps] = await Promise.all([
        fetchQuotations(),
        fetchInvoices(),
        fetchExpenses(),
        fetchData('Inventory'),
        fetchData('Employees'),
        fetchData('operations_recurring'),
        fetchData('operations_bigcleaning')
      ]);

      // 2. Calculate revenue (paid invoices only)
      const rev = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || inv.price || 0), 0);

      // 3. Calculate active jobs
      const activeBc = bcOps.filter(j => j.status === 'กำลังดำเนินการ').length;
      const activeRec = recurringOps.filter(r => r.status === 'เข้างานแล้ว').length;
      const activeJobs = activeBc + activeRec;

      const completedBc = bcOps.filter(j => j.status === 'เสร็จสิ้นแล้ว').length;
      const completedRec = recurringOps.filter(r => r.status === 'ปิดงาน').length;
      const completedJobs = completedBc + completedRec;

      // 5. Calculate low stock items
      const lowStockCount = inventory.filter(i => (i.qty || 0) < (i.minStock || 0)).length;

      setStats({
        revenue: rev,
        activeJobs,
        completedJobs,
        lowStockCount: lowStockCount
      });

      // 6. Generate recent activities
      const activities = [];
      
      quotations.slice(-3).forEach(q => {
        activities.push({
          type: 'quotation',
          title: `ใบเสนอราคา ${q.id}`,
          desc: `${q.customer} — ${q.projectName}`,
          time: q.date,
          amount: q.total,
          link: '/quotation'
        });
      });

      expenses.slice(-2).forEach(e => {
        activities.push({
          type: 'expense',
          title: `บันทึกค่าใช้จ่าย: ${e.description}`,
          desc: `${e.category} — ${e.projectName || 'ส่วนกลาง'}`,
          time: e.date,
          amount: -e.amount,
          link: '/finance/expenses'
        });
      });

      employees.slice(-2).forEach(emp => {
        activities.push({
          type: 'employee',
          title: `ลงทะเบียนพนักงาน: ${emp.name}`,
          desc: `ตำแหน่ง: ${emp.position}`,
          time: 'ล่าสุด',
          link: '/hr/employees'
        });
      });

      // Sort by date equivalent
      setRecentActivities(activities.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetDatabase = async () => {
    if (!confirm('คุณต้องการรีเซ็ตฐานข้อมูลตัวอย่างทั้งหมดใช่หรือไม่? ข้อมูลที่คุณป้อนทั้งหมดจะถูกล้างและกลับเป็นค่าเริ่มต้น')) {
      return;
    }
    try {
      await resetDatabase();
      showToast('รีเซ็ตฐานข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      showToast('ไม่สามารถรีเซ็ตฐานข้อมูลได้', 'error');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดแดชบอร์ด...</div>;

  return (
    <div>
      {/* Title with Reset Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>แดชบอร์ดภาพรวม</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ภาพรวมความเคลื่อนไหวทางธุรกิจและงานปฏิบัติการวันนี้</p>
        </div>
        {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={handleResetDatabase}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        >
          <RefreshCw size={16} /> รีเซ็ตข้อมูลตัวอย่าง (dev)
        </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="card-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>รายได้รวม (บาท)</h3>
            <p>฿{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}><TrendingUp size={28} /></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>งานกำลังดำเนินการ</h3>
            <p>{stats.activeJobs} งาน</p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><Briefcase size={28} /></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>งานสำเร็จแล้ววันนี้</h3>
            <p>{stats.completedJobs} งาน</p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#166534' }}><CheckCircle size={28} /></div>
        </div>
        
        <div className="stat-card" style={stats.lowStockCount > 0 ? { borderLeft: '4px solid #ef4444' } : {}}>
          <div className="stat-card-info">
            <h3>เตือนสต็อกต่ำกว่าเกณฑ์</h3>
            <p style={stats.lowStockCount > 0 ? { color: '#ef4444' } : {}}>{stats.lowStockCount} รายการ</p>
          </div>
          <div className="stat-icon" style={stats.lowStockCount > 0 ? { backgroundColor: '#fee2e2', color: '#ef4444' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}><AlertTriangle size={28} /></div>
        </div>
      </div>
      
      {/* Recent Activities & Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Activities */}
        <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>ความเคลื่อนไหวล่าสุด</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map((act, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{act.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{act.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {act.amount !== undefined && (
                    <span style={{ fontWeight: 'bold', color: act.amount < 0 ? '#ef4444' : '#10b981', fontSize: '1rem' }}>
                      {act.amount < 0 ? '-' : '+'}฿{Math.abs(act.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <Link href={act.link} style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>ยังไม่มีประวัติความเคลื่อนไหว</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>ทางลัดเปิดเอกสาร/บันทึก</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/quotation/create?type=bigcleaning" style={{ textDecoration: 'none', padding: '12px', backgroundColor: 'var(--bg-color)', color: 'var(--primary-dark)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                📝 สร้างใบเสนอราคาใหม่
              </Link>
              <Link href="/finance/expenses/create" style={{ textDecoration: 'none', padding: '12px', backgroundColor: 'var(--bg-color)', color: '#d97706', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                💰 บันทึกค่าใช้จ่ายใหม่
              </Link>
              <Link href="/hr/register" style={{ textDecoration: 'none', padding: '12px', backgroundColor: 'var(--bg-color)', color: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                👤 ลงทะเบียนพนักงานใหม่
              </Link>
              <Link href="/inventory/requisition/create" style={{ textDecoration: 'none', padding: '12px', backgroundColor: 'var(--bg-color)', color: '#6b21a8', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '0.95rem' }}>
                📦 สร้างใบขอเบิกสินค้า
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
