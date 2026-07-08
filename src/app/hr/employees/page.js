'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, CreditCard, Edit3, Trash2, X, Check } from 'lucide-react';
import Link from 'next/link';
import { fetchData, saveData, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function EmployeeList() {
  const showToast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSite, setEditSite] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const loadData = async () => {
    try {
      const data = await fetchData('Employees');
      setEmployees(data || []);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการโหลดรายชื่อพนักงาน', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setEditName(emp.name || '');
    setEditPosition(emp.position || emp.role || '');
    setEditPhone(emp.phone || '');
    setEditSite(emp.site || '');
    setEditStatus(emp.status || 'active');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    const updatedEmp = {
      ...editingEmp,
      name: editName,
      position: editPosition,
      role: editPosition, // Sync both keys in case of naming inconsistency
      phone: editPhone,
      site: editSite,
      status: editStatus
    };

    try {
      const updatedList = employees.map(emp => emp.id === editingEmp.id ? updatedEmp : emp);
      await saveData('Employees', updatedEmp);
      setEmployees(updatedList);
      setIsEditModalOpen(false);
      showToast(`แก้ไขข้อมูลพนักงาน ${editName} สำเร็จ!`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล', 'error');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!confirm(`คุณแน่ใจว่าต้องการลบพนักงาน ${name} ออกจากระบบ? การลบนี้จะไม่สามารถย้อนคืนได้`)) return;

    try {
      await deleteData('Employees', id);
      setEmployees(employees.filter(emp => emp.id !== id));
      showToast(`ลบรายชื่อพนักงาน ${name} เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบพนักงาน', 'error');
    }
  };

  const filtered = employees.filter(emp => 
    (emp.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.position || emp.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.site || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>รายชื่อพนักงานทั้งหมด</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ค้นหา จัดการแก้ไข ลบ และพิมพ์บัตรประจำตัวของพนักงานแต่ละคน</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/hr/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,169,80,0.2)' }}>
            <UserPlus size={20} /> ลงทะเบียนพนักงานใหม่
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหา รหัสพนักงาน, ชื่อ, ตำแหน่ง หรือไซต์งาน..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลพนักงาน...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>รหัสพนักงาน</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ชื่อ-นามสกุล</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ตำแหน่ง</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ไซต์งานประจำ</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>เบอร์โทรศัพท์</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>สถานะ</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center', width: '280px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px 20px', color: '#0ea5e9', fontWeight: 'bold', fontFamily: 'monospace' }}>{emp.id}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#0ea5e9', marginTop: '4px', fontFamily: 'monospace' }}>
                      👤 User: {emp.username || emp.id} | 🔑 Pass: {emp.password || 'sc1234'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-main)' }}>{emp.position || emp.role || 'แม่บ้านประจำ'}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{emp.site || 'ส่วนกลาง/ยังไม่ได้กำหนด'}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{emp.phone}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: emp.status === 'active' ? '#dcfce7' : '#fee2e2', 
                      color: emp.status === 'active' ? '#166534' : '#991b1b', 
                      padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' 
                    }}>
                      {emp.status === 'active' ? '🟢 ทำงานอยู่' : '🔴 พักงาน/ลาออก'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <Link href={`/hr/id-card?id=${emp.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        <CreditCard size={14} /> บัตรพนักงาน
                      </Link>
                      <button onClick={() => handleOpenEdit(emp)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Edit3 size={14} /> แก้ไข
                      </button>
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบรายชื่อพนักงานตรงตามเงื่อนไข</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================== Modal: แก้ไขข้อมูลพนักงาน ==================== */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveEdit} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>แก้ไขข้อมูลพนักงาน</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ชื่อ-นามสกุล *</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ตำแหน่งงาน *</label>
                <input 
                  type="text" 
                  value={editPosition} 
                  onChange={e => setEditPosition(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="เช่น แม่บ้านประจำ, หัวหน้าแม่บ้าน"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>เบอร์โทรศัพท์ *</label>
                <input 
                  type="text" 
                  value={editPhone} 
                  onChange={e => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ไซต์งานประจำ</label>
                <input 
                  type="text" 
                  value={editSite} 
                  onChange={e => setEditSite(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="กรอกชื่อไซต์งานหรือว่างไว้หากเป็นส่วนกลาง"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>สถานะพนักงาน</label>
                <select 
                  value={editStatus} 
                  onChange={e => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="active">🟢 ทำงานอยู่ (Active)</option>
                  <option value="inactive">🔴 พักงาน/ลาออก (Inactive)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกแก้ไข</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
