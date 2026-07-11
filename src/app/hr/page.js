'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Filter, User, Phone, Home, Eye, Edit3, Trash2, X, CreditCard,
  Briefcase, IdCard, MapPin, Shield, BadgeCheck,
} from 'lucide-react';
import { fetchData, saveData, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

const fieldLabel = { fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 };
const fieldValue = { margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' };
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  outline: 'none',
  fontSize: '0.95rem',
};

export default function HRDashboardEmployeeList() {
  const showToast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    position: '',
    phone: '',
    site: '',
    status: 'active',
    username: '',
    password: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const loadEmployees = async () => {
    try {
      const data = await fetchData('Employees');
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
      showToast('โหลดรายชื่อพนักงานไม่สำเร็จ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openDetail = (emp, edit = false) => {
    setSelectedEmp(emp);
    setForm({
      name: emp.name || '',
      position: emp.position || emp.role || '',
      phone: emp.phone || '',
      site: emp.site || '',
      status: emp.status || 'active',
      username: emp.username || emp.id || '',
      password: emp.password || '',
      address: emp.address || '',
      emergencyName: emp.emergencyName || '',
      emergencyPhone: emp.emergencyPhone || '',
      emergencyRelation: emp.emergencyRelation || '',
    });
    setIsEditing(edit);
  };

  const closeModal = () => {
    setSelectedEmp(null);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('กรุณากรอกชื่อและเบอร์โทร', 'warning');
      return;
    }

    const updated = {
      ...selectedEmp,
      name: form.name.trim(),
      position: form.position.trim(),
      role: form.position.trim(),
      phone: form.phone.trim(),
      site: form.site.trim(),
      status: form.status,
      username: form.username.trim() || selectedEmp.id,
      password: form.password || selectedEmp.password,
      address: form.address.trim(),
      emergencyName: form.emergencyName.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      emergencyRelation: form.emergencyRelation.trim(),
    };

    try {
      await saveData('Employees', updated);
      setEmployees((prev) => prev.map((emp) => (emp.id === updated.id ? updated : emp)));
      setSelectedEmp(updated);
      setIsEditing(false);
      showToast(`บันทึกข้อมูล ${updated.name} เรียบร้อย`, 'success');
    } catch (err) {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmp) return;
    if (!window.confirm(`ยืนยันลบพนักงาน ${selectedEmp.name} ออกจากระบบ?`)) return;
    try {
      await deleteData('Employees', selectedEmp.id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmp.id));
      closeModal();
      showToast(`ลบ ${selectedEmp.name} แล้ว`, 'success');
    } catch (err) {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const active = status === 'active';
    return (
      <span
        style={{
          display: 'inline-block',
          backgroundColor: active ? '#dcfce7' : '#fee2e2',
          color: active ? '#166534' : '#991b1b',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '0.85rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {active ? 'ปฏิบัติงานปกติ' : 'ลาออก/พักงาน'}
      </span>
    );
  };

  const filtered = employees.filter((emp) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQ =
      !q ||
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.id || '').toLowerCase().includes(q) ||
      (emp.position || emp.role || '').toLowerCase().includes(q) ||
      (emp.phone || '').includes(q);
    const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
            <Home size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>พนักงาน (HR)</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>คลิกรายชื่อเพื่อดูรายละเอียดและแก้ไขข้อมูล</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/hr/employees" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>
            รายชื่อทั้งหมด
          </Link>
          <Link href="/hr/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={18} /> เพิ่มพนักงานใหม่
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง หรือเบอร์โทร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#64748b" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: 'white' }}
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">ปฏิบัติงานปกติ</option>
              <option value="inactive">ลาออก/พักงาน</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>รหัส</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>พนักงาน</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ตำแหน่ง</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>เบอร์โทร</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>สถานะ</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => openDetail(emp, false)}
                    style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 600, color: '#0ea5e9', whiteSpace: 'nowrap' }}>{emp.id}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontWeight: 700 }}>
                          {emp.photo ? <img src={emp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emp.name?.charAt(0) || <User size={18} />)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.site || 'ส่วนกลาง'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{emp.position || emp.role || '-'}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{emp.phone || '-'}</td>
                    <td style={{ padding: '14px 20px' }}>{getStatusBadge(emp.status)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button type="button" title="ดูรายละเอียด" onClick={() => openDetail(emp, false)} style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <Eye size={16} />
                        </button>
                        <button type="button" title="แก้ไข" onClick={() => openDetail(emp, true)} style={{ padding: '8px', backgroundColor: '#fff7ed', color: '#ea580c', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          <Edit3 size={16} />
                        </button>
                        <Link href={`/hr/id-card?id=${emp.id}`} title="บัตรพนักงาน" style={{ padding: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', display: 'flex' }}>
                          <CreditCard size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <User size={40} style={{ margin: '0 auto 12px', opacity: 0.45 }} />
                      <p style={{ margin: 0 }}>ไม่พบพนักงานตามเงื่อนไขค้นหา</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ดู / แก้ไข */}
      {selectedEmp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', padding: '24px', color: 'white', display: 'flex', gap: '16px', alignItems: 'center', position: 'sticky', top: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden', flexShrink: 0 }}>
                {selectedEmp.photo ? <img src={selectedEmp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedEmp.name?.charAt(0) || '?')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>{isEditing ? 'แก้ไขข้อมูลพนักงาน' : selectedEmp.name}</h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>{selectedEmp.position || selectedEmp.role} · {selectedEmp.id}</p>
              </div>
              <button type="button" onClick={closeModal} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={fieldLabel}>ชื่อ-นามสกุล *</div>
                    <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <div style={fieldLabel}>ตำแหน่ง *</div>
                    <input style={inputStyle} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
                  </div>
                  <div>
                    <div style={fieldLabel}>เบอร์โทร *</div>
                    <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div>
                    <div style={fieldLabel}>ไซต์งานประจำ</div>
                    <input style={inputStyle} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="ส่วนกลาง / ชื่อไซต์" />
                  </div>
                  <div>
                    <div style={fieldLabel}>สถานะ</div>
                    <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">ปฏิบัติงานปกติ</option>
                      <option value="inactive">ลาออก/พักงาน</option>
                    </select>
                  </div>
                  <div>
                    <div style={fieldLabel}>ชื่อผู้ใช้เข้าสู่ระบบ</div>
                    <input style={inputStyle} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div>
                    <div style={fieldLabel}>รหัสผ่าน</div>
                    <input style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={fieldLabel}>ที่อยู่</div>
                    <input style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div>
                    <div style={fieldLabel}>ผู้ติดต่อฉุกเฉิน</div>
                    <input style={inputStyle} value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
                  </div>
                  <div>
                    <div style={fieldLabel}>เบอร์ฉุกเฉิน</div>
                    <input style={inputStyle} value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={fieldLabel}>ความสัมพันธ์</div>
                    <input style={inputStyle} value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} placeholder="เช่น คู่สมรส / บิดา-มารดา" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleDelete} style={{ padding: '10px 14px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> ลบ
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
                    <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>บันทึก</button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ padding: '8px 24px 24px' }}>
                {[
                  { icon: <IdCard size={18} color="#0ea5e9" />, label: 'รหัสพนักงาน', value: selectedEmp.id },
                  { icon: <User size={18} color="#0ea5e9" />, label: 'ชื่อ-นามสกุล', value: selectedEmp.name },
                  { icon: <Briefcase size={18} color="#0ea5e9" />, label: 'ตำแหน่ง', value: selectedEmp.position || selectedEmp.role || '-' },
                  { icon: <Phone size={18} color="#0ea5e9" />, label: 'เบอร์โทรศัพท์', value: selectedEmp.phone || '-' },
                  { icon: <MapPin size={18} color="#0ea5e9" />, label: 'ไซต์งานประจำ', value: selectedEmp.site || 'ส่วนกลาง / ยังไม่ได้กำหนด' },
                  { icon: <Shield size={18} color="#0ea5e9" />, label: 'บัญชีเข้าสู่ระบบ', value: `${selectedEmp.username || selectedEmp.id} · รหัสผ่านถูกซ่อนไว้` },
                  { icon: <BadgeCheck size={18} color={selectedEmp.status === 'active' ? '#16a34a' : '#94a3b8'} />, label: 'สถานะ', value: selectedEmp.status === 'active' ? 'ปฏิบัติงานปกติ' : 'ลาออก/พักงาน' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ marginTop: 2 }}>{row.icon}</div>
                    <div>
                      <div style={fieldLabel}>{row.label}</div>
                      <p style={fieldValue}>{row.value}</p>
                    </div>
                  </div>
                ))}

                {(selectedEmp.address || selectedEmp.emergencyName) && (
                  <div style={{ marginTop: '8px', padding: '14px', background: '#f8fafc', borderRadius: '10px' }}>
                    {selectedEmp.address && (
                      <p style={{ margin: '0 0 8px', fontSize: '0.9rem' }}><strong>ที่อยู่:</strong> {selectedEmp.address}</p>
                    )}
                    {selectedEmp.emergencyName && (
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        <strong>ฉุกเฉิน:</strong> {selectedEmp.emergencyName}
                        {selectedEmp.emergencyRelation ? ` (${selectedEmp.emergencyRelation})` : ''}
                        {selectedEmp.emergencyPhone ? ` · ${selectedEmp.emergencyPhone}` : ''}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Link href={`/hr/id-card?id=${selectedEmp.id}`} style={{ padding: '10px 14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} /> บัตรพนักงาน
                  </Link>
                  <button type="button" onClick={() => setIsEditing(true)} style={{ padding: '10px 18px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={16} /> แก้ไขข้อมูล
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
