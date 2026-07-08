'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { fetchItemCatalog } from '@/utils/api';

export default function ItemMasterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchItemCatalog();
      setInventoryItems(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredItems = inventoryItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>รายการสินค้า (Item Master)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ฐานข้อมูลสินค้า น้ำยา และอุปกรณ์ทั้งหมดในคลัง</p>
        </div>
        <Link href="/under-construction" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(14,165,233,0.2)', textDecoration: 'none' }}>
          <Plus size={20} /> เพิ่มสินค้าใหม่
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหา ชื่อสินค้า, รหัสสินค้า, หมวดหมู่..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <Link href="/under-construction" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', textDecoration: 'none' }}>
            <Filter size={18} /> กรองหมวดหมู่
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดรายการสินค้า...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '500', width: '120px' }}>รหัส</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>ชื่อสินค้า</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>หมวดหมู่</th>
                <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'center' }}>คงเหลือในคลัง</th>
                <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'right' }}>ต้นทุน/หน่วย</th>
                <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.id}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 'bold', color: item.stock < 20 ? '#ef4444' : '#10b981' }}>
                    {item.stock} <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '500' }}>฿{item.price.toFixed(2)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <Link href="/under-construction" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}><Edit size={18} /></Link>
                      <Link href="/under-construction" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ไม่พบรายการสินค้าที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
