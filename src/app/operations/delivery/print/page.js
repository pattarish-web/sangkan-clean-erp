'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { fetchData, fetchQuotations } from '@/utils/api';
import { findSurveyForDeal } from '@/lib/find-survey';
import { scopeItemsFromQuote } from '@/lib/delivery-note-utils';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import DeliveryNotePrint from '@/components/DeliveryNotePrint';

function DeliveryPrintInner() {
  const params = useSearchParams();
  const docId = params.get('id') || '';
  const scheduleId = params.get('scheduleId') || '';
  const quoteIdParam = params.get('quoteId') || params.get('ref') || '';
  const { profile } = useCompanyProfile();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [schedules, quotes, surveys, deliveryNotes] = await Promise.all([
          fetchData('BigcleanSchedule'),
          fetchQuotations(),
          fetchData('AllSurveys'),
          fetchData('DeliveryNotes').catch(() => []),
        ]);

        let payload = null;

        if (docId) {
          payload = (deliveryNotes || []).find((d) => String(d.id) === String(docId)) || null;
        }

        if (!payload) {
          const sch =
            (schedules || []).find((s) => String(s.id) === String(scheduleId)) ||
            (schedules || []).find((s) => String(s.projectId) === String(quoteIdParam)) ||
            null;
          const qid = quoteIdParam || sch?.projectId || sch?.refQuotation || '';
          const quote = (quotes || []).find((q) => String(q.id) === String(qid)) || null;
          const survey = findSurveyForDeal(
            { id: qid, customer: sch?.customer || quote?.customer, projectName: sch?.projectName || quote?.projectName },
            quote,
            surveys || []
          );

          const existing = (deliveryNotes || []).find(
            (d) =>
              String(d.scheduleId) === String(sch?.id || scheduleId) ||
              String(d.refQuotation) === String(qid)
          );

          if (existing) {
            payload = existing;
          } else if (sch || quote) {
            payload = {
              id: `DN${Date.now().toString().slice(-6)}`,
              scheduleId: sch?.id || scheduleId,
              refQuotation: qid,
              customer: sch?.customer || quote?.customer || survey?.customer || '',
              projectName: sch?.projectName || quote?.projectName || survey?.projectName || '',
              address: sch?.address || quote?.address || survey?.address || '',
              workDate: sch?.date || quote?.date || '',
              days: sch?.days || survey?.days || 1,
              team: sch?.team || '',
              teamSize: sch?.teamSize || sch?.estimatedPeoplePerDay || null,
              contactPhone: sch?.contactPhone || quote?.contactPhone || '',
              contacts: sch?.contacts || quote?.contacts || [],
              notes: '',
              scopeItems: scopeItemsFromQuote(quote),
              survey,
            };
          }
        }

        if (!payload) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!payload.scopeItems?.length && payload.quoteSummary?.items) {
          payload.scopeItems = scopeItemsFromQuote({ items: payload.quoteSummary.items });
        }

        let survey = payload.survey || null;
        if (!survey && payload.refQuotation) {
          const quote = (quotes || []).find((q) => String(q.id) === String(payload.refQuotation));
          survey = findSurveyForDeal(
            { id: payload.refQuotation, customer: payload.customer, projectName: payload.projectName },
            quote,
            surveys || []
          );
        }

        const contact = Array.isArray(payload.contacts) ? payload.contacts[0] : null;

        setDoc({
          docNo: payload.id,
          customer: payload.customer,
          projectName: payload.projectName,
          address: payload.address,
          workDate: payload.workDate || payload.createdAt,
          days: payload.days,
          team: payload.team,
          teamSize: payload.teamSize,
          refQuotation: payload.refQuotation,
          survey: survey || payload.surveySummary,
          scopeItems: payload.scopeItems || scopeItemsFromQuote(payload.quoteSummary),
          notes: payload.notes,
          contactName: contact?.name || payload.contactName || '',
          contactPhone: contact?.phone || payload.contactPhone || '',
        });

        if (params.get('print') === '1') {
          setTimeout(() => window.print(), 500);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [docId, scheduleId, quoteIdParam]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>กำลังเตรียมเอกสาร PDF...</div>;
  }

  if (notFound || !doc) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: 16 }}>ไม่พบข้อมูลใบส่งมอบงาน</p>
        <Link href="/operations" style={{ color: 'var(--primary-color)' }}>กลับหน้าปฏิบัติการ</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px 60px' }}>
      <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href={scheduleId || quoteIdParam ? `/operations/delivery?scheduleId=${encodeURIComponent(scheduleId)}&quoteId=${encodeURIComponent(quoteIdParam)}` : '/operations'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>หนังสือส่งมอบงาน (PDF)</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>รูปแบบตามแบบฟอร์มใบส่งงาน — พิมพ์แล้วให้ลูกค้าเซ็นรับ</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#0891b2', color: 'white', fontWeight: 700, cursor: 'pointer' }}
        >
          <Printer size={18} /> พิมพ์ / บันทึก PDF
        </button>
      </div>

      <DeliveryNotePrint
        profile={profile}
        docNo={doc.docNo}
        customer={doc.customer}
        projectName={doc.projectName}
        address={doc.address}
        workDate={doc.workDate}
        days={doc.days}
        team={doc.team}
        teamSize={doc.teamSize}
        refQuotation={doc.refQuotation}
        survey={doc.survey}
        scopeItems={doc.scopeItems}
        notes={doc.notes}
        contactName={doc.contactName}
        contactPhone={doc.contactPhone}
      />
    </div>
  );
}

export default function DeliveryPrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>กำลังโหลด...</div>}>
      <DeliveryPrintInner />
    </Suspense>
  );
}
