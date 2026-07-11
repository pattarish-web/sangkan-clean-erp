'use client';
import { useState, useEffect } from 'react';
import { Settings, Percent, DollarSign, Users, Wrench, ShieldAlert, Check, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { DEFAULT_COMPANY_PROFILE } from '@/lib/company-profile';
import { fetchSetting, saveSetting } from '@/utils/api';

export default function AdminSettingsPage() {
  const showToast = useToast();

  // State สำหรับการตั้งค่าทั้งหมด
  const [commissionRate, setCommissionRate] = useState(10);
  const [minMargin, setMinMargin] = useState(25);
  const [maidDailyRate, setMaidDailyRate] = useState(500);
  const [maidHourlyOt, setMaidHourlyOt] = useState(75);
  const [supervisorDailyRate, setSupervisorDailyRate] = useState(800);
  
  const [soapGallonCost, setSoapGallonCost] = useState(150);
  const [trashBagKgCost, setTrashBagKgCost] = useState(65);
  const [tissueRollCost, setTissueRollCost] = useState(12);
  
  const [scrubberDailyDepreciation, setScrubberDailyDepreciation] = useState(250);
  const [vacuumDailyDepreciation, setVacuumDailyDepreciation] = useState(100);
  const [scaffoldDailyDepreciation, setScaffoldDailyDepreciation] = useState(300);

  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_PROFILE.name);
  const [companyPhone, setCompanyPhone] = useState(DEFAULT_COMPANY_PROFILE.phone);
  const [companyTaxId, setCompanyTaxId] = useState(DEFAULT_COMPANY_PROFILE.taxId);
  const [companyAddress, setCompanyAddress] = useState(DEFAULT_COMPANY_PROFILE.address);
  const [bankAccNo, setBankAccNo] = useState(DEFAULT_COMPANY_PROFILE.banks[0].accNo);

  // โหลดค่าเมื่อเปิดหน้าจอ
  useEffect(() => {
    async function loadSettings() {
      try {
        const saved = await fetchSetting('sangkan_settings');
        if (saved) {
          if (saved.commissionRate !== undefined) setCommissionRate(saved.commissionRate);
          if (saved.minMargin !== undefined) setMinMargin(saved.minMargin);
          if (saved.maidDailyRate !== undefined) setMaidDailyRate(saved.maidDailyRate);
          if (saved.maidHourlyOt !== undefined) setMaidHourlyOt(saved.maidHourlyOt);
          if (saved.supervisorDailyRate !== undefined) setSupervisorDailyRate(saved.supervisorDailyRate);
          if (saved.soapGallonCost !== undefined) setSoapGallonCost(saved.soapGallonCost);
          if (saved.trashBagKgCost !== undefined) setTrashBagKgCost(saved.trashBagKgCost);
          if (saved.tissueRollCost !== undefined) setTissueRollCost(saved.tissueRollCost);
          if (saved.scrubberDailyDepreciation !== undefined) setScrubberDailyDepreciation(saved.scrubberDailyDepreciation);
          if (saved.vacuumDailyDepreciation !== undefined) setVacuumDailyDepreciation(saved.vacuumDailyDepreciation);
          if (saved.scaffoldDailyDepreciation !== undefined) setScaffoldDailyDepreciation(saved.scaffoldDailyDepreciation);
          const cp = saved.companyProfile || {};
          if (cp.name) setCompanyName(cp.name);
          if (cp.phone) setCompanyPhone(cp.phone);
          if (cp.taxId) setCompanyTaxId(cp.taxId);
          if (cp.address) setCompanyAddress(cp.address);
          if (cp.banks?.[0]?.accNo) setBankAccNo(cp.banks[0].accNo);
        }
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    let existing = {};
    try {
      const saved = await fetchSetting('sangkan_settings');
      if (saved && typeof saved === 'object') existing = saved;
    } catch (e) {}

    const settings = {
      ...existing,
      commissionRate: Number(commissionRate),
      minMargin: Number(minMargin),
      maidDailyRate: Number(maidDailyRate),
      maidHourlyOt: Number(maidHourlyOt),
      supervisorDailyRate: Number(supervisorDailyRate),
      soapGallonCost: Number(soapGallonCost),
      trashBagKgCost: Number(trashBagKgCost),
      tissueRollCost: Number(tissueRollCost),
      scrubberDailyDepreciation: Number(scrubberDailyDepreciation),
      vacuumDailyDepreciation: Number(vacuumDailyDepreciation),
      scaffoldDailyDepreciation: Number(scaffoldDailyDepreciation),
      companyProfile: {
        name: companyName,
        phone: companyPhone,
        fax: DEFAULT_COMPANY_PROFILE.fax,
        taxId: companyTaxId,
        address: companyAddress,
        email: DEFAULT_COMPANY_PROFILE.email,
        defaultBankId: 'KBANK',
        banks: [{ ...DEFAULT_COMPANY_PROFILE.banks[0], accNo: bankAccNo }],
      },
    };

    try {
      await saveSetting('sangkan_settings', settings);
      showToast('บันทึกการตั้งค่าต้นทุนและกำไรเรียบร้อยแล้ว!', 'success');
    } catch (e) {
      showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>ปรับแต่งกำไรและต้นทุนแอดมิน</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ตั้งค่าเกณฑ์ต้นทุน อัตราค่าจ้าง และค่าน้ำยากลางเพื่อนำไปใช้วิเคราะห์กำไรจริง</p>
          </div>
        </div>
        <button onClick={handleSave} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
          <Save size={18} /> บันทึกการตั้งค่า
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: 'bold' }}>ข้อมูลบริษัท (แสดงบนเอกสาร)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={{ fontSize: '0.85rem' }}>ชื่อบริษัท</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: 4, border: '1px solid var(--border-color)', borderRadius: 6 }} /></div>
            <div><label style={{ fontSize: '0.85rem' }}>โทรศัพท์</label><input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: 4, border: '1px solid var(--border-color)', borderRadius: 6 }} /></div>
            <div><label style={{ fontSize: '0.85rem' }}>เลขผู้เสียภาษี</label><input value={companyTaxId} onChange={e => setCompanyTaxId(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: 4, border: '1px solid var(--border-color)', borderRadius: 6 }} /></div>
            <div><label style={{ fontSize: '0.85rem' }}>เลขบัญชีกสิกร</label><input value={bankAccNo} onChange={e => setBankAccNo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: 4, border: '1px solid var(--border-color)', borderRadius: 6 }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '0.85rem' }}>ที่อยู่</label><textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', marginTop: 4, border: '1px solid var(--border-color)', borderRadius: 6 }} /></div>
          </div>
        </div>
        
        {/* ส่วนที่ 1: ตั้งค่านโยบายบริษัท */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <ShieldAlert size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>นโยบายกำไรและคอมมิชชัน (Company Policies)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>อัตราค่าคอมมิชชันฝ่ายขาย (% ของกำไรหน้างานจริง)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} style={{ width: '100%', padding: '10px', paddingRight: '36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>%</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>เกณฑ์แจ้งเตือนกำไรขั้นต่ำ (Warning Gross Margin %)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={minMargin} onChange={e => setMinMargin(e.target.value)} style={{ width: '100%', padding: '10px', paddingRight: '36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 2: ตั้งค่าต้นทุนบุคคลและค่าแรง */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <Users size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>ราคากลางต้นทุนบุคลากร (Labor Standard Rates)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ค่าแรงแม่บ้านมาตรฐาน (บาท/วัน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={maidDailyRate} onChange={e => setMaidDailyRate(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ค่าล่วงเวลา (OT) แม่บ้าน (บาท/ชั่วโมง)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={maidHourlyOt} onChange={e => setMaidHourlyOt(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ค่าแรงหัวหน้างาน (บาท/วัน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={supervisorDailyRate} onChange={e => setSupervisorDailyRate(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3: ต้นทุนสินค้าวัสดุ */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <DollarSign size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>ราคากลางต้นทุนวัสดุเคมี (Consumables Standard Cost)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ค่าน้ำยาทำความสะอาด (บาท/แกลลอน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={soapGallonCost} onChange={e => setSoapGallonCost(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ราคาทุนถุงขยะ (บาท/กิโลกรัม)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={trashBagKgCost} onChange={e => setTrashBagKgCost(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ราคาทุนกระดาษทิชชู่ (บาท/ม้วน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={tissueRollCost} onChange={e => setTissueRollCost(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 4: ค่าเสื่อมเครื่องมือหนัก */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <Wrench size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>อัตราค่าเสื่อมเครื่องมือหลักต่อวัน (Equipment Depreciation / Day)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>เครื่องขัดพื้น (บาท/วัน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={scrubberDailyDepreciation} onChange={e => setScrubberDailyDepreciation(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>เครื่องดูดฝุ่นอุตสาหกรรม (บาท/วัน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={vacuumDailyDepreciation} onChange={e => setVacuumDailyDepreciation(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>ชุดนั่งร้านที่สูง (บาท/วัน)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={scaffoldDailyDepreciation} onChange={e => setScaffoldDailyDepreciation(e.target.value)} style={{ width: '100%', padding: '10px', paddingLeft: '32px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
