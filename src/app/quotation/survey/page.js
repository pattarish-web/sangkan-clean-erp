'use client';
import { useState, useEffect, Suspense } from 'react';
import { Calculator, ArrowLeft, Save, FileText, Users, Truck, Wrench, Sparkles, Percent } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { saveData } from '@/utils/api';

function SiteSurveyCostingContent() {
  const router = useRouter();
  const showToast = useToast();

  const [customer, setCustomer] = useState('');
  const [projectName, setProjectName] = useState('');
  const [staffCount, setStaffCount] = useState(5);
  const [days, setDays] = useState(2);
  const [laborRate, setLaborRate] = useState(500); // ค่าแรงแม่บ้านต่อวัน
  const [vehicleCost, setVehicleCost] = useState(1500); // ค่าพาหนะขนส่ง
  const [suppliesCost, setSuppliesCost] = useState(800); // ค่าน้ำยาทำความสะอาด
  const [toolsCost, setToolsCost] = useState(500); // ค่าเครื่องขัด/ค่าเสื่อมเครื่องมือ
  const [otherCost, setOtherCost] = useState(0); // ค่าจิปาถะอื่นๆ
  const [markupPercent, setMarkupPercent] = useState(35); // กำไรเป้าหมายที่ต้องการบวกเพิ่ม
  
  // บันทึกลักษณะหน้างานและกรณีพิเศษ
  const [nightShift, setNightShift] = useState(false);
  const [highRise, setHighRise] = useState(false);
  const [heavyStains, setHeavyStains] = useState(false);
  const [noWaterElectricity, setNoWaterElectricity] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  const searchParams = useSearchParams();
  const customerParam = searchParams.get('customer');

  // โหลดราคากลางจาก settings และตรวจเช็คชื่อลูกค้าจากพารามิเตอร์ URL
  useEffect(() => {
    if (customerParam) {
      setCustomer(customerParam);
    }

    async function loadSettings() {
      const saved = await loadSettingJson('sangkan_settings', null);
      if (saved) {
        try {
          if (saved.maidDailyRate) setLaborRate(saved.maidDailyRate);
          if (saved.soapGallonCost) setSuppliesCost(saved.soapGallonCost * 3);
          if (saved.minMargin) setMarkupPercent(saved.minMargin + 10);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadSettings();
  }, [customerParam]);

  // คำนวณต้นทุนประเมินทั้งหมด
  const totalLaborCost = staffCount * days * laborRate;
  const totalDirectCost = totalLaborCost + Number(vehicleCost) + Number(suppliesCost) + Number(toolsCost) + Number(otherCost);
  
  // คำนวณราคาขายตามกำไรเป้าหมาย
  // สูตร: ราคาขาย = ต้นทุนตรง / (1 - markupPercent/100)
  const calculatedPrice = totalDirectCost / (1 - (markupPercent / 100));
  const estimatedProfit = calculatedPrice - totalDirectCost;

  const handleGenerateQuotation = async () => {
    if (!customer || !projectName) {
      showToast('กรุณากรอกชื่อลูกค้าและชื่อโปรเจ็คหน้างานก่อนทำการประเมิน!', 'warning');
      return;
    }

    // สร้างไอดีประเมินหน้างาน
    const surveyId = 'SV' + Date.now();
    const surveyData = {
      surveyId,
      customer,
      projectName,
      staffCount: Number(staffCount),
      days: Number(days),
      laborRate: Number(laborRate),
      vehicleCost: Number(vehicleCost),
      suppliesCost: Number(suppliesCost),
      toolsCost: Number(toolsCost),
      otherCost: Number(otherCost),
      totalDirectCost,
      calculatedPrice,
      markupPercent,
      estimatedProfit,
      // บันทึกลักษณะหน้างานและกรณีพิเศษ
      nightShift,
      highRise,
      heavyStains,
      noWaterElectricity,
      specialNotes
    };

    await saveSettingJson('sangkan_current_survey', surveyData);
    await saveData('AllSurveys', { ...surveyData, id: surveyId });

    showToast('ประเมินต้นทุนเรียบร้อย! กำลังนำทางไปหน้าสร้างใบเสนอราคา...', 'success');
    router.push(`/quotation/create?fromSurvey=true`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/quotation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>1. สำรวจหน้างาน & คำนวณต้นทุน Big Cleaning</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ประเมินราคาตามหน้างานจริงก่อนส่งข้อมูลไปออกใบเสนอราคาเสนอความโปร่งใสของต้นทุน</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ฟอร์มกรอกต้นทุน */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary-color)" /> รายละเอียดลูกค้าและหน้างาน
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ชื่อลูกค้า / บริษัทผู้ว่าจ้าง</label>
            <input type="text" placeholder="เช่น บจก. น่ำเฮงคอนกรีต" value={customer} onChange={e => setCustomer(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ชื่อโครงการปฏิบัติงาน Big Cleaning</label>
            <input type="text" placeholder="เช่น บริการขัดกระจกอาคาร A และล้างคราบปูนสระน้ำ" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
          </div>

          {/* บันทึกกรณีพิเศษและสำรวจลักษณะหน้างาน */}
          <h3 style={{ margin: '16px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
            <Wrench size={18} color="var(--primary-color)" /> ประเมินลักษณะหน้างาน &amp; กรณีพิเศษเฉพาะราย
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={nightShift} onChange={e => setNightShift(e.target.checked)} style={{ cursor: 'pointer' }} />
              🌙 ทำงานกะกลางคืน / นอกเวลา
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={highRise} onChange={e => setHighRise(e.target.checked)} style={{ cursor: 'pointer' }} />
              🧗 งานที่สูง / นั่งร้าน / โรยตัว
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={heavyStains} onChange={e => setHeavyStains(e.target.checked)} style={{ cursor: 'pointer' }} />
              🧱 คราบฝังลึก / คราบปูนหนาพิเศษ
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={noWaterElectricity} onChange={e => setNoWaterElectricity(e.target.checked)} style={{ cursor: 'pointer' }} />
              ⚠️ ไม่มีแหล่งน้ำหรือไฟฟ้าหน้างาน
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px' }}>บันทึกเงื่อนไขกรณีพิเศษเพิ่มเติม</label>
            <textarea 
              placeholder="ระบุข้อกำหนดเฉพาะ เช่น ต้องเตรียมปั๊มปั่นไฟไปเอง, ต้องโรยตัวสไปเดอร์แมนเช็ดกระจกชั้น 5..." 
              value={specialNotes} 
              onChange={e => setSpecialNotes(e.target.value)} 
              rows={2} 
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', resize: 'none', fontSize: '0.85rem' }} 
            />
          </div>

          <h3 style={{ margin: '12px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--primary-color)" /> กำลังพลและต้นทุนแรงงาน
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>จำนวนแม่บ้านปฏิบัติการ (คน)</label>
              <input type="number" min={1} value={staffCount} onChange={e => setStaffCount(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ระยะเวลาปฏิบัติงาน (วัน)</label>
              <input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>

          <h3 style={{ margin: '12px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="var(--primary-color)" /> ยานพาหนะ เคมีภัณฑ์ และเครื่องมือ
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าเดินทางและจัดส่งรถทีมงาน (฿)</label>
              <input type="number" value={vehicleCost} onChange={e => setVehicleCost(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ประมาณค่าน้ำยา/เคมีภัณฑ์ใช้จริง (฿)</label>
              <input type="number" value={suppliesCost} onChange={e => setSuppliesCost(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าเช่า/ค่าเสื่อมเครื่องมือหลัก (฿)</label>
              <input type="number" value={toolsCost} onChange={e => setToolsCost(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าสำรองหน้างานอื่นๆ (฿)</label>
              <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* คาร์ดคำนวณกำไรประเมินและปุ่มส่งข้อมูล */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={18} color="var(--primary-color)" /> สรุปงบคำนวณกำไร
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ต้นทุนค่าแรงแม่บ้าน ({staffCount} คน × {days} วัน)</span>
                <span style={{ fontWeight: '500' }}>{totalLaborCost.toLocaleString()} ฿</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ค่าพาหนะ/ยานพาหนะ</span>
                <span style={{ fontWeight: '500' }}>{Number(vehicleCost).toLocaleString()} ฿</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ค่าน้ำยา/วัสดุสิ้นเปลือง</span>
                <span style={{ fontWeight: '500' }}>{Number(suppliesCost).toLocaleString()} ฿</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ค่าเช่าเครื่องมือ & อื่นๆ</span>
                <span style={{ fontWeight: '500' }}>{(Number(toolsCost) + Number(otherCost)).toLocaleString()} ฿</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontWeight: 'bold' }}>
                <span>รวมต้นทุนตรงทั้งสิ้น</span>
                <span style={{ color: '#ef4444' }}>{totalDirectCost.toLocaleString()} ฿</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>
                อัตรากำไรเป้าหมายที่ต้องการ (Margin Target %)
              </label>
              <div style={{ position: 'relative' }}>
                <input type="number" min={1} max={99} value={markupPercent} onChange={e => setMarkupPercent(e.target.value)} style={{ width: '100%', padding: '10px', paddingRight: '36px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontWeight: 'bold' }} />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#15803d' }}>
                <span>ราคาขายเสนอแนะ (รวมกำไร)</span>
                <span>กำไรขั้นต้นประเมิน</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={{ margin: 0, fontWeight: 'bold', color: '#16a34a', fontSize: '1.4rem' }}>
                  {Math.round(calculatedPrice).toLocaleString()} ฿
                </h2>
                <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                  +{Math.round(estimatedProfit).toLocaleString()} ฿
                </span>
              </div>
            </div>

            <button onClick={handleGenerateQuotation} style={{ width: '100%', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              <Sparkles size={18} /> ไปสร้างใบเสนอราคาใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SiteSurveyCostingPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>กำลังโหลดหน้าแบบประเมิน...</div>}>
      <SiteSurveyCostingContent />
    </Suspense>
  );
}
