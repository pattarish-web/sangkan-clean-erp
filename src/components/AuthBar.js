'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  if (!user) {
    return (
      <Link href="/login" className="user-profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>เข้าสู่ระบบ</span>
        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '14px', backgroundColor: '#94a3b8', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
      </Link>
    );
  }

  return (
    <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Link
        href="/profile"
        style={{ textAlign: 'right', textDecoration: 'none', color: 'inherit' }}
        title="จัดการบัญชีและรายเซ็น"
      >
        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.position || user.id}</div>
      </Link>
      <Link
        href="/profile"
        className="avatar"
        title="จัดการบัญชีและรายเซ็น"
        style={{ width: '36px', height: '36px', fontSize: '14px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
      >
        {user.name?.charAt(0) || 'A'}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        title="ออกจากระบบ"
        style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
