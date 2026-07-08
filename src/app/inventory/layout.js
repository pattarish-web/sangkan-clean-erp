'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileSpreadsheet, PackageSearch, PackageCheck, Wrench } from 'lucide-react';

export default function InventoryLayout({ children }) {
  const pathname = usePathname() || '';
  
  const menuItems = [
    { name: 'แดชบอร์ดคลังสินค้า', path: '/inventory', icon: <LayoutDashboard size={18} /> },
    { type: 'divider' },
    { name: 'ใบขอเบิกสินค้า (PR)', path: '/inventory/requisition', icon: <FileSpreadsheet size={18} /> },
    { name: 'รายการสั่งซื้อ (PO)', path: '/inventory/purchasing', icon: <PackageCheck size={18} /> },
    { type: 'divider' },
    { name: 'รายการสินค้า (Item Master)', path: '/inventory/items', icon: <PackageSearch size={18} /> },
    { name: 'ทะเบียนคุมอุปกรณ์', path: '/inventory/equipment', icon: <Wrench size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#f1f5f9' }}>
      <aside style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-dark)', margin: 0 }}>คลังสินค้า & จัดซื้อ</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Inventory & Procurement</p>
        </div>
        
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '12px 0' }} />;
            }
            
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                  backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
