'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Briefcase, Calendar, MapPin, Users, Settings } from 'lucide-react';

export default function CreateJobOrder() {
  const [jobType, setJobType] = useState('bigclean');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'maid') {
      setJobType('maid');
    }
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/quotation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', color: 'var(--text-main)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>สร้างใบงาน (Job Order)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>อ้างอิงจากใบเสนอราคา QT202607001 (ซ่อนข้อมูลราคาสำหรับทีมปฏิบัติการ)</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ข้อมูลลูกค้าและสถานที่ */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary-color)" /> ข้อมูลลูกค้า
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>ชื่อลูกค้า / นิติบุคคล</label>
                <input type="text" value="บจก. อัลฟ่า เทค (สำนักงานใหญ่)" readOnly style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc', color: 'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>เบอร์โทรศัพท์ติดต่อหน้างาน</label>
                <input type="text" value="081-234-5678 (คุณสมชาย)" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={16} /> สถานที่ปฏิบัติงาน
                </label>
                <textarea rows="2" value="123/45 อาคารอัลฟ่า ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110 (ชั้น 15)" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>

          {/* ประเภทงาน */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--primary-color)" /> กำหนดขอบเขตงาน ({jobType === 'bigclean' ? 'Big Cleaning' : 'แม่บ้านประจำ'})
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>รายละเอียดงาน (ซ่อนราคา)</label>
              <textarea rows="8" defaultValue={jobType === 'bigclean' ? 
`บริการ Big Cleaning สำนักงาน (150 ตร.ม.)

ขอบเขตงาน:
- ทำความสะอาดพื้นผิวและเฟอร์นิเจอร์ทั่วไป
- เช็ดกระจกภายในและภายนอก (ไม่ใช้สลิง)
- ขจัดคราบฝังลึก / คราบสี / ปูน (หลังก่อสร้าง)
- ดูดฝุ่นและซักพรม

รายการอุปกรณ์ที่ต้องเตรียม:
- เครื่องขัดพื้น / ปั่นเงา
- เครื่องดูดฝุ่นอุตสาหกรรม
- น้ำยาทำความสะอาดทั่วไป, น้ำยาเช็ดกระจก, น้ำยาลอกแว็กซ์
- บันไดอเนกประสงค์
* อุปกรณ์และน้ำยาอาจมีการปรับเปลี่ยนตามความเหมาะสมของหน้างาน` 
              : 
`บริการจัดส่งแม่บ้านทำความสะอาดสำนักงาน (3 วัน/สัปดาห์)

เวลาทำงาน: จันทร์, พุธ, ศุกร์ (08:00 - 17:00 น.)
จำนวนพนักงาน: 1 คน

ขอบเขตงาน:
- กวาดและถูพื้นสำนักงาน
- ทำความสะอาดโต๊ะทำงานและห้องประชุม
- ล้างห้องน้ำและเติมกระดาษชำระ/สบู่เหลว
- ทิ้งขยะประจำวัน

หมายเหตุ: 
- ลูกค้าเป็นผู้จัดเตรียมอุปกรณ์ทำความสะอาดพื้นฐาน (ไม้กวาด, ไม้ถู, น้ำยา)
- กรณีพนักงานลา บริษัทจะจัดส่งพนักงานแทนให้ภายใน 24 ชม.`} style={{ width: '100%', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.6', backgroundColor: '#f8fafc' }}></textarea>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>หมายเหตุพิเศษสำหรับทีมปฏิบัติการ (Internal Note)</label>
              <textarea rows="3" placeholder="เช่น ข้อควรระวังพิเศษในพื้นที่, จุดจอดรถ, กฎระเบียบของอาคาร..." style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)', resize: 'vertical' }}></textarea>
            </div>
          </div>

          {/* การมอบหมายงาน (ส่วน Operations) */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary-color)" /> การมอบหมายทีมงาน
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={16} /> วันที่เริ่มงาน
                </label>
                <input type="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>วันที่สิ้นสุด (ถ้ามี)</label>
                <input type="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>หัวหน้าทีม / ผู้ควบคุมงาน</label>
                <select style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)', appearance: 'none', backgroundColor: 'white' }}>
                  <option>เลือกระบุหัวหน้าทีม...</option>
                  <option>นาย สมชาย ใจดี (ทีม A)</option>
                  <option>นาย สมศักดิ์ รักสะอาด (ทีม B)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>จำนวนทีมงาน (คน)</label>
                <input type="number" defaultValue="1" min="1" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outlineColor: 'var(--primary-color)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', backgroundColor: 'white', padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
        <Link href="/quotation" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '500', color: 'var(--text-main)', border: '1px solid var(--border-color)', backgroundColor: 'white', textDecoration: 'none' }}>
          ยกเลิก
        </Link>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', fontWeight: '500', color: 'white', backgroundColor: 'var(--primary-color)', border: 'none', cursor: 'pointer' }}>
          <Save size={20} />
          บันทึกและสร้างใบงาน
        </button>
      </div>
    </div>
  );
}
