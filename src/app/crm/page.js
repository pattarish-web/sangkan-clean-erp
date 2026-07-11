'use client';
import { findSurveyForDeal } from '@/lib/find-survey';
import { useState, useEffect } from 'react';
import { Columns, Users, CheckCircle, DollarSign, AlertCircle, Calendar as CalendarIcon, ArrowRight, Search, Plus, PhoneCall, MessageSquare, Briefcase, ChevronRight, TrendingUp, Clock, Eye, Trash2, ChevronLeft, X, Pencil } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchData, saveData, deleteData, fetchSetting } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { useToast } from '@/components/Toast';

function buildManpowerFromSurvey(survey, overrideDays = null) {
  if (!survey) {
    return {
      daily: null,
      lumpSum: null,
      outsource: null,
      totalPeople: 0,
      days: 1,
      estimatedPeoplePerDay: 1,
      estimateMethod: 'default',
      maxDays: 1,
      manDaysTotal: 0,
    };
  }

  const jobDays = Math.max(1, Number(overrideDays || survey.days || 1) || 1);

  // ใช้สวิตช์ use* เป็นหลัก — ไม่ดึง laborType=daily ทับสวิตช์ที่ปิดไว้
  const hasAnySwitch =
    survey.useDailyLabor !== undefined ||
    survey.useLumpSumLabor !== undefined ||
    survey.useOutsourceLabor !== undefined;

  let useDaily;
  let useLump;
  let useOut;

  if (hasAnySwitch) {
    useDaily = !!survey.useDailyLabor;
    useLump = !!survey.useLumpSumLabor;
    useOut = !!survey.useOutsourceLabor;
  } else {
    // ข้อมูลเก่า: เดาจากแรงงานที่มีตัวเลข / laborType
    useDaily =
      survey.laborType === 'daily' ||
      Number(survey.supervisorCount || 0) > 0 ||
      Number(survey.maidCount || 0) > 0 ||
      Number(survey.technicianCount || 0) > 0;
    useLump = Number(survey.lumpSumLaborCount || 0) > 0 || Number(survey.lumpSumLaborCost || 0) > 0;
    useOut =
      Number(survey.outsourceSupervisorCount || 0) +
        Number(survey.outsourceMaidCount || 0) +
        Number(survey.outsourceTechnicianCount || 0) >
        0 || Number(survey.outsourceLaborCost || 0) > 0;
  }

  const dailySupervisors = Number(survey.supervisorCount || 0) || 0;
  const dailyMaids = Number(survey.maidCount || 0) || 0;
  const dailyTechs = Number(survey.technicianCount || 0) || 0;
  const dailyTotal = useDaily ? dailySupervisors + dailyMaids + dailyTechs : 0;
  const dailyDays = Math.max(1, Number(survey.days || jobDays) || 1);

  const lumpTotal = useLump ? Number(survey.lumpSumLaborCount || 0) || 0 : 0;
  const lumpDays = Math.max(1, Number(survey.lumpSumDays || survey.days || jobDays) || 1);

  const outSupervisors = Number(survey.outsourceSupervisorCount || 0) || 0;
  const outMaids = Number(survey.outsourceMaidCount || 0) || 0;
  const outTechs = Number(survey.outsourceTechnicianCount || 0) || 0;
  const outsourceTotal = useOut ? outSupervisors + outMaids + outTechs : 0;
  const outDays = Math.max(1, Number(survey.outsourceDays || survey.days || jobDays) || 1);

  const groups = [];
  if (useDaily && dailyTotal > 0) groups.push({ people: dailyTotal, days: dailyDays, key: 'daily' });
  if (useLump && lumpTotal > 0) groups.push({ people: lumpTotal, days: lumpDays, key: 'lump' });
  if (useOut && outsourceTotal > 0) groups.push({ people: outsourceTotal, days: outDays, key: 'outsource' });

  const totalPeople = groups.reduce((sum, g) => sum + g.people, 0);
  const activeDays = groups.map((g) => g.days);
  const daysEqual = activeDays.length <= 1 || activeDays.every((d) => d === activeDays[0]);
  const maxDays = activeDays.length ? Math.max(...activeDays) : jobDays;
  const manDaysTotal = groups.reduce((sum, g) => sum + g.people * g.days, 0);

  let estimatedPeoplePerDay = 1;
  let estimateMethod = 'default';

  if (!groups.length) {
    estimatedPeoplePerDay = 1;
    estimateMethod = 'default';
  } else if (daysEqual) {
    // วันเท่ากัน → รวมคนทุกหัวข้อที่มีตัวเลขจริง
    estimatedPeoplePerDay = Math.max(1, totalPeople);
    estimateMethod = 'sum_same_days';
  } else {
    // วันไม่เท่า → Σ(คน×วัน) ÷ วันสูงสุด (ปัดขึ้น)
    estimatedPeoplePerDay = Math.max(1, Math.ceil(manDaysTotal / maxDays));
    estimateMethod = 'man_days_div_max';
  }

  return {
    // แสดงเฉพาะหัวข้อที่เปิดใช้และมีจำนวนคน > 0
    daily:
      useDaily && dailyTotal > 0
        ? {
            supervisors: dailySupervisors,
            maids: dailyMaids,
            technicians: dailyTechs,
            total: dailyTotal,
            days: dailyDays,
          }
        : null,
    lumpSum:
      useLump && lumpTotal > 0
        ? {
            total: lumpTotal,
            days: lumpDays,
          }
        : null,
    outsource:
      useOut && outsourceTotal > 0
        ? {
            supervisors: outSupervisors,
            maids: outMaids,
            technicians: outTechs,
            total: outsourceTotal,
            days: outDays,
          }
        : null,
    totalPeople,
    days: jobDays,
    estimatedPeoplePerDay,
    estimateMethod,
    maxDays,
    manDaysTotal,
  };
}

function inferServiceType(source = {}) {
  if (source.serviceType === 'recurring' || source.serviceType === 'bigcleaning') {
    return source.serviceType;
  }
  if (source.quotationType === 'recurring' || source.quotationType === 'bigcleaning') {
    return source.quotationType;
  }

  const text = [
    source.projectName,
    source.description,
    source.note,
    ...(source.items || []).map(item => `${item.description || ''} ${item.unit || ''}`),
  ].filter(Boolean).join(' ');

  if (/แม่บ้านประจำ|รายเดือน|รายปี|\/ เดือน|unit.*เดือน/i.test(text) && !/big\s*clean/i.test(text)) {
    return 'recurring';
  }
  return 'bigcleaning';
}

const INVOICE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // ขั้น 6 วางบิลแล้ว — อยู่บนกระดาน 3 วัน

function ensureInvoiceExpiry(billingInfo) {
  if (!billingInfo) return null;
  if (billingInfo.expiresAt) return billingInfo;
  const start = billingInfo.at ? new Date(billingInfo.at).getTime() : Date.now();
  return {
    ...billingInfo,
    expiresAt: new Date(start + INVOICE_TTL_MS).toISOString(),
  };
}

function getInvoiceRemainingMs(billingInfo) {
  const info = ensureInvoiceExpiry(billingInfo);
  if (!info?.expiresAt) return null;
  return new Date(info.expiresAt).getTime() - Date.now();
}

function formatInvoiceCountdown(remainingMs) {
  if (remainingMs == null) return '';
  if (remainingMs <= 0) return 'หมดเวลา — จะนำออกจากกระดาน';
  const totalMin = Math.ceil(remainingMs / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `เหลือ ${days} วัน ${hours} ชม.`;
  if (hours > 0) return `เหลือ ${hours} ชม. ${mins} นาที`;
  return `เหลือ ${mins} นาที`;
}

export default function CRMPage() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('bigcleaning');
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [lostDeals, setLostDeals] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('ลูกค้าปฏิเสธ / ไม่ได้งาน');
  const [rollbackDeleteTarget, setRollbackDeleteTarget] = useState(null); // { deal, fromStage }
  const [nowTick, setNowTick] = useState(Date.now());
  const [customerLogs, setCustomerLogs] = useState([]);
  const [surveySchedules, setSurveySchedules] = useState([]); // นัดหมายสำรวจหน้างาน
  const [searchQuery, setSearchQuery] = useState('');
  
  // สำหรับปฏิทินสำรวจหน้างาน
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSurveyDay, setSelectedSurveyDay] = useState(null); // วันที่เลือกในปฏิทิน (1-31)

  // Interactive Logs Form
  const [logClient, setLogClient] = useState('');
  const [logText, setLogText] = useState('');
  const [logType, setLogType] = useState('โทรศัพท์');

  // Form สำหรับจองนัดสำรวจหน้างาน
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyClient, setSurveyClient] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyTime, setSurveyTime] = useState('10:00');
  const [surveyAssigned, setSurveyAssigned] = useState('เซลล์ สมปอง');
  const [surveyNote, setSurveyNote] = useState('');
  const [surveyContacts, setSurveyContacts] = useState([{ name: '', phone: '' }]);

  // Form/Modal สำหรับแบบประเมินต้นทุนหน้างานขนาดใหญ่ (Site Cost Estimator Pop-up)
  const [isCostingModalOpen, setIsCostingModalOpen] = useState(false);
  const [editingSurveyId, setEditingSurveyId] = useState(null);
  const [allSurveys, setAllSurveys] = useState([]);
  const [selectedViewSurvey, setSelectedViewSurvey] = useState(null);
  const [costingCustomer, setCostingCustomer] = useState('');
  const [costingProjectName, setCostingProjectName] = useState('');
  const [costingSalesperson, setCostingSalesperson] = useState('เซลล์ สมปอง'); // เซลส์ผู้ดูแล
  const [costingAreaSqm, setCostingAreaSqm] = useState(150); // ขนาดพื้นที่ ตร.ม.
  const [costingSiteType, setCostingSiteType] = useState('สำนักงาน / ออฟฟิศ'); // ประเภทหน้างาน
  
  // แยกสตาฟละเอียด
  const [useDailyLabor, setUseDailyLabor] = useState(true);
  const [useLumpSumLabor, setUseLumpSumLabor] = useState(false);
  const [useOutsourceLabor, setUseOutsourceLabor] = useState(false);
  const [costingLaborType, setCostingLaborType] = useState('daily'); // 'daily' | 'lumpSum'
  const [costingSupervisorCount, setCostingSupervisorCount] = useState(1);
  const [costingSupervisorRate, setCostingSupervisorRate] = useState(700);
  const [costingMaidCount, setCostingMaidCount] = useState(4);
  const [costingMaidRate, setCostingMaidRate] = useState(500);
  const [costingTechnicianCount, setCostingTechnicianCount] = useState(0);
  const [costingTechnicianRate, setCostingTechnicianRate] = useState(800);
  const [costingOutsourceLaborCost, setCostingOutsourceLaborCost] = useState(0); // ค่าแรงนอก/ซับคอนแทรค
  const [costingOutsourceSupervisorCount, setCostingOutsourceSupervisorCount] = useState(0);
  const [costingOutsourceSupervisorRate, setCostingOutsourceSupervisorRate] = useState(700);
  const [costingOutsourceMaidCount, setCostingOutsourceMaidCount] = useState(0);
  const [costingOutsourceMaidRate, setCostingOutsourceMaidRate] = useState(500);
  const [costingOutsourceTechnicianCount, setCostingOutsourceTechnicianCount] = useState(0);
  const [costingOutsourceTechnicianRate, setCostingOutsourceTechnicianRate] = useState(800);
  const [costingOutsourceDays, setCostingOutsourceDays] = useState(1);
  const [costingLumpSumLaborCount, setCostingLumpSumLaborCount] = useState(10);
  const [costingLumpSumLaborCost, setCostingLumpSumLaborCost] = useState(12000);
  const [costingLumpSumDays, setCostingLumpSumDays] = useState(2);
  const [costingDays, setCostingDays] = useState(2);
  
  // เครื่องจักร อุปกรณ์เฉพาะ และยานพาหนะแบบแยกคันรายวัน
  const [costingVehicles, setCostingVehicles] = useState([
    { id: 1, type: 'รถกระบะขนอุปกรณ์', rate: 1500, count: 1, days: 1 }
  ]);
  const [costingBoomLiftCost, setCostingBoomLiftCost] = useState(0); // ค่าเช่ารถกระเช้า/นั่งร้าน
  const [costingSuppliesType, setCostingSuppliesType] = useState('perSqm'); // 'lumpSum' | 'perSqm'
  const [costingSuppliesRate, setCostingSuppliesRate] = useState(2); // อัตราต่อ ตร.ม. เช่น 2 บาท
  const [costingSuppliesCost, setCostingSuppliesCost] = useState(300); // ค่าน้ำยาทำความสะอาดทั่วไป
  const [costingSpecialChemicals, setCostingSpecialChemicals] = useState(0); // เคมีล้างคราบปูน/เคลือบเงา
  const [costingSafeguardCost, setCostingSafeguardCost] = useState(0); // วัสดุเซฟการ์ดหน้างาน
  const [costingToolsCost, setCostingToolsCost] = useState(500); // เครื่องขัด/เครื่องมือ
  const [costingSafetyCost, setCostingSafetyCost] = useState(0); // อุปกรณ์ความปลอดภัย PPE
  const [costingOtherCost, setCostingOtherCost] = useState(0);
  
  const [costingMarkupPercent, setCostingMarkupPercent] = useState(35);
  const [costingNightShift, setCostingNightShift] = useState(false);
  const [costingHighRise, setCostingHighRise] = useState(false);
  const [costingHeavyStains, setCostingHeavyStains] = useState(false);
  const [costingNoWaterElectricity, setCostingNoWaterElectricity] = useState(false);
  const [costingSpecialNotes, setCostingSpecialNotes] = useState('');

  // Modal จองคิวปฏิบัติการเมื่อย้าย 2 → 3
  const [isOpsBookModalOpen, setIsOpsBookModalOpen] = useState(false);
  const [opsBookDeal, setOpsBookDeal] = useState(null);
  const [opsBookContext, setOpsBookContext] = useState(null);
  const [opsBookDate, setOpsBookDate] = useState('');
  const [opsBookDays, setOpsBookDays] = useState(1);
  const [opsBookTeam, setOpsBookTeam] = useState('ทีมปฏิบัติการ A');
  const [opsBookDaysSource, setOpsBookDaysSource] = useState('');

  // ข้อมูลสเตจในไปป์ไลน์ CRM
  const stages = [
    { key: 'survey', label: '1. สำรวจหน้างาน', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'costed', label: '1.5 ประเมินต้นทุนแล้ว', color: '#6366f1', bg: '#e0e7ff' },
    { key: 'quoted', label: '2. เสนอราคาแล้ว', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'approved', label: '3. อนุมัติ/รอคิว', color: '#10b981', bg: '#ecfdf5' },
    { key: 'ops', label: '4. กำลังทำความสะอาด', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'delivered', label: '5. ปิดงาน/รอวางบิล', color: '#06b6d4', bg: '#ecfeff' },
    { key: 'invoiced', label: '6. วางบิลแล้ว', color: '#64748b', bg: '#f8fafc' }
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const qs = await fetchQuotations();
        const savedCustomStages = await loadSettingJson('sangkan_crm_deal_stages', {});
        let allSurveys = await fetchData('AllSurveys');
        const executionReports = await loadSettingJson('sangkan_execution_reports', {});
        const billingApprovedRaw = await loadSettingJson('sangkan_billing_approved', {});
        let billingApproved = { ...(billingApprovedRaw || {}) };
        let billingDirty = false;
        const lostList = await loadSettingJson('sangkan_lost_deals', []);
        setLostDeals(Array.isArray(lostList) ? lostList : []);
        const lostIds = new Set((Array.isArray(lostList) ? lostList : []).map((d) => String(d.dealId || d.id)));

        // ขั้น 6: นับถอยหลัง 3 วัน — ครบแล้วเอาการ์ดออกจากกระดาน
        const archivedIds = new Set();
        for (const [qid, info] of Object.entries(billingApproved)) {
          if (!info || info.archived) {
            if (info?.archived) archivedIds.add(String(qid));
            continue;
          }
          const withExpiry = ensureInvoiceExpiry(info);
          if (withExpiry && !info?.expiresAt) {
            billingApproved[qid] = withExpiry;
            billingDirty = true;
          }
          const remaining = getInvoiceRemainingMs(billingApproved[qid]);
          if (remaining != null && remaining <= 0) {
            archivedIds.add(String(qid));
            billingApproved[qid] = {
              ...billingApproved[qid],
              archived: true,
              archivedAt: new Date().toISOString(),
            };
            billingDirty = true;
            if (savedCustomStages[qid]) delete savedCustomStages[qid];
          }
        }
        if (billingDirty) {
          await saveSettingJson('sangkan_billing_approved', billingApproved);
          await saveSettingJson('sangkan_crm_deal_stages', savedCustomStages);
        }

        // ใบเสนอราคาถูกลบแล้ว → ตัดตัวเชื่อมในคลังใบประเมินออกด้วย
        const quoteIds = new Set((qs || []).map((q) => String(q.id)));
        const orphanLinks = (allSurveys || []).filter((s) => {
          const link = String(s.linkedQuotationId || '');
          return link && link !== 'รอดำเนินการ' && !quoteIds.has(link);
        });
        if (orphanLinks.length > 0) {
          for (const survey of orphanLinks) {
            await saveData('AllSurveys', {
              ...survey,
              id: survey.id || survey.surveyId,
              linkedQuotationId: 'รอดำเนินการ',
            });
          }
          allSurveys = await fetchData('AllSurveys');
        }
        setAllSurveys(allSurveys);

        // แปลงสถานะใบเสนอราคามาจับคู่กับ CRM Stage (ข้ามรายการที่ย้ายไป "ปฏิเสธ/ไม่ได้งาน" และขั้น 6 ที่หมดอายุ 3 วัน)
        const mappedDeals = qs
          .filter((q) => !lostIds.has(String(q.id)) && !archivedIds.has(String(q.id)) && q.status !== 'rejected' && savedCustomStages[q.id] !== 'lost')
          .map((q, idx) => {
          let stage = 'quoted';
          if (q.status === 'approved') {
            stage = 'approved';
          }
          
          // ตรวจเช็คสถานะการปฏิบัติงาน (เก็บทั้งด้วย QT id และ job schedule id)
          const execSaved =
            executionReports[q.id] ||
            Object.values(executionReports).find(
              (r) => r && (r.projectId === q.id || r.dealId === q.id || r.jobId === q.id)
            );
          if (execSaved) {
            if (execSaved.status === 'completed') {
              stage = 'delivered';
            } else if (execSaved.status === 'in-progress') {
              stage = 'ops';
            }
          }

          if (billingApproved[q.id] && !billingApproved[q.id].archived) {
            stage = 'invoiced';
          }

          // สถานะที่แอดมิน/เซลล์ย้ายเอง หรือจากใบส่งมอบงาน
          if (savedCustomStages[q.id] && savedCustomStages[q.id] !== 'lost') {
            stage = savedCustomStages[q.id];
          }

          // เชื่อมข้อมูลประเมินหน้างานกรณีพิเศษ
          const matchedSurvey = findSurveyForDeal({ id: q.id, customer: q.customer, projectName: q.projectName }, q, allSurveys);
          const evaluation = matchedSurvey ? {
            nightShift: matchedSurvey.nightShift,
            highRise: matchedSurvey.highRise,
            heavyStains: matchedSurvey.heavyStains,
            noWaterElectricity: matchedSurvey.noWaterElectricity,
            specialNotes: matchedSurvey.specialNotes
          } : null;

          const billingInfo = billingApproved[q.id] && !billingApproved[q.id].archived
            ? ensureInvoiceExpiry(billingApproved[q.id])
            : null;

          return {
            id: q.id,
            customer: q.customer,
            projectName: q.projectName || 'โครงการ Big Cleaning',
            total: q.total || 0,
            date: q.date,
            stage: stage,
            serviceType: inferServiceType(q),
            evaluation: evaluation,
            invoicedAt: billingInfo?.at || null,
            invoiceExpiresAt: billingInfo?.expiresAt || null,
          };
        });

        // โหลดนัดหมายสำรวจหน้างาน (Survey Schedules)
        let parsedSurveys = await fetchData('SurveySchedules');
        setSurveySchedules(parsedSurveys || []);

        // ดึงรายการนัดหมายสำรวจหน้างานที่บันทึกไว้มารวมกันในกระดานบอร์ด (Stage 1: survey)
        // อนุญาตให้มีใบประเมิน (1.5) คู่กับใบเสนอราคา (2) ของลูกค้าเดียวกันได้
        const earlyCardKeys = new Set(
          mappedDeals
            .filter((d) => d.stage === 'survey' || d.stage === 'costed')
            .map((d) => `${d.serviceType || 'bigcleaning'}|${String(d.customer || '').trim().toLowerCase()}`)
        );

        parsedSurveys.forEach(survey => {
          const surveyCustomer = String(survey.customer || '').trim();
          const surveyType = survey.serviceType || 'bigcleaning';
          const customerKey = `${surveyType}|${surveyCustomer.toLowerCase()}`;
          if (lostIds.has(`survey_${survey.id}`)) return;
          // ไม่ข้ามเพราะมี QT แล้ว — ข้ามเฉพาะเมื่อมีใบสำรวจ/ประเมินของลูกค้านี้แล้ว
          if (earlyCardKeys.has(customerKey)) {
            return;
          }

          let surveyStage = 'survey';
          const matchedSurvey = allSurveys.find(
            (s) => String(s.customer || '').trim().toLowerCase() === surveyCustomer.toLowerCase()
          );

          if (matchedSurvey) {
            surveyStage = 'costed';
          }

          if (savedCustomStages[`survey_${survey.id}`] && savedCustomStages[`survey_${survey.id}`] !== 'lost') {
            const custom = savedCustomStages[`survey_${survey.id}`];
            // ใบสำรวจ/ประเมินไม่ถูกดึงไปขั้นเสนอราคา — คง early stage
            if (custom === 'survey' || custom === 'costed') surveyStage = custom;
          }

          const evaluation = matchedSurvey ? {
            nightShift: matchedSurvey.nightShift,
            highRise: matchedSurvey.highRise,
            heavyStains: matchedSurvey.heavyStains,
            noWaterElectricity: matchedSurvey.noWaterElectricity,
            specialNotes: matchedSurvey.specialNotes
          } : null;

          mappedDeals.unshift({
            id: matchedSurvey ? (matchedSurvey.surveyId || matchedSurvey.id || `survey_${survey.id}`) : `survey_${survey.id}`,
            customer: surveyCustomer,
            projectName: survey.note || matchedSurvey?.projectName || 'สำรวจหน้างาน Big Cleaning',
            total: matchedSurvey ? (matchedSurvey.calculatedPrice || 0) : 0,
            date: survey.date,
            stage: surveyStage,
            serviceType: surveyType,
            evaluation: evaluation
          });
          earlyCardKeys.add(customerKey);
        });

        // รวมใบประเมินต้นทุนจากคลังทั้งหมดเป็นขั้น 1.5 (คงอยู่แม้สร้าง QT แล้ว)
        (allSurveys || []).forEach((survey) => {
          const sid = String(survey.surveyId || survey.id || '');
          if (!sid || lostIds.has(sid) || savedCustomStages[sid] === 'lost') return;
          const surveyType = survey.serviceType || 'bigcleaning';
          const surveyCustomer = String(survey.customer || '').trim();
          const customerKey = `${surveyType}|${surveyCustomer.toLowerCase()}`;

          // ถ้ามีแล้วจากนัดสำรวจ ให้ข้าม — แต่ถ้า key คนละชื่อ (แก้ชื่อบน QT) ยังแสดงใบประเมินเดิมได้
          const alreadyOnBoard = mappedDeals.some(
            (d) =>
              (d.stage === 'survey' || d.stage === 'costed') &&
              (String(d.id) === sid || String(d.id) === `survey_${sid}`)
          );
          if (alreadyOnBoard) return;

          // ถ้ามี early card ของลูกค้านี้แล้วด้วย survey อื่น ข้าม
          if (earlyCardKeys.has(customerKey)) return;

          mappedDeals.unshift({
            id: sid,
            customer: surveyCustomer,
            projectName: survey.projectName || 'โครงการ Big Cleaning',
            total: survey.calculatedPrice || 0,
            date: survey.date || new Date().toISOString().split('T')[0],
            stage: 'costed',
            serviceType: surveyType,
            evaluation: {
              nightShift: survey.nightShift,
              highRise: survey.highRise,
              heavyStains: survey.heavyStains,
              noWaterElectricity: survey.noWaterElectricity,
              specialNotes: survey.specialNotes,
            },
          });
          earlyCardKeys.add(customerKey);
        });

        // ดึงใบประเมินต้นทุนล่าสุดที่ยังไม่ผูกกับใบเสนอราคา
        const surveyObj = await loadSettingJson('sangkan_current_survey', null);
        if (surveyObj) {
          const surveyCustomer = String(surveyObj.customer || '').trim();
          const surveyType = surveyObj.serviceType || 'bigcleaning';
          const customerKey = `${surveyType}|${surveyCustomer.toLowerCase()}`;
          const sid = String(surveyObj.surveyId || surveyObj.id || '');
          const alreadyOnBoard = mappedDeals.some((d) => String(d.id) === sid);
          if (!alreadyOnBoard && !earlyCardKeys.has(customerKey) && sid && !lostIds.has(sid)) {
            mappedDeals.unshift({
              id: sid,
              customer: surveyCustomer,
              projectName: surveyObj.projectName,
              total: surveyObj.calculatedPrice || 0,
              date: new Date().toISOString().split('T')[0],
              stage: 'costed',
              serviceType: surveyType,
              evaluation: {
                nightShift: surveyObj.nightShift,
                highRise: surveyObj.highRise,
                heavyStains: surveyObj.heavyStains,
                noWaterElectricity: surveyObj.noWaterElectricity,
                specialNotes: surveyObj.specialNotes
              }
            });
            earlyCardKeys.add(customerKey);
          }
        }

        // สำรอง: รวมการ์ดซ้ำ — แยก "ใบสำรวจ/ประเมิน" กับ "ใบเสนอราคาขึ้นไป" ไม่ชนกัน
        // ทำให้ขั้น 1.5 คงอยู่เมื่อมีขั้น 2 ของลูกค้าเดียวกัน (หรือชื่อลูกค้าใหม่บน QT)
        const stageRank = {
          survey: 1,
          costed: 2,
          quoted: 3,
          approved: 4,
          ops: 5,
          delivered: 6,
          invoiced: 7,
        };
        const pickBetterDeal = (a, b) => {
          const rankA = stageRank[a.stage] || 0;
          const rankB = stageRank[b.stage] || 0;
          if (rankA !== rankB) return rankA >= rankB ? a : b;
          const score = (d) => {
            if (String(d.id).startsWith('QT')) return 3;
            if (String(d.id).startsWith('SV')) return 2;
            if (String(d.id).startsWith('survey_')) return 1;
            return 0;
          };
          return score(a) >= score(b) ? a : b;
        };
        const deduped = [];
        const seenKeys = new Map();
        mappedDeals.forEach((deal) => {
          const isEarly = deal.stage === 'survey' || deal.stage === 'costed';
          const key = isEarly
            ? `est|${deal.serviceType || 'bigcleaning'}|${String(deal.customer || '').trim().toLowerCase()}`
            : `qt|${deal.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.set(key, deduped.length);
            deduped.push(deal);
            return;
          }
          const idx = seenKeys.get(key);
          deduped[idx] = pickBetterDeal(deduped[idx], deal);
        });

        setDeals(deduped);

        // โหลดบันทึกปฏิสัมพันธ์ลูกค้า (Customer Logs)
        let logs = await fetchData('CrmLogs');
        setCustomerLogs(logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // อัปเดตนับถอยหลังขั้น 6 ทุกนาที และเอาการ์ดที่หมดอายุออก
  useEffect(() => {
    let busy = false;
    const sweepExpired = async () => {
      setNowTick(Date.now());
      if (busy) return;
      busy = true;
      try {
        let expiredIds = [];
        setDeals((prev) => {
          const expired = prev.filter(
            (d) =>
              d.stage === 'invoiced' &&
              d.invoiceExpiresAt &&
              new Date(d.invoiceExpiresAt).getTime() <= Date.now()
          );
          expiredIds = expired.map((d) => d.id);
          if (!expired.length) return prev;
          return prev.filter((d) => !expiredIds.includes(d.id));
        });
        if (!expiredIds.length) return;

        const billingApproved = await loadSettingJson('sangkan_billing_approved', {});
        const stages = await loadSettingJson('sangkan_crm_deal_stages', {});
        for (const id of expiredIds) {
          if (billingApproved[id]) {
            billingApproved[id] = {
              ...billingApproved[id],
              archived: true,
              archivedAt: new Date().toISOString(),
              expiresAt: billingApproved[id].expiresAt,
            };
          }
          delete stages[id];
        }
        await saveSettingJson('sangkan_billing_approved', billingApproved);
        await saveSettingJson('sangkan_crm_deal_stages', stages);
        showToast(`นำการ์ดขั้น 6 ออกจากกระดานแล้ว ${expiredIds.length} รายการ (ครบ 3 วัน)`, 'info');
      } finally {
        busy = false;
      }
    };

    const timer = setInterval(sweepExpired, 60000);
    // เช็คครั้งแรกหลังเข้าเพจเล็กน้อย (กรณีโหลดมาแล้วหมดอายุ)
    const first = setTimeout(sweepExpired, 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [showToast]);

  // เลื่อน Stage ของดีล
  const moveDeal = async (dealId, nextStage) => {
    const deal = deals.find(d => d.id === dealId);
    
    // ตรวจสอบ Workflow ด่านที่ 1: ต้องประเมินต้นทุนหน้างานก่อนเสนอราคา (เฉพาะ Big Cleaning)
    if (deal && deal.serviceType !== 'recurring' && (deal.stage === 'survey') && (nextStage === 'costed' || nextStage === 'quoted')) {
      const allSurveys = await fetchData('AllSurveys');
      const hasCosting = allSurveys.some(s => s.customer === deal.customer);
      if (!hasCosting) {
        showToast('⚠️ ระบบเปิดแบบประเมินและคำนวณต้นทุนของลูกค้าท่านนี้ให้ทันทีเพื่อทำประเมินต้นทุน', 'warning');
        setCostingCustomer(deal.customer);
        setCostingProjectName(deal.projectName || 'โครงการ Big Cleaning');
        setCostingSalesperson(deal.assigned || 'เซลล์ สมปอง');
        
        // โหลดราคากลางจาก settings
        let parsed = null;
        try {
          parsed = await fetchSetting('sangkan_settings');
        } catch (e) {}
        if (parsed) {
            if (parsed.maidDailyRate) {
              setCostingMaidRate(parsed.maidDailyRate);
              setCostingSupervisorRate(parsed.maidDailyRate + 200);
            }
            if (parsed.soapGallonCost) setCostingSuppliesCost(parsed.soapGallonCost * 3);
            if (parsed.minMargin) setCostingMarkupPercent(parsed.minMargin + 10);
            
            setCostingLaborType('daily');
            setCostingAreaSqm(150);
            setCostingSiteType('สำนักงาน / ออฟฟิศ');
            setCostingSupervisorCount(1);
            setCostingMaidCount(4);
            setCostingLumpSumLaborCount(10);
            setCostingLumpSumLaborCost(12000);
            setCostingLumpSumDays(2);
            setCostingDays(2);
            setCostingVehicles([
              { id: 1, type: 'รถกระบะขนอุปกรณ์', rate: 1500, count: 1, days: 1 }
            ]);
            setCostingTechnicianCount(0);
            setCostingTechnicianRate(800);
            setCostingOutsourceLaborCost(0);
            setCostingOutsourceSupervisorCount(0);
            setCostingOutsourceSupervisorRate(700);
            setCostingOutsourceMaidCount(0);
            setCostingOutsourceMaidRate(500);
            setCostingOutsourceTechnicianCount(0);
            setCostingOutsourceTechnicianRate(800);
            setCostingOutsourceDays(1);
            setCostingBoomLiftCost(0);
            setCostingSuppliesType('perSqm');
            setCostingSuppliesRate(2);
            setCostingSuppliesCost(300);
            setCostingSpecialChemicals(0);
            setCostingSafeguardCost(0);
            setCostingToolsCost(500);
            setCostingSafetyCost(0);
            setCostingOtherCost(0);
            setCostingNightShift(false);
            setCostingHighRise(false);
            setCostingHeavyStains(false);
            setCostingNoWaterElectricity(false);
            setCostingSpecialNotes('');
        }

        setEditingSurveyId(null);
        setIsCostingModalOpen(true);
        return;
      }
    }

    // แม่บ้านประจำ: จากนัดพบลูกค้า → เสนอราคา ไปหน้าสร้างใบเสนอราคาเลย
    if (deal && deal.serviceType === 'recurring' && deal.stage === 'survey' && nextStage === 'quoted') {
      showToast('📄 กำลังนำทางไปหน้าสร้างใบเสนอราคาแม่บ้านประจำ...', 'info');
      setTimeout(() => {
        window.location.href = '/quotation/create?type=recurring';
      }, 800);
      return;
    }

    // หากย้ายจากประเมินต้นทุนเสร็จแล้ว (1.5) ไปด่านเสนอราคาแล้ว (2)
    // → สร้างใบเสนอราคาใหม่ (ขั้น 2) โดยใบประเมิน 1.5 ยังคงอยู่ที่เดิม
    // อนุญาตให้เปลี่ยนชื่อลูกค้าบนใบเสนอราคาได้ โดยไม่ยุบการ์ด 1.5
    if (deal && deal.stage === 'costed' && nextStage === 'quoted') {
      if (deal.serviceType === 'recurring') {
        showToast('📄 กำลังนำทางไปหน้าสร้างใบเสนอราคาแม่บ้านประจำ...', 'info');
        setTimeout(() => {
          window.location.href = '/quotation/create?type=recurring';
        }, 800);
        return;
      }

      showToast('📄 สร้างใบเสนอราคาใหม่ (ขั้น 2) — ใบประเมินขั้น 1.5 จะยังคงอยู่', 'info');
      const allSurveysForQuote = await fetchData('AllSurveys');
      const matched =
        allSurveysForQuote.find((s) => String(s.surveyId || s.id) === String(deal.id)) ||
        allSurveysForQuote.find((s) => s.customer === deal.customer);
      if (matched) {
        await saveSettingJson('sangkan_current_survey', matched);
      }
      setTimeout(() => {
        const type = deal.serviceType === 'recurring' ? 'recurring' : 'bigcleaning';
        const surveyParam = matched ? `&surveyId=${encodeURIComponent(matched.surveyId || matched.id)}` : '';
        window.location.href = `/quotation/create?fromSurvey=true&type=${type}${surveyParam}`;
      }, 1000);
      return;
    }

    // ขยับ 2→3: เปิดเลือกวันทำงาน ก่อนจองตารางปฏิบัติการ
    // เมื่อยืนยันวันจองคิว → เปลี่ยนสถานะใบเสนอราคาเป็นอนุมัติอัตโนมัติ
    if (
      deal &&
      deal.stage === 'quoted' &&
      nextStage === 'approved' &&
      deal.serviceType !== 'recurring'
    ) {
      await openOpsBookModal(deal);
      return;
    }

    await finalizeDealMove(dealId, nextStage);
  };

  const askRejectDeal = (deal) => {
    setRejectTarget(deal);
    setRejectReason('ลูกค้าปฏิเสธ / ไม่ได้งาน');
  };

  const confirmRollbackDelete = async () => {
    if (!rollbackDeleteTarget?.deal) return;
    const deal = rollbackDeleteTarget.deal;
    setRollbackDeleteTarget(null);
    const deletedDocs = await deleteDealCardCompletely(deal);
    showToast(
      `ลบการ์ดออกจากกระดานแล้ว${deletedDocs.length ? `: ${deletedDocs.slice(0, 3).join(', ')}${deletedDocs.length > 3 ? '...' : ''}` : ''}`,
      'success'
    );
  };

  /** ลบออกจากกระดาน → เก็บในรายการลูกค้าที่ปฏิเสธหรือไม่ได้งาน */
  const confirmMoveToLost = async () => {
    if (!rejectTarget) return;
    const deal = rejectTarget;

    const record = {
      id: `LOST_${Date.now()}`,
      dealId: deal.id,
      customer: deal.customer || '',
      projectName: deal.projectName || '',
      total: Number(deal.total) || 0,
      stage: deal.stage || '',
      serviceType: deal.serviceType || 'bigcleaning',
      reason: rejectReason || 'ลูกค้าปฏิเสธ / ไม่ได้งาน',
      lostAt: new Date().toISOString().slice(0, 10),
      evaluation: deal.evaluation || null,
    };

    const updatedLost = [record, ...lostDeals.filter((d) => String(d.dealId) !== String(deal.id))];
    setLostDeals(updatedLost);
    await saveSettingJson('sangkan_lost_deals', updatedLost);

    // อัปเดตสถานะใบเสนอราคาเป็น rejected (ถ้ามี)
    try {
      const { saveQuotation, fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      const quote = qs.find((q) => String(q.id) === String(deal.id));
      if (quote) {
        quote.status = 'rejected';
        await saveQuotation(quote);
      }
    } catch (e) {
      console.error(e);
    }

    // บันทึกว่าอยู่นอกกระดาน (กันกลับมาจาก stage cache)
    const stages = await loadSettingJson('sangkan_crm_deal_stages', {});
    stages[deal.id] = 'lost';
    await saveSettingJson('sangkan_crm_deal_stages', stages);

    setDeals((prev) => prev.filter((d) => d.id !== deal.id));
    setRejectTarget(null);
    showToast(`ย้าย "${deal.customer}" ไปรายการลูกค้าที่ปฏิเสธ/ไม่ได้งานแล้ว`, 'success');
  };

  const restoreLostDeal = async (lostItem) => {
    if (!lostItem) return;
    const updatedLost = lostDeals.filter((d) => d.id !== lostItem.id);
    setLostDeals(updatedLost);
    await saveSettingJson('sangkan_lost_deals', updatedLost);

    const stages = await loadSettingJson('sangkan_crm_deal_stages', {});
    delete stages[lostItem.dealId];
    await saveSettingJson('sangkan_crm_deal_stages', stages);

    // คืนสถานะใบเสนอราคาเป็นรอดำเนินการถ้าเคย rejected
    try {
      const { saveQuotation, fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      const quote = qs.find((q) => String(q.id) === String(lostItem.dealId));
      if (quote && quote.status === 'rejected') {
        quote.status = 'pending';
        await saveQuotation(quote);
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`คืน "${lostItem.customer}" เข้ากระดานขายแล้ว — รีเฟรชเพื่อโหลดการ์ด`, 'success');
    setTimeout(() => window.location.reload(), 600);
  };

  const getEstimateDaysForDeal = async (deal, quote = null, survey = null) => {
    if (survey?.days) {
      return { days: Number(survey.days) || 1, source: `ใบประมาณต้นทุน (${survey.id || survey.surveyId || survey.projectName || 'หน้างาน'})` };
    }

    if (quote?.days || quote?.durationDays) {
      return { days: Number(quote.days || quote.durationDays) || 1, source: 'ใบเสนอราคา' };
    }

    return { days: 1, source: 'ค่าเริ่มต้น (ไม่พบจำนวนวันในใบประมาณ)' };
  };

  const buildOpsBookContext = async (deal) => {
    let quote = null;
    try {
      const { fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      quote = qs.find((q) => q.id === deal.id) || null;
    } catch (e) {}

    const surveys = allSurveys.length ? allSurveys : await fetchData('AllSurveys');
    const survey = findSurveyForDeal(deal, quote, surveys);

    const scheduleSurvey = surveySchedules.find((s) => s.customer === deal.customer);
    const customers = await fetchData('Customers');
    const customer = customers.find((c) => c.name === deal.customer || c.name === quote?.customer);

    const contactsFromQuote = [];
    if (quote?.contactName || quote?.contactPhone) {
      contactsFromQuote.push({ name: quote.contactName || 'ผู้ติดต่อ', phone: quote.contactPhone || '' });
    }
    if (Array.isArray(quote?.contacts)) {
      quote.contacts.forEach((c) => {
        if (c?.name || c?.phone) contactsFromQuote.push(c);
      });
    }

    const contacts =
      (contactsFromQuote.length && contactsFromQuote) ||
      scheduleSurvey?.contacts ||
      customer?.contacts ||
      [];

    const uniqueContacts = [];
    const seen = new Set();
    contacts.forEach((c) => {
      const key = `${c?.name || ''}|${c?.phone || ''}`;
      if (!seen.has(key) && (c?.name || c?.phone)) {
        seen.add(key);
        uniqueContacts.push(c);
      }
    });

    const photos = quote?.sitePhotos || survey?.sitePhotos || [];
    const mapUrl = quote?.mapUrl || quote?.googleMapUrl || survey?.mapUrl || customer?.mapUrl || '';
    const manpower = buildManpowerFromSurvey(survey);

    return {
      quote,
      survey,
      address: quote?.address || customer?.address || '',
      projectName: quote?.projectName || deal.projectName || '',
      siteType: survey?.siteType || '',
      areaSqm: survey?.areaSqm || null,
      specialNotes: survey?.specialNotes || '',
      flags: {
        nightShift: !!survey?.nightShift,
        highRise: !!survey?.highRise,
        heavyStains: !!survey?.heavyStains,
        noWaterElectricity: !!survey?.noWaterElectricity,
      },
      contacts: uniqueContacts,
      phone: quote?.contactPhone || uniqueContacts[0]?.phone || customer?.phone || '',
      photos,
      mapUrl,
      manpower,
    };
  };

  const openOpsBookModal = async (deal) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const context = await buildOpsBookContext(deal);
    const { days, source } = await getEstimateDaysForDeal(deal, context.quote, context.survey);
    setOpsBookDeal(deal);
    setOpsBookContext(context);
    setOpsBookDate(tomorrow.toISOString().slice(0, 10));
    setOpsBookDays(days);
    setOpsBookDaysSource(source);
    setOpsBookTeam('ทีมปฏิบัติการ A');
    setIsOpsBookModalOpen(true);
  };

  const stageRank = {
    survey: 1,
    costed: 2,
    quoted: 3,
    approved: 4,
    ops: 5,
    delivered: 6,
    invoiced: 7,
  };

  const cleanupDocsOnRollback = async (deal, fromStage, toStage) => {
    if (!deal) return [];
    const fromRank = stageRank[fromStage] || 0;
    const toRank = stageRank[toStage] || 0;
    if (toRank >= fromRank) return [];

    const deleted = [];
    const dealId = deal.id;
    const isQt = String(dealId).startsWith('QT');

    // ย้อนออกจากขั้นอนุมัติ/ปฏิบัติการขึ้นไป → ลบนัดปฏิบัติการ + ใบส่งงาน
    if (fromRank >= stageRank.approved && toRank < stageRank.approved) {
      const schedules = await fetchData('BigcleanSchedule');
      for (const event of schedules) {
        if (event.projectId === dealId || event.refQuotation === dealId) {
          await deleteData('BigcleanSchedule', String(event.id));
          deleted.push(`นัดปฏิบัติการ ${event.id}`);
        }
      }

      const jobs = await fetchData('operations_bigcleaning');
      for (const job of jobs) {
        const jobIdFromQt = isQt ? String(dealId).replace('QT', 'OPB') : '';
        if (job.refQuotation === dealId || (jobIdFromQt && job.id === jobIdFromQt) || job.projectId === dealId) {
          await deleteData('operations_bigcleaning', String(job.id));
          deleted.push(`ใบส่งงาน ${job.id}`);
        }
      }

      // ล้างรายงานปฏิบัติการ / ใบวางบิลที่ผูกกับดีลนี้
      const executionReports = await loadSettingJson('sangkan_execution_reports', {});
      if (executionReports[dealId]) {
        delete executionReports[dealId];
        await saveSettingJson('sangkan_execution_reports', executionReports);
        deleted.push('รายงานปฏิบัติการ');
      }
      const billingApproved = await loadSettingJson('sangkan_billing_approved', {});
      if (billingApproved[dealId]) {
        delete billingApproved[dealId];
        await saveSettingJson('sangkan_billing_approved', billingApproved);
        deleted.push('สถานะวางบิล');
      }
    }

    // ย้อนออกจากขั้นเสนอราคา → ลบใบเสนอราคา
    if (fromRank >= stageRank.quoted && toRank < stageRank.quoted && isQt) {
      try {
        await deleteData('Quotations', dealId);
        deleted.push(`ใบเสนอราคา ${dealId}`);
      } catch (e) {
        console.error('delete quotation failed', e);
      }

      // ปลดลิงก์จากใบประมาณ
      const surveys = await fetchData('AllSurveys');
      for (const survey of surveys) {
        if (survey.linkedQuotationId === dealId) {
          await saveData('AllSurveys', { ...survey, id: survey.id || survey.surveyId, linkedQuotationId: 'รอดำเนินการ' });
          deleted.push(`ปลดลิงก์ใบประมาณ ${survey.surveyId || survey.id}`);
        }
      }

      // ลบเอกสาร downstream ที่อาจผูก QT
      for (const sheet of ['Deposits', 'Invoices', 'Taxinvoices']) {
        try {
          const rows = await fetchData(sheet);
          for (const row of rows) {
            if (row.refQuotation === dealId || row.quotationId === dealId || row.projectId === dealId) {
              await deleteData(sheet, String(row.id));
              deleted.push(`${sheet} ${row.id}`);
            }
          }
        } catch (e) {}
      }
    }

    // ย้อนออกจากขั้นประเมินต้นทุน → ลบใบประมาณต้นทุน
    if (fromRank >= stageRank.costed && toRank < stageRank.costed) {
      const surveys = await fetchData('AllSurveys');
      for (const survey of surveys) {
        const sameCustomer = String(survey.customer || '').trim().toLowerCase() === String(deal.customer || '').trim().toLowerCase();
        const sameProject = !deal.projectName || !survey.projectName || survey.projectName === deal.projectName;
        const linked = survey.linkedQuotationId === dealId || survey.surveyId === dealId || survey.id === dealId;
        if (linked || (sameCustomer && sameProject && String(dealId).startsWith('survey_'))) {
          await deleteData('AllSurveys', String(survey.id || survey.surveyId));
          deleted.push(`ใบประมาณ ${survey.surveyId || survey.id}`);
        }
      }

      const currentSurvey = await loadSettingJson('sangkan_current_survey', null);
      if (currentSurvey && String(currentSurvey.customer || '').trim().toLowerCase() === String(deal.customer || '').trim().toLowerCase()) {
        await saveSettingJson('sangkan_current_survey', null);
      }
    }

    return deleted;
  };

  /** ย้อนกลับไปขั้น 1 = ลบการ์ดออกจากกระดาน (ลบนัดสำรวจ + เอกสารที่เกี่ยวข้องด้วย) */
  const deleteDealCardCompletely = async (deal) => {
    if (!deal) return [];
    const deleted = [];
    const dealId = deal.id;
    const customerKey = String(deal.customer || '').trim().toLowerCase();
    const projectKey = String(deal.projectName || '').trim().toLowerCase();

    // ลบเอกสารขั้นถัดไปทั้งหมด (ใบเสนอราคา / ประมาณ / นัดปฏิบัติการ ฯลฯ)
    const rollbackDeleted = await cleanupDocsOnRollback(deal, deal.stage, 'survey');
    deleted.push(...rollbackDeleted);

    // ลบนัดสำรวจหน้างานที่ผูกกับการ์ดนี้
    try {
      const schedules = await fetchData('SurveySchedules');
      for (const s of schedules) {
        const sameId =
          String(dealId) === `survey_${s.id}` ||
          String(dealId) === String(s.id);
        const sameCustomer = String(s.customer || '').trim().toLowerCase() === customerKey;
        const sameNote =
          !projectKey ||
          String(s.note || '').trim().toLowerCase() === projectKey ||
          projectKey.includes(String(s.note || '').trim().toLowerCase().slice(0, 20));
        if (sameId || (sameCustomer && sameNote && String(dealId).startsWith('survey_'))) {
          await deleteData('SurveySchedules', String(s.id));
          deleted.push(`นัดสำรวจ ${s.id}`);
        } else if (sameId || (sameCustomer && String(deal.stage) === 'costed' && String(dealId).startsWith('survey_'))) {
          await deleteData('SurveySchedules', String(s.id));
          deleted.push(`นัดสำรวจ ${s.id}`);
        }
      }
      // การ์ด nัดสำรวจโดยตรง (id = survey_X) ยังไม่ถูกลบด้านบน
      if (String(dealId).startsWith('survey_')) {
        const rawId = String(dealId).replace(/^survey_/, '');
        const still = (await fetchData('SurveySchedules')).find((s) => String(s.id) === rawId);
        if (still) {
          await deleteData('SurveySchedules', rawId);
          deleted.push(`นัดสำรวจ ${rawId}`);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // ลบใบประมาณที่ผูกกับการ์ดนี้โดยตรง
    try {
      const surveys = await fetchData('AllSurveys');
      for (const survey of surveys) {
        const linked =
          String(survey.surveyId || '') === String(dealId) ||
          String(survey.id || '') === String(dealId) ||
          survey.linkedQuotationId === dealId ||
          String(dealId) === `survey_${survey.id}` ||
          String(dealId) === `survey_${survey.surveyId}`;
        const sameCustomer = String(survey.customer || '').trim().toLowerCase() === customerKey;
        const sameProject =
          !deal.projectName ||
          !survey.projectName ||
          String(survey.projectName || '').trim().toLowerCase() === projectKey;
        if (linked || (sameCustomer && sameProject && (deal.stage === 'survey' || deal.stage === 'costed'))) {
          await deleteData('AllSurveys', String(survey.id || survey.surveyId));
          deleted.push(`ใบประมาณ ${survey.surveyId || survey.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // ลบใบเสนอราคาถ้าการ์ดนี้คือ QT
    try {
      const { fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      const quote = qs.find((q) => String(q.id) === String(dealId));
      if (quote) {
        await deleteData('Quotations', String(dealId));
        deleted.push(`ใบเสนอราคา ${dealId}`);
      }
    } catch (e) {
      console.error(e);
    }

    // เคลียร์ stage cache / billing ของการ์ดนี้
    const stages = await loadSettingJson('sangkan_crm_deal_stages', {});
    delete stages[dealId];
    if (String(dealId).startsWith('survey_')) {
      delete stages[dealId];
    }
    await saveSettingJson('sangkan_crm_deal_stages', stages);

    const billingApproved = await loadSettingJson('sangkan_billing_approved', {});
    if (billingApproved[dealId]) {
      delete billingApproved[dealId];
      await saveSettingJson('sangkan_billing_approved', billingApproved);
    }

    setDeals((prev) => prev.filter((d) => d.id !== dealId));

    return [...new Set(deleted)];
  };

  const finalizeDealMove = async (dealId, nextStage, bookingOptions = null) => {
    const deal = deals.find((d) => d.id === dealId);
    const fromStage = deal?.stage;

    // ย้อนกลับไปขั้น 1 สำรวจหน้างาน = ลบการ์ด — เปิดโมดัลยืนยันก่อน
    if (
      deal &&
      fromStage &&
      nextStage === 'survey' &&
      (stageRank[fromStage] || 0) > stageRank.survey
    ) {
      setRollbackDeleteTarget({ deal, fromStage });
      return;
    }

    // ย้อนกลับ: ลบเอกสารที่สร้างในขั้นถัดไปก่อน
    let deletedDocs = [];
    if (deal && fromStage && (stageRank[nextStage] || 0) < (stageRank[fromStage] || 0)) {
      const ok = window.confirm(
        `ยืนยันย้อนกลับจาก "${fromStage}" → "${nextStage}"?\nระบบจะลบเอกสารที่ออกหลังจากขั้นนี้ด้วย`
      );
      if (!ok) return;
      deletedDocs = await cleanupDocsOnRollback(deal, fromStage, nextStage);
    }

    // ถ้าลบใบเสนอราคาแล้ว การ์ด QT ควรหาย/ถูกแทนที่หลัง reload
    const quoteDeleted = deletedDocs.some((d) => String(d).startsWith('ใบเสนอราคา '));

    // 1. อัปเดต state
    let updated;
    if (quoteDeleted) {
      updated = deals.filter((d) => d.id !== dealId);
    } else {
      updated = deals.map((d) => {
        if (d.id === dealId) {
          return { ...d, stage: nextStage };
        }
        return d;
      });
    }
    setDeals(updated);

    // 2. บันทึกลง SQLite เพื่อใช้โหลดใหม่
    const savedCustomStages = await loadSettingJson('sangkan_crm_deal_stages', {});
    if (quoteDeleted) {
      delete savedCustomStages[dealId];
    } else {
      savedCustomStages[dealId] = nextStage;
    }
    await saveSettingJson('sangkan_crm_deal_stages', savedCustomStages);

    // 3. ปรับสถานะใบเสนอราคาจริงในระบบหากย้ายสถานะที่เกี่ยวข้อง
    // (จองคิวใน CRM → อนุมัติใบเสนอราคาอัตโนมัติ — รองรับทั้งรหัส QT... และเลขเอกสารอื่น)
    let bookedOps = null;
    if (!quoteDeleted) {
      const { saveQuotation, fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      const quote =
        qs.find((q) => q.id === dealId) ||
        qs.find((q) => String(q.id) === String(dealId)) ||
        null;
      if (quote) {
        if (nextStage === 'approved') {
          quote.status = 'approved';
          await saveQuotation(quote);

          if (deal?.serviceType !== 'recurring' && bookingOptions) {
            bookedOps = await bookOpsScheduleFromDeal(deal, quote, bookingOptions);
          }
        } else if (nextStage === 'quoted') {
          quote.status = 'pending';
          await saveQuotation(quote);
        }
      } else if (nextStage === 'approved' && bookingOptions && deal?.serviceType !== 'recurring') {
        // ไม่พบใบเสนอราคาในรายการ แต่ยังจองคิวปฏิบัติการได้
        bookedOps = await bookOpsScheduleFromDeal(deal, { id: dealId, projectName: deal.projectName, customer: deal.customer }, bookingOptions);
      }
    }

    // ขั้น 6: บันทึกเวลาเริ่ม + expiresAt (3 วัน) แล้วนับถอยหลังบนการ์ด
    if (nextStage === 'invoiced' && deal) {
      const billingApproved = await loadSettingJson('sangkan_billing_approved', {});
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + INVOICE_TTL_MS).toISOString();
      const existing = billingApproved[dealId];
      // ถ้ายังอยู่บนกระดานและยังไม่หมดอายุ → คง expiresAt เดิม; ถ้าเข้าใหม่/เคย archive → นับ 3 วันใหม่
      const keepExisting =
        existing &&
        !existing.archived &&
        existing.expiresAt &&
        new Date(existing.expiresAt).getTime() > Date.now();
      billingApproved[dealId] = {
        ...(existing || {}),
        at: keepExisting ? existing.at || nowIso : nowIso,
        expiresAt: keepExisting ? existing.expiresAt : expiresAt,
        archived: false,
        customer: deal.customer,
        projectName: deal.projectName,
        total: deal.total,
      };
      await saveSettingJson('sangkan_billing_approved', billingApproved);

      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: 'invoiced',
                invoicedAt: billingApproved[dealId].at,
                invoiceExpiresAt: billingApproved[dealId].expiresAt,
              }
            : d
        )
      );

      // แจ้ง LINE เฉพาะเมื่อเลื่อนจากขั้น 5 → 6
      if (fromStage === 'delivered') {
        const baht = Number(deal.total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
        const msg = [
          '✅ งาน Big Cleaning แล้วเสร็จ — รอฝ่ายบัญชีดำเนินการ',
          ``,
          `ลูกค้า: ${deal.customer || '-'}`,
          `โครงการ: ${deal.projectName || '-'}`,
          `เลขเอกสาร: ${dealId}`,
          `มูลค่า: ${baht} บาท`,
          ``,
          `สถานะ CRM: ขั้น 6 วางบิลแล้ว (เก็บบนกระดาน 3 วัน)`,
          `กรุณาออกใบแจ้งหนี้ / ใบกำกับภาษีตามขั้นตอนบัญชี`,
        ].join('\n');

        try {
          const res = await fetch('/api/notify/line', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }),
          });
          const data = await res.json().catch(() => ({}));
          if (data?.skipped) {
            showToast('ย้ายไปขั้น 6 แล้ว — นับถอยหลัง 3 วันแล้วจะนำการ์ดออก (ยังไม่ได้ตั้งค่า LINE)', 'warning');
          } else if (data?.ok) {
            showToast('ย้ายไปขั้น 6 และแจ้งกลุ่ม LINE แล้ว — นับถอยหลัง 3 วัน', 'success');
          } else {
            showToast('ย้ายไปขั้น 6 แล้ว (นับถอยหลัง 3 วัน) แต่ส่ง LINE ไม่สำเร็จ', 'warning');
          }
        } catch (e) {
          console.error(e);
          showToast('ย้ายไปขั้น 6 แล้ว (นับถอยหลัง 3 วัน) แต่ส่ง LINE ไม่สำเร็จ', 'warning');
        }
      } else {
        showToast('ย้ายไปขั้น 6 แล้ว — นับถอยหลัง 3 วันแล้วจะนำการ์ดออกจากกระดาน', 'success');
      }
      return;
    }

    if (bookedOps) {
      showToast(
        `จองคิว ${bookedOps.team} วันที่ ${bookedOps.date} (${bookedOps.days} วัน) และอนุมัติใบเสนอราคาแล้ว`,
        'success'
      );
    } else if (deletedDocs.length) {
      showToast(`ย้อนสเตจสำเร็จ และลบเอกสารแล้ว: ${deletedDocs.slice(0, 3).join(', ')}${deletedDocs.length > 3 ? '...' : ''}`, 'success');
      // รีโหลดเพื่อให้การ์ดสำรวจ/ประมาณกลับมาถูกต้องหลังลบ QT
      setTimeout(() => window.location.reload(), 700);
    } else {
      showToast(`ย้ายสเตจของดีล ${dealId} สำเร็จแล้ว`, 'success');
    }
  };

  const handleConfirmOpsBook = async () => {
    if (!opsBookDeal) return;
    if (!opsBookDate) {
      showToast('กรุณาเลือกวันเริ่มงาน', 'warning');
      return;
    }
    if (!opsBookDays || Number(opsBookDays) < 1) {
      showToast('จำนวนวันทำงานต้องอย่างน้อย 1 วัน', 'warning');
      return;
    }

    const manpower = buildManpowerFromSurvey(opsBookContext?.survey, Number(opsBookDays) || 1);

    const bookingOptions = {
      date: opsBookDate,
      days: Number(opsBookDays) || 1,
      team: opsBookTeam,
      manpower,
      siteInfo: {
        address: opsBookContext?.address || '',
        siteType: opsBookContext?.siteType || '',
        areaSqm: opsBookContext?.areaSqm || null,
        specialNotes: opsBookContext?.specialNotes || '',
        flags: opsBookContext?.flags || {},
        contacts: opsBookContext?.contacts || [],
        contactPhone: opsBookContext?.phone || '',
        mapUrl: opsBookContext?.mapUrl || '',
        photos: opsBookContext?.photos || [],
      },
    };

    setIsOpsBookModalOpen(false);
    // ยืนยันวันจองคิว → ขยับขั้น 3 + เปลี่ยนสถานะใบเสนอราคาเป็นอนุมัติ
    await finalizeDealMove(opsBookDeal.id, 'approved', bookingOptions);
    setOpsBookDeal(null);
    setOpsBookContext(null);
  };

  // จองคิว BigcleanSchedule เมื่อดีลอนุมัติ (ขั้น 3)
  const bookOpsScheduleFromDeal = async (deal, quote, options = {}) => {
    const schedules = await fetchData('BigcleanSchedule');
    const already = schedules.find((e) => e.projectId === deal.id);
    if (already) return already;

    const durationDays = Number(options.days || quote?.days || quote?.durationDays || 1) || 1;
    const preferredDate =
      options.date ||
      quote?.serviceDate ||
      quote?.workDate ||
      quote?.startDate ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })();

    const teams = ['ทีมปฏิบัติการ A', 'ทีมปฏิบัติการ B', 'ทีมปฏิบัติการ C', 'ทีมปฏิบัติการ D'];
    const preferredTeam = options.team || teams[0];

    const overlaps = (aStart, aDays, bStart, bDays) => {
      const start1 = new Date(aStart);
      const end1 = new Date(aStart);
      end1.setDate(end1.getDate() + (aDays - 1));
      const start2 = new Date(bStart);
      const end2 = new Date(bStart);
      end2.setDate(end2.getDate() + (bDays - 1));
      return start2 <= end1 && end2 >= start1;
    };

    // ใช้วัน/ทีมที่เลือกก่อน หากชนคิว ให้หาวันถัดไปของทีมเดียวกัน
    let date = preferredDate;
    let team = preferredTeam;
    let found = false;

    for (let dayOffset = 0; dayOffset < 30 && !found; dayOffset++) {
      const tryDate = new Date(preferredDate);
      tryDate.setDate(tryDate.getDate() + dayOffset);
      const dateStr = tryDate.toISOString().slice(0, 10);

      const conflict = schedules.some(
        (e) => e.team === preferredTeam && overlaps(e.date, Number(e.days) || 1, dateStr, durationDays)
      );
      if (!conflict) {
        date = dateStr;
        team = preferredTeam;
        found = true;
      }
    }

    if (!found) {
      for (let dayOffset = 0; dayOffset < 30 && !found; dayOffset++) {
        const tryDate = new Date(preferredDate);
        tryDate.setDate(tryDate.getDate() + dayOffset);
        const dateStr = tryDate.toISOString().slice(0, 10);

        for (const t of teams) {
          const conflict = schedules.some(
            (e) => e.team === t && overlaps(e.date, Number(e.days) || 1, dateStr, durationDays)
          );
          if (!conflict) {
            date = dateStr;
            team = t;
            found = true;
            break;
          }
        }
      }
    }

    const newEvent = {
      id: `BC${Date.now()}`,
      projectId: deal.id,
      projectName: deal.projectName || quote?.projectName || 'บริการ Big Cleaning',
      customer: deal.customer || quote?.customer || '',
      date,
      team,
      days: durationDays,
      source: 'crm_approved',
      address: options.siteInfo?.address || quote?.address || '',
      siteType: options.siteInfo?.siteType || '',
      areaSqm: options.siteInfo?.areaSqm || null,
      specialNotes: options.siteInfo?.specialNotes || '',
      flags: options.siteInfo?.flags || {},
      contacts: options.siteInfo?.contacts || [],
      contactPhone: options.siteInfo?.contactPhone || quote?.contactPhone || '',
      mapUrl: options.siteInfo?.mapUrl || quote?.mapUrl || '',
      photos: options.siteInfo?.photos || quote?.sitePhotos || [],
      manpower: options.manpower || null,
      estimatedPeoplePerDay: options.manpower?.estimatedPeoplePerDay || 1,
      teamSize: options.manpower?.estimatedPeoplePerDay || 1,
    };

    await saveData('BigcleanSchedule', newEvent);

    // สร้าง/อัปเดตใบส่งงาน Big Cleaning โดยใช้คนประมาณการ/วัน
    const jobId = String(deal.id).replace('QT', 'OPB');
    const jobPayload = {
      id: jobId,
      client: deal.customer || quote?.customer || '',
      date,
      time: '08:00',
      teamSize: options.manpower?.estimatedPeoplePerDay || 1,
      estimatedPeoplePerDay: options.manpower?.estimatedPeoplePerDay || 1,
      manpower: options.manpower || null,
      status: 'รอดำเนินการ',
      refQuotation: deal.id,
      projectName: deal.projectName || quote?.projectName || '',
      team,
      days: durationDays,
      mapUrl: options.siteInfo?.mapUrl || quote?.mapUrl || '',
      address: options.siteInfo?.address || quote?.address || '',
      contacts: options.siteInfo?.contacts || [],
    };
    await saveData('operations_bigcleaning', jobPayload);

    return newEvent;
  };

  // บันทึกคำนวณต้นทุนตรงจาก Modal และไปเสนอราคา
  const handleSaveCosting = async (e) => {
    e.preventDefault();
    if (!costingCustomer || !costingProjectName) {
      showToast('กรุณากรอกชื่อลูกค้าและชื่อโปรเจ็กต์หน้างานก่อนบันทึกประเมินต้นทุน!', 'warning');
      return;
    }

    const dailyLaborTotal = useDailyLabor
      ? ((Number(costingSupervisorCount) * Number(costingSupervisorRate) + 
          Number(costingMaidCount) * Number(costingMaidRate) +
          Number(costingTechnicianCount) * Number(costingTechnicianRate)
         ) * Number(costingDays))
      : 0;
    const lumpSumLaborTotal = useLumpSumLabor ? Number(costingLumpSumLaborCost) : 0;
    const outsourceLaborTotal = useOutsourceLabor ? Number(costingOutsourceLaborCost) : 0;
    const totalLaborCost = dailyLaborTotal + lumpSumLaborTotal;

    const calculatedVehicleCost = costingVehicles.reduce((sum, v) => sum + (Number(v.rate) * Number(v.count) * Number(v.days)), 0);

    const totalDirectCost = totalLaborCost + 
      outsourceLaborTotal +
      calculatedVehicleCost + 
      Number(costingBoomLiftCost) + 
      Number(costingSuppliesCost) + 
      Number(costingSpecialChemicals) + 
      Number(costingSafeguardCost) + 
      Number(costingToolsCost) + 
      Number(costingSafetyCost) + 
      Number(costingOtherCost);

    const calculatedPrice = totalDirectCost / (1 - (costingMarkupPercent / 100));
    const estimatedProfit = calculatedPrice - totalDirectCost;

    const isEditing = !!editingSurveyId;
    const surveyId = editingSurveyId || ('SV' + Date.now());
    const existingSurvey = isEditing
      ? allSurveys.find((s) => s.surveyId === editingSurveyId || s.id === editingSurveyId)
      : null;
    // คำนวณค่าน้ำยารวมให้ถูกต้อง
    const finalSuppliesCost = costingSuppliesType === 'perSqm'
      ? Number(costingAreaSqm) * Number(costingSuppliesRate)
      : Number(costingSuppliesCost);

    const surveyData = {
      surveyId,
      customer: costingCustomer,
      projectName: costingProjectName,
      salesperson: costingSalesperson,
      serviceType: 'bigcleaning',
      linkedQuotationId: existingSurvey?.linkedQuotationId || 'รอดำเนินการ',
      areaSqm: Number(costingAreaSqm),
      siteType: costingSiteType,
      // บันทึกสถานะสวิตช์เปิด/ปิดแต่ละประเภทค่าแรง
      useDailyLabor,
      useLumpSumLabor,
      useOutsourceLabor,
      // ข้อมูลค่าแรงรายวัน
      supervisorCount: Number(costingSupervisorCount),
      supervisorRate: Number(costingSupervisorRate),
      maidCount: Number(costingMaidCount),
      maidRate: Number(costingMaidRate),
      technicianCount: Number(costingTechnicianCount),
      technicianRate: Number(costingTechnicianRate),
      dailyLaborTotal,
      // ข้อมูลค่าแรงเหมาจ่าย
      lumpSumLaborCount: Number(costingLumpSumLaborCount),
      lumpSumLaborCost: Number(costingLumpSumLaborCost),
      lumpSumDays: Number(costingLumpSumDays),
      // ข้อมูลค่าแรงนอก
      outsourceLaborCost: Number(costingOutsourceLaborCost),
      outsourceLaborTotal,
      outsourceSupervisorCount: Number(costingOutsourceSupervisorCount),
      outsourceSupervisorRate: Number(costingOutsourceSupervisorRate),
      outsourceMaidCount: Number(costingOutsourceMaidCount),
      outsourceMaidRate: Number(costingOutsourceMaidRate),
      outsourceTechnicianCount: Number(costingOutsourceTechnicianCount),
      outsourceTechnicianRate: Number(costingOutsourceTechnicianRate),
      outsourceDays: Number(costingOutsourceDays),
      days: Number(costingDays),
      vehicles: costingVehicles,
      vehicleCost: calculatedVehicleCost,
      boomLiftCost: Number(costingBoomLiftCost),
      suppliesType: costingSuppliesType,
      suppliesRate: Number(costingSuppliesRate),
      suppliesCost: finalSuppliesCost,
      specialChemicals: Number(costingSpecialChemicals),
      safeguardCost: Number(costingSafeguardCost),
      toolsCost: Number(costingToolsCost),
      safetyCost: Number(costingSafetyCost),
      otherCost: Number(costingOtherCost),
      totalDirectCost,
      calculatedPrice,
      markupPercent: costingMarkupPercent,
      estimatedProfit,
      nightShift: costingNightShift,
      highRise: costingHighRise,
      heavyStains: costingHeavyStains,
      noWaterElectricity: costingNoWaterElectricity,
      specialNotes: costingSpecialNotes
    };

    // 1. บันทึกเพื่อดึงไปสร้างใบเสนอราคา
    await saveSettingJson('sangkan_current_survey', surveyData);

    // 2. บันทึกถาวรลงประวัติต้นทุนทั้งหมด
    await saveData('AllSurveys', { ...surveyData, id: surveyId });
    const savedAll = isEditing
      ? allSurveys.map((s) => ((s.surveyId === surveyId || s.id === surveyId) ? surveyData : s))
      : [...allSurveys, surveyData];
    setAllSurveys(savedAll);

    // 3. ปิด Modal
    setIsCostingModalOpen(false);
    setEditingSurveyId(null);
    setSelectedViewSurvey(null);

    // 4. รีเฟรชหน้าเพื่อให้กระดานอัปเดตสเตจใหม่ (1.5 ประเมินต้นทุนแล้ว)
    showToast(
      isEditing
        ? `แก้ไขใบประเมิน ${surveyId} สำเร็จแล้ว`
        : 'บันทึกราคาทุนและผลประเมินหน้างานสำเร็จ! ดีลนี้ถูกเลื่อนเป็น "ประเมินต้นทุนแล้ว"',
      'success'
    );
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const openEditCostingSurvey = (survey) => {
    if (!survey) return;

    setEditingSurveyId(survey.surveyId || survey.id || null);
    setCostingCustomer(survey.customer || '');
    setCostingProjectName(survey.projectName || '');
    setCostingSalesperson(survey.salesperson || 'เซลล์ สมปอง');
    setCostingAreaSqm(survey.areaSqm || 150);
    setCostingSiteType(survey.siteType || 'สำนักงาน / ออฟฟิศ');

    setUseDailyLabor(
      survey.useDailyLabor !== undefined
        ? !!survey.useDailyLabor
        : survey.laborType
          ? survey.laborType === 'daily'
          : true
    );
    setUseLumpSumLabor(!!survey.useLumpSumLabor);
    setUseOutsourceLabor(!!survey.useOutsourceLabor);
    setCostingLaborType(survey.laborType || 'daily');

    setCostingSupervisorCount(survey.supervisorCount ?? 1);
    setCostingSupervisorRate(survey.supervisorRate ?? 700);
    setCostingMaidCount(survey.maidCount ?? 4);
    setCostingMaidRate(survey.maidRate ?? 500);
    setCostingTechnicianCount(survey.technicianCount ?? 0);
    setCostingTechnicianRate(survey.technicianRate ?? 800);

    setCostingLumpSumLaborCount(survey.lumpSumLaborCount ?? 10);
    setCostingLumpSumLaborCost(survey.lumpSumLaborCost ?? 12000);
    setCostingLumpSumDays(survey.lumpSumDays ?? survey.days ?? 2);

    setCostingOutsourceLaborCost(survey.outsourceLaborCost ?? 0);
    setCostingOutsourceSupervisorCount(survey.outsourceSupervisorCount ?? 0);
    setCostingOutsourceSupervisorRate(survey.outsourceSupervisorRate ?? 700);
    setCostingOutsourceMaidCount(survey.outsourceMaidCount ?? 0);
    setCostingOutsourceMaidRate(survey.outsourceMaidRate ?? 500);
    setCostingOutsourceTechnicianCount(survey.outsourceTechnicianCount ?? 0);
    setCostingOutsourceTechnicianRate(survey.outsourceTechnicianRate ?? 800);
    setCostingOutsourceDays(survey.outsourceDays ?? survey.days ?? 1);

    setCostingDays(survey.days ?? 2);
    setCostingVehicles(
      Array.isArray(survey.vehicles) && survey.vehicles.length
        ? survey.vehicles
        : [{ id: 1, type: 'รถกระบะขนอุปกรณ์', rate: 1500, count: 1, days: 1 }]
    );
    setCostingBoomLiftCost(survey.boomLiftCost ?? 0);
    setCostingSuppliesType(survey.suppliesType || 'perSqm');
    setCostingSuppliesRate(survey.suppliesRate ?? 2);
    setCostingSuppliesCost(survey.suppliesCost ?? 300);
    setCostingSpecialChemicals(survey.specialChemicals ?? 0);
    setCostingSafeguardCost(survey.safeguardCost ?? 0);
    setCostingToolsCost(survey.toolsCost ?? 500);
    setCostingSafetyCost(survey.safetyCost ?? 0);
    setCostingOtherCost(survey.otherCost ?? 0);
    setCostingMarkupPercent(survey.markupPercent ?? 35);
    setCostingNightShift(!!survey.nightShift);
    setCostingHighRise(!!survey.highRise);
    setCostingHeavyStains(!!survey.heavyStains);
    setCostingNoWaterElectricity(!!survey.noWaterElectricity);
    setCostingSpecialNotes(survey.specialNotes || '');

    setSelectedViewSurvey(null);
    setIsCostingModalOpen(true);
  };

  // บันทึก Log การติดต่อลูกค้า
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logClient || !logText) {
      showToast('กรุณากรอกชื่อลูกค้าและบันทึกข้อความสนทนา', 'warning');
      return;
    }

    const newLog = {
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      customer: logClient,
      type: logType,
      text: logText,
      serviceType: activeTab,
    };

    await saveData('CrmLogs', newLog);
    const updated = [newLog, ...customerLogs];
    setCustomerLogs(updated);
    setLogClient('');
    setLogText('');
    showToast('บันทึกความสนทนาประวัติการคุยลูกค้าเรียบร้อยแล้ว!', 'success');
  };

  // จองนัดหมายสำรวจหน้างาน
  const handleAddSurveySchedule = async (e) => {
    e.preventDefault();
    if (!surveyClient || !surveyDate) {
      showToast('กรุณาระบุชื่อลูกค้าและวันที่นัดหมายสำรวจหน้างาน!', 'warning');
      return;
    }

    const newSurvey = {
      id: String(Date.now()),
      customer: surveyClient,
      date: surveyDate,
      time: surveyTime,
      assigned: surveyAssigned,
      note: surveyNote,
      serviceType: activeTab,
      contacts: surveyContacts.filter(c => c.name || c.phone) // บันทึกเฉพาะผู้ติดต่อที่มีการระบุข้อมูล
    };

    await saveData('SurveySchedules', newSurvey);
    const updated = [...surveySchedules, newSurvey];
    setSurveySchedules(updated);
    
    setSurveyClient('');
    setSurveyDate('');
    setSurveyNote('');
    setSurveyContacts([{ name: '', phone: '' }]);
    setIsSurveyModalOpen(false);
    showToast('นัดหมายเวลาเข้าสำรวจหน้างานของเซลส์เสร็จสมบูรณ์!', 'success');
  };

  // ยกเลิกนัดหมายสำรวจ
  const handleDeleteSurvey = async (id) => {
    if (confirm('คุณต้องการยกเลิกนัดหมายสำรวจหน้างานครั้งนี้ใช่หรือไม่?')) {
      await deleteData('SurveySchedules', String(id));
      const updated = surveySchedules.filter(s => s.id !== id);
      setSurveySchedules(updated);
      showToast('ยกเลิกนัดหมายสำรวจหน้างานเรียบร้อยแล้ว', 'info');
    }
  };

  // ปฏิทินคำนวณวัน
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedSurveyDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedSurveyDay(null);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const blankDays = Array(firstDay).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const tabDeals = deals.filter(d => (d.serviceType || 'bigcleaning') === activeTab && d.stage !== 'lost');
  const tabLostDeals = lostDeals.filter((d) => (d.serviceType || 'bigcleaning') === activeTab);
  const tabSurveys = surveySchedules.filter(s => (s.serviceType || 'bigcleaning') === activeTab);
  const tabLogs = customerLogs.filter(l => (l.serviceType || 'bigcleaning') === activeTab);
  const tabArchivedSurveys = allSurveys.filter(s => (s.serviceType || 'bigcleaning') === activeTab);

  // กรองนัดหมายสำรวจรายวัน
  const getSurveysForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return tabSurveys
      .filter((s) => s.date === dateStr)
      .slice()
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  };

  const selectedDaySurveys = selectedSurveyDay ? getSurveysForDay(selectedSurveyDay) : null;
  const listSurveys = (selectedDaySurveys || tabSurveys)
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.time || '').localeCompare(String(b.time || '')));

  const goToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedSurveyDay(now.getDate());
  };

  const filteredDeals = tabDeals.filter(d => 
    (d.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  // คำนวณผลรวมต้นทุนตรงแบบเรียลไทม์สำหรับ Pop-up Modal
  // คำนวณผลรวมต้นทุนยานพาหนะแบบไดนามิก
  const calculatedVehicleCost = costingVehicles.reduce((sum, v) => sum + (Number(v.rate) * Number(v.count) * Number(v.days)), 0);

  // คำนวณค่าน้ำยารวมแบบทางเลือก ตร.ม. หรือเหมา
  const calculatedSuppliesCost = costingSuppliesType === 'perSqm'
    ? Number(costingAreaSqm) * Number(costingSuppliesRate)
    : Number(costingSuppliesCost);

  // คำนวณผลรวมต้นทุนตรงแบบเรียลไทม์สำหรับ Pop-up Modal
  const calcDailyLabor = useDailyLabor
    ? ((Number(costingSupervisorCount) * Number(costingSupervisorRate) + 
        Number(costingMaidCount) * Number(costingMaidRate) +
        Number(costingTechnicianCount) * Number(costingTechnicianRate)
       ) * Number(costingDays))
    : 0;
  const calcLumpSumLabor = useLumpSumLabor ? Number(costingLumpSumLaborCost) : 0;
  const calcOutsourceLabor = useOutsourceLabor
    ? ((Number(costingOutsourceSupervisorCount) * Number(costingOutsourceSupervisorRate) + 
        Number(costingOutsourceMaidCount) * Number(costingOutsourceMaidRate) +
        Number(costingOutsourceTechnicianCount) * Number(costingOutsourceTechnicianRate)
       ) * Number(costingOutsourceDays))
    : 0;
  const calculatedDirectCost = 
    (calcDailyLabor + calcLumpSumLabor) +
    calcOutsourceLabor +
    calculatedVehicleCost +
    Number(costingBoomLiftCost) +
    calculatedSuppliesCost +
    Number(costingSpecialChemicals) +
    Number(costingSafeguardCost) +
    Number(costingToolsCost) +
    Number(costingSafetyCost) +
    Number(costingOtherCost);

  const calculatedSellPrice = calculatedDirectCost / (1 - (costingMarkupPercent / 100));
  const calculatedProfit = calculatedSellPrice - calculatedDirectCost;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล CRM...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 4px 0' }}>แดชบอร์ด CRM & กระดานขาย (Sales Pipeline)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'bigcleaning'
              ? 'ติดตามดีล Big Cleaning จากสำรวจหน้างาน → ประเมินต้นทุน → เสนอราคา → ปิดงาน'
              : 'ติดตามดีลแม่บ้านประจำหน่วยงาน จากพบลูกค้า → เสนอราคารายเดือน → ปิดสัญญา'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsSurveyModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e0f2fe', color: 'var(--primary-dark)', padding: '12px 20px', borderRadius: '8px', border: '1px solid #bae6fd', fontWeight: 'bold', cursor: 'pointer' }}>
            <CalendarIcon size={18} /> {activeTab === 'bigcleaning' ? 'นัดสำรวจหน้างาน' : 'นัดพบลูกค้า'}
          </button>

          {activeTab === 'bigcleaning' ? (
          <button onClick={() => {
            setCostingCustomer('');
            setCostingProjectName('');
            setCostingSalesperson('เซลล์ สมปอง');
            setCostingAreaSqm(150);
            setCostingSiteType('สำนักงาน / ออฟฟิศ');
            setCostingLaborType('daily');
            setCostingSupervisorCount(1);
            setCostingSupervisorRate(700);
            setCostingMaidCount(4);
            setCostingMaidRate(500);
            setCostingLumpSumLaborCount(10);
            setCostingLumpSumLaborCost(12000);
            setCostingLumpSumDays(2);
            setCostingDays(2);
            setCostingVehicles([
              { id: 1, type: 'รถกระบะขนอุปกรณ์', rate: 1500, count: 1, days: 1 }
            ]);
            setCostingTechnicianCount(0);
            setCostingTechnicianRate(800);
            setCostingOutsourceLaborCost(0);
            setCostingOutsourceSupervisorCount(0);
            setCostingOutsourceSupervisorRate(700);
            setCostingOutsourceMaidCount(0);
            setCostingOutsourceMaidRate(500);
            setCostingOutsourceTechnicianCount(0);
            setCostingOutsourceTechnicianRate(800);
            setCostingOutsourceDays(1);
            setCostingBoomLiftCost(0);
            setCostingSuppliesType('perSqm');
            setCostingSuppliesRate(2);
            setCostingSuppliesCost(300);
            setCostingSpecialChemicals(0);
            setCostingSafeguardCost(0);
            setCostingToolsCost(500);
            setCostingSafetyCost(0);
            setCostingOtherCost(0);
            setCostingMarkupPercent(35);
            setCostingNightShift(false);
            setCostingHighRise(false);
            setCostingHeavyStains(false);
            setCostingNoWaterElectricity(false);
            setCostingSpecialNotes('');
            setEditingSurveyId(null);
            setIsCostingModalOpen(true);
          }} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            <Plus size={18} /> คำนวณต้นทุนประเมิน
          </button>
          ) : (
          <Link href="/quotation/create?type=recurring" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }}>
            <Plus size={18} /> สร้างใบเสนอราคาแม่บ้านประจำ
          </Link>
          )}
        </div>
      </div>

      {/* Tabs ประเภทบริการ */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('bigcleaning')}
          style={{
            padding: '16px 24px',
            fontSize: '1.05rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            color: activeTab === 'bigcleaning' ? '#d97706' : 'var(--text-muted)',
            borderBottom: activeTab === 'bigcleaning' ? '4px solid #f59e0b' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <Briefcase size={20} /> Big Cleaning ({deals.filter(d => (d.serviceType || 'bigcleaning') === 'bigcleaning').length})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          style={{
            padding: '16px 24px',
            fontSize: '1.05rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            color: activeTab === 'recurring' ? 'var(--primary-dark)' : 'var(--text-muted)',
            borderBottom: activeTab === 'recurring' ? '4px solid var(--primary-color)' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <Users size={20} /> แม่บ้านประจำหน่วยงาน ({deals.filter(d => d.serviceType === 'recurring').length})
        </button>
      </div>

      {/* สถิติดีลสรุปบนไปป์ไลน์ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', color: '#2563eb' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>จำนวนดีลทั้งหมด</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{tabDeals.length} ดีล</h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ดีลที่อนุมัติแล้ว</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>
              {tabDeals.filter(d => d.stage === 'approved' || d.stage === 'ops' || d.stage === 'delivered' || d.stage === 'invoiced').length} ดีล
            </h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', color: '#d97706' }}>
            <CalendarIcon size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeTab === 'bigcleaning' ? 'นัดสำรวจหน้างาน' : 'นัดพบลูกค้า'}</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#d97706' }}>{tabSurveys.length} นัดหมาย</h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '12px', borderRadius: '8px', color: '#7c3aed' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ประวัติคุยลูกค้า</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#7c3aed' }}>{tabLogs.length} ครั้ง</h3>
          </div>
        </div>
      </div>

      {/* แท็บค้นหา */}
      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="ค้นหาดีลตามชื่อลูกค้า หรือรายละเอียดงาน..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem' }} 
        />
      </div>

      {/* กระดานขาย Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '16px' }}>
        {stages.map(st => {
          const stageDeals = filteredDeals.filter(d => d.stage === st.key);
          return (
            <div key={st.key} style={{ minWidth: '170px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header สเตจ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', backgroundColor: st.bg, borderTop: `4px solid ${st.color}` }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: st.color }} title={st.key === 'invoiced' ? 'เก็บบนกระดาน 3 วัน แล้วระบบจะนำการ์ดออกอัตโนมัติ' : undefined}>
                  {st.label}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: st.color, backgroundColor: 'white', padding: '2px 6px', borderRadius: '20px' }}>
                  {stageDeals.length}
                </span>
              </div>

              {/* รายการดีลในแต่ละสเตจ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                {stageDeals.map(d => {
                  const remainingMs =
                    d.stage === 'invoiced' && d.invoiceExpiresAt
                      ? new Date(d.invoiceExpiresAt).getTime() - nowTick
                      : null;
                  const countdownLabel =
                    d.stage === 'invoiced' ? formatInvoiceCountdown(remainingMs) : '';

                  return (
                  <div key={d.id} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-main)', lineBreak: 'anywhere' }}>{d.customer}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.projectName.slice(0, 30)}...</p>
                    
                    {/* แท็กสัญลักษณ์กรณีพิเศษประเมินหน้างาน */}
                    {d.evaluation && (d.evaluation.nightShift || d.evaluation.highRise || d.evaluation.heavyStains || d.evaluation.noWaterElectricity) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                        {d.evaluation.nightShift && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 'bold' }}>🌙 กะดึก</span>}
                        {d.evaluation.highRise && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', fontWeight: 'bold' }}>🧗 ที่สูง</span>}
                        {d.evaluation.heavyStains && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', fontWeight: 'bold' }}>🧱 คราบปูน</span>}
                        {d.evaluation.noWaterElectricity && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontWeight: 'bold' }}>⚠️ ไม่มีน้ำ/ไฟ</span>}
                      </div>
                    )}

                    {d.evaluation?.specialNotes && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px', marginTop: '2px', borderLeft: '3px solid #cbd5e1' }} title={d.evaluation.specialNotes}>
                        📌 {d.evaluation.specialNotes.slice(0, 25)}...
                      </div>
                    )}

                    {d.stage === 'invoiced' && countdownLabel && (
                      <div style={{
                        marginTop: 2,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: remainingMs != null && remainingMs < 24 * 60 * 60 * 1000 ? '#b91c1c' : '#475569',
                        background: remainingMs != null && remainingMs < 24 * 60 * 60 * 1000 ? '#fef2f2' : '#f1f5f9',
                        padding: '4px 6px',
                        borderRadius: 6,
                      }}>
                        ⏳ {countdownLabel}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{d.total.toLocaleString()} ฿</span>
                      
                      {/* ปุ่มเลื่อนสเตจ / ย้ายไปปฏิเสธ */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {stages.findIndex(s => s.key === st.key) > 0 && (
                          <button 
                            onClick={() => {
                              const currentIdx = stages.findIndex(s => s.key === st.key);
                              moveDeal(d.id, stages[currentIdx - 1].key);
                            }}
                            style={{
                              border: 'none',
                              background: stages[stages.findIndex(s => s.key === st.key) - 1]?.key === 'survey' ? '#fef2f2' : '#f1f5f9',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: stages[stages.findIndex(s => s.key === st.key) - 1]?.key === 'survey' ? '#dc2626' : 'var(--text-muted)',
                            }}
                            title={
                              stages[stages.findIndex(s => s.key === st.key) - 1]?.key === 'survey'
                                ? 'ย้อนไปขั้น 1 = ลบการ์ดออกจากกระดาน'
                                : 'ย้อนขั้นตอนดีลขายก่อนหน้า'
                            }
                          >
                            <ChevronLeft size={12} />
                          </button>
                        )}
                        {stages.findIndex(s => s.key === st.key) < stages.length - 1 && (
                          <button 
                            onClick={() => {
                              const currentIdx = stages.findIndex(s => s.key === st.key);
                              moveDeal(d.id, stages[currentIdx + 1].key);
                            }}
                            style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="เลื่อนขั้นตอนดีลขายถัดไป"
                          >
                            <ChevronRight size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => askRejectDeal(d)}
                          style={{ border: 'none', background: '#fef2f2', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}
                          title="ลบจากกระดาน → เก็บในลูกค้าที่ปฏิเสธ/ไม่ได้งาน"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ตารางปฏิทินและรายชื่อนัดหมายสำรวจหน้างาน */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
        
        {/* ปฏิทินซ้าย */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} /> {activeTab === 'bigcleaning' ? 'ปฏิทินคิวนัดสำรวจหน้างาน' : 'ปฏิทินคิวนัดพบลูกค้า'}
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', minWidth: '9rem', textAlign: 'center' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </span>
              <button type="button" onClick={goToday} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8' }}>
                วันนี้
              </button>
              <button type="button" onClick={prevMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={nextMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* ตารางวันปฏิทิน */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', alignItems: 'stretch' }}>
            {blankDays.map((_, i) => (
              <div key={`blank-${i}`} style={{ minHeight: '96px', backgroundColor: '#f8fafc', borderRadius: '8px' }} />
            ))}
            {daysArray.map((day) => {
              const daySurveys = getSurveysForDay(day);
              const isSelected = selectedSurveyDay === day;
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              const hasEvents = daySurveys.length > 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedSurveyDay(isSelected ? null : day)}
                  style={{
                    minHeight: hasEvents ? '118px' : '96px',
                    height: '100%',
                    border: isSelected ? '2px solid #2563eb' : isToday ? '1.5px solid #93c5fd' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: isSelected ? '#eff6ff' : hasEvents ? '#f8fbff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                    transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isToday ? '#fff' : 'var(--text-main)',
                        width: isToday ? 22 : 'auto',
                        height: isToday ? 22 : 'auto',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isToday ? '#2563eb' : 'transparent',
                      }}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: 10 }}>
                        {daySurveys.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0 }}>
                    {daySurveys.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        title={`${s.time || ''} ${s.customer || ''}\n${s.note || ''}\nผู้รับผิดชอบ: ${s.assigned || '-'}`}
                        style={{
                          fontSize: '0.68rem',
                          lineHeight: 1.35,
                          padding: '3px 5px',
                          borderRadius: '5px',
                          backgroundColor: '#e0f2fe',
                          color: '#0c4a6e',
                          fontWeight: 600,
                          borderLeft: '3px solid #0ea5e9',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#0369a1' }}>{s.time || '--:--'}</div>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {s.customer || '-'}
                        </div>
                      </div>
                    ))}
                    {daySurveys.length > 3 && (
                      <span style={{ fontSize: '0.65rem', color: '#0369a1', fontWeight: 600, paddingLeft: 2 }}>
                        + อีก {daySurveys.length - 3} นัด — คลิกดูทั้งหมด
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            คลิกวันที่เพื่อดูรายละเอียดด้านขวา · รวม {tabSurveys.length} นัดหมายในเดือนนี้/ทั้งหมดตามแท็บ
          </p>
        </div>

        {/* ข้อมูลการ์ดลิสต์นัดหมายขวา */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '360px', maxHeight: '640px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>
                {selectedSurveyDay
                  ? `นัดวันที่ ${selectedSurveyDay} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`
                  : activeTab === 'bigcleaning'
                    ? 'รายละเอียดคิวนัดสำรวจหน้างาน'
                    : 'รายละเอียดคิวนัดพบลูกค้า'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedSurveyDay
                  ? `${listSurveys.length} นัดในวันนี้`
                  : `แสดงทุกรายการ (${listSurveys.length}) — คลิกวันในปฏิทินเพื่อกรอง`}
              </p>
            </div>
            {selectedSurveyDay && (
              <button
                type="button"
                onClick={() => setSelectedSurveyDay(null)}
                style={{ flexShrink: 0, border: '1px solid var(--border-color)', background: '#f8fafc', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ดูทั้งหมด
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {listSurveys.length > 0 ? (
              listSurveys.map((survey) => (
                <div key={survey.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', backgroundColor: '#f8fafc' }}>
                  <button onClick={() => handleDeleteSurvey(survey.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="ลบนัดหมาย">
                    <X size={14} />
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingRight: 24 }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                      📅 {survey.date}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                      ⏰ {survey.time} น.
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                      {survey.assigned}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                    {survey.customer}
                  </h4>
                  {survey.note && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {survey.note}
                    </p>
                  )}

                  {survey.contacts && survey.contacts.length > 0 && (
                    <div style={{ marginTop: '2px', backgroundColor: 'white', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>👥 ผู้ติดต่อประสานงาน ({survey.contacts.length})</span>
                      {survey.contacts.map((c, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.8rem', color: 'var(--text-main)', flexWrap: 'wrap' }}>
                          <span>• {c.name || '-'}</span>
                          {c.phone && <a href={`tel:${c.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>📞 {c.phone}</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '40px 0' }}>
                {selectedSurveyDay
                  ? 'ไม่มีนัดหมายในวันที่เลือก'
                  : activeTab === 'bigcleaning'
                    ? 'ไม่มีนัดหมายลงพื้นที่สำรวจหน้างาน'
                    : 'ไม่มีนัดหมายพบลูกค้า'}
              </p>
            )}
          </div>
        </div>

      </div>



      {/* 📦 คลังเอกสารใบประเมินต้นทุนโครงการ (Archived Costing Sheets) — เฉพาะ Big Cleaning */}
      {activeTab === 'bigcleaning' && (
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)' }}>
          📦 คลังเอกสารใบประเมินต้นทุนหน้างาน (Archived Costing Sheets)
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>รหัสใบสำรวจ</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>ชื่อลูกค้า</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>ชื่อโครงการ</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>ลักษณะ/พื้นที่</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>ผู้รับผิดชอบ (เซลส์)</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'right' }}>ต้นทุนรวม (Direct Cost)</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'right' }}>ราคาแนะนำขาย</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'center' }}>เชื่อมใบเสนอราคา</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tabArchivedSurveys.length > 0 ? (
                tabArchivedSurveys.map(survey => (
                  <tr key={survey.surveyId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{survey.surveyId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{survey.customer}</td>
                    <td style={{ padding: '12px 8px' }}>{survey.projectName}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{survey.siteType} ({survey.areaSqm} ตร.ม.)</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                        👤 {survey.salesperson || 'ไม่ระบุ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{Number(survey.totalDirectCost || 0).toLocaleString()} ฿</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>{Number(survey.calculatedPrice || 0).toLocaleString()} ฿</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {survey.linkedQuotationId && survey.linkedQuotationId !== 'รอดำเนินการ' ? (
                        <span style={{ padding: '3px 8px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          📄 {survey.linkedQuotationId}
                        </span>
                      ) : (
                        <span style={{ padding: '3px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          ⏳ รอดำเนินการ
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          type="button"
                          onClick={() => setSelectedViewSurvey(survey)}
                          style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          🔍 ดูใบประเมิน
                        </button>
                        <button 
                          type="button"
                          onClick={() => openEditCostingSurvey(survey)}
                          style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Pencil size={12} /> แก้ไข
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    ไม่มีข้อมูลเอกสารใบสำรวจและประเมินราคาบันทึกไว้ในคลัง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ลูกค้าที่ปฏิเสธหรือไม่ได้งาน */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b' }}>
          <AlertCircle size={20} /> ลูกค้าที่ปฏิเสธหรือไม่ได้งาน ({tabLostDeals.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fef2f2', borderBottom: '2px solid #fecaca', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b' }}>วันที่บันทึก</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b' }}>ลูกค้า</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b' }}>โครงการ</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b', textAlign: 'right' }}>มูลค่า</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b' }}>เหตุผล</th>
                <th style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tabLostDeals.length > 0 ? (
                tabLostDeals.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #fee2e2' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.lostAt || '-'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.customer}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{item.projectName}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{Number(item.total || 0).toLocaleString()} ฿</td>
                      <td style={{ padding: '12px 8px' }}>{item.reason || '-'}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => restoreLostDeal(item)}
                          style={{ padding: '4px 10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#047857' }}
                        >
                          คืนเข้ากระดาน
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ยังไม่มีรายการ — กดไอคอนถังขยะบนการ์ดในกระดานเพื่อย้ายมาเก็บที่นี่
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ยืนยันลบการ์ดเมื่อย้อนกลับไปขั้น 1 สำรวจหน้างาน */}
      {rollbackDeleteTarget?.deal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#991b1b' }}>ยืนยันลบการ์ด</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  การย้อนกลับไปขั้น &quot;1. สำรวจหน้างาน&quot; จะลบการ์ดนี้ออกจากกระดาน
                </p>
              </div>
              <button type="button" onClick={() => setRollbackDeleteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{rollbackDeleteTarget.deal.customer}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rollbackDeleteTarget.deal.projectName}</p>
              <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--primary-dark)' }}>{Number(rollbackDeleteTarget.deal.total || 0).toLocaleString()} ฿</p>
              {rollbackDeleteTarget.fromStage && (
                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                  ย้อนจากขั้นปัจจุบัน → ขั้น 1 (ลบการ์ด)
                </p>
              )}
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              ระบบจะลบเอกสารที่เกี่ยวข้องด้วย เช่น นัดสำรวจ / ใบประมาณ / ใบเสนอราคา (ถ้ามี) — การกระทำนี้ไม่สามารถกู้คืนได้จากกระดาน
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setRollbackDeleteTarget(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
                ยกเลิก
              </button>
              <button type="button" onClick={confirmRollbackDelete} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                ยืนยันลบการ์ด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันย้ายไปปฏิเสธ/ไม่ได้งาน */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#991b1b' }}>ย้ายออกจากกระดานขาย</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>ข้อมูลจะถูกเก็บในรายการลูกค้าที่ปฏิเสธหรือไม่ได้งาน</p>
              </div>
              <button type="button" onClick={() => setRejectTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{rejectTarget.customer}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rejectTarget.projectName}</p>
              <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--primary-dark)' }}>{Number(rejectTarget.total || 0).toLocaleString()} ฿</p>
            </div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>เหตุผล</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', outline: 'none' }}
            >
              <option value="ลูกค้าปฏิเสธ / ไม่ได้งาน">ลูกค้าปฏิเสธ / ไม่ได้งาน</option>
              <option value="ราคาสูงเกินไป">ราคาสูงเกินไป</option>
              <option value="ลูกค้าเลื่อนไม่มีกำหนด">ลูกค้าเลื่อนไม่มีกำหนด</option>
              <option value="คู่แข่งชนะ">คู่แข่งชนะ</option>
              <option value="ติดต่อไม่ได้">ติดต่อไม่ได้</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setRejectTarget(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
                ยกเลิก
              </button>
              <button type="button" onClick={confirmMoveToLost} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                ยืนยันย้ายไปเก็บ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียดใบประเมินต้นทุนแบบละเอียด (Survey Detail Viewer) */}
      {selectedViewSurvey && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '750px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                📄 รายละเอียดเอกสารประเมินต้นทุน ({selectedViewSurvey.surveyId})
              </h3>
              <button onClick={() => setSelectedViewSurvey(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* ข้อมูลพื้นฐาน */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ชื่อลูกค้า: <strong style={{ color: 'var(--text-main)' }}>{selectedViewSurvey.customer}</strong></p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ชื่อโครงการ: <strong style={{ color: 'var(--text-main)' }}>{selectedViewSurvey.projectName}</strong></p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>เซลส์ผู้รับผิดชอบ: <strong style={{ color: 'var(--primary-dark)' }}>{selectedViewSurvey.salesperson || 'ไม่ระบุ'}</strong></p>
                </div>
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ประเภทสถานที่: <strong style={{ color: 'var(--text-main)' }}>{selectedViewSurvey.siteType}</strong></p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ขนาดพื้นที่: <strong style={{ color: 'var(--text-main)' }}>{selectedViewSurvey.areaSqm} ตร.ม.</strong></p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>สถานะใบเสนอราคา: 
                    <strong style={{ color: selectedViewSurvey.linkedQuotationId === 'รอดำเนินการ' ? '#b91c1c' : '#15803d', marginLeft: '6px' }}>
                      {selectedViewSurvey.linkedQuotationId}
                    </strong>
                  </p>
                </div>
              </div>

              {/* รายละเอียดกำลังพล */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>👥 ข้อมูลแผนงานและกำลังพล</h4>
                
                {/* ค่าแรงรายวัน */}
                {(selectedViewSurvey.useDailyLabor || selectedViewSurvey.laborType === 'daily') && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-dark)', display: 'block', marginBottom: '6px' }}>📋 ค่าแรงรายวัน (Daily)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                      <div>
                        <p style={{ margin: 0 }}>หัวหน้าทีม/ช่างเทคนิค: <strong>{selectedViewSurvey.supervisorCount} คน</strong></p>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>อัตรา {Number(selectedViewSurvey.supervisorRate).toLocaleString()} บ./วัน</p>
                      </div>
                      <div>
                        <p style={{ margin: 0 }}>แม่บ้านปฏิบัติการ: <strong>{selectedViewSurvey.maidCount} คน</strong></p>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>อัตรา {Number(selectedViewSurvey.maidRate).toLocaleString()} บ./วัน</p>
                      </div>
                      <div>
                        <p style={{ margin: 0 }}>ช่างพิเศษ/ขัดพื้น: <strong>{selectedViewSurvey.technicianCount || 0} คน</strong></p>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>อัตรา {Number(selectedViewSurvey.technicianRate || 0).toLocaleString()} บ./วัน</p>
                      </div>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)', textAlign: 'right' }}>
                      รวม {selectedViewSurvey.days} วัน = {Number(selectedViewSurvey.dailyLaborTotal || 0).toLocaleString()} ฿
                    </p>
                  </div>
                )}

                {/* ค่าแรงเหมาจ่าย */}
                {selectedViewSurvey.useLumpSumLabor && (
                  <div style={{ backgroundColor: '#faf5ff', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>📦 ค่าแรงเหมาจ่าย (Lump-Sum)</span>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      จำนวนคน: <strong>{selectedViewSurvey.lumpSumLaborCount} คน</strong> | จำนวนวัน: <strong>{selectedViewSurvey.lumpSumDays || selectedViewSurvey.days || 1} วัน</strong> | ยอดเหมารวม: <strong>{Number(selectedViewSurvey.lumpSumLaborCost || 0).toLocaleString()} ฿</strong>
                    </p>
                  </div>
                )}

                {/* ค่าแรงนอก */}
                {selectedViewSurvey.useOutsourceLabor && (
                  <div style={{ backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#b91c1c', display: 'block', marginBottom: '6px' }}>🔧 ค่าแรงนอก/ซับคอนแทรค (Outsource)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <div>หัวหน้า/ช่าง: <strong>{selectedViewSurvey.outsourceSupervisorCount || 0} คน</strong></div>
                      <div>แม่บ้าน: <strong>{selectedViewSurvey.outsourceMaidCount || 0} คน</strong></div>
                      <div>ช่างพิเศษ: <strong>{selectedViewSurvey.outsourceTechnicianCount || 0} คน</strong></div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      ยอดรวม: <strong style={{ color: '#b91c1c' }}>{Number(selectedViewSurvey.outsourceLaborCost || 0).toLocaleString()} ฿</strong>
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '0.85rem' }}>
                  <span>ระยะเวลาทำงานทั้งหมด: <strong>{selectedViewSurvey.days} วัน</strong></span>
                </div>
              </div>

              {/* รายละเอียดค่ารถ */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>🚚 ยานพาหนะจัดส่งทีมงาน</h4>
                {selectedViewSurvey.vehicles && selectedViewSurvey.vehicles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    {selectedViewSurvey.vehicles.map((v, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                        <span>{idx + 1}. {v.type} ({v.count} คัน)</span>
                        <span>{v.rate} บ./คัน/วัน x {v.days} วัน = <strong>{(v.rate * v.count * v.days).toLocaleString()} ฿</strong></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลยานพาหนะเฉพาะเจาะจง (รวมค่ารถ {Number(selectedViewSurvey.vehicleCost || 0).toLocaleString()} ฿)</p>
                )}
              </div>

              {/* เคมีภัณฑ์และค่าใช้จ่ายอื่นๆ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--primary-dark)' }}>🧪 เคมีภัณฑ์ &amp; อุปกรณ์หนัก</h5>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>ค่าน้ำยาทำความสะอาดทั่วไป: {Number(selectedViewSurvey.suppliesCost).toLocaleString()} ฿</li>
                    <li>ค่าน้ำยาเฉพาะทางคราบลึก: {Number(selectedViewSurvey.specialChemicals).toLocaleString()} ฿</li>
                    <li>เช่ารถกระเช้า/Boom Lift: {Number(selectedViewSurvey.boomLiftCost).toLocaleString()} ฿</li>
                  </ul>
                </div>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--primary-dark)' }}>🛡️ เซฟตี้ &amp; ความเสี่ยงเฉพาะหน้างาน</h5>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>กันฝุ่นเซฟการ์ดหน้างาน: {Number(selectedViewSurvey.safeguardCost).toLocaleString()} ฿</li>
                    <li>ค่าเสื่อมเครื่องขัด/เครื่องมือ: {Number(selectedViewSurvey.toolsCost).toLocaleString()} ฿</li>
                    <li>ค่าตรวจเซฟตี้/PPE: {Number(selectedViewSurvey.safetyCost).toLocaleString()} ฿</li>
                    <li>ค่าความเสี่ยง/จิปาถะอื่นๆ: {Number(selectedViewSurvey.otherCost).toLocaleString()} ฿</li>
                  </ul>
                </div>
              </div>

              {/* ข้อกำหนดลักษณะพิเศษ */}
              <div style={{ backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>
                <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>💡 ปัจจัยความเสี่ยงที่ระบุตอนสำรวจ:</span>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {selectedViewSurvey.nightShift && <span>🌙 ทำงานกลางคืน</span>}
                  {selectedViewSurvey.highRise && <span>🏢 งานที่สูง/กระจกสูง</span>}
                  {selectedViewSurvey.heavyStains && <span>⚠️ คราบสกปรกฝังแน่น</span>}
                  {selectedViewSurvey.noWaterElectricity && <span>🔌 ไม่มีน้ำ/ไฟหน้างาน</span>}
                </div>
                {selectedViewSurvey.specialNotes && (
                  <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', color: '#4b5563' }}>
                    * โน้ตกรณีพิเศษ: {selectedViewSurvey.specialNotes}
                  </p>
                )}
              </div>

              {/* สรุปต้นทุนและการขาย */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ต้นทุนตรงรวม (Direct Cost): <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{Number(selectedViewSurvey.totalDirectCost).toLocaleString()} ฿</strong></p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>เป้าหมาย Margin: <strong>{selectedViewSurvey.markupPercent}%</strong> (กำไรประเมิน {Number(selectedViewSurvey.estimatedProfit).toLocaleString()} ฿)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ราคาแนะนำเสนอขายลูกค้า:</p>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.5rem' }}>{Number(selectedViewSurvey.calculatedPrice).toLocaleString()} ฿</h3>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button 
                type="button" 
                onClick={() => openEditCostingSurvey(selectedViewSurvey)} 
                style={{ padding: '10px 20px', border: '1px solid #bae6fd', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Pencil size={16} /> แก้ไขใบประเมิน
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedViewSurvey(null)} 
                style={{ padding: '10px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal จองคิวนัดสำรวจหน้างาน */}
      {isSurveyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)' }}>
                {activeTab === 'bigcleaning' ? 'นัดหมายวันเข้าสำรวจหน้างาน (Sales Survey)' : 'นัดหมายพบลูกค้า (แม่บ้านประจำ)'}
              </h3>
              <button onClick={() => setIsSurveyModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleAddSurveySchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ชื่อลูกค้า / บริษัท</label>
                <input type="text" placeholder="เช่น บจก. พัฒนาการค้า" value={surveyClient} onChange={e => setSurveyClient(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
              </div>

              {/* ส่วนเพิ่มผู้ติดต่อประสานงาน (รองรับมากกว่า 1 คน) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500' }}>รายชื่อผู้ติดต่อหน้างาน</label>
                  <button 
                    type="button" 
                    onClick={() => setSurveyContacts([...surveyContacts, { name: '', phone: '' }])}
                    style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', background: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    + เพิ่มผู้ติดต่อ
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
                  {surveyContacts.map((contact, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="ชื่อผู้ติดต่อ" 
                        value={contact.name} 
                        onChange={e => {
                          const updated = [...surveyContacts];
                          updated[idx].name = e.target.value;
                          setSurveyContacts(updated);
                        }}
                        style={{ flex: 1.2, padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }} 
                      />
                      <input 
                        type="text" 
                        placeholder="เบอร์โทร" 
                        value={contact.phone} 
                        onChange={e => {
                          const updated = [...surveyContacts];
                          updated[idx].phone = e.target.value;
                          setSurveyContacts(updated);
                        }}
                        style={{ flex: 1, padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }} 
                      />
                      {surveyContacts.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = surveyContacts.filter((_, cIdx) => cIdx !== idx);
                            setSurveyContacts(updated);
                          }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>วันที่นัดหมาย</label>
                  <input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>เวลาสะดวก</label>
                  <input type="time" value={surveyTime} onChange={e => setSurveyTime(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>เซลส์ผู้รับผิดชอบเข้าหน้างาน</label>
                <select value={surveyAssigned} onChange={e => setSurveyAssigned(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}>
                  <option value="เซลล์ สมปอง">เซลล์ สมปอง</option>
                  <option value="เซลล์ สมศรี">เซลล์ สมศรี</option>
                  <option value="แอดมินระบบ">แอดมินระบบ</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>หมายเหตุกิจกรรม/รายละเอียดหน้างาน</label>
                <textarea placeholder="เช่น วัดตารางเมตรของออฟฟิศชั้น 4 หรือคุยขอบเขตการซักพรม..." value={surveyNote} onChange={e => setSurveyNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsSurveyModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกนัดหมาย</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ขนาดใหญ่สำหรับคำนวณต้นทุนประเมินโครงการแบบละเอียด (Detailed Site Cost Estimator) */}
      {isCostingModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '920px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingSurveyId
                  ? `✏️ แก้ไขใบประเมินต้นทุน (${editingSurveyId})`
                  : '📋 ใบสำรวจหน้างาน & แบบคำนวณต้นทุนประเมินโครงการละเอียด (Detailed Costing Worksheet)'}
              </h3>
              <button onClick={() => { setIsCostingModalOpen(false); setEditingSurveyId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCosting} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '24px', alignItems: 'start' }}>
              
              {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูลสำรวจและคำนวณ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Section 1: ข้อมูลลูกค้าและโครงการ */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>1. ข้อมูลสถานที่และโครงการ</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>ชื่อลูกค้า / บริษัทผู้ว่าจ้าง</label>
                      <input type="text" placeholder="ระบุชื่อบริษัท" value={costingCustomer} onChange={e => setCostingCustomer(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>ชื่อโครงการปฏิบัติงาน</label>
                      <input type="text" placeholder="ระบุรายละเอียดโครงการ" value={costingProjectName} onChange={e => setCostingProjectName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>ประเภทลักษณะหน้างาน</label>
                      <select value={costingSiteType} onChange={e => setCostingSiteType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <option value="สำนักงาน / ออฟฟิศ">สำนักงาน / ออฟฟิศ</option>
                        <option value="โรงงานอุตสาหกรรม / โกดัง">โรงงานอุตสาหกรรม / โกดัง</option>
                        <option value="โชว์รูมสินค้า / ห้างสรรพสินค้า">โชว์รูมสินค้า / ห้างสรรพสินค้า</option>
                        <option value="บ้านโครงการ / คอนโดหลังใหม่">บ้านโครงการ / คอนโดหลังใหม่</option>
                        <option value="กระจกอาคารสูงภายนอก">กระจกอาคารสูงภายนอก</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>ขนาดพื้นที่สำรวจ (ตร.ม.)</label>
                      <input type="number" min={1} value={costingAreaSqm} onChange={e => setCostingAreaSqm(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>เซลส์ผู้ดูแล / ประเมินทุน</label>
                      <select value={costingSalesperson} onChange={e => setCostingSalesperson(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                        <option value="เซลล์ สมปอง">เซลล์ สมปอง</option>
                        <option value="เซลล์ สมศรี">เซลล์ สมศรี</option>
                        <option value="เซลล์ สมศักดิ์">เซลล์ สมศักดิ์</option>
                        <option value="เซลล์ สมชาย">เซลล์ สมชาย</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: ลักษณะพิเศษหน้างาน */}
                <div style={{ backgroundColor: '#fdf2f8', padding: '16px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#db2777', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>2. ลักษณะความเสี่ยงและเงื่อนไขพิเศษ</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                      <input type="checkbox" checked={costingNightShift} onChange={e => setCostingNightShift(e.target.checked)} />
                      🌙 ปฏิบัติงานกลางคืน (Night Shift)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                      <input type="checkbox" checked={costingHighRise} onChange={e => setCostingHighRise(e.target.checked)} />
                      🧗 งานเสี่ยงภัยที่สูง (มีโรยตัว/นั่งร้าน)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                      <input type="checkbox" checked={costingHeavyStains} onChange={e => setCostingHeavyStains(e.target.checked)} />
                      🧱 มีคราบฝังแน่น (คราบปูน/คราบบิลด์อินหนา)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                      <input type="checkbox" checked={costingNoWaterElectricity} onChange={e => setCostingNoWaterElectricity(e.target.checked)} />
                      ⚠️ ไม่มีแหล่งจ่ายน้ำหรือไฟฟ้าในหน้างาน
                    </label>
                  </div>
                  <textarea 
                    placeholder="ระบุข้อกำหนดกรณีพิเศษรายตัวอื่นๆ (เช่น สเปคน้ำยา, กำหนดเวลาส่งมอบงานพิเศษ)..." 
                    value={costingSpecialNotes} 
                    onChange={e => setCostingSpecialNotes(e.target.value)} 
                    rows={2} 
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', resize: 'none', fontSize: '0.8rem' }} 
                  />
                </div>

                {/* Section 3: แผนกำลังพลและค่าแรงงาน (สวิตช์เปิด/ปิดแต่ละประเภท) */}
                <div style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>3. แผนกำลังพลและค่าแรงงาน</span>
                  
                  {/* ส่วนที่ 3.1: คิดตามรายวัน */}
                  <div style={{ backgroundColor: useDailyLabor ? '#f8fafc' : '#f9fafb', padding: '12px', borderRadius: '8px', border: `1px solid ${useDailyLabor ? '#e2e8f0' : '#e5e7eb'}`, opacity: useDailyLabor ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: useDailyLabor ? '8px' : '0' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>3.1 กำลังพลคิดตามรายวัน (Daily Labor)</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={useDailyLabor} onChange={e => setUseDailyLabor(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: useDailyLabor ? 'var(--primary-color)' : '#cbd5e1', borderRadius: '20px', transition: 'background-color 0.2s' }}>
                          <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: useDailyLabor ? '18px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}></span>
                        </span>
                      </label>
                    </div>
                    {useDailyLabor && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>หัวหน้าทีม/ช่างเทคนิค (คน)</label>
                            <input type="number" min={0} value={costingSupervisorCount} onChange={e => setCostingSupervisorCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>แม่บ้านปฏิบัติการ (คน)</label>
                            <input type="number" min={0} value={costingMaidCount} onChange={e => setCostingMaidCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ช่างพิเศษ/โรยตัว/ขัดพื้น (คน)</label>
                            <input type="number" min={0} value={costingTechnicianCount} onChange={e => setCostingTechnicianCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงช่าง/วัน (฿)</label>
                            <input type="number" value={costingSupervisorRate} onChange={e => setCostingSupervisorRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงแม่บ้าน/วัน (฿)</label>
                            <input type="number" value={costingMaidRate} onChange={e => setCostingMaidRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงช่างพิเศษ/วัน (฿)</label>
                            <input type="number" value={costingTechnicianRate} onChange={e => setCostingTechnicianRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>จำนวนวันทำงานจริง:</span>
                            <input type="number" min={1} value={costingDays} onChange={e => setCostingDays(e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วัน</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                            รวม: {calcDailyLabor.toLocaleString()} ฿
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ส่วนที่ 3.2: คิดแบบเหมาจ่าย */}
                  <div style={{ backgroundColor: useLumpSumLabor ? '#faf5ff' : '#f9fafb', padding: '12px', borderRadius: '8px', border: `1px solid ${useLumpSumLabor ? '#e9d5ff' : '#e5e7eb'}`, opacity: useLumpSumLabor ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: useLumpSumLabor ? '8px' : '0' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: useLumpSumLabor ? '#6b21a8' : 'var(--text-muted)' }}>3.2 กำลังพลคิดแบบเหมาจ่ายโครงการ (Lump-Sum)</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={useLumpSumLabor} onChange={e => setUseLumpSumLabor(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: useLumpSumLabor ? '#7c3aed' : '#cbd5e1', borderRadius: '20px', transition: 'background-color 0.2s' }}>
                          <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: useLumpSumLabor ? '18px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}></span>
                        </span>
                      </label>
                    </div>
                    {useLumpSumLabor && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>จำนวนคนรวม (คน)</label>
                          <input type="number" min={0} value={costingLumpSumLaborCount} onChange={e => setCostingLumpSumLaborCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>จำนวนวันทำงาน (วัน)</label>
                          <input type="number" min={1} value={costingLumpSumDays} onChange={e => setCostingLumpSumDays(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ยอดค่าแรงเหมาจ่ายรวมสุทธิ (฿)</label>
                          <input type="number" min={0} value={costingLumpSumLaborCost} onChange={e => setCostingLumpSumLaborCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ส่วนที่ 3.3: ค่าแรงนอก / ซับคอนแทรค */}
                  <div style={{ backgroundColor: useOutsourceLabor ? '#fff5f5' : '#f9fafb', padding: '12px', borderRadius: '8px', border: `1px solid ${useOutsourceLabor ? '#fee2e2' : '#e5e7eb'}`, opacity: useOutsourceLabor ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, maxWidth: '280px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: useOutsourceLabor ? '#b91c1c' : 'var(--text-muted)', display: 'block' }}>3.3 ค่าแรงนอก / ซับคอนแทรค (Outsource)</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>จ้างเหมาทีมช่างภายนอกเข้าช่วยเคสเฉพาะ</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={useOutsourceLabor} onChange={e => setUseOutsourceLabor(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: useOutsourceLabor ? '#dc2626' : '#cbd5e1', borderRadius: '20px', transition: 'background-color 0.2s' }}>
                            <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: useOutsourceLabor ? '18px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}></span>
                          </span>
                        </label>
                      </div>
                    </div>
                    {useOutsourceLabor && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px', marginTop: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>หัวหน้าทีม/ช่างเทคนิค (คน)</label>
                            <input type="number" min={0} value={costingOutsourceSupervisorCount} onChange={e => setCostingOutsourceSupervisorCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>แม่บ้านปฏิบัติการ (คน)</label>
                            <input type="number" min={0} value={costingOutsourceMaidCount} onChange={e => setCostingOutsourceMaidCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ช่างพิเศษ/โรยตัว/ขัดพื้น (คน)</label>
                            <input type="number" min={0} value={costingOutsourceTechnicianCount} onChange={e => setCostingOutsourceTechnicianCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงช่าง/วัน (฿)</label>
                            <input type="number" value={costingOutsourceSupervisorRate} onChange={e => setCostingOutsourceSupervisorRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงแม่บ้าน/วัน (฿)</label>
                            <input type="number" value={costingOutsourceMaidRate} onChange={e => setCostingOutsourceMaidRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าแรงช่างพิเศษ/วัน (฿)</label>
                            <input type="number" value={costingOutsourceTechnicianRate} onChange={e => setCostingOutsourceTechnicianRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>จำนวนวันทำงานจริง:</span>
                            <input type="number" min={1} value={costingOutsourceDays} onChange={e => setCostingOutsourceDays(e.target.value)} style={{ width: '60px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วัน</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b91c1c' }}>
                            รวม: {calcOutsourceLabor.toLocaleString()} ฿
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 4: ยานพาหนะ & จัดส่งทีมงานแบบระบุ คัน คันละ วันละ */}
                <div style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>4. ยานพาหนะ &amp; จัดส่งทีมงาน</span>
                    <button type="button" onClick={() => {
                      setCostingVehicles([...costingVehicles, { id: Date.now(), type: 'รถกระบะขนอุปกรณ์', rate: 1500, count: 1, days: 1 }]);
                    }} style={{ padding: '4px 8px', border: '1px solid #bae6fd', borderRadius: '6px', backgroundColor: '#e0f2fe', color: 'var(--primary-dark)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      + เพิ่มรถ/การเดินทาง
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {costingVehicles.map((vehicle, idx) => (
                      <div key={vehicle.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="ประเภทรถ/รายละเอียด" 
                          value={vehicle.type} 
                          onChange={e => {
                            const updated = costingVehicles.map((v, i) => i === idx ? { ...v, type: e.target.value } : v);
                            setCostingVehicles(updated);
                          }} 
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} 
                        />
                        <input 
                          type="number" 
                          placeholder="คันละ/วันละ (฿)" 
                          value={vehicle.rate} 
                          onChange={e => {
                            const updated = costingVehicles.map((v, i) => i === idx ? { ...v, rate: Number(e.target.value) } : v);
                            setCostingVehicles(updated);
                          }} 
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} 
                        />
                        <input 
                          type="number" 
                          placeholder="จำนวนคัน" 
                          value={vehicle.count} 
                          onChange={e => {
                            const updated = costingVehicles.map((v, i) => i === idx ? { ...v, count: Number(e.target.value) } : v);
                            setCostingVehicles(updated);
                          }} 
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} 
                        />
                        <input 
                          type="number" 
                          placeholder="จำนวนวัน" 
                          value={vehicle.days} 
                          onChange={e => {
                            const updated = costingVehicles.map((v, i) => i === idx ? { ...v, days: Number(e.target.value) } : v);
                            setCostingVehicles(updated);
                          }} 
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} 
                        />
                        <button 
                          type="button" 
                          disabled={costingVehicles.length <= 1}
                          onClick={() => {
                            setCostingVehicles(costingVehicles.filter((_, i) => i !== idx));
                          }} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '8px' }}>
                    รวมค่าเดินทางทั้งหมด: {calculatedVehicleCost.toLocaleString()} ฿
                  </div>
                </div>

                {/* Section 5: เคมีภัณฑ์ และเครื่องมือหนัก */}
                <div style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>5. เคมีภัณฑ์ และเช่าอุปกรณ์หนัก</span>
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                      <button type="button" onClick={() => setCostingSuppliesType('perSqm')} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: costingSuppliesType === 'perSqm' ? 'white' : 'transparent', boxShadow: costingSuppliesType === 'perSqm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: costingSuppliesType === 'perSqm' ? 'var(--primary-dark)' : 'var(--text-muted)' }}>คิดต่อ ตร.ม.</button>
                      <button type="button" onClick={() => setCostingSuppliesType('lumpSum')} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: costingSuppliesType === 'lumpSum' ? 'white' : 'transparent', boxShadow: costingSuppliesType === 'lumpSum' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: costingSuppliesType === 'lumpSum' ? 'var(--primary-dark)' : 'var(--text-muted)' }}>ระบุยอดเหมา</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าเช่ารถกระเช้า / Boom Lift / นั่งร้าน (฿)</label>
                      <input type="number" value={costingBoomLiftCost} onChange={e => setCostingBoomLiftCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      {costingSuppliesType === 'perSqm' ? (
                        <>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าน้ำยาทั่วไปต่อ ตร.ม. (฿/ตร.ม.)</label>
                          <input type="number" step="0.1" value={costingSuppliesRate} onChange={e => setCostingSuppliesRate(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            คำนวณ: {costingAreaSqm} ตร.ม. * {costingSuppliesRate} บ. = {(costingAreaSqm * costingSuppliesRate).toLocaleString()} ฿
                          </div>
                        </>
                      ) : (
                        <>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าน้ำยาทั่วไปรวมเหมาจ่าย (฿)</label>
                          <input type="number" value={costingSuppliesCost} onChange={e => setCostingSuppliesCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าน้ำยาเฉพาะทาง (คราบฝังลึก/เคลือบเงา) (฿)</label>
                      <input type="number" value={costingSpecialChemicals} onChange={e => setCostingSpecialChemicals(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่ากันฝุ่นเซฟการ์ดหน้างาน (฿)</label>
                      <input type="number" value={costingSafeguardCost} onChange={e => setCostingSafeguardCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าเสื่อมเครื่องขัด/เครื่องมือ (฿)</label>
                      <input type="number" value={costingToolsCost} onChange={e => setCostingToolsCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>ค่าความปลอดภัย PPE/ชี้แจงเซฟตี้ (฿)</label>
                      <input type="number" value={costingSafetyCost} onChange={e => setCostingSafetyCost(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* ฝั่งขวา: สรุปงบและคำนวณราคาขายอัตโนมัติ */}
              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
                <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', color: 'var(--primary-dark)' }}>
                  📊 สรุปต้นทุนประเมินหน้างาน
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  {useDailyLabor && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ค่าแรงรายวัน:</span>
                      <span>{calcDailyLabor.toLocaleString()} ฿</span>
                    </div>
                  )}
                  {useLumpSumLabor && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ค่าแรงเหมาจ่าย:</span>
                      <span>{calcLumpSumLabor.toLocaleString()} ฿</span>
                    </div>
                  )}
                  {useOutsourceLabor && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ค่าแรงนอก/ซับคอนแทรค:</span>
                      <span style={{ fontWeight: '600', color: '#b91c1c' }}>{calcOutsourceLabor.toLocaleString()} ฿</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่ารถขนส่งเดินทางรวม:</span>
                    <span>{calculatedVehicleCost.toLocaleString()} ฿</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่าน้ำยาและเคมีภัณฑ์รวม:</span>
                    <span>{(Number(costingSuppliesCost) + Number(costingSpecialChemicals)).toLocaleString()} ฿</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่าเสื่อมเครื่องมือ &amp; เซฟการ์ด:</span>
                    <span>{(Number(costingToolsCost) + Number(costingSafeguardCost)).toLocaleString()} ฿</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่าตรวจเซฟตี้ &amp; จิปาถะ:</span>
                    <span>{(Number(costingSafetyCost) + Number(costingOtherCost)).toLocaleString()} ฿</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    <span>ต้นทุนตรงรวม (Direct Cost):</span>
                    <span>{calculatedDirectCost.toLocaleString()} ฿</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>ต้นทุนเฉลี่ยต่อ ตร.ม.:</span>
                    <span>{costingAreaSqm > 0 ? (calculatedDirectCost / costingAreaSqm).toFixed(1) : 0} ฿ / ตร.ม.</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    เป้าหมายอัตรากำไร (Margin): {costingMarkupPercent}%
                  </label>
                  <input 
                    type="range" 
                    min={15} 
                    max={75} 
                    value={costingMarkupPercent} 
                    onChange={e => setCostingMarkupPercent(Number(e.target.value))} 
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-color)' }} 
                  />
                </div>

                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#15803d', marginBottom: '4px' }}>
                    <span>ราคาเสนอขายเป้าหมาย:</span>
                    <span>กำไรขั้นต้นที่จะได้รับ:</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, fontWeight: 'bold', color: '#16a34a', fontSize: '1.4rem' }}>
                      {Math.round(calculatedSellPrice).toLocaleString()} ฿
                    </h3>
                    <span style={{ fontWeight: 'bold', color: '#15803d', fontSize: '0.9rem' }}>
                      +{Math.round(calculatedProfit).toLocaleString()} ฿
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '6px', textAlign: 'right' }}>
                    เฉลี่ยตารางเมตรละ {costingAreaSqm > 0 ? Math.round(calculatedSellPrice / costingAreaSqm).toLocaleString() : 0} ฿/ตร.ม.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setIsCostingModalOpen(false); setEditingSurveyId(null); }} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                    ยกเลิก
                  </button>
                  <button type="submit" style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                    {editingSurveyId ? 'บันทึกการแก้ไข' : 'บันทึก & ออกใบเสนอราคา'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Modal จองคิวปฏิบัติการเมื่อขยับ 2 → 3 */}
      {isOpsBookModalOpen && opsBookDeal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '560px', maxHeight: '92vh', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfdf5' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#047857' }}>จองตารางงานฝ่ายปฏิบัติการ</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ย้ายดีลจาก “เสนอราคาแล้ว” → “อนุมัติ/รอคิว”
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsOpsBookModalOpen(false); setOpsBookDeal(null); setOpsBookContext(null); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{opsBookDeal.customer}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opsBookContext?.projectName || opsBookDeal.projectName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', marginTop: '6px' }}>{opsBookDeal.id}</div>
                {opsBookContext?.address && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                    📍 {opsBookContext.address}
                  </div>
                )}
                {(opsBookContext?.siteType || opsBookContext?.areaSqm) && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {opsBookContext.siteType ? `🏢 ${opsBookContext.siteType}` : ''}
                    {opsBookContext.siteType && opsBookContext.areaSqm ? ' · ' : ''}
                    {opsBookContext.areaSqm ? `${Number(opsBookContext.areaSqm).toLocaleString()} ตร.ม.` : ''}
                  </div>
                )}
                {(opsBookContext?.flags?.nightShift || opsBookContext?.flags?.highRise || opsBookContext?.flags?.heavyStains || opsBookContext?.flags?.noWaterElectricity) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {opsBookContext.flags.nightShift && <span style={{ fontSize: '0.72rem', background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '999px' }}>กลางคืน</span>}
                    {opsBookContext.flags.highRise && <span style={{ fontSize: '0.72rem', background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '999px' }}>งานสูง</span>}
                    {opsBookContext.flags.heavyStains && <span style={{ fontSize: '0.72rem', background: '#fef2f2', color: '#b91c1c', padding: '2px 8px', borderRadius: '999px' }}>คราบฝังแน่น</span>}
                    {opsBookContext.flags.noWaterElectricity && <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#475569', padding: '2px 8px', borderRadius: '999px' }}>ไม่มีน้ำ/ไฟ</span>}
                  </div>
                )}
                {opsBookContext?.specialNotes && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px' }}>
                    📌 {opsBookContext.specialNotes}
                  </div>
                )}
              </div>

              {(opsBookContext?.contacts?.length > 0 || opsBookContext?.phone) && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>ผู้ติดต่อหน้างาน</div>
                  {(opsBookContext.contacts?.length ? opsBookContext.contacts : [{ name: 'ผู้ติดต่อ', phone: opsBookContext.phone }]).map((c, idx) => (
                    <div key={`${c.name || 'c'}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.85rem', marginBottom: idx === (opsBookContext.contacts?.length || 1) - 1 ? 0 : '6px' }}>
                      <span>{c.name || 'ไม่ระบุชื่อ'}</span>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>📞 {c.phone}</a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {opsBookContext?.mapUrl ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px' }}>โลเคชัน Google Maps</div>
                  <a
                    href={opsBookContext.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', wordBreak: 'break-all' }}
                  >
                    {opsBookContext.mapUrl}
                  </a>
                </div>
              ) : null}

              {opsBookContext?.photos?.length > 0 && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>รูปสำรวจหน้างาน ({opsBookContext.photos.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '8px' }}>
                    {opsBookContext.photos.map((photo, index) => (
                      <div key={index} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f1f5f9' }}>
                        {typeof photo === 'string' && (photo.startsWith('data:image/') || photo.startsWith('http') || photo.startsWith('/')) ? (
                          <img src={photo} alt={`survey-${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>รูป {index + 1}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const mp = buildManpowerFromSurvey(opsBookContext?.survey, Number(opsBookDays) || 1);
                if (!mp || (!mp.daily && !mp.lumpSum && !mp.outsource)) {
                  return (
                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ยังไม่พบข้อมูลกำลังพลจากใบประมาณ — จะใช้ 1 คน/วัน เป็นค่าเริ่มต้นในใบส่งงาน
                    </div>
                  );
                }
                return (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>กำลังพลจากใบประมาณ (โชว์ในแอป)</div>

                    {mp.daily && (
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '4px' }}>3.1 ค่าแรงรายวัน</div>
                        <div>หัวหน้า/ช่าง: {mp.daily.supervisors} คน · แม่บ้าน: {mp.daily.maids} คน · ช่างพิเศษ: {mp.daily.technicians} คน</div>
                        <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>รวม {mp.daily.total} คน · {mp.daily.days} วัน</div>
                      </div>
                    )}

                    {mp.lumpSum && (
                      <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: '4px' }}>3.2 เหมาจ่ายโครงการ</div>
                        <div>จำนวนคน: {mp.lumpSum.total} คน · จำนวนวัน: {mp.lumpSum.days} วัน</div>
                      </div>
                    )}

                    {mp.outsource && (
                      <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>3.3 ค่าแรงนอก / ซับคอนแทรค</div>
                        <div>หัวหน้า/ช่าง: {mp.outsource.supervisors} คน · แม่บ้าน: {mp.outsource.maids} คน · ช่างพิเศษ: {mp.outsource.technicians} คน</div>
                        <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>รวม {mp.outsource.total} คน · {mp.outsource.days} วัน</div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '0.85rem' }}>
                      <div>
                        รวมกำลังพลที่ใช้งาน:{' '}
                        <strong>
                          {[
                            mp.daily ? `3.1=${mp.daily.total}` : null,
                            mp.lumpSum ? `3.2=${mp.lumpSum.total}` : null,
                            mp.outsource ? `3.3=${mp.outsource.total}` : null,
                          ]
                            .filter(Boolean)
                            .join(' + ') || '0'}
                          {' '}→ {mp.totalPeople} คน
                        </strong>
                      </div>
                      <div style={{ marginTop: '4px', color: '#047857', fontWeight: 700 }}>
                        คนประมาณการสำหรับใบส่งงาน: {mp.estimatedPeoplePerDay} คน/วัน
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {mp.estimateMethod === 'sum_same_days'
                          ? `สูตร: วันเท่ากัน (${mp.maxDays} วัน) → รวมคนทุกหัวข้อที่มีตัวเลข = ${mp.estimatedPeoplePerDay} คน/วัน`
                          : mp.estimateMethod === 'man_days_div_max'
                            ? `สูตร: วันไม่เท่ากัน → รวม(คน×วัน)=${mp.manDaysTotal} ÷ วันสูงสุด(${mp.maxDays}) = ${mp.estimatedPeoplePerDay} คน/วัน`
                            : 'สูตร: ไม่พบกำลังพลในใบประมาณ — ใช้ค่าเริ่มต้น 1 คน/วัน'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px' }}>วันเริ่มงาน *</label>
                <input
                  type="date"
                  value={opsBookDate}
                  onChange={(e) => setOpsBookDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px' }}>จำนวนวันทำงาน *</label>
                <input
                  type="number"
                  min={1}
                  value={opsBookDays}
                  onChange={(e) => setOpsBookDays(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ดึงจาก: {opsBookDaysSource || 'ใบประมาณต้นทุน'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px' }}>ทีมปฏิบัติการ</label>
                <select
                  value={opsBookTeam}
                  onChange={(e) => setOpsBookTeam(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', backgroundColor: 'white' }}
                >
                  <option>ทีมปฏิบัติการ A</option>
                  <option>ทีมปฏิบัติการ B</option>
                  <option>ทีมปฏิบัติการ C</option>
                  <option>ทีมปฏิบัติการ D</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setIsOpsBookModalOpen(false); setOpsBookDeal(null); setOpsBookContext(null); }}
                  style={{ flex: 1, padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOpsBook}
                  style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  ยืนยันจองคิว &amp; ย้ายสเตจ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
