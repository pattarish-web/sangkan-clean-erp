'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, MoreHorizontal, User, Phone, Home, FileText, BadgeInfo } from 'lucide-react';

import { fetchData } from '@/utils/api';

export default function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await fetchData('Employees');
        setEmployees(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>ปฏิบัติงานปกติ</span>;
      case 'inactive':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>ลาออก/พักงาน</span>;
      default:
        return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500' }}>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
               <Home size={20} />
           </Link>
           <div>
             <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>พนักงาน (HR)</h1>
             <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>จัดการข้อมูลพนักงานและออกบัตรพนักงาน</p>
           </div>
        </div>
        <Link href="/hr/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none' }}>
          <Plus size={20} />
          เพิ่มพนักงานใหม่
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อพนักงาน, รหัส, ตำแหน่ง หรือเบอร์โทร..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Filter size={20} />
            ตัวกรอง
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>รหัสพนักงาน</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>พนักงาน</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>ตำแหน่ง</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>เบอร์โทร</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>สถานะ</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {employees.filter(emp => emp.name.includes(searchQuery) || emp.id.includes(searchQuery)).map((emp, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 20px', fontSize: '15px', fontWeight: '500' }}>{emp.id}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {emp.photo ? (
                           <img src={emp.photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                           <User size={20} color="#94a3b8" />
                        )}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-light)', fontSize: '15px' }}>{emp.position}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-light)', fontSize: '15px' }}>{emp.phone}</td>
                  <td style={{ padding: '16px 20px' }}>{getStatusBadge(emp.status)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <Link href={`/hr/id-card?id=${emp.id}`} style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', border: 'none', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center' }} title="พิมพ์บัตรพนักงาน">
                        <BadgeInfo size={18} />
                      </Link>
                      <button style={{ padding: '8px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', cursor: 'pointer', border: 'none', transition: 'background-color 0.2s' }}>
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {employees.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <User size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '16px', margin: 0 }}>ยังไม่มีข้อมูลพนักงาน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
