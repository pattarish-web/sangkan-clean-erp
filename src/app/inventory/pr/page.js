'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Plus, ArrowUpRight } from 'lucide-react';

import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function RequisitionForm() {
  const showToast = useToast();

  const [prNo, setPrNo] = useState(`PR202607${Math.floor(100 + Math.random() * 900)}`);
  const [date, setDate] = useState('2026-07-06');
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([
    { id: 1, itemId: '', qty: 1 }
  ]);

  const [availableItems, setAvailableItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [invData, empData] = await Promise.all([
        fetchData('Inventory'),
        fetchData('Employees'),
      ]);
      setAvailableItems(invData || []);
      setEmployees(empData || []);
    };
    load();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: items.length + 1, itemId: '', qty: 1 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleChangeItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    if (!employeeId) {
      showToast('กรุณาระบุรหัสพนักงานผู้เบิก', 'error');
      return;
    }

    const emp = employees.find(e => e.id === employeeId);
    const mappedItems = items
      .filter(item => item.itemId)
      .map(item => {
        const inv = availableItems.find(i => i.id === item.itemId);
        return {
          id: item.itemId,
          name: inv?.name || item.itemId,
          unit: inv?.unit || 'ชิ้น',
          category: inv?.category || '',
          price: inv?.price || 0,
          qty: Number(item.qty) || 1,
        };
      });

    if (mappedItems.length === 0) {
      showToast('กรุณาเลือกรายการสินค้าที่ต้องการเบิก', 'error');
      return;
    }

    const amount = mappedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const record = {
      id: prNo,
      date,
      by: emp?.name || employeeId,
      projectId: projectId || null,
      project: projectId || 'ส่วนกลาง',
      amount,
      status: 'pending',
      items: mappedItems,
    };

    try {
      await saveData('PurchaseRequests', record);
      showToast(`บันทึกใบเบิกอุปกรณ์เลขที่ ${prNo} สำเร็จ!`, 'success');
      window.location.href = '/inventory';
    } catch (e) {
      showToast('ไม่สามารถบันทึกใบเบิกได้', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/inventory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
           <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>ใบเบิกอุปกรณ์/น้ำยา (Material Requisition)</h1>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>เบิกของจากคลังสินค้าไปใช้หน้างาน</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>เลขที่ใบเบิก</label>
            <input type="text" value={prNo} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>วันที่เบิก</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>ผู้เบิก (พนักงาน) <span style={{ color: 'red' }}>*</span></label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}>
              <option value="">-- เลือกพนักงาน --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>[{emp.id}] {emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>อ้างอิงโปรเจกต์ (ถ้ามี)</label>
            <input type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="เช่น QT202607001" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }} />
          </div>
        </div>

        {/* Items Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>รายการที่เบิก</h3>
            <button onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#3b82f6', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
              <Plus size={16} /> เพิ่มรายการ
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '60%' }}>สินค้า/อุปกรณ์</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '20%' }}>คงเหลือในคลัง</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '15%' }}>จำนวนที่เบิก</th>
                <th style={{ padding: '12px', fontWeight: '600', color: '#64748b', fontSize: '13px', width: '5%', textAlign: 'center' }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const selectedInv = availableItems.find(i => i.id === item.itemId);
                
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
                          <option key={inv.id} value={inv.id}>[{inv.id}] {inv.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px' }}>
                      {selectedInv ? `${selectedInv.qty} ${selectedInv.unit}` : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number" 
                        min="1" 
                        max={selectedInv ? selectedInv.qty : 999}
                        value={item.qty} 
                        onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} 
                      />
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
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Link href="/inventory" style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
            ยกเลิก
          </Link>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <ArrowUpRight size={20} />
            ยืนยันการเบิกสินค้า
          </button>
        </div>

      </div>
    </div>
  );
}
