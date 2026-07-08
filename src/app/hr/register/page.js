'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Camera, ArrowLeft, Upload, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function RegisterEmployee() {
  const router = useRouter();
  const showToast = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('แม่บ้านประจำ');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [photo, setPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [nextId, setNextId] = useState('SKC0001');

  useEffect(() => {
    async function loadNextId() {
      try {
        const emps = await fetchData('Employees');
        if (emps && emps.length > 0) {
          // ค้นหา ID ที่ขึ้นต้นด้วย SKC แล้วหาลำดับสูงสุด
          const scNums = emps
            .map(e => e.id)
            .filter(id => id && id.startsWith('SKC'))
            .map(id => parseInt(id.replace('SKC', ''), 10))
            .filter(n => !isNaN(n));
          
          if (scNums.length > 0) {
            const max = Math.max(...scNums);
            const next = max + 1;
            setNextId(`SKC${next.toString().padStart(4, '0')}`);
          } else {
            // กรณีไม่มีรหัส SKC เลย ให้ใช้จำนวนพนักงานที่มี + 1
            const count = emps.length;
            setNextId(`SKC${(count + 1).toString().padStart(4, '0')}`);
          }
        } else {
          setNextId('SKC0001');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadNextId();
  }, []);

  // Convert uploaded image to Base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('กรุณากรอกชื่อและนามสกุลพนักงาน', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('กรุณากรอกเบอร์โทรศัพท์', 'error');
      return;
    }

    setIsSaving(true);

    // รหัสผ่านที่ง่ายและสะดวก: ดึงเอาเลขท้าย 4 ตัวของเบอร์โทรศัพท์ ถ้าไม่มีให้เป็น sc1234
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const empPassword = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';

    const newEmp = {
      id: nextId,
      name: `${firstName.trim()} ${lastName.trim()}`,
      position,
      role: position, // for compatibility
      phone: phone.trim(),
      address: address.trim(),
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relationship: emergencyRelation.trim()
      },
      status: 'active',
      photo: photo || '',
      site: 'ส่วนกลาง',
      // ข้อมูลการเข้าสู่ระบบที่สร้างให้อัตโนมัติ
      username: nextId,
      password: empPassword
    };

    try {
      await saveData('Employees', newEmp);
      showToast(`ลงทะเบียนสำเร็จ! รหัสพนักงาน: ${nextId} | รหัสผ่านล็อกอิน: ${empPassword}`, 'success');
      setTimeout(() => {
        router.push('/hr/employees');
      }, 2000);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/hr/employees" style={{ backgroundColor: 'white', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', color: 'var(--text-main)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>ลงทะเบียนพนักงานใหม่</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>บันทึกประวัติพนักงาน รูปถ่าย และข้อมูลสำหรับสร้างบัญชีผู้ใช้งานอัตโนมัติ</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* คอลัมน์ซ้าย: รูปถ่าย */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 16px 0', textAlign: 'left', color: 'var(--text-main)' }}>รูปถ่ายพนักงาน</h3>
            
            <div style={{ 
              width: '180px', height: '240px', backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1', 
              borderRadius: '12px', margin: '0 auto 16px auto', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer',
              overflow: 'hidden', position: 'relative'
            }}>
              {photo ? (
                <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={48} style={{ marginBottom: '12px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>อัปโหลดรูปภาพ</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>รูปนี้จะถูกนำไปใช้พิมพ์บนบัตรพนักงานโดยอัตโนมัติ</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> ข้อมูลการล็อกอินแนะแนว
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Username:</strong> <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{nextId}</span></div>
              <div><strong>Password:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{phone ? (phone.replace(/[^0-9]/g, '').slice(-4) || '1234') : 'เลขท้ายเบอร์โทร 4 ตัว'}</span></div>
              <p style={{ fontSize: '0.8rem', margin: '8px 0 0 0', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                💡 รหัสผ่านจะถูกตั้งเป็นเลขท้าย 4 ตัวของเบอร์มือถือโดยอัตโนมัติ เพื่อให้จำง่ายและสแกนเข้าใช้งานได้สะดวกรวดเร็วค่ะ
              </p>
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: ฟอร์มข้อมูล */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', color: 'var(--primary-dark)' }}>
            ข้อมูลส่วนตัวและตำแหน่งงาน
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>รหัสพนักงาน (ระบบรันให้อัตโนมัติ)</label>
              <input type="text" value={nextId} readOnly style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0ea5e9' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>ชื่อจริง *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="ชื่อ" required style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>นามสกุล *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="นามสกุล" required style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>เบอร์โทรศัพท์ *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="เช่น 0891234567" required style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>ตำแหน่งงาน *</label>
              <select value={position} onChange={e => setPosition(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem', backgroundColor: 'white' }}>
                <option value="แม่บ้านประจำ">แม่บ้านประจำ</option>
                <option value="หัวหน้าแม่บ้าน">หัวหน้าแม่บ้าน</option>
                <option value="สายตรวจ (QA)">สายตรวจ (QA)</option>
                <option value="พนักงานขับรถ">พนักงานขับรถ</option>
              </select>
            </div>
            
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>ที่อยู่ปัจจุบัน</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด" style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}></textarea>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '32px 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', color: 'var(--primary-dark)' }}>
            ข้อมูลสำหรับติดต่อกรณีฉุกเฉิน
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>ชื่อผู้ติดต่อฉุกเฉิน</label>
              <input type="text" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="ชื่อ-นามสกุล" style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>เบอร์โทรศัพท์</label>
              <input type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="08X-XXX-XXXX" style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>ความสัมพันธ์</label>
              <input type="text" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} placeholder="เช่น บิดา, มารดา, สามี, ภรรยา" style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <Link href="/hr/employees" style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', color: 'var(--text-main)', textDecoration: 'none', textAlign: 'center' }}>
              ยกเลิก
            </Link>
            <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', backgroundColor: isSaving ? '#6b7280' : '#10b981', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <Save size={20} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกและสร้างประวัติ'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
