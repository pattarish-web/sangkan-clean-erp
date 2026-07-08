'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ArrowDown, Save } from 'lucide-react';
import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function PurchaseOrderForm() {
  const showToast = useToast();
  const router = useRouter();

  const [poNo, setPoNo] = useState('PO202607001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState([
    { id: 1, itemId: '', qty: 1, price: 0 }
  ]);

  const [availableItems, setAvailableItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [data, pos] = await Promise.all([
        fetchData('Inventory'),
        fetchData('PurchaseOrders')
      ]);
      setAvailableItems(data || []);

      // รันเลขที่ PO แบบต่อเนื่องอ้างอิงปีและเดือนปัจจุบัน
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `PO${year}${month}`;
      
      const thisMonthNums = (pos || [])
        .map(p => p.id)
        .filter(id => id && id.startsWith(prefix))
        .map(id => parseInt(id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));

      let nextNum = 1;
      if (thisMonthNums.length > 0) {
        nextNum = Math.max(...thisMonthNums) + 1;
      }
      setPoNo(`${prefix}${nextNum.toString().padStart(3, '0')}`);

      // ดึงรหัส prefill สินค้าขาดสต็อก
      const params = new URLSearchParams(window.location.search);
      const prefillId = params.get('prefillId');
      if (prefillId && data) {
        const selected = data.find(i => i.id === prefillId);
        if (selected) {
          const diffQty = selected.minStock > selected.qty ? selected.minStock - selected.qty : 5;
          setItems([{ id: 1, itemId: prefillId, qty: diffQty, price: selected.price || 0 }]);
        }
      }
    };
    load();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: items.length + 1, itemId: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleChangeItem = (id, field, value) => {
    if (field === 'itemId') {
      const selected = availableItems.find(i => i.id === value);
      setItems(items.map(item => item.id === id ? { ...item, itemId: value, price: selected ? selected.price : 0 } : item));
    } else {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    }
  };

  const handleSave = async () => {
    if (!supplierName.trim()) {
      showToast('กรุณาระบุชื่อผู้ผลิต/ผู้จัดจำหน่าย (Supplier)', 'error');
      return;
    }

    const invalidItem = items.some(item => !item.itemId || item.qty <= 0);
    if (invalidItem) {
      showToast('กรุณาเลือกรายการสินค้าและกรอกจำนวนที่ต้องการสั่งซื้อให้ถูกต้อง', 'error');
      return;
    }

    setSaving(true);
    
    const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const newPO = {
      id: poNo,
      date,
      vendor: supplierName,
      supplierName: supplierName,
      total: subTotal,
      status: 'pending',
      items: items.map(item => {
        const detail = availableItems.find(i => i.id === item.itemId);
        return {
          itemId: item.itemId,
          name: detail ? detail.name : 'สินค้าทั่วไป',
          qty: item.qty,
          price: item.price
        };
      })
    };

    try {
      await saveData('PurchaseOrders', newPO);
      showToast(`💵 ออกใบสั่งซื้อสินค้า ${poNo} สำเร็จ!`, 'success');
      setTimeout(() => {
        router.push('/inventory/purchasing');
      }, 1000);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกใบสั่งซื้อ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/inventory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
           <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>ใบสั่งซื้อสินค้า (Purchase Order)</h1>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>เปิดออเดอร์สั่งซื้อสินค้าเติมเข้าคลัง</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>เลขที่ใบสั่งซื้อ (PO No.)</label>
            <input type="text" value={poNo} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>วันที่สั่งซื้อ</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>ผู้ผลิต/ผู้จัดจำหน่าย (Supplier) <span style={{ color: 'red' }}>*</span></label>
            <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="ระบุชื่อร้านค้า หรือผู้ผลิต" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} />
          </div>
        </div>

        {/* Items Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>รายการสั่งซื้อ</h3>
            <button onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#3b82f6', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
              <Plus size={16} /> เพิ่มรายการ
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '50%' }}>สินค้า/อุปกรณ์</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '15%' }}>จำนวนที่สั่ง</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '15%' }}>ราคา/หน่วย</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '15%', textAlign: 'right' }}>รวม (บาท)</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '5%', textAlign: 'center' }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <select 
                        value={item.itemId} 
                        onChange={(e) => handleChangeItem(item.id, 'itemId', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                      >
                        <option value="">-- เลือกสินค้า --</option>
                        {availableItems.map(inv => (
                          <option key={inv.id} value={inv.id}>[{inv.id}] {inv.name} (คงเหลือ {inv.qty} / Min {inv.minStock})</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.qty} 
                        onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} 
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={item.price} 
                        onChange={(e) => handleChangeItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} 
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: 'var(--text-main)' }}>
                      {(item.qty * item.price).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => handleRemoveItem(item.id)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>ยอดรวมสุทธิ</p>
              <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '24px' }}>{subTotal.toLocaleString()} บาท</h2>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: '500', cursor: 'pointer' }}>
            ยกเลิก
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer' }}>
            <ArrowDown size={20} />
            {saving ? 'กำลังบันทึก...' : 'ยืนยันการสั่งซื้อ'}
          </button>
        </div>

      </div>
    </div>
  );
}
