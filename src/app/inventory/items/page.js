'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { fetchItemCatalog, saveItemCatalog, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

const emptyForm = { id: '', name: '', category: 'น้ำยา', unit: 'ขวด', price: 0, stock: 0 };

export default function ItemMasterPage() {
  const showToast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editMode, setEditMode] = useState(false);

  const load = async () => {
    const data = await fetchItemCatalog();
    setInventoryItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = inventoryItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setForm({ ...emptyForm, id: `ITM${Date.now().toString().slice(-6)}` });
    setEditMode(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast('กรุณากรอกชื่อสินค้า', 'error'); return; }
    try {
      await saveItemCatalog({ ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0 });
      showToast(editMode ? 'บันทึกเรียบร้อย' : 'เพิ่มสินค้าเรียบร้อย', 'success');
      setModalOpen(false);
      await load();
    } catch (e) {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ลบรายการนี้?')) return;
    try {
      await deleteData('Itemcatalog', id);
      showToast('ลบเรียบร้อย', 'success');
      await load();
    } catch (e) {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>รายการสินค้า (Item Master)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ฐานข้อมูลสินค้า น้ำยา และอุปกรณ์ทั้งหมดในคลัง</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          <Plus size={20} /> เพิ่มสินค้าใหม่
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="ค้นหา..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px' }}>รหัส</th>
                <th style={{ padding: '16px 20px' }}>ชื่อ</th>
                <th style={{ padding: '16px 20px' }}>หมวดหมู่</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>คงเหลือ</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>ต้นทุน</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace' }}>{item.id}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '16px 20px' }}>{item.category}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', color: (item.stock || 0) < 20 ? '#ef4444' : '#10b981' }}>{item.stock} {item.unit}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>฿{Number(item.price || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', marginRight: 8 }}><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {['id', 'name', 'category', 'unit'].map((field) => (
              <div key={field} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>{field}</label>
                <input value={form[field] || ''} readOnly={field === 'id' && editMode} onChange={e => setForm({ ...form, [field]: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>ต้นทุน</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>สต็อก</label>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
              </div>
            </div>
            <button onClick={handleSave} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={18} /> บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
