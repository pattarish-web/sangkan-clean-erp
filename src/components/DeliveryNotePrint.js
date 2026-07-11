'use client';

import React, { useMemo } from 'react';
import { surveyConditionLabels } from '@/lib/delivery-note-utils';

function fmtDate(d) {
  if (!d) return '';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return String(d);
  return parsed.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function FieldRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  const underline = {
    borderBottom: '1px solid #1e293b',
    display: 'inline-block',
    minWidth: '65%',
    paddingBottom: 2,
    verticalAlign: 'bottom',
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 10, fontSize: '10pt', lineHeight: 1.8 }}>
      <div>
        <span>{leftLabel} </span>
        <span style={underline}>{leftValue || '\u00A0'}</span>
      </div>
      <div>
        <span>{rightLabel} </span>
        <span style={underline}>{rightValue || '\u00A0'}</span>
      </div>
    </div>
  );
}

function FieldFull({ label, value }) {
  return (
    <div style={{ marginBottom: 10, fontSize: '10pt', lineHeight: 1.8 }}>
      <span>{label} </span>
      <span style={{ borderBottom: '1px solid #1e293b', display: 'inline-block', width: 'calc(100% - 120px)', paddingBottom: 2 }}>
        {value || '\u00A0'}
      </span>
    </div>
  );
}

export default function DeliveryNotePrint({
  profile,
  docNo,
  customer,
  projectName,
  address,
  workDate,
  days,
  team,
  teamSize,
  refQuotation,
  survey,
  scopeItems,
  notes,
  contactName,
  contactPhone,
}) {
  const tableRows = useMemo(() => {
    const rows = [];

    // ตารางนี้ให้เป็น "รายการจากใบเสนอราคา" เท่านั้น (ไม่แทรกใบประเมิน)
    const items = scopeItems || [];
    items.forEach((it) => {
      const qtyText = [it.qty, it.unit].filter(Boolean).join(' ');
      rows.push({
        description: it.description || '-',
        qty: qtyText || '-',
        remark: '',
      });
    });

    // เพิ่มบรรทัดว่างให้ครบจำนวนแถวขั้นต่ำตามฟอร์ม
    const minRows = 8;
    while (rows.length < minRows) {
      rows.push({ description: '', qty: '', remark: '' });
    }

    return rows;
  }, [scopeItems]);

  const contactDisplay = [contactName, contactPhone].filter(Boolean).join('  ');
  const companyName = profile?.name || 'บริษัท สั่งการ คลีน จำกัด';

  return (
    <div className="print-area" style={{ maxWidth: 780, margin: '0 auto', background: 'white', color: '#1e293b', padding: '8mm 10mm', fontFamily: 'var(--font-family), sans-serif' }}>
      {/* ชื่อเอกสาร — กลางบนสุด */}
      <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 14px', letterSpacing: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
        หนังสือส่งมอบงาน
      </h1>

      {/* ข้อมูลบริษัท */}
      <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: 12, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
          <img src="/logo.png" alt="Company Logo" style={{ width: 70, height: 40, objectFit: 'contain' }} />
          <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>{companyName} (สำนักงานใหญ่)</p>
        </div>
        <p style={{ margin: '0 0 2px', fontSize: '9.5pt', lineHeight: 1.4 }}>{profile?.address || ''}</p>
        <p style={{ margin: 0, fontSize: '9.5pt' }}>โทร. {profile?.phone || '-'}</p>
      </div>

      {/* เล่มที่ / เลขที่ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 16 }}>
        <div>
          <span>เล่มที่ </span>
          <span style={{ borderBottom: '1px solid #1e293b', display: 'inline-block', minWidth: 60, textAlign: 'center' }}>1</span>
        </div>
        <div>
          <span>เลขที่ </span>
          <span style={{ borderBottom: '1px solid #1e293b', display: 'inline-block', minWidth: 140 }}>{docNo || ''}</span>
        </div>
      </div>

      {/* ฟอร์มข้อมูลลูกค้า */}
      <FieldRow
        leftLabel="ชื่อลูกค้า"
        leftValue={customer}
        rightLabel="วันที่"
        rightValue={fmtDate(workDate)}
      />
      <FieldRow
        leftLabel="ที่อยู่"
        leftValue={address}
        rightLabel="เอกสารอ้างอิง"
        rightValue={refQuotation || ''}
      />
      <FieldFull label="ชื่อผู้ติดต่อ" value={contactDisplay} />
      <FieldFull label="ที่อยู่หน้างาน" value={address} />

      {/* ตารางรายการ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, marginBottom: 24, fontSize: '9.5pt' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #1e293b', padding: '6px 4px', width: 44, textAlign: 'center' }}>ลำดับ</th>
            <th style={{ border: '1px solid #1e293b', padding: '6px 8px', textAlign: 'center' }}>รายการ</th>
            <th style={{ border: '1px solid #1e293b', padding: '6px 4px', width: 80, textAlign: 'center' }}>ปริมาณ</th>
            <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: 140, textAlign: 'center' }}>ข้อเสนอแนะ</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, idx) => (
            <tr key={idx} style={{ height: 32 }}>
              <td style={{ border: '1px solid #1e293b', textAlign: 'center', verticalAlign: 'top', padding: '4px' }}>
                {row.description ? idx + 1 : ''}
              </td>
              <td style={{ border: '1px solid #1e293b', padding: '4px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                {row.description}
              </td>
              <td style={{ border: '1px solid #1e293b', textAlign: 'center', verticalAlign: 'top', padding: '4px' }}>
                {row.qty}
              </td>
              <td style={{ border: '1px solid #1e293b', padding: '4px 8px', verticalAlign: 'top', fontSize: '8.5pt' }}>
                {row.remark}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ตรวจรับงาน */}
      <p style={{ textAlign: 'center', fontSize: '11pt', fontWeight: 'bold', margin: '0 0 20px', letterSpacing: 0.5 }}>
        ตรวจรับงานเรียบร้อย
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 28, fontSize: '10pt' }}>
        <div>
          <span>วันที่ </span>
          <span style={{ borderBottom: '1px solid #1e293b', display: 'inline-block', width: '75%', paddingBottom: 2 }}>&nbsp;</span>
        </div>
        <div>
          <span>วันที่ </span>
          <span style={{ borderBottom: '1px solid #1e293b', display: 'inline-block', width: '75%', paddingBottom: 2 }}>&nbsp;</span>
        </div>
      </div>

      {/* ลายเซ็น */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48, textAlign: 'center', pageBreakInside: 'avoid' }}>
        <div>
          <div style={{ minHeight: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ borderBottom: '1px solid #1e293b', width: '85%', height: 1 }} />
          </div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '10pt' }}>ผู้ตรวจรับงาน</p>
          <p style={{ margin: '4px 0 0', fontSize: '9pt', color: '#64748b' }}>(ลูกค้า / ผู้รับมอบงาน)</p>
        </div>
        <div>
          <div style={{ minHeight: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ borderBottom: '1px solid #1e293b', width: '85%', height: 1 }} />
          </div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '10pt' }}>ผู้ส่งมอบงาน</p>
          <p style={{ margin: '4px 0 0', fontSize: '9pt', color: '#64748b' }}>(ลงนามหน้างาน)</p>
        </div>
      </div>
    </div>
  );
}
