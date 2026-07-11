'use client';
import { useState, useEffect, useRef } from 'react';
import { PhoneCall, Camera, CheckCircle, AlertCircle, Upload, X, Briefcase, FileCheck, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { fetchData } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { readFilesAsDataUrls } from '@/lib/read-image-files';

async function setCrmDealStage(dealId, stage) {
  if (!dealId) return;
  const saved = await loadSettingJson('sangkan_crm_deal_stages', {});
  saved[dealId] = stage;
  await saveSettingJson('sangkan_crm_deal_stages', saved);
}

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
  const photoInputRef = useRef(null);
  const signOffInputRef = useRef(null);

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

  const dealIdOf = (job) => job?.projectId || job?.refQuotation || job?.dealId || '';

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    const parsed = execReports[job.id] || execReports[dealIdOf(job)];
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

  const handlePhotoFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const remaining = 30 - photos.length;
    const added = await readFilesAsDataUrls(files, { max: remaining, type: 'During' });
    setPhotos((prev) => [...prev, ...added]);
    showToast(`อัปโหลดรูปสำเร็จ ${added.length} รูป`, 'success');
    e.target.value = '';
  };

  const handleSignOffFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const [item] = await readFilesAsDataUrls([file], { max: 1 });
    setSignOffPhoto(item.url);
    showToast('อัปโหลดใบเซ็นรับงานเรียบร้อย', 'success');
    e.target.value = '';
  };

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const buildReportPayload = (status) => ({
    jobId: selectedJob.id,
    projectId: dealIdOf(selectedJob),
    dealId: dealIdOf(selectedJob),
    customer: selectedJob.customer || '',
    projectName: selectedJob.projectName || '',
    team: selectedJob.team || '',
    date: selectedJob.date || '',
    call3Days,
    call1Day,
    photos,
    signOffPhoto,
    actLabor: Number(actLabor) || 0,
    actVehicle: Number(actVehicle) || 0,
    actFuel: Number(actFuel) || 0,
    actSupplies: Number(actSupplies) || 0,
    status,
    ...(status === 'completed' ? { completedAt: new Date().toISOString().split('T')[0] } : {}),
  });

  const persistExecReport = async (data) => {
    const dealId = data.projectId || data.dealId;
    const updated = {
      ...execReports,
      [selectedJob.id]: data,
    };
    // เก็บสำเนาด้วยรหัส QT เพื่อให้ CRM จับ stage ได้
    if (dealId) {
      updated[dealId] = data;
    }
    setExecReports(updated);
    await saveSettingJson('sangkan_execution_reports', updated);
  };

  /** สร้าง/บันทึกใบส่งมอบงาน → ขยับ CRM 3 → 4 */
  const handleSaveProgress = async () => {
    if (!selectedJob) return;

    const data = buildReportPayload('in-progress');
    const isNew = !execReports[selectedJob.id] && !execReports[dealIdOf(selectedJob)];

    await persistExecReport(data);

    const dealId = dealIdOf(selectedJob);
    if (dealId) {
      await setCrmDealStage(dealId, 'ops');
    }

    showToast(
      isNew
        ? 'สร้างใบส่งมอบงานแล้ว — ดีลขยับไปขั้น 4 กำลังทำความสะอาด'
        : 'บันทึกความคืบหน้าของงานปฏิบัติการสำเร็จแล้ว',
      'success'
    );
  };

  /** ปิดงานในใบส่งมอบ → ขยับ CRM 4 → 5 */
  const handleCloseJob = async () => {
    if (!selectedJob) return;

    if (!call3Days || !call1Day) {
      showToast('⚠️ ไม่อนุญาตให้ปิดงาน! กรุณายืนยันการโทรยืนยันนัดหมายกับลูกค้าให้ครบถ้วนก่อน', 'error');
      return;
    }

    if (photos.length < 20) {
      showToast(`⚠️ ไม่อนุญาตให้ปิดงาน! ต้องมีรูปถ่าย Before/After อย่างน้อย 20 รูป (ปัจจุบันมี ${photos.length} รูป)`, 'error');
      return;
    }

    if (!signOffPhoto) {
      showToast('⚠️ ไม่อนุญาตให้ปิดงาน! กรุณาอัปโหลดใบเซ็นรับงานที่ลูกค้าลงลายมือชื่อแล้ว', 'error');
      return;
    }

    const data = buildReportPayload('completed');
    await persistExecReport(data);

    const dealId = dealIdOf(selectedJob);
    if (dealId) {
      await setCrmDealStage(dealId, 'delivered');
    }

    const savedCosts = await loadSettingJson('sangkan_actual_costs', {});
    if (dealId) {
      savedCosts[dealId] = {
        labor: Number(actLabor) || 0,
        supplies: Number(actSupplies) || 0,
        transport: (Number(actVehicle) || 0) + (Number(actFuel) || 0),
        other: 0,
        isPaid: false,
        signOffPhoto,
        photosCount: photos.length,
      };
      await saveSettingJson('sangkan_actual_costs', savedCosts);
    }

    showToast('ปิดงานเรียบร้อย — ดีลขยับไปขั้น 5 ปิดงาน/รอวางบิล', 'success');
    setSelectedJob(null);
  };

  const reportOf = (job) => execReports[job.id] || execReports[dealIdOf(job)];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/operations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>บันทึกและส่งมอบงานปฏิบัติการ Big Cleaning</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>สร้างใบส่งมอบ → ขั้น 4 · กดปิดงาน → ขั้น 5 · บัญชีวางบิลใน CRM → ขั้น 6</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>เลือกงานคิวงานปฏิบัติการ</h3>
          {schedules.length > 0 ? (
            schedules.map((job) => {
              const rep = reportOf(job);
              const badge =
                rep?.status === 'completed' ? { text: 'ปิดงานแล้ว', bg: '#ecfeff', color: '#0e7490' } :
                rep?.status === 'in-progress' ? { text: 'กำลังทำ', bg: '#f5f3ff', color: '#6d28d9' } :
                { text: 'รอสร้างใบส่งมอบ', bg: '#f1f5f9', color: '#64748b' };
              return (
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
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.date} • {job.team}</p>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                    {badge.text}
                  </span>
                </button>
              );
            })
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยังไม่มีคิวงาน — จองได้ที่ปฏิทิน Big Cleaning / CRM ขั้น 3</p>
          )}
        </div>

        {selectedJob ? (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{selectedJob.projectName}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedJob.customer} | {dealIdOf(selectedJob) || selectedJob.id}</p>
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
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photos.length >= 30} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', cursor: photos.length >= 30 ? 'not-allowed' : 'pointer' }}>
                  <Plus size={14} /> เพิ่มรูป
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoFiles} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {photos.map((p) => (
                  <div key={p.id} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {p.url?.startsWith('data:') ? (
                      <img src={p.url} alt={p.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ padding: '8px', fontSize: '0.7rem' }}>{p.type}</div>
                    )}
                    <button type="button" onClick={() => handleRemovePhoto(p.id)} style={{ position: 'absolute', top: 2, right: 2, border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', cursor: 'pointer', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><FileCheck size={18} /> ใบเซ็นรับงานจากลูกค้า</h4>
              {signOffPhoto ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {signOffPhoto.startsWith('data:') && <img src={signOffPhoto} alt="signoff" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />}
                  <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>✓ อัปโหลดใบเซ็นรับงานแล้ว</p>
                </div>
              ) : (
                <>
                <button type="button" onClick={() => signOffInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer' }}>
                  <Upload size={16} /> อัปโหลดใบเซ็นรับงาน
                </button>
                <input ref={signOffInputRef} type="file" accept="image/*" hidden onChange={handleSignOffFile} />
                </>
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
              <button type="button" onClick={handleSaveProgress} style={{ flex: 1, padding: '12px', backgroundColor: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#6d28d9' }}>
                {reportOf(selectedJob) ? 'บันทึกความคืบหน้า' : 'สร้างใบส่งมอบงาน → ขั้น 4'}
              </button>
              <button type="button" onClick={handleCloseJob} style={{ flex: 1, padding: '12px', backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> ปิดงาน → ขั้น 5
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
