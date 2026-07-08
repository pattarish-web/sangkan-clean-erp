'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, Package, Droplets, Wrench, Home, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

import { fetchData } from '@/utils/api';

export default function InventoryList() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      try {
        const data = await fetchData('Inventory');
        setItems(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInventory();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'chemical': return <Droplets size={18} color="#0ea5e9" />;
      case 'equipment': return <Wrench size={18} color="#f59e0b" />;
      case 'supply': return <Package size={18} color="#10b981" />;
      default: return <Package size={18} color="#64748b" />;
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'chemical': return 'น้ำยาเคมีภัณฑ์';
      case 'equipment': return 'เครื่องจักร/อุปกรณ์';
      case 'supply': return 'วัสดุสิ้นเปลือง';
      default: return 'อื่นๆ';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
               <Home size={20} />
           </Link>
           <div>
             <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>คลังสินค้า & จัดซื้อ (Inventory)</h1>
             <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>จัดการสต็อกน้ำยา เครื่องจักร และอุปกรณ์หน้างาน</p>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/inventory/pr" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', color: 'var(--text-main)', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none' }}>
            <ArrowUp size={20} /> เบิกของ (PR)
          </Link>
          <Link href="/inventory/po" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none' }}>
            <ArrowDown size={20} /> สั่งซื้อของ (PO)
          </Link>
          <Link href="/inventory/create" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none' }}>
            <Plus size={20} /> เพิ่มสินค้าใหม่
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>จำนวนรายการทั้งหมด</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{items.length}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>มูลค่าคงคลังรวม (บาท)</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>
            {items.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString()}
          </p>
        </div>
        <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> ต่ำกว่าจุดสั่งซื้อ (Min Stock)
          </p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#991b1b' }}>
            {items.filter(item => item.qty < item.minStock).length}
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input 
              type="text" 
              placeholder="ค้นหารหัสสินค้า หรือชื่อสินค้า..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
            />
          </div>
          <select style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: 'white' }}>
            <option value="all">ทุกหมวดหมู่</option>
            <option value="chemical">น้ำยาเคมีภัณฑ์</option>
            <option value="equipment">เครื่องจักร/อุปกรณ์</option>
            <option value="supply">วัสดุสิ้นเปลือง</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>รหัสสินค้า</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>รายการสินค้า</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px' }}>หมวดหมู่</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px', textAlign: 'right' }}>คงเหลือ</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>สถานะ</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(item => item.name.includes(searchQuery) || item.id.includes(searchQuery)).map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s', backgroundColor: item.qty < item.minStock ? '#fef2f2' : 'white' }}>
                  <td style={{ padding: '16px 20px', fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>{item.id}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontSize: '15px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b' }}>
                      {getCategoryIcon(item.category)}
                      {getCategoryName(item.category)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '15px', fontWeight: 'bold', textAlign: 'right', color: item.qty < item.minStock ? '#ef4444' : '#0f172a' }}>
                    {item.qty} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>{item.unit}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    {item.qty < item.minStock ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                        ต้องสั่งซื้อด่วน
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                        ปกติ
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {item.qty < item.minStock && (
                        <Link 
                          href={`/inventory/po?prefillId=${item.id}`} 
                          style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none', border: '1px solid #bfdbfe', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}
                        >
                          ➕ สั่งซื้อด่วน (PO)
                        </Link>
                      )}
                      <button onClick={() => alert(`ประวัติการเบิกจ่ายของ ${item.name}: ไม่มีการเบิกเพิ่มใน 30 วันที่ผ่านมา`)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'background-color 0.2s', fontSize: '13px', fontWeight: '500' }}>
                        ประวัติการเบิก
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Package size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '16px', margin: 0 }}>ยังไม่มีข้อมูลสินค้า</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
