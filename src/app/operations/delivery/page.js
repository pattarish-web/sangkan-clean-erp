'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Camera, CheckCircle, MapPin, Users, Calendar, Clock,
  FileText, Upload, X, Plus, Image as ImageIcon, Printer,
} from 'lucide-react';
import { fetchData, fetchQuotations, saveData } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { stripPriceFields, scopeItemsFromQuote } from '@/lib/delivery-note-utils';
import { findSurveyForDeal } from '@/lib/find-survey';
import { useToast } from '@/components/Toast';

const MAX_BATCH = 30;
const PHOTO_CATEGORIES = [
  { key: 'before', label: '1) ก่อนทำ', color: '#0369a1', bg: '#e0f2fe' },
  { key: 'during', label: '2) ระหว่างทำ', color: '#b45309', bg: '#fffbeb' },
  { key: 'after', label: '3) หลังทำ', color: '#15803d', bg: '#dcfce7' },
];

async function setCrmDealStage(dealId, stage) {
  if (!dealId) return;
  const saved = await loadSettingJson('sangkan_crm_deal_stages', {});
  saved[dealId] = stage;
  await saveSettingJson('sangkan_crm_deal_stages', saved);
}

function DeliveryNoteInner() {
  const showToast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const scheduleId = params.get('scheduleId') || '';
  const quoteIdParam = params.get('quoteId') || params.get('ref') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [quote, setQuote] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState({ before: [], during: [], after: [] });
  const [docNo, setDocNo] = useState('');

  const dealId = quoteIdParam || schedule?.projectId || schedule?.refQuotation || '';

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [schedules, quotes, surveys, existingDocs] = await Promise.all([
          fetchData('BigcleanSchedule'),
          fetchQuotations(),
          fetchData('AllSurveys'),
          fetchData('DeliveryNotes').catch(() => []),
        ]);

        const sch =
          (schedules || []).find((s) => String(s.id) === String(scheduleId)) ||
          (schedules || []).find((s) => String(s.projectId) === String(quoteIdParam)) ||
          null;
        setSchedule(sch);

        const qid = quoteIdParam || sch?.projectId || sch?.refQuotation || '';
        const q = (quotes || []).find((item) => String(item.id) === String(qid)) || null;
        setQuote(q);

        const sv = findSurveyForDeal(
          { id: qid, customer: sch?.customer || q?.customer, projectName: sch?.projectName || q?.projectName },
          q,
          surveys || []
        );
        setSurvey(sv);

        const existing = (existingDocs || []).find(
          (d) =>
            String(d.scheduleId) === String(sch?.id || scheduleId) ||
            String(d.refQuotation) === String(qid)
        );
        if (existing) {
          setDocNo(existing.id);
          setNotes(existing.notes || '');
          setPhotos({
            before: existing.photos?.before || [],
            during: existing.photos?.during || [],
            after: existing.photos?.after || [],
          });
        } else {
          const stamp = Date.now().toString().slice(-6);
          setDocNo(`DN${stamp}`);
        }
      } catch (e) {
        console.error(e);
        showToast('โหลดข้อมูลใบส่งมอบงานไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scheduleId, quoteIdParam]);

  const scopeItems = useMemo(() => scopeItemsFromQuote(quote), [quote]);

  const printUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (docNo && docNo.startsWith('DN')) qs.set('id', docNo);
    if (scheduleId) qs.set('scheduleId', scheduleId);
    if (dealId) qs.set('quoteId', dealId);
    return `/operations/delivery/print?${qs.toString()}`;
  }, [docNo, scheduleId, dealId]);

  const readFilesAsDataUrls = (fileList, category) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const current = photos[category] || [];
    const room = Math.max(0, MAX_BATCH - current.length);
    if (room <= 0) {
      showToast(`หมวด "${PHOTO_CATEGORIES.find((c) => c.key === category)?.label}" มีครบ ${MAX_BATCH} รูปแล้ว`, 'warning');
      return;
    }

    const take = files.slice(0, room);
    if (files.length > room) {
      showToast(`เลือกได้ครั้งละไม่เกิน ${MAX_BATCH} รูป (รับเพิ่มได้อีก ${room} รูป)`, 'warning');
    }

    Promise.all(
      take.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              url: reader.result,
              uploadedAt: new Date().toISOString(),
            });
            reader.readAsDataURL(file);
          })
      )
    ).then((parsed) => {
      setPhotos((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), ...parsed].slice(0, MAX_BATCH),
      }));
      showToast(`เพิ่มรูป ${parsed.length} ไฟล์ในหมวดนี้แล้ว`, 'success');
    });
  };

  const removePhoto = (category, id) => {
    setPhotos((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((p) => p.id !== id),
    }));
  };

  const handleConfirmCreate = async () => {
    if (!docNo) return;
    setSaving(true);
    try {
      const payload = {
        id: docNo,
        scheduleId: schedule?.id || scheduleId || '',
        refQuotation: dealId || '',
        customer: schedule?.customer || quote?.customer || survey?.customer || '',
        projectName: schedule?.projectName || quote?.projectName || survey?.projectName || '',
        address: schedule?.address || quote?.address || survey?.address || '',
        mapUrl: schedule?.mapUrl || quote?.mapUrl || '',
        siteType: survey?.siteType || '',
        areaSqm: survey?.areaSqm || null,
        workDate: schedule?.date || '',
        days: schedule?.days || survey?.days || 1,
        team: schedule?.team || '',
        teamSize: schedule?.teamSize || schedule?.estimatedPeoplePerDay || null,
        contacts: schedule?.contacts || quote?.contacts || [],
        contactPhone: schedule?.contactPhone || quote?.contactPhone || '',
        // รายละเอียดจากใบประเมิน/ใบเสนอ (ตัดราคาออก)
        surveySummary: stripPriceFields({
          surveyId: survey?.surveyId || survey?.id,
          siteType: survey?.siteType,
          areaSqm: survey?.areaSqm,
          days: survey?.days,
          nightShift: survey?.nightShift,
          highRise: survey?.highRise,
          heavyStains: survey?.heavyStains,
          noWaterElectricity: survey?.noWaterElectricity,
          specialNotes: survey?.specialNotes,
          supervisorCount: survey?.supervisorCount,
          maidCount: survey?.maidCount,
          technicianCount: survey?.technicianCount,
          lumpSumLaborCount: survey?.lumpSumLaborCount,
          lumpSumDays: survey?.lumpSumDays,
          outsourceSupervisorCount: survey?.outsourceSupervisorCount,
          outsourceMaidCount: survey?.outsourceMaidCount,
          outsourceTechnicianCount: survey?.outsourceTechnicianCount,
          outsourceDays: survey?.outsourceDays,
          useDailyLabor: survey?.useDailyLabor,
          useLumpSumLabor: survey?.useLumpSumLabor,
          useOutsourceLabor: survey?.useOutsourceLabor,
        }),
        quoteSummary: stripPriceFields({
          id: quote?.id,
          projectName: quote?.projectName,
          customer: quote?.customer,
          address: quote?.address,
          date: quote?.date,
          items: quote?.items,
          note: quote?.note || quote?.notes,
          sitePhotos: undefined,
        }),
        scopeItems,
        notes,
        photos,
        status: 'in-progress',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };

      await saveData('DeliveryNotes', payload);

      // sync เข้า execution report + ขยับ CRM 3 → 4
      const execReports = await loadSettingJson('sangkan_execution_reports', {});
      const execPayload = {
        jobId: schedule?.id || docNo,
        projectId: dealId,
        dealId,
        customer: payload.customer,
        projectName: payload.projectName,
        team: payload.team,
        date: payload.workDate,
        photos: [
          ...photos.before.map((p) => ({ ...p, type: 'Before' })),
          ...photos.during.map((p) => ({ ...p, type: 'During' })),
          ...photos.after.map((p) => ({ ...p, type: 'After' })),
        ],
        status: 'in-progress',
        deliveryNoteId: docNo,
      };
      if (schedule?.id) execReports[schedule.id] = execPayload;
      if (dealId) execReports[dealId] = execPayload;
      await saveSettingJson('sangkan_execution_reports', execReports);

      if (dealId) await setCrmDealStage(dealId, 'ops');

      showToast('ยืนยันสร้างใบส่งมอบงานแล้ว — ดีลขยับไปขั้น 4', 'success');
      router.push('/operations/execution');
    } catch (e) {
      console.error(e);
      showToast('บันทึกใบส่งมอบงานไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดใบส่งมอบงาน...</div>;
  }

  const customer = schedule?.customer || quote?.customer || survey?.customer || '-';
  const projectName = schedule?.projectName || quote?.projectName || survey?.projectName || '-';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link href="/operations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>หนังสือส่งมอบงาน</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ดึงรายละเอียดจากใบประเมิน + ใบเสนอราคา (ไม่รวมราคา) · เลขที่ {docNo}
          </p>
        </div>
        <Link
          href={printUrl}
          target="_blank"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, border: '1px solid #0891b2', background: 'white', color: '#0891b2', fontWeight: 700, textDecoration: 'none' }}
        >
          <Printer size={18} /> พิมพ์ PDF / เซ็นรับ
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={handleConfirmCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, border: 'none', background: '#06b6d4', color: 'white', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          <CheckCircle size={18} /> {saving ? 'กำลังบันทึก...' : 'ยืนยันสร้างใบส่งมอบงาน'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* สรุปงาน */}
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>{customer}</h3>
          <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}>{projectName}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {schedule?.date || quote?.date || '-'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> {schedule?.days || survey?.days || 1} วัน</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> {schedule?.teamSize || schedule?.estimatedPeoplePerDay || '-'} คน/วัน</span>
            {dealId ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> อ้างอิง {dealId}</span> : null}
          </div>
          {(schedule?.address || quote?.address) && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, fontSize: '0.9rem' }}>
              <MapPin size={16} style={{ marginTop: 2 }} /> {schedule?.address || quote?.address}
            </div>
          )}
        </div>

        {/* รายละเอียดจากใบประเมิน */}
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>รายละเอียดจากใบประเมิน (ไม่รวมราคา)</h3>
          {survey ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.9rem' }}>
              <div>ประเภทหน้างาน: <strong>{survey.siteType || '-'}</strong></div>
              <div>พื้นที่: <strong>{survey.areaSqm ? `${survey.areaSqm} ตร.ม.` : '-'}</strong></div>
              <div>จำนวนวัน: <strong>{survey.days || 1} วัน</strong></div>
              <div>กำลังพลรายวัน: <strong>{(Number(survey.supervisorCount || 0) + Number(survey.maidCount || 0) + Number(survey.technicianCount || 0)) || '-'} คน</strong></div>
              <div style={{ gridColumn: '1 / -1' }}>
                เงื่อนไขพิเศษ:{' '}
                {[
                  survey.nightShift && 'กะดึก',
                  survey.highRise && 'งานที่สูง',
                  survey.heavyStains && 'คราบฝังแน่น',
                  survey.noWaterElectricity && 'ไม่มีน้ำ/ไฟ',
                ].filter(Boolean).join(' · ') || '-'}
              </div>
              {survey.specialNotes && (
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  หมายเหตุ: {survey.specialNotes}
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>ไม่พบใบประเมินที่เชื่อมกับงานนี้</p>
          )}
        </div>

        {/* ขอบเขตงานจากใบเสนอราคา */}
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>ขอบเขตงานจากใบเสนอราคา (ตัดราคาออก)</h3>
          {scopeItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 4px' }}>รายละเอียด</th>
                  <th style={{ padding: '8px 4px', width: 80 }}>จำนวน</th>
                  <th style={{ padding: '8px 4px', width: 80 }}>หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {scopeItems.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 4px', whiteSpace: 'pre-wrap' }}>{it.description}</td>
                    <td style={{ padding: '10px 4px' }}>{it.qty || '-'}</td>
                    <td style={{ padding: '10px 4px' }}>{it.unit || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>ไม่พบรายการในใบเสนอราคา</p>
          )}
          {quote?.note || quote?.notes ? (
            <div style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              หมายเหตุใบเสนอราคา: {quote.note || quote.notes}
            </div>
          ) : null}
        </div>

        {/* รูป 3 แบบ */}
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={18} /> รูปปฏิบัติงาน (ก่อน / ระหว่าง / หลัง)
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            แต่ละหมวดเพิ่มได้ทีละเยอะ (สูงสุดครั้งละ {MAX_BATCH} รูป) เพื่อลดภาระแคช
          </p>

          <div style={{ display: 'grid', gap: 18 }}>
            {PHOTO_CATEGORIES.map((cat) => {
              const list = photos[cat.key] || [];
              const inputId = `delivery-photo-${cat.key}`;
              return (
                <div key={cat.key} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 999, background: cat.bg, color: cat.color, fontWeight: 700, fontSize: '0.85rem' }}>{cat.label}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{list.length}/{MAX_BATCH} รูป</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById(inputId)?.click()}
                      disabled={list.length >= MAX_BATCH}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
                        border: '1px dashed var(--border-color)', background: 'white', cursor: list.length >= MAX_BATCH ? 'not-allowed' : 'pointer',
                        color: cat.color, fontWeight: 600, opacity: list.length >= MAX_BATCH ? 0.5 : 1,
                      }}
                    >
                      <Upload size={14} /> เพิ่มรูป (สูงสุด {MAX_BATCH}/ครั้ง)
                    </button>
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        readFilesAsDataUrls(e.target.files, cat.key);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
                    {list.map((photo) => (
                      <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f1f5f9' }}>
                        {typeof photo.url === 'string' && (photo.url.startsWith('data:image') || photo.url.startsWith('http') || photo.url.startsWith('/')) ? (
                          <img src={photo.url} alt={photo.name || cat.key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={22} color="#94a3b8" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(cat.key, photo.id)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <button
                        type="button"
                        onClick={() => document.getElementById(inputId)?.click()}
                        style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed #cbd5e1', background: 'white', color: cat.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
                      >
                        <Plus size={20} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>แนบรูป</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>หมายเหตุเพิ่มเติมในใบส่งมอบงาน</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="เช่น จุดที่ลูกค้าเน้นพิเศษ / เวลาเข้า-ออกไซต์"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Link href="/operations" style={{ padding: '12px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'white', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600 }}>
            กลับ
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirmCreate}
            style={{ padding: '12px 18px', borderRadius: 8, border: 'none', background: '#06b6d4', color: 'white', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'กำลังบันทึก...' : 'ยืนยันและสร้างใบส่งมอบงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryNotePage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>กำลังโหลด...</div>}>
      <DeliveryNoteInner />
    </Suspense>
  );
}
