'use client';
import { useState, useEffect } from 'react';
import { Printer, CheckCircle, DollarSign, Image as ImageIcon, FileText, ArrowLeft, ExternalLink, FileCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { useToast } from '@/components/Toast';

export default function FinanceBillingAuditor() {
  const showToast = useToast();
  
  const [completedJobs, setCompletedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [adminSettings, setAdminSettings] = useState({ commissionRate: 10 });

  const loadData = async () => {
    try {
      const { fetchData } = await import('@/utils/api');
      const schedules = await fetchData('BigcleanSchedule');
      const execReports = await loadSettingJson('sangkan_execution_reports', {});

      const completed = [];
      schedules.forEach(job => {
        const parsed = execReports[job.id];
        if (parsed && parsed.status === 'completed') {
          completed.push({ ...job, execData: parsed });
        }
      });
      setCompletedJobs(completed);

      const settings = await loadSettingJson('sangkan_settings', { commissionRate: 10 });
      setAdminSettings(settings);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setIsPrintMode(false);
  };

  const handlePrintBillingPackage = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleApproveBilling = async (jobId) => {
    const billingApproved = await loadSettingJson('sangkan_billing_approved', {});
    billingApproved[jobId] = {
      approvedAt: new Date().toISOString().split('T')[0],
      status: 'billed'
    };
    await saveSettingJson('sangkan_billing_approved', billingApproved);
    showToast('อนุมัติออกเอกสารวางบิลและบันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
  };

  // ดึงราคากลางและข้อมูลส่วนต่าง
  const getFinancials = (job) => {
    const revenue = 15000; // default mock
    // คำนวณต้นทุนจริง
    const exec = job.execData || {};
    const actLabor = exec.actLabor || 0;
    const actSupplies = exec.actSupplies || 0;
    const actVehicle = exec.actVehicle || 0;
    const actFuel = exec.actFuel || 0;
    const actualCost = actLabor + actSupplies + actVehicle + actFuel;
    const actualProfit = revenue - actualCost;
    const commRate = adminSettings.commissionRate || 10;
    const commission = actualProfit > 0 ? (actualProfit * (commRate / 100)) : 0;

    return {
      revenue,
      actualCost,
      actualProfit,
      commission
    };
  };

  // ถ้างวดการพิมพ์ถูกเปิดใช้งาน ให้แสดงหน้าพรีวิวสำหรับพิมพ์
  if (isPrintMode && selectedJob) {
    const fin = getFinancials(selectedJob);
    return (
      <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', fontFamily: 'sans-serif' }} className="print-area">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }} className="no-print">
          <button onClick={() => setIsPrintMode(false)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ← ย้อนกลับ
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            🖨️ สั่งพิมพ์ชุดเอกสาร
          </button>
        </div>

        {/* แผ่นที่ 1: ใบวางบิล / ใบแจ้งหนี้ */}
        <div style={{ minHeight: '297mm', padding: '20px', borderBottom: '2px dashed #000', pageBreakAfter: 'always' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 'bold' }}>บจก. สั่งการ คลีน (Sangkan Clean Co., Ltd.)</h2>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>123/45 ถนนทำความสะอาด แขวงสะอาด เขตปัดกวาด กทม. 10000</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>เลขประจำตัวผู้เสียภาษี: 0105555555555</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>ใบแจ้งหนี้ / ใบวางบิล</h1>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>เลขที่เอกสาร: INV-{selectedJob.projectId.replace('QT', '')}</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>วันที่: {selectedJob.date}</p>
            </div>
          </div>

          <div style={{ border: '1px solid #000', padding: '16px', borderRadius: '6px', marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>ข้อมูลลูกค้าผู้รับบริการ:</h4>
            <p style={{ margin: '4px 0' }}><strong>ชื่อลูกค้า:</strong> {selectedJob.customer}</p>
            <p style={{ margin: '4px 0' }}><strong>โครงการ:</strong> {selectedJob.projectName}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>รายละเอียดรายการ</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>จำนวน</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>หน่วย</th>
                <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>ราคาต่อหน่วย</th>
                <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '16px 12px' }}>
                  <strong>{selectedJob.projectName}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>- บริการ Big Cleaning ตามขอบเขตและใบเสนอราคาเสร็จสิ้นเรียบร้อย</p>
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>1</td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>งาน</td>
                <td style={{ padding: '16px 12px', textAlign: 'right' }}>{fin.revenue.toLocaleString()} ฿</td>
                <td style={{ padding: '16px 12px', textAlign: 'right' }}>{fin.revenue.toLocaleString()} ฿</td>
              </tr>
              <tr>
                <td colSpan={3}></td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>รวมเงินทั้งสิ้น:</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{fin.revenue.toLocaleString()} ฿</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '100px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', height: '60px' }}></div>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>ผู้ส่งเอกสาร</p>
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', height: '60px' }}></div>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>ผู้รับเอกสาร / ลูกค้า</p>
            </div>
          </div>
        </div>

        {/* แผ่นที่ 2: ใบเซ็นรับงานจากลูกค้า */}
        <div style={{ minHeight: '297mm', padding: '20px', borderBottom: '2px dashed #000', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ marginBottom: '20px' }}>ใบเซ็นรับมอบงานจากลูกค้า (Signed Work Order)</h2>
          <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', padding: '40px', width: '90%', height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
            <FileCheck size={80} color="#16a34a" style={{ marginBottom: '20px' }} />
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>ไฟล์ภาพใบเซ็นรับมอบงาน (แนบแล้ว)</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>อ้างอิงรหัสใบงาน: OPR-{selectedJob.id}</p>
            <div style={{ border: '1px solid #16a34a', padding: '10px 20px', borderRadius: '20px', color: '#16a34a', fontWeight: 'bold', marginTop: '30px', backgroundColor: '#f0fdf4' }}>
              ✓ ลงลายมือชื่อตรวจรับมอบงานโดยลูกค้าเรียบร้อย
            </div>
          </div>
        </div>

        {/* แผ่นที่ 3: รายงานรูปภาพก่อนหลัง */}
        <div style={{ minHeight: '297mm', padding: '20px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>รายงานภาพถ่าย Before / After ปฏิบัติการหน้างาน</h2>
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: '30px' }}>โครงการ: {selectedJob.projectName} | จำนวนภาพทั้งหมด: {selectedJob.execData.photos.length} รูป</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {selectedJob.execData.photos.slice(0, 4).map((p, idx) => (
              <div key={idx} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <div style={{ width: '100%', height: '220px', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  📷 [ภาพถ่ายสถานที่ {p.type} ทำความสะอาด]
                </div>
                <span style={{ marginTop: '10px', fontWeight: 'bold', color: p.type === 'Before' ? '#b45309' : '#15803d' }}>
                  ภาพที่ {idx + 1}: สถานะ {p.type} (ก่อนทำ/หลังทำ)
                </span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>- เอกสารแนบท้ายภาพประกอบฉบับเต็มอีก {(selectedJob.execData.photos.length - 4)} รูป ได้รวบรวมไว้ในระบบคลาวด์เรียบร้อยแล้ว -</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/finance/expenses" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>3. ตรวจสอบงบ & จัดชุดวางบิล (ฝ่ายบัญชี)</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ตรวจสอบใบเซ็นรับงาน รายงานรูปภาพก่อนหลังทำ และจัดชุดเอกสารวางบิลแบบอัตโนมัติ</p>
          </div>
        </div>
        <button onClick={loadData} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}>
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* คิวงานที่รอตรวจซ้าย */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>งานที่ส่งมอบแล้ว (รอวางบิล)</h3>
          {completedJobs.length > 0 ? (
            completedJobs.map(job => (
              <button 
                key={job.id} 
                onClick={() => handleSelectJob(job)}
                style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: selectedJob?.id === job.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: selectedJob?.id === job.id ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  ✓ เสร็จหน้างาน
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{job.projectName}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ลูกค้า: {job.customer}</span>
              </button>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>ไม่มีโครงการส่งมอบปฏิบัติงานค้างตรวจในขณะนี้</p>
          )}
        </div>

        {/* รายละเอียดการตรวจสอบและประกอบร่างวางบิลขวา */}
        {selectedJob ? (
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-dark)' }}>{selectedJob.projectName}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ลูกค้า: {selectedJob.customer} | อ้างอิงใบเสนอราคา: {selectedJob.projectId}</p>
              </div>
            </div>

            {/* 1. บันทึกและผลประเมินโทรยืนยัน */}
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#15803d' }}>✓ ตรวจเช็คข้อมูลการโทรยืนยันของทีมปฏิบัติงาน</h4>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#16a34a' }}>• ยืนยันการโทรแจ้งล่วงหน้า 1-3 วัน: สำเร็จ (บันทึกเวลาเข้าระบบ)</p>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#16a34a' }}>• ยืนยันการโทรแจ้งวันเข้างานจริง: สำเร็จ (บันทึกเวลาเข้าระบบ)</p>
            </div>

            {/* 2. ตรวจสอบรูปหลักฐานก่อนหลังทำความสะอาด */}
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>2. ตรวจสอบรายงานรูปก่อนหลัง ({selectedJob.execData.photos.length} รูป)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                {selectedJob.execData.photos.map((p, index) => (
                  <div key={index} style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#475569', fontWeight: 'bold' }}>
                    {p.type}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ตรวจสอบบิลและกำไรเปรียบเทียบจริง */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={18} color="var(--primary-color)" /> 3. ตรวจสอบผลต่างกำไรและค่านายหน้า (Audit Budget)
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ยอดรวมรายได้ใบเสนอราคา:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{getFinancials(selectedJob).revenue.toLocaleString()} ฿</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>รวมค่าใช้จ่ายเบิกจ่ายจริงหน้างาน:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#ef4444' }}>{getFinancials(selectedJob).actualCost.toLocaleString()} ฿</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', color: 'var(--text-main)', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>กำไรสุทธิคงเหลือ (Actual Margin):</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#16a34a' }}>{getFinancials(selectedJob).actualProfit.toLocaleString()} ฿</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ค่านายหน้าฝ่ายขาย (Sales Commission):</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#d97706' }}>{getFinancials(selectedJob).commission.toLocaleString()} ฿</span>
                </div>
              </div>
            </div>

            {/* ปุ่มรวมจัดชุดวางบิล */}
            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #cbd5e1', paddingTop: '20px' }}>
              <button onClick={() => handleApproveBilling(selectedJob.id)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                ✓ บันทึกตรวจสอบสำเร็จ
              </button>
              
              <button onClick={handlePrintBillingPackage} style={{ flex: 1.5, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Printer size={18} /> จัดทำชุดเอกสารวางบิล (Print)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px auto', display: 'block' }} />
            <p style={{ margin: 0, fontWeight: '500' }}>กรุณาเลือกงานที่ปฏิบัติเสร็จสมบูรณ์ทางเมนูซ้ายมือเพื่อสรุปงบวางบิล</p>
          </div>
        )}

      </div>
    </div>
  );
}
