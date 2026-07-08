'use client';
import { useState, useEffect } from 'react';
import { PhoneCall, Camera, CheckCircle, DollarSign, AlertCircle, Upload, X, Briefcase, FileCheck, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { fetchData } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';

export default function OperationsExecutionPage() {
  const showToast = useToast();

  const [schedules, setSchedules] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [execReports, setExecReports] = useState({});

  const [call3Days, setCall3Days] = useState(false);
  const [call1Day, setCall1Day] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [signOffPhoto, setSignOffPhoto] = useState('');
  const [actLabor, setActLabor] = useState('');
  const [actVehicle, setActVehicle] = useState('');
  const [actFuel, setActFuel] = useState('');
  const [actSupplies, setActSupplies] = useState('');

  useEffect(() => {
    async function load() {
      const [scheduleData, reports] = await Promise.all([
        fetchData('BigcleanSchedule'),
        loadSettingJson('sangkan_execution_reports', {}),
      ]);
      setSchedules(scheduleData || []);
      setExecReports(reports || {});
    }
    load();
  }, []);

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    const parsed = execReports[job.id];
    if (parsed) {
      setCall3Days(parsed.call3Days || false);
      setCall1Day(parsed.call1Day || false);
      setPhotos(parsed.photos || []);
      setSignOffPhoto(parsed.signOffPhoto || '');
      setActLabor(parsed.actLabor || '');
      setActVehicle(parsed.actVehicle || '');
      setActFuel(parsed.actFuel || '');
      setActSupplies(parsed.actSupplies || '');
    } else {
      setCall3Days(false);
      setCall1Day(false);
      setPhotos([]);
      setSignOffPhoto('');
      setActLabor('');
      setActVehicle('');
      setActFuel('');
      setActSupplies('');
    }
  };

  const handleUploadPhoto = () => {
    if (photos.length >= 30) return;
    const newPhoto = {
      id: Date.now(),
      url: `/site_photo_${photos.length + 1}.jpg`,
      type: Math.random() > 0.5 ? 'Before' : 'After',
    };
    setPhotos([...photos, newPhoto]);
    showToast(`อัปโหลดรูปภาพจำลองสำเร็จ (${photos.length + 1} รูป)`, 'info');
  };

  const handleRemovePhoto = (id) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleUploadSignOff = () => {
    setSignOffPhoto('/signoff_sheet_signed.jpg');
    showToast('อัปโหลดใบเซ็นรับงานที่ลูกค้าลงลายมือชื่อเรียบร้อย!', 'success');
  };

  const persistExecReport = async (data) => {
    const updated = { ...execReports, [selectedJob.id]: data };
    setExecReports(updated);
    await saveSettingJson('sangkan_execution_reports', updated);
  };

  const handleSaveProgress = async () => {
    if (!selectedJob) return;

    const data = {
      jobId: selectedJob.id,
      call3Days,
      call1Day,
      photos,
      signOffPhoto,
      actLabor: Number(actLabor) || 0,
      actVehicle: Number(actVehicle) || 0,
      actFuel: Number(actFuel) || 0,
      actSupplies: Number(actSupplies) || 0,
      status: 'in-progress',
    };

    await persistExecReport(data);
    showToast('บันทึกความคืบหน้าของงานปฏิบัติการสำเร็จแล้ว', 'success');
  };

  const handleSubmitToAccounting = async () => {
    if (!selectedJob) return;

    if (!call3Days || !call1Day) {
      showToast('⚠️ ไม่อนุญาตให้ส่งงาน! กรุณายืนยันการโทรยืนยันนัดหมายกับลูกค้าให้ครบถ้วนก่อนเข้างาน', 'error');
      return;
    }

    if (photos.length < 20) {
      showToast(`⚠️ ไม่อนุญาตให้ส่งงาน! ต้องมีรูปถ่าย Before/After อย่างน้อย 20 รูป (ปัจจุบันมี ${photos.length} รูป)`, 'error');
      return;
    }

    if (!signOffPhoto) {
      showToast('⚠️ ไม่อนุญาตให้ส่งงาน! กรุณาอัปโหลดใบเซ็นรับงานที่ลูกค้าลงลายมือชื่อแล้ว', 'error');
      return;
    }

    const data = {
      jobId: selectedJob.id,
      call3Days,
      call1Day,
      photos,
      signOffPhoto,
      actLabor: Number(actLabor) || 0,
      actVehicle: Number(actVehicle) || 0,
      actFuel: Number(actFuel) || 0,
      actSupplies: Number(actSupplies) || 0,
      status: 'completed',
      completedAt: new Date().toISOString().split('T')[0],
    };

    await persistExecReport(data);

    const savedCosts = await loadSettingJson('sangkan_actual_costs', {});
    savedCosts[selectedJob.projectId] = {
      labor: Number(actLabor) || 0,
      supplies: Number(actSupplies) || 0,
      transport: (Number(actVehicle) || 0) + (Number(actFuel) || 0),
      other: 0,
      isPaid: false,
      signOffPhoto,
      photosCount: photos.length,
    };
    await saveSettingJson('sangkan_actual_costs', savedCosts);

    showToast('🎉 ปฏิบัติงานเสร็จสมบูรณ์! ส่งมอบงบและภาพถ่ายให้ฝ่ายบัญชีวางบิลเรียบร้อยแล้ว', 'success');
    setSelectedJob(null);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/operations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>บันทึกและส่งมอบงานปฏิบัติการ Big Cleaning</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>จัดการเช็คลิสต์การทำงาน ถ่ายภาพ Before/After ยืนยัน และสรุปต้นทุนส่งให้บัญชีวางบิล</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>เลือกงานคิวงานปฏิบัติการ</h3>
          {schedules.length > 0 ? (
            schedules.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => handleSelectJob(job)}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedJob?.id === job.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: selectedJob?.id === job.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{job.customer}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.date} • {job.team}</p>
              </button>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีคิวงาน — จองได้ที่ปฏิทิน Big Cleaning</p>
          )}
        </div>

        {selectedJob ? (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{selectedJob.projectName}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedJob.customer} | {selectedJob.projectId}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={call3Days} onChange={(e) => setCall3Days(e.target.checked)} />
                <PhoneCall size={16} /> โทรยืนยันลูกค้า 3 วันก่อนเข้างาน
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={call1Day} onChange={(e) => setCall1Day(e.target.checked)} />
                <PhoneCall size={16} /> โทรยืนยันลูกค้า 1 วันก่อนเข้างาน
              </label>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Camera size={18} /> รูป Before/After ({photos.length}/20+)</h4>
                <button type="button" onClick={handleUploadPhoto} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                  <Plus size={14} /> เพิ่มรูป
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {photos.map((p) => (
                  <div key={p.id} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p.type}: {p.url}
                    <button type="button" onClick={() => handleRemovePhoto(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FileCheck size={18} /> ใบเซ็นรับงานจากลูกค้า</h4>
              {signOffPhoto ? (
                <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>✓ อัปโหลดแล้ว: {signOffPhoto}</p>
              ) : (
                <button type="button" onClick={handleUploadSignOff} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer' }}>
                  <Upload size={16} /> อัปโหลดใบเซ็นรับงาน
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ค่าแรงจริง (฿)</label>
                <input type="number" value={actLabor} onChange={(e) => setActLabor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ค่าน้ำยา/วัสดุ (฿)</label>
                <input type="number" value={actSupplies} onChange={(e) => setActSupplies(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ค่ารถ/ยานพาหนะ (฿)</label>
                <input type="number" value={actVehicle} onChange={(e) => setActVehicle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ค่าน้ำมัน (฿)</label>
                <input type="number" value={actFuel} onChange={(e) => setActFuel(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button type="button" onClick={handleSaveProgress} style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                บันทึกความคืบหน้า
              </button>
              <button type="button" onClick={handleSubmitToAccounting} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> ส่งมอบบัญชีวางบิล
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Briefcase size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>เลือกงานจากรายการด้านซ้ายเพื่อเริ่มบันทึกปฏิบัติการ</p>
          </div>
        )}
      </div>
    </div>
  );
}
