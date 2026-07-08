'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Briefcase, FileText, CheckCircle, AlertTriangle, Plus, Trash2, X, PlusCircle, Check } from 'lucide-react';
import { fetchData, saveData, fetchQuotations, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function OperationsPage() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('recurring'); // 'recurring' or 'bigcleaning'
  
  const [bigCleaningJobs, setBigCleaningJobs] = useState([]);
  const [recurringMaids, setRecurringMaids] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotations, setQuotations] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isBigCleaningModalOpen, setIsBigCleaningModalOpen] = useState(false);

  // Form states - Recurring
  const [recRefQ, setRecRefQ] = useState('');
  const [recClient, setRecClient] = useState('');
  const [recMaid, setRecMaid] = useState('');
  const [recSchedule, setRecSchedule] = useState('จันทร์ - ศุกร์ (08.00 - 17.00)');
  const [recStatus, setRecStatus] = useState('เข้างานแล้ว');

  // Form states - Big Cleaning
  const [bcRefQ, setBcRefQ] = useState('');
  const [bcClient, setBcClient] = useState('');
  const [bcDate, setBcDate] = useState('');
  const [bcTime, setBcTime] = useState('08:30 - 16:30');
  const [bcTeamSize, setBcTeamSize] = useState(5);
  const [bcStatus, setBcStatus] = useState('กำลังดำเนินการ');

  const loadAllData = async () => {
    try {
      const [opsRec, opsBc, emps, custs, qs] = await Promise.all([
        fetchData('operations_recurring'),
        fetchData('operations_bigcleaning'),
        fetchData('Employees'),
        fetchData('Customers'),
        fetchQuotations()
      ]);

      setRecurringMaids(opsRec || []);
      setBigCleaningJobs(opsBc || []);
      setEmployees(emps || []);
      setCustomers(custs || []);
      
      const approvedQs = (qs || []).filter(q => q.status === 'approved');
      setQuotations(approvedQs);

      if (approvedQs.length > 0) {
        setRecRefQ(approvedQs[0].id);
        setRecClient(approvedQs[0].customer);
        setBcRefQ(approvedQs[0].id);
        setBcClient(approvedQs[0].customer);
      }
      if (emps && emps.length > 0) {
        setRecMaid(emps[0].name);
      }
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลหน้าปฏิบัติการ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync clients when quotation references change
  const handleRecRefQChange = (qid) => {
    setRecRefQ(qid);
    const q = quotations.find(item => item.id === qid);
    if (q) setRecClient(q.customer);
  };

  const handleBcRefQChange = (qid) => {
    setBcRefQ(qid);
    const q = quotations.find(item => item.id === qid);
    if (q) setBcClient(q.customer);
  };

  // Submit handlers
  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    if (!recClient || !recMaid) {
      showToast('กรุณาระบุข้อมูลหน่วยงานและพนักงานให้ครบถ้วน', 'error');
      return;
    }

    const newObj = {
      id: recRefQ ? recRefQ.replace('QT', 'OPR') : 'OPR' + Date.now().toString().slice(-6),
      client: recClient,
      maid: recMaid,
      schedule: recSchedule,
      status: recStatus,
      refQuotation: recRefQ
    };

    try {
      const updated = [...recurringMaids, newObj];
      await saveData('operations_recurring', newObj);
      setRecurringMaids(updated);
      setIsRecurringModalOpen(false);
      showToast('จัดส่งพนักงานลงไซต์เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleSaveBigCleaning = async (e) => {
    e.preventDefault();
    if (!bcClient || !bcDate) {
      showToast('กรุณาระบุสถานที่และวันเข้าทำงานให้ครบถ้วน', 'error');
      return;
    }

    const newObj = {
      id: bcRefQ ? bcRefQ.replace('QT', 'OPB') : 'OPB' + Date.now().toString().slice(-6),
      client: bcClient,
      date: bcDate,
      time: bcTime,
      teamSize: Number(bcTeamSize) || 1,
      status: bcStatus,
      refQuotation: bcRefQ
    };

    try {
      const updated = [...bigCleaningJobs, newObj];
      await saveData('operations_bigcleaning', newObj);
      setBigCleaningJobs(updated);
      setIsBigCleaningModalOpen(false);
      showToast('สร้างใบงาน Big Cleaning เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบใบงานนี้ใช่หรือไม่?')) return;
    
    try {
      if (type === 'recurring') {
        await deleteData('operations_recurring', id);
        setRecurringMaids(recurringMaids.filter(item => item.id !== id));
        showToast('ลบรายการสัญญาแม่บ้านประจำออกแล้ว', 'success');
      } else {
        await deleteData('operations_bigcleaning', id);
        setBigCleaningJobs(bigCleaningJobs.filter(item => item.id !== id));
        showToast('ลบใบงาน Big Cleaning ออกแล้ว', 'success');
      }
    } catch(err) {
      showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  };

  const handleStatusUpdate = async (type, id, newStatus) => {
    try {
      if (type === 'recurring') {
        const updated = recurringMaids.map(item => item.id === id ? { ...item, status: newStatus } : item);
        const match = updated.find(item => item.id === id);
        if (match) await saveData('operations_recurring', match);
        setRecurringMaids(updated);
        showToast('อัปเดตสถานะของแม่บ้านเรียบร้อย', 'success');
      } else {
        const updated = bigCleaningJobs.map(item => item.id === id ? { ...item, status: newStatus } : item);
        const match = updated.find(item => item.id === id);
        if (match) await saveData('operations_bigcleaning', match);
        setBigCleaningJobs(updated);
        showToast('อัปเดตสถานะงาน Big Cleaning เรียบร้อย', 'success');
      }
    } catch (err) {
      showToast('อัปเดตสถานะล้มเหลว', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>ปฏิบัติการหน้างาน (Operations)</h2>
          <p style={{ color: 'var(--text-muted)' }}>จัดการตารางงาน, การส่งกำลังพลเข้าไซต์งาน และการเช็กชื่อพนักงานประจำวัน</p>
          
          {/* เมนูย่อยปฏิบัติการ */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <Link href="/operations/scheduler" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 ปฏิทินจองทีม Big Cleaning
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Link href="/operations/execution" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✍️ บันทึกปฏิบัติงาน & ส่งมอบจ๊อบ (Before/After & บิล)
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('recurring')}
          style={{ 
            padding: '16px 24px', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            backgroundColor: 'transparent',
            color: activeTab === 'recurring' ? 'var(--primary-dark)' : 'var(--text-muted)',
            borderBottom: activeTab === 'recurring' ? '4px solid var(--primary-color)' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            border: 'none', cursor: 'pointer'
          }}>
          <Users size={20} /> แม่บ้านประจำหน่วยงาน ({recurringMaids.length})
        </button>
        <button 
          onClick={() => setActiveTab('bigcleaning')}
          style={{ 
            padding: '16px 24px', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            backgroundColor: 'transparent',
            color: activeTab === 'bigcleaning' ? '#d97706' : 'var(--text-muted)',
            borderBottom: activeTab === 'bigcleaning' ? '4px solid #f59e0b' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            border: 'none', cursor: 'pointer'
          }}>
          <Briefcase size={20} /> ทีม Big Cleaning ({bigCleaningJobs.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px', minHeight: '500px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดตารางงาน...</div>
        ) : (
          <>
            {/* Tab 1: แม่บ้านประจำ */}
            {activeTab === 'recurring' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>ตารางงานแม่บ้านประจำหน่วยงาน</h3>
                  <button onClick={() => setIsRecurringModalOpen(true)} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} /> จัดพนักงานลงหน่วยงาน
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รหัสจัดงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>หน่วยงาน / ลูกค้า</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>พนักงานประจำ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รอบเวลาทำงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>สถานะ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500', width: '220px' }}>จัดการตารางงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringMaids.map((rec, idx) => (
                      <tr key={rec.id || idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rec.status === 'ลาหยุด 1 คน' ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rec.id}</td>
                        <td style={{ padding: '16px 8px', fontWeight: '600', color: 'var(--text-main)' }}>{rec.client}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} color="var(--primary-color)"/> {rec.maid}</span>
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> {rec.schedule}</span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <select 
                            value={rec.status} 
                            onChange={e => handleStatusUpdate('recurring', rec.id, e.target.value)}
                            style={{ 
                              backgroundColor: rec.status === 'เข้างานแล้ว' ? '#dcfce7' : rec.status === 'ลาหยุด 1 คน' ? '#fee2e2' : '#f1f5f9', 
                              color: rec.status === 'เข้างานแล้ว' ? '#166534' : rec.status === 'ลาหยุด 1 คน' ? '#991b1b' : 'var(--text-muted)', 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' 
                            }}
                          >
                            <option value="เข้างานแล้ว">🟢 เข้างานแล้ว</option>
                            <option value="ยังไม่มา">⚪ ยังไม่มา</option>
                            <option value="ลาหยุด 1 คน">🔴 ลาหยุด 1 คน</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {rec.status === 'ลาหยุด 1 คน' && (
                              <button onClick={() => showToast('ระบบหาพนักงานสำรองมาแทนตัวชั่วคราวแล้ว!', 'success')} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><AlertTriangle size={14}/> หาคนแทน</button>
                            )}
                            <button onClick={() => handleDeleteItem('recurring', rec.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="ลบตารางงาน">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {recurringMaids.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่พบข้อมูลงานแม่บ้านประจำหน่วยงาน</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Big Cleaning */}
            {activeTab === 'bigcleaning' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>โปรเจกต์ Big Cleaning (รายครั้ง)</h3>
                  <button onClick={() => setIsBigCleaningModalOpen(true)} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} /> สร้างใบงาน Big Cleaning
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รหัสใบงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>ลูกค้า / สถานที่</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>วัน-เวลา เข้าปฏิบัติงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>จำนวนทีมงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>สถานะ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>ลบใบงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bigCleaningJobs.map((job, idx) => (
                      <tr key={job.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{job.id}</td>
                        <td style={{ padding: '16px 8px', fontWeight: '600', color: 'var(--text-main)' }}>{job.client}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {job.date}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {job.time}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 8px', fontWeight: '500' }}>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} color="#d97706"/> {job.teamSize} คน</span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <select 
                            value={job.status} 
                            onChange={e => handleStatusUpdate('bigcleaning', job.id, e.target.value)}
                            style={{ 
                              backgroundColor: job.status === 'เสร็จสิ้นแล้ว' ? '#dcfce7' : job.status === 'กำลังดำเนินการ' ? '#e0f2fe' : '#f1f5f9', 
                              color: job.status === 'เสร็จสิ้นแล้ว' ? '#166534' : job.status === 'กำลังดำเนินการ' ? '#0284c7' : 'var(--text-muted)', 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' 
                            }}
                          >
                            <option value="รอดำเนินการ">⚪ รอดำเนินการ</option>
                            <option value="กำลังดำเนินการ">🔵 กำลังดำเนินการ</option>
                            <option value="เสร็จสิ้นแล้ว">🟢 เสร็จสิ้นแล้ว</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <button onClick={() => handleDeleteItem('bigcleaning', job.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bigCleaningJobs.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่พบข้อมูลโครงการ Big Cleaning</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================== Modal 1: จัดพนักงานลงไซต์งาน (Recurring) ==================== */}
      {isRecurringModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveRecurring} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>จัดส่งแม่บ้านลงไซต์งาน</h3>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>อ้างอิงใบเสนอราคา (โครงการ) *</label>
                {quotations.length > 0 ? (
                  <select 
                    value={recRefQ} 
                    onChange={e => handleRecRefQChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>{q.id} - {q.projectName || q.customer}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ ไม่พบใบเสนอราคาที่ได้รับอนุมัติในระบบ</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ชื่อหน่วยงาน / ลูกค้า *</label>
                <input 
                  type="text" 
                  value={recClient} 
                  onChange={e => setRecClient(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#f8fafc' }}
                  placeholder="กรอกชื่อลูกค้า/บริษัท..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>เลือกพนักงานประจำไซต์ *</label>
                {employees.length > 0 ? (
                  <select 
                    value={recMaid} 
                    onChange={e => setRecMaid(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อพนักงาน..." 
                    value={recMaid} 
                    onChange={e => setRecMaid(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                    required 
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>รอบเวลาทำงาน</label>
                <input 
                  type="text" 
                  value={recSchedule} 
                  onChange={e => setRecSchedule(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>สถานะการทำงานเริ่มต้น</label>
                <select 
                  value={recStatus} 
                  onChange={e => setRecStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="เข้างานแล้ว">🟢 เข้างานแล้ว</option>
                  <option value="ยังไม่มา">⚪ ยังไม่มา</option>
                  <option value="ลาหยุด 1 คน">🔴 ลาหยุด 1 คน</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกส่งกำลังพล</button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== Modal 2: สร้างใบงาน Big Cleaning ==================== */}
      {isBigCleaningModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveBigCleaning} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>สร้างใบงาน Big Cleaning</h3>
              <button type="button" onClick={() => setIsBigCleaningModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>อ้างอิงใบเสนอราคา (โครงการ) *</label>
                {quotations.length > 0 ? (
                  <select 
                    value={bcRefQ} 
                    onChange={e => handleBcRefQChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>{q.id} - {q.projectName || q.customer}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ ไม่พบใบเสนอราคาที่ได้รับอนุมัติในระบบ</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ลูกค้า / สถานที่จัดงาน *</label>
                <input 
                  type="text" 
                  value={bcClient} 
                  onChange={e => setBcClient(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#f8fafc' }}
                  placeholder="กรอกชื่อลูกค้า..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>วันทำงาน *</label>
                <input 
                  type="date" 
                  value={bcDate} 
                  onChange={e => setBcDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>เวลาเข้าปฏิบัติงาน</label>
                <input 
                  type="text" 
                  value={bcTime} 
                  onChange={e => setBcTime(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>จำนวนทีมงาน (คน) *</label>
                <input 
                  type="number" 
                  min="1" 
                  value={bcTeamSize} 
                  onChange={e => setBcTeamSize(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>สถานะใบงาน</label>
                <select 
                  value={bcStatus} 
                  onChange={e => setBcStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="รอดำเนินการ">⚪ รอดำเนินการ</option>
                  <option value="กำลังดำเนินการ">🔵 กำลังดำเนินการ</option>
                  <option value="เสร็จสิ้นแล้ว">🟢 เสร็จสิ้นแล้ว</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsBigCleaningModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกใบงาน</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
