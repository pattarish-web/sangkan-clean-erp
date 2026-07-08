'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Star, Users, Building, FileText, X, Loader2, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { fetchCustomers, saveCustomer, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

const emptyForm = { taxId: '', branchCode: '00000', name: '', address: '', zip: '', phone: '', email: '', contactName: '', contactPosition: '', contactPhone: '' };

export default function CustomersPage() {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSearchingTax, setIsSearchingTax] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const data = await fetchCustomers();
    setCustomers(data || []);
    setLoading(false);
  }

  const handleOpenNew = () => {
    setFormData(emptyForm);
    setAvailableBranches([]);
    setEditMode(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setFormData({
      taxId: c.taxId || '',
      branchCode: c.branchCode || '00000',
      name: c.name || '',
      address: c.address || '',
      zip: c.zip || '',
      phone: c.phone || '',
      email: c.email || '',
      contactName: c.contacts?.[0]?.name || '',
      contactPosition: c.contacts?.[0]?.position || '',
      contactPhone: c.contacts?.[0]?.phone || '',
    });
    setAvailableBranches([]);
    setEditMode(true);
    setEditId(c.id);
    setIsModalOpen(true);
  };

  const handleSearchTaxId = () => {
    if (formData.taxId.length !== 13) return;
    setIsSearchingTax(true);
    setAvailableBranches([]);
    // จำลองการเรียก API กรมสรรพากร — ในอนาคตเชื่อมจริงได้
    setTimeout(() => {
      const mockBranches = [
        { code: '00000', name: `บริษัท ตัวอย่าง จำกัด (สำนักงานใหญ่)`, address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม.', zip: '10110' },
        { code: '00001', name: `บริษัท ตัวอย่าง จำกัด (สาขาบางนา)`, address: '99/9 ถนนบางนา-ตราด สมุทรปราการ', zip: '10540' },
      ];
      setAvailableBranches(mockBranches);
      setFormData(prev => ({ ...prev, branchCode: mockBranches[0].code, name: mockBranches[0].name, address: mockBranches[0].address, zip: mockBranches[0].zip }));
      setIsSearchingTax(false);
    }, 1200);
  };

  const handleSelectBranch = (code) => {
    const b = availableBranches.find(b => b.code === code);
    if (b) setFormData(prev => ({ ...prev, branchCode: b.code, name: b.name, address: b.address, zip: b.zip }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { showToast('กรุณากรอกชื่อบริษัท / ลูกค้า', 'error'); return; }
    const id = editId || ('CUS' + Date.now());
    const data = {
      id,
      taxId: formData.taxId,
      branchCode: formData.branchCode,
      name: formData.name.trim(),
      address: formData.address.trim(),
      zip: formData.zip.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      contacts: formData.contactName ? [{ name: formData.contactName, position: formData.contactPosition, phone: formData.contactPhone }] : [],
      rating: 5,
    };
    await saveCustomer(data);
    await loadCustomers();
    showToast(editMode ? 'บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว' : 'เพิ่มลูกค้าใหม่เรียบร้อยแล้ว', 'success');
    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`ต้องการลบลูกค้า "${name}" ออกจากระบบใช่หรือไม่?`)) return;
    await deleteData('Customers', id);
    await loadCustomers();
    showToast(`ลบข้อมูล "${name}" เรียบร้อยแล้ว`, 'success');
  };

  const filtered = customers.filter(c =>
    (c.name || '').includes(searchQuery) ||
    (c.taxId || '').includes(searchQuery) ||
    (c.phone || '').includes(searchQuery)
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>ลูกค้า &amp; สัญญาจ้าง</h2>
          <p style={{ color: 'var(--text-muted)' }}>จัดการข้อมูลลูกค้า ผู้ติดต่อ และสัญญาจ้างทั้งหมด</p>
        </div>
        <button onClick={handleOpenNew} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
          <Plus size={20} /> เพิ่มลูกค้าใหม่
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', backgroundColor: '#f8fafc' }}>
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เลขผู้เสียภาษี, เบอร์โทร..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '1rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 8px', fontWeight: '500', width: '30%' }}>ข้อมูลลูกค้า</th>
                <th style={{ padding: '16px 8px', fontWeight: '500', width: '25%' }}>ผู้ติดต่อ</th>
                <th style={{ padding: '16px 8px', fontWeight: '500', width: '30%' }}>ที่อยู่</th>
                <th style={{ padding: '16px 8px', fontWeight: '500', width: '15%', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {/* ข้อมูลลูกค้า */}
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1.05rem' }}>{c.name}</div>
                    {c.taxId && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>เลขผู้เสียภาษี: {c.taxId}</div>}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>รหัส: {c.id}</div>
                    {c.phone && (
                      <div style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} /> <a href={`tel:${c.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>{c.phone}</a>
                      </div>
                    )}
                    {c.rating > 0 && (
                      <div style={{ marginTop: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[...Array(Math.min(c.rating, 5))].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                      </div>
                    )}
                  </td>

                  {/* ผู้ติดต่อ */}
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    {c.contacts && c.contacts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {c.contacts.map((ct, i) => (
                          <div key={i} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: '500', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={14} /> {ct.name}
                            </div>
                            {ct.position && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ct.position}</div>}
                            {ct.phone && <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '4px' }}>{ct.phone}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ไม่มีผู้ติดต่อ</span>
                    )}
                  </td>

                  {/* ที่อยู่ */}
                  <td style={{ padding: '16px 8px', verticalAlign: 'top', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {c.address || '-'}
                    {c.zip && <div style={{ marginTop: '4px' }}>รหัสไปรษณีย์: {c.zip}</div>}
                    {c.email && <div style={{ marginTop: '4px', color: 'var(--primary-color)' }}>{c.email}</div>}
                  </td>

                  {/* จัดการ */}
                  <td style={{ padding: '16px 8px', verticalAlign: 'top', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}
                      >
                        <Edit size={14} /> แก้ไข
                      </button>
                      <Link href={`/quotation/create?type=bigcleaning`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#e0f2fe', color: 'var(--primary-dark)', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
                        <FileText size={14} /> สร้างใบเสนอ
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ยังไม่มีข้อมูลลูกค้า กดปุ่ม &quot;เพิ่มลูกค้าใหม่&quot; เพื่อเริ่มต้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขลูกค้า */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                {editMode ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* เลขผู้เสียภาษี */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" maxLength={13}
                    placeholder="กรอกเลข 13 หลัก..."
                    value={formData.taxId}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
                  />
                  <button
                    onClick={handleSearchTaxId}
                    disabled={formData.taxId.length !== 13 || isSearchingTax}
                    style={{ backgroundColor: formData.taxId.length === 13 ? 'var(--primary-color)' : '#e2e8f0', color: formData.taxId.length === 13 ? 'white' : 'var(--text-muted)', padding: '0 16px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: formData.taxId.length === 13 ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                  >
                    {isSearchingTax ? <><Loader2 size={16} /> กำลังค้นหา</> : 'ค้นหาข้อมูล'}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>* กรอกเลขผู้เสียภาษีแล้วกดค้นหาเพื่อดึงข้อมูลบริษัทอัตโนมัติ</p>
              </div>

              {/* เลือกสาขา */}
              {availableBranches.length > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#166534' }}>พบข้อมูล! เลือกสาขา:</label>
                  <select
                    value={formData.branchCode}
                    onChange={e => handleSelectBranch(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #86efac', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white', color: '#166534', cursor: 'pointer' }}
                  >
                    {availableBranches.map(b => (
                      <option key={b.code} value={b.code}>{b.code === '00000' ? 'สำนักงานใหญ่' : `สาขา ${b.code}`} — {b.address}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ชื่อบริษัท */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>ชื่อบริษัท / ลูกค้า <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="เช่น บจก. สยาม เทค จำกัด" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
              </div>

              {/* ที่อยู่ */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>ที่อยู่จดทะเบียน</label>
                <textarea rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem', resize: 'vertical' }} />
              </div>

              {/* รหัสไปรษณีย์ + เบอร์โทร + อีเมล */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>รหัสไปรษณีย์</label>
                  <input type="text" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>เบอร์โทรบริษัท</label>
                  <input type="text" placeholder="02-xxx-xxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>อีเมล</label>
                <input type="email" placeholder="info@company.co.th" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
              </div>

              {/* ผู้ติดต่อหลัก */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--primary-dark)' }}>👤 ผู้ติดต่อหลัก</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="ชื่อผู้ติดต่อ" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="ตำแหน่ง" value={formData.contactPosition} onChange={e => setFormData({ ...formData, contactPosition: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                    <input type="text" placeholder="เบอร์โทรผู้ติดต่อ" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleSave} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                {editMode ? '💾 บันทึกการแก้ไข' : '✅ เพิ่มลูกค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
