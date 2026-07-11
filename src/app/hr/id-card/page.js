'use client';

import React, { useState, useEffect } from 'react';
import { User, Printer, Search, ArrowLeft, Grid, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { fetchData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function IDCardPreview() {
  const showToast = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  const [printMode, setPrintMode] = useState('single'); // 'single' or 'all'
  const [searchQuery, setSearchQuery] = useState('');

  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [qrTokens, setQrTokens] = useState({});

  const loginQrUrl = (emp) => {
    if (!emp || !origin) return '';
    const token = qrTokens[emp.id];
    if (!token) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
      `${origin}/login?token=${token}`
    )}`;
  };

  useEffect(() => {
    async function loadQrToken(empId) {
      if (!empId || qrTokens[empId]) return;
      try {
        const res = await fetch(`/api/auth/qr-token?user=${encodeURIComponent(empId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            setQrTokens((prev) => ({ ...prev, [empId]: data.token }));
          }
        }
      } catch {
        /* QR optional if not logged in */
      }
    }
    if (selectedEmployee?.id) loadQrToken(selectedEmployee.id);
  }, [selectedEmployee?.id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        if (typeof window !== 'undefined') {
          setOrigin(window.location.origin);
        }
        const emps = await fetchData('Employees');
        const list = Array.isArray(emps) ? emps : [];
        setEmployees(list);

        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlId = params?.get('id');
        if (list.length > 0) {
          const defaultEmp = list.find((e) => e.id === urlId) || list[0];
          setSelectedEmployee(defaultEmp);
          setSelectedEmpId(defaultEmp.id);
        }
      } catch (e) {
        console.error(e);
        setLoadError('โหลดรายชื่อพนักงานไม่สำเร็จ');
        showToast('โหลดรายชื่อพนักงานไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setSelectedEmployee(emp);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // ค้นหาพนักงานสำหรับ Dropdown
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <p>กำลังโหลดข้อมูลพนักงาน...</p>
      </div>
    );
  }

  if (loadError || employees.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: 16 }}>{loadError || 'ยังไม่มีพนักงานในระบบ'}</p>
        <Link href="/hr/register" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
          ไปลงทะเบียนพนักงานใหม่
        </Link>
      </div>
    );
  }

  if (!selectedEmployee && printMode === 'single') {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <p>ไม่พบพนักงานที่เลือก</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* ส่วนควบคุมและกรองข้อมูล */}
      <div className="no-print" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/hr/employees" style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '50%', display: 'flex', color: 'var(--text-main)' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>พิมพ์บัตรประจำตัวพนักงาน</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>ออกแบบบัตรพนักงานในธีม Corporate สุดหรู พร้อมคิวอาร์โค้ดสแกนล็อกอินด้านหลัง</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setPrintMode('single')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: printMode === 'single' ? 'var(--primary-color)' : '#f1f5f9', color: printMode === 'single' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <CreditCard size={18} /> บัตรเดี่ยว
            </button>
            <button 
              onClick={() => setPrintMode('all')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: printMode === 'all' ? 'var(--primary-color)' : '#f1f5f9', color: printMode === 'all' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <Grid size={18} /> แสดงพนักงานทั้งหมด ({employees.length})
            </button>
            <button 
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              <Printer size={18} /> พิมพ์บัตร
            </button>
          </div>
        </div>

        {printMode === 'single' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>ค้นหาพนักงาน</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', backgroundColor: '#f8fafc' }}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="พิมพ์ชื่อหรือรหัสพนักงาน..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 8px', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>เลือกพนักงานที่ต้องการแสดง</label>
              <select 
                value={selectedEmpId} 
                onChange={e => handleSelectEmployee(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white' }}
              >
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    [{emp.id}] {emp.name} ({emp.position || emp.role})
                  </option>
                ))}
                {filteredEmployees.length === 0 && <option>ไม่พบรายชื่อพนักงาน</option>}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ส่วนพรีวิวบัตรพนักงาน */}
      <div className="print-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
        
        {printMode === 'single' ? (
          /* โหมดบัตรเดี่ยว */
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* ด้านหน้า */}
            <div className="id-card" style={{ width: '220px', height: '350px', borderRadius: '16px', border: '1px solid #d4af37', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              
              {/* แถบหัวบัตรสีขาวโค้งมนล้อมด้วยขอบทองสไตล์ Corporate */}
              <div style={{ backgroundColor: 'white', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid #fbbf24', padding: '12px 16px', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', zIndex: 10 }}>
                <img src="/logo.png" alt="Sangkan Cleaning Logo" style={{ height: '100%', objectFit: 'contain' }} />
              </div>

              {/* รูปพนักงานแบบวงกลม ล้อมรอบด้วยขอบทองหรูหรา */}
              <div style={{ alignSelf: 'center', width: '105px', height: '105px', backgroundColor: '#f1f5f9', border: '4px solid #fbbf24', borderRadius: '50%', marginTop: '16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                 {selectedEmployee.photo ? (
                   <img src={selectedEmployee.photo} alt={selectedEmployee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <User size={44} color="#94a3b8" />
                 )}
              </div>

              {/* รายละเอียดพนักงาน */}
              <div style={{ textAlign: 'center', padding: '16px 12px 20px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.3px' }}>{selectedEmployee.name}</h3>
                  <p style={{ margin: 0, color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedEmployee.position || selectedEmployee.role}</p>
                </div>
                
                {/* รหัสประจำตัวพนักงาน */}
                <div style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'inline-block', margin: '0 auto' }}>
                  <span style={{ fontSize: '7.5px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Employee ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{selectedEmployee.id}</span>
                </div>
              </div>

              {/* ลายแต่งขอบทองมุมล่างสไตล์ Pngtree */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)' }}></div>
            </div>

            {/* ด้านหลัง */}
            <div className="id-card" style={{ width: '220px', height: '350px', borderRadius: '16px', border: '1px solid #d4af37', backgroundColor: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              
              {/* แถบหัวบัตรด้านหลังสีน้ำเงินเข้ม */}
              <div style={{ backgroundColor: '#0f172a', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid #fbbf24' }}>
                <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sangkan Cleaning</span>
              </div>

              {/* เนื้อหาเงื่อนไขการใช้บัตร */}
              <div style={{ padding: '16px 20px', flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>เงื่อนไขการใช้บัตร / Terms</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '8.5px', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>
                  <p style={{ margin: 0 }}>• บัตรนี้เป็นกรรมสิทธิ์ของ บจก. สั่งการ คลีนนิ่ง</p>
                  <p style={{ margin: 0 }}>• ต้องสวมใส่หรือติดบัตรนี้ขณะปฏิบัติหน้าที่ทุกครั้ง</p>
                  <p style={{ margin: 0 }}>• หากพบบัตรสูญหาย กรุณาส่งคืนตามที่อยู่บริษัท</p>
                </div>
              </div>

              {/* คิวอาร์โค้ดสแกนระบบ */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '8px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scan for Auto Login</span>
                <div style={{ width: '85px', height: '85px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1.5px solid #fbbf24', padding: '4px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
                  <img 
                    src={loginQrUrl(selectedEmployee)} 
                    alt="Login QR" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* ลายแต่งขอบทองมุมล่าง */}
              <div style={{ height: '6px', background: 'linear-gradient(90deg, #0f172a 0%, #fbbf24 100%)' }}></div>
            </div>
          </div>
        ) : (
          /* โหมดบัตรทั้งหมด (สำหรับพิมพ์เยอะๆ ลายคมชัดสวยหรู) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '24px', width: '100%' }}>
            {employees.map(emp => (
              <div key={emp.id} style={{ display: 'flex', gap: '16px', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', pageBreakInside: 'avoid' }}>
                
                {/* ด้านหน้า */}
                <div className="id-card" style={{ width: '200px', height: '320px', borderRadius: '14px', border: '1px solid #d4af37', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  
                  {/* แถบหัวบัตร */}
                  <div style={{ backgroundColor: 'white', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid #fbbf24', padding: '8px 12px', borderRadius: '0 0 20px 20px', boxShadow: '0 3px 5px rgba(0,0,0,0.15)', zIndex: 10 }}>
                    <img src="/logo.png" alt="Sangkan Cleaning Logo" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>

                  {/* รูปพนักงานแบบวงกลม */}
                  <div style={{ alignSelf: 'center', width: '90px', height: '90px', backgroundColor: '#f1f5f9', border: '3.5px solid #fbbf24', borderRadius: '50%', marginTop: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, boxShadow: '0 6px 12px rgba(0,0,0,0.3)' }}>
                     {emp.photo ? (
                       <img src={emp.photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                       <User size={36} color="#94a3b8" />
                     )}
                  </div>

                  {/* รายละเอียดพนักงาน */}
                  <div style={{ textAlign: 'center', padding: '10px 8px 16px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 'bold', color: 'white' }}>{emp.name}</h3>
                      <p style={{ margin: 0, color: '#fbbf24', fontSize: '0.78rem', fontWeight: '600' }}>{emp.position || emp.role}</p>
                    </div>
                    
                    {/* รหัสพนักงาน */}
                    <div style={{ padding: '4px 10px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '15px', border: '1px solid rgba(251, 191, 36, 0.25)', display: 'inline-block', margin: '0 auto' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace' }}>{emp.id}</span>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)' }}></div>
                </div>

                {/* ด้านหลัง */}
                <div className="id-card" style={{ width: '200px', height: '320px', borderRadius: '14px', border: '1px solid #d4af37', backgroundColor: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* แถบหัวบัตรด้านหลัง */}
                  <div style={{ backgroundColor: '#0f172a', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '3px solid #fbbf24' }}>
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Sangkan Cleaning</span>
                  </div>

                  {/* เงื่อนไข */}
                  <div style={{ padding: '12px 16px', flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>เงื่อนไขการใช้บัตร / Terms</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '7.8px', color: '#475569', textAlign: 'left', lineHeight: '1.3' }}>
                      <p style={{ margin: 0 }}>• บัตรนี้เป็นของ บจก. สั่งการ คลีนนิ่ง</p>
                      <p style={{ margin: 0 }}>• ต้องติดบัตรนี้ขณะปฏิบัติงานเสมอ</p>
                      <p style={{ margin: 0 }}>• กรุณาส่งคืนหากเก็บบัตรนี้ได้</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', gap: '6px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' }}>Scan for Auto Login</span>
                    <div style={{ width: '70px', height: '70px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #fbbf24', padding: '3px', overflow: 'hidden' }}>
                      <img 
                        src={loginQrUrl(emp)} 
                        alt="Login QR" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  <div style={{ height: '5px', background: 'linear-gradient(90deg, #0f172a 0%, #fbbf24 100%)' }}></div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
