'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Calculator, FileCheck, FileSignature, HandCoins, ArrowDownRight, ArrowUpRight, ClipboardList, FolderKanban } from 'lucide-react';

export default function SalesLayout({ children }) {
  const pathname = usePathname();
  
  const menuItems = [
    { name: 'ใบเสนอราคา', path: '/quotation', icon: <Calculator size={18} /> },
    { name: 'ใบวางบิล/ใบแจ้งหนี้', path: '/quotation/invoice', icon: <FileText size={18} /> },
    { name: 'ใบกำกับภาษี', path: '/quotation/tax-invoice', icon: <FileCheck size={18} /> },
    { name: 'ใบเสร็จรับเงิน', path: '/quotation/receipt', icon: <FileSignature size={18} /> },
    { type: 'divider' },
    { name: 'ขายเงินสด', path: '/quotation/cash-sale', icon: <HandCoins size={18} /> },
    { type: 'divider' },
    { name: 'ใบลดหนี้', path: '/quotation/credit-note', icon: <ArrowDownRight size={18} /> },
    { name: 'ใบเพิ่มหนี้', path: '/quotation/debit-note', icon: <ArrowUpRight size={18} /> },
    { type: 'divider' },
    { name: 'ใบแจ้งรับมัดจำ', path: '/quotation/deposit', icon: <FileText size={18} /> },
    { name: 'ใบเสร็จรับมัดจำ', path: '/quotation/deposit-receipt', icon: <FileSignature size={18} /> },
    { type: 'divider' },
    { name: 'โครงการ (Projects)', path: '/quotation/project', icon: <FolderKanban size={18} /> },
  ];

  // /quotation/create shouldn't really show the sidebar, but for now we can wrap everything in it.
  // Actually, if we are in /quotation/create, it might look weird to have a sidebar. But let's see.
  // We can hide sidebar if pathname includes '/create'
  
  const isCreatePage = pathname.includes('/create');

  if (isCreatePage) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto' }}>{children}</div>;
  }

  return (
    <div className="sales-layout-container" style={{ display: 'flex', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Sidebar */}
      <div className="sales-sidebar no-print" style={{ width: '240px', flexShrink: 0, backgroundColor: 'white', borderRadius: '12px', padding: '16px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)', padding: '0 20px', marginBottom: '16px' }}>เอกสารขาย</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '12px 20px' }}></div>;
            }
            
            // Exact match for /quotation, prefix match for others to keep active state when viewing a doc
            const isActive = item.path === '/quotation' ? pathname === '/quotation' : pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 20px',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--bg-color)' : 'transparent',
                  fontWeight: isActive ? '600' : '400',
                  textDecoration: 'none',
                  borderLeft: isActive ? '4px solid var(--primary-color)' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)' }}>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="sales-main-content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
