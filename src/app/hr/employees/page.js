'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CreditCard, Edit3, Trash2, X, Eye, User, Phone, Briefcase, IdCard, MapPin, Shield, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
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

export default function EmployeeList() {
  const showToast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', position: '', phone: '', site: '', status: 'active',
    username: '', password: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  });

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

    const updatedEmp = {
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
      await saveData('Employees', updatedEmp);
      setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp)));
      setSelectedEmp(updatedEmp);
      setIsEditing(false);
      showToast(`แก้ไขข้อมูลพนักงาน ${updatedEmp.name} สำเร็จ!`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล', 'error');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!confirm(`คุณแน่ใจว่าต้องการลบพนักงาน ${name} ออกจากระบบ? การลบนี้จะไม่สามารถย้อนคืนได้`)) return;
    try {
      await deleteData('Employees', id);
      setEmployees(employees.filter((emp) => emp.id !== id));
      if (selectedEmp?.id === id) closeModal();
      showToast(`ลบรายชื่อพนักงาน ${name} เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบพนักงาน', 'error');
    }
  };

  const filtered = employees.filter((emp) =>
    (emp.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.position || emp.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.site || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>รายชื่อพนักงานทั้งหมด</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>คลิกแถวเพื่อดูรายละเอียด · กดแก้ไขเพื่ออัปเดตข้อมูล</p>
        </div>
        <Link href="/hr/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
          <UserPlus size={20} /> ลงทะเบียนพนักงานใหม่
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="ค้นหา รหัสพนักงาน, ชื่อ, ตำแหน่ง หรือไซต์งาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลพนักงาน...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: '600', whiteSpace: 'nowrap' }}>รหัส</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600' }}>ชื่อ-นามสกุล</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600', whiteSpace: 'nowrap' }}>ตำแหน่ง</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600', whiteSpace: 'nowrap' }}>ไซต์งาน</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600', whiteSpace: 'nowrap' }}>เบอร์โทร</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>สถานะ</th>
                  <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => openDetail(emp, false)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '16px 20px', color: '#0ea5e9', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{emp.id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>User: {emp.username || emp.id}</div>
                    </td>
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>{emp.position || emp.role || 'แม่บ้านประจำ'}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{emp.site || 'ส่วนกลาง'}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{emp.phone}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: emp.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: emp.status === 'active' ? '#166534' : '#991b1b',
                        padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                      }}>
                        {emp.status === 'active' ? 'ปฏิบัติงานปกติ' : 'ลาออก/พักงาน'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                        <button type="button" onClick={() => openDetail(emp, false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <Eye size={14} /> ดู
                        </button>
                        <button type="button" onClick={() => openDetail(emp, true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <Edit3 size={14} /> แก้ไข
                        </button>
                        <Link href={`/hr/id-card?id=${emp.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0ea5e9', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          <CreditCard size={14} /> บัตร
                        </Link>
                        <button type="button" onClick={() => handleDeleteEmployee(emp.id, emp.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
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
          </div>
        )}
      </div>

      {selectedEmp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', padding: '24px', color: 'white', display: 'flex', gap: '16px', alignItems: 'center', position: 'sticky', top: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden', flexShrink: 0 }}>
                {selectedEmp.photo ? <img src={selectedEmp.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedEmp.name?.charAt(0) || '?')}
              </div>
              <div style={{ flex: 1 }}>
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
                    <input style={inputStyle} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
                  </div>
                  <div>
                    <div style={fieldLabel}>สถานะ</div>
                    <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">ปฏิบัติงานปกติ</option>
                      <option value="inactive">ลาออก/พักงาน</option>
                    </select>
                  </div>
                  <div>
                    <div style={fieldLabel}>ชื่อผู้ใช้</div>
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
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
                  <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>บันทึก</button>
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
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
