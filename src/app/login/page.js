'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { QrCode, KeyRound, User, Lock, ArrowRight, Loader } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

async function loginRequest(user, pass) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
  }
  return data.employee;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();

  const [loginMethod, setLoginMethod] = useState('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const redirectAfterLogin = () => {
    const next = searchParams.get('next') || '/';
    router.push(next.startsWith('/') ? next : '/');
  };

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const userParam = searchParams.get('user');
    const passParam = searchParams.get('pass');

    if (tokenParam) {
      setIsLoggingIn(true);
      fetch('/api/auth/qr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam }),
        credentials: 'include',
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error);
          return data.employee;
        })
        .then((emp) => {
          showToast(`📲 เข้าสู่ระบบอัตโนมัติด้วย QR Code ของพนักงานรหัส ${emp.id} สำเร็จ!`, 'success');
          redirectAfterLogin();
        })
        .catch(() => {
          setIsLoggingIn(false);
          showToast('QR Code ไม่ถูกต้องหรือหมดอายุ', 'error');
        });
      return;
    }

    if (userParam && passParam) {
      showToast('ลิงก์เข้าสู่ระบบแบบเก่าไม่รองรับแล้ว — กรุณาสแกน QR Code บนบัตรพนักงาน', 'warning');
      return;
    }
  }, [searchParams]);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('กรุณากรอกรหัสพนักงานและรหัสผ่าน', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      const emp = await loginRequest(username.trim(), password.trim());
      showToast(`🔓 เข้าสู่ระบบพนักงาน ${emp.name} สำเร็จ!`, 'success');
      redirectAfterLogin();
    } catch (err) {
      setIsLoggingIn(false);
      showToast(err.message || 'ไม่สามารถเข้าสู่ระบบได้', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ backgroundColor: 'var(--white)', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '480px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Sangkan Cleaning" style={{ height: '75px', objectFit: 'contain', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>เข้าสู่ระบบ ERP</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>บริษัท สั่งการ คลีน (Sangkan Clean)</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', backgroundColor: loginMethod === 'password' ? 'white' : 'transparent', color: loginMethod === 'password' ? 'var(--primary-dark)' : 'var(--text-muted)', boxShadow: loginMethod === 'password' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
          >
            <KeyRound size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            รหัสผ่าน
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('qrcode')}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', backgroundColor: loginMethod === 'qrcode' ? 'white' : 'transparent', color: loginMethod === 'qrcode' ? 'var(--primary-dark)' : 'var(--text-muted)', boxShadow: loginMethod === 'qrcode' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
          >
            <QrCode size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            QR Code
          </button>
        </div>

        {loginMethod === 'password' ? (
          <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>รหัสพนักงาน / Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น SKC0001"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน 4 หลัก"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{ marginTop: '8px', padding: '14px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: isLoggingIn ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLoggingIn ? 0.7 : 1 }}
            >
              {isLoggingIn ? <Loader size={20} className="spin" /> : <ArrowRight size={20} />}
              {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <QrCode size={64} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>สแกน QR Code บนบัตรพนักงาน หรือเปิดลิงก์จากหน้าบัตรพนักงาน (HR → พิมพ์บัตร)</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>กำลังโหลด...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
