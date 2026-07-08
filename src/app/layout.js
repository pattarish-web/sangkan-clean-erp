'use client';

import './globals.css';
import { Home, Users, Briefcase, FileText, UserCircle, DollarSign, Settings, Columns } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import AuthBar from '@/components/AuthBar';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith('/share');

  return (
    <html lang="th">
      <head>
        <title>สั่งการ คลีน - ERP</title>
      </head>
      <body>
        <ToastProvider>
          <div className="app-container">
            {!isSharePage && (
              <header className="topbar-main">
                <div className="topbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/logo.png" alt="Sangkan Cleaning" style={{ height: '38px', objectFit: 'contain', backgroundColor: 'white', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <nav className="top-nav">
                  <Link href="/" className="nav-item"><Home size={20} /> แดชบอร์ด</Link>
                  <Link href="/crm" className="nav-item"><Columns size={20} /> CRM &amp; กระดานขาย</Link>
                  <Link href="/customers" className="nav-item"><Users size={20} /> ลูกค้า &amp; สัญญา</Link>
                  <Link href="/quotation" className="nav-item"><FileText size={20} /> เอกสารขาย</Link>
                  <Link href="/operations" className="nav-item"><Briefcase size={20} /> ปฏิบัติการหน้างาน</Link>
                  <Link href="/inventory" className="nav-item"><FileText size={20} /> คลังสินค้า &amp; จัดซื้อ</Link>
                  <Link href="/finance/expenses" className="nav-item"><DollarSign size={20} /> การเงิน</Link>
                  <Link href="/hr" className="nav-item"><UserCircle size={20} /> บุคคล (HR)</Link>
                  <Link href="/settings" className="nav-item"><Settings size={20} /> ตั้งค่าระบบ</Link>
                </nav>
                <AuthBar />
              </header>
            )}
            <main className="main-content" style={isSharePage ? { backgroundColor: '#f1f5f9' } : {}}>
              <div className="page-content" style={isSharePage ? { padding: '20px 0' } : {}}>
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
