'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Package } from 'lucide-react';

import { saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function AddInventoryItem() {
  const showToast = useToast();

  const [itemId, setItemId] = useState(`INV-CH-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('chemical');
  const [qty, setQty] = useState(0);
  const [unit, setUnit] = useState('');
  const [minStock, setMinStock] = useState(10);
  const [price, setPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategory(val);
    let prefix = 'INV-CH-';
    if (val === 'equipment') prefix = 'INV-EQ-';
    if (val === 'supply') prefix = 'INV-SP-';
    setItemId(`${prefix}${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleSave = async () => {
    if (!name || !unit) {
      showToast('กรุณากรอกชื่อสินค้าและหน่วยนับ', 'error');
      return;
    }

    setIsSaving(true);
    const newItem = {
      id: itemId,
      name,
      category,
      qty: Number(qty),
      unit,
      minStock: Number(minStock),
      price: Number(price)
    };

    try {
      await saveData('Inventory', newItem);
      showToast(`เพิ่มสินค้าใหม่: ${name} สำเร็จ! ข้อมูลถูกส่งเข้า Database แล้ว`, 'success');
      window.location.href = '/inventory';
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/inventory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
           <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>เพิ่มสินค้าใหม่ (Add New Item)</h1>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>เพิ่มรายการน้ำยา เครื่องจักร หรืออุปกรณ์ใหม่เข้าสู่คลังสินค้า</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
            <Package size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-main)' }}>ข้อมูลสินค้าพื้นฐาน</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>รหัสสินค้าจะถูกสร้างอัตโนมัติตามหมวดหมู่ที่คุณเลือก</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>หมวดหมู่สินค้า <span style={{ color: 'red' }}>*</span></label>
            <select 
              value={category} 
              onChange={handleCategoryChange}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
            >
              <option value="chemical">น้ำยาเคมีภัณฑ์ (Chemicals)</option>
              <option value="equipment">เครื่องจักร/อุปกรณ์ (Equipment)</option>
              <option value="supply">วัสดุสิ้นเปลือง (Supplies)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>รหัสสินค้า</label>
            <input 
              type="text" 
              value={itemId} 
              readOnly 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#64748b' }} 
            />
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>ชื่อสินค้า/อุปกรณ์ <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="เช่น น้ำยาดันฝุ่นสูตรน้ำ (แกลลอน 5L)"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>หน่วยนับ <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              value={unit} 
              onChange={e => setUnit(e.target.value)}
              placeholder="เช่น แกลลอน, ขวด, เครื่อง, แพ็ค"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>ราคาประเมินต่อหน่วย (บาท)</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>จำนวนเริ่มต้น (ยอดยกมา)</label>
            <input 
              type="number" 
              value={qty} 
              onChange={e => setQty(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>จุดสั่งซื้อขั้นต่ำ (Min Stock)</label>
            <input 
              type="number" 
              value={minStock} 
              onChange={e => setMinStock(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} 
            />
          </div>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Link href="/inventory" style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
            ยกเลิก
          </Link>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <Save size={20} />
            บันทึกรายการสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}
