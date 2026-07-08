'use client';
import { useState, useEffect } from 'react';
import { Columns, Users, CheckCircle, DollarSign, AlertCircle, Calendar as CalendarIcon, ArrowRight, Search, Plus, PhoneCall, MessageSquare, Briefcase, ChevronRight, TrendingUp, Clock, Eye, Trash2, ChevronLeft, X } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchData, saveData, deleteData, fetchSetting } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { useToast } from '@/components/Toast';

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

export default function CRMPage() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('bigcleaning');
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [customerLogs, setCustomerLogs] = useState([]);
  const [surveySchedules, setSurveySchedules] = useState([]); // นัดหมายสำรวจหน้างาน
  const [searchQuery, setSearchQuery] = useState('');
  
  // สำหรับปฏิทินสำรวจหน้างาน
  const [currentDate, setCurrentDate] = useState(new Date());

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
        const allSurveys = await fetchData('AllSurveys');
        setAllSurveys(allSurveys);
        const executionReports = await loadSettingJson('sangkan_execution_reports', {});
        const billingApproved = await loadSettingJson('sangkan_billing_approved', {});

        // แปลงสถานะใบเสนอราคามาจับคู่กับ CRM Stage
        const mappedDeals = qs.map((q, idx) => {
          let stage = 'quoted';
          if (q.status === 'approved') {
            stage = 'approved';
          }
          
          // ตรวจเช็คสถานะการปฏิบัติงาน
          const execSaved = executionReports[q.id];
          if (execSaved) {
            if (execSaved.status === 'completed') {
              stage = 'delivered';
            } else if (execSaved.status === 'in-progress') {
              stage = 'ops';
            }
          }

          if (billingApproved[q.id]) {
            stage = 'invoiced';
          }

          // คืนค่าสถานะที่แอดมินหรือเซลส์กดย้ายแมนนวล
          if (savedCustomStages[q.id]) {
            stage = savedCustomStages[q.id];
          }

          // เชื่อมข้อมูลประเมินหน้างานกรณีพิเศษ
          const matchedSurvey = allSurveys.find(s => s.customer === q.customer);
          const evaluation = matchedSurvey ? {
            nightShift: matchedSurvey.nightShift,
            highRise: matchedSurvey.highRise,
            heavyStains: matchedSurvey.heavyStains,
            noWaterElectricity: matchedSurvey.noWaterElectricity,
            specialNotes: matchedSurvey.specialNotes
          } : null;

          return {
            id: q.id,
            customer: q.customer,
            projectName: q.projectName || 'โครงการ Big Cleaning',
            total: q.total || 0,
            date: q.date,
            stage: stage,
            serviceType: inferServiceType(q),
            evaluation: evaluation
          };
        });

        // โหลดนัดหมายสำรวจหน้างาน (Survey Schedules)
        let parsedSurveys = await fetchData('SurveySchedules');
        if (!parsedSurveys.length) {
          const mockSurveys = [
            { id: 1, date: '2026-07-08', time: '10:30', customer: 'บจก. มิตซู ไทยแลนด์', assigned: 'เซลล์ สมปอง', note: 'สำรวจโรงงานล้างทำความสะอาดพื้นโรงรถและโกดังเก็บสินค้า', serviceType: 'bigcleaning' },
            { id: 2, date: '2026-07-10', time: '14:00', customer: 'คอนโดมิเนียม รอยัล ปาร์ค', assigned: 'เซลล์ สมศรี', note: 'ประเมินขัดพื้นหินอ่อนหน้าโถงล็อบบี้และเช็ดกระจกชั้นลอย', serviceType: 'bigcleaning' }
          ];
          for (const survey of mockSurveys) {
            await saveData('SurveySchedules', { ...survey, id: String(survey.id) });
          }
          parsedSurveys = mockSurveys;
        }
        setSurveySchedules(parsedSurveys);

        // ดึงรายการนัดหมายสำรวจหน้างานที่บันทึกไว้มารวมกันในกระดานบอร์ด (Stage 1: survey)
        parsedSurveys.forEach(survey => {
          const isQuoted = qs.some(q => q.customer === survey.customer);
          if (!isQuoted) {
            let surveyStage = 'survey';
            // ค้นหาแบบประเมินและกรณีพิเศษ
            const matchedSurvey = allSurveys.find(s => s.customer === survey.customer);
            
            // หากประเมินต้นทุนเรียบร้อยแล้ว ให้แสดงเป็นด่าน 1.5 โดยอัตโนมัติ
            if (matchedSurvey) {
              surveyStage = 'costed';
            }

            if (savedCustomStages[`survey_${survey.id}`]) {
              surveyStage = savedCustomStages[`survey_${survey.id}`];
            }

            // ค้นหาและแนบรายละเอียดกรณีพิเศษเพิ่มเติม
            const evaluation = matchedSurvey ? {
              nightShift: matchedSurvey.nightShift,
              highRise: matchedSurvey.highRise,
              heavyStains: matchedSurvey.heavyStains,
              noWaterElectricity: matchedSurvey.noWaterElectricity,
              specialNotes: matchedSurvey.specialNotes
            } : null;

            mappedDeals.unshift({
              id: `survey_${survey.id}`,
              customer: survey.customer,
              projectName: survey.note || 'สำรวจหน้างาน Big Cleaning',
              total: matchedSurvey ? (matchedSurvey.calculatedPrice || 0) : 0,
              date: survey.date,
              stage: surveyStage,
              serviceType: survey.serviceType || 'bigcleaning',
              evaluation: evaluation
            });
          }
        });

        // ดึงใบประเมินต้นทุนล่าสุดที่ยังไม่ผูกกับใบเสนอราคา
        const surveyObj = await loadSettingJson('sangkan_current_survey', null);
        if (surveyObj) {
          const isQuoted = qs.some(q => q.customer === surveyObj.customer);
          const isAlreadyAdded = parsedSurveys.some(s => s.customer === surveyObj.customer);
          if (!isQuoted && !isAlreadyAdded) {
            let surveyStage = 'costed'; // ประเมินต้นทุนเรียบร้อยแล้ว
            if (savedCustomStages[surveyObj.surveyId]) {
              surveyStage = savedCustomStages[surveyObj.surveyId];
            }
            mappedDeals.unshift({
              id: surveyObj.surveyId,
              customer: surveyObj.customer,
              projectName: surveyObj.projectName,
              total: surveyObj.calculatedPrice || 0,
              date: new Date().toISOString().split('T')[0],
              stage: surveyStage,
              serviceType: surveyObj.serviceType || 'bigcleaning',
              evaluation: {
                nightShift: surveyObj.nightShift,
                highRise: surveyObj.highRise,
                heavyStains: surveyObj.heavyStains,
                noWaterElectricity: surveyObj.noWaterElectricity,
                specialNotes: surveyObj.specialNotes
              }
            });
          }
        }

        setDeals(mappedDeals);

        // โหลดบันทึกปฏิสัมพันธ์ลูกค้า (Customer Logs)
        let logs = await fetchData('CrmLogs');
        if (!logs.length) {
          const mockLogs = [
            { id: 1, date: '2026-07-06', customer: 'โรงแรม แกรนด์ พาราดลย์', type: 'โทรศัพท์', text: 'โทรนำเสนอแพ็กเกจ Big Cleaning โถงรับแขกหน้าโรงแรม', serviceType: 'bigcleaning' },
            { id: 2, date: '2026-07-05', customer: 'บจก. อัลฟ่า เทค', type: 'อีเมล', text: 'ส่งรายละเอียดขอบเขตการเช็ดกระจกภายนอกที่นั่งร้านสูง', serviceType: 'bigcleaning' }
          ];
          for (const log of mockLogs) {
            await saveData('CrmLogs', { ...log, id: String(log.id) });
          }
          logs = mockLogs;
        }
        setCustomerLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

    // หากย้ายจากประเมินต้นทุนเสร็จแล้ว (1.5) ไปด่านเสนอราคาแล้ว (2) ให้นำทางไปสร้างใบเสนอราคาพร้อมข้อมูลต้นทุนทันที
    if (deal && deal.stage === 'costed' && nextStage === 'quoted') {
      if (deal.serviceType === 'recurring') {
        showToast('📄 กำลังนำทางไปหน้าสร้างใบเสนอราคาแม่บ้านประจำ...', 'info');
        setTimeout(() => {
          window.location.href = '/quotation/create?type=recurring';
        }, 800);
        return;
      }

      showToast('📄 กำลังนำทางไปหน้าเขียนใบเสนอราคาจากข้อมูลประเมินต้นทุนนี้...', 'info');
      const allSurveysForQuote = await fetchData('AllSurveys');
      const matched = allSurveysForQuote.find(s => s.customer === deal.customer);
      if (matched) {
        await saveSettingJson('sangkan_current_survey', matched);
      }
      setTimeout(() => {
        const type = deal.serviceType === 'recurring' ? 'recurring' : 'bigcleaning';
        window.location.href = `/quotation/create?fromSurvey=true&type=${type}`;
      }, 1000);
      return;
    }

    // 1. อัปเดต state
    const updated = deals.map(d => {
      if (d.id === dealId) {
        return { ...d, stage: nextStage };
      }
      return d;
    });
    setDeals(updated);

    // 2. บันทึกลง SQLite เพื่อใช้โหลดใหม่
    const savedCustomStages = await loadSettingJson('sangkan_crm_deal_stages', {});
    savedCustomStages[dealId] = nextStage;
    await saveSettingJson('sangkan_crm_deal_stages', savedCustomStages);

    // 3. ปรับสถานะใบเสนอราคาจริงในระบบหากย้ายสถานะที่เกี่ยวข้อง
    if (dealId.startsWith('QT')) {
      const { saveQuotation, fetchQuotations: fetchQs } = await import('@/utils/api');
      const qs = await fetchQs();
      const quote = qs.find(q => q.id === dealId);
      if (quote) {
        if (nextStage === 'approved') {
          quote.status = 'approved';
          await saveQuotation(quote);
        } else if (nextStage === 'quoted') {
          quote.status = 'pending';
          await saveQuotation(quote);
        }
      }
    }

    showToast(`ย้ายสเตจของดีล ${dealId} สำเร็จแล้ว`, 'success');
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

    const surveyId = 'SV' + Date.now();
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
      linkedQuotationId: 'รอดำเนินการ',
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
      // ข้อมูลค่าแรงนอก
      outsourceLaborCost: Number(costingOutsourceLaborCost),
      outsourceLaborTotal,
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
    const savedAll = [...allSurveys, surveyData];
    setAllSurveys(savedAll);

    // 3. ปิด Modal
    setIsCostingModalOpen(false);

    // 4. รีเฟรชหน้าเพื่อให้กระดานอัปเดตสเตจใหม่ (1.5 ประเมินต้นทุนแล้ว)
    showToast('บันทึกราคาทุนและผลประเมินหน้างานสำเร็จ! ดีลนี้ถูกเลื่อนเป็น "ประเมินต้นทุนแล้ว"', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const blankDays = Array(firstDay).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const tabDeals = deals.filter(d => (d.serviceType || 'bigcleaning') === activeTab);
  const tabSurveys = surveySchedules.filter(s => (s.serviceType || 'bigcleaning') === activeTab);
  const tabLogs = customerLogs.filter(l => (l.serviceType || 'bigcleaning') === activeTab);
  const tabArchivedSurveys = allSurveys.filter(s => (s.serviceType || 'bigcleaning') === activeTab);

  // กรองนัดหมายสำรวจรายวัน
  const getSurveysForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return tabSurveys.filter(s => s.date === dateStr);
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
            border: 'none', cursor: 'pointer',
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
            border: 'none', cursor: 'pointer',
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
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: st.color }}>{st.label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: st.color, backgroundColor: 'white', padding: '2px 6px', borderRadius: '20px' }}>
                  {stageDeals.length}
                </span>
              </div>

              {/* รายการดีลในแต่ละสเตจ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                {stageDeals.map(d => (
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{d.total.toLocaleString()} ฿</span>
                      
                      {/* ปุ่มเลื่อนสเตจแบบย้อนกลับ/ไปข้างหน้า */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {stages.findIndex(s => s.key === st.key) > 0 && (
                          <button 
                            onClick={() => {
                              const currentIdx = stages.findIndex(s => s.key === st.key);
                              moveDeal(d.id, stages[currentIdx - 1].key);
                            }}
                            style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="ย้อนขั้นตอนดีลขายก่อนหน้า"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ตารางปฏิทินและรายชื่อนัดหมายสำรวจหน้างาน */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
        
        {/* ปฏิทินซ้าย */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} /> {activeTab === 'bigcleaning' ? 'ปฏิทินคิวนัดสำรวจหน้างาน' : 'ปฏิทินคิวนัดพบลูกค้า'} ({monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={prevMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* ตารางวันปฏิทิน */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {blankDays.map((_, i) => (
              <div key={`blank-${i}`} style={{ height: '75px', backgroundColor: '#f8fafc', borderRadius: '6px' }}></div>
            ))}
            {daysArray.map(day => {
              const daySurveys = getSurveysForDay(day);

              return (
                <div key={day} style={{ height: '75px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'white' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{day}</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', overflowY: 'auto', flex: 1 }}>
                    {daySurveys.map(s => (
                      <div 
                        key={s.id}
                        title={`${s.customer} - ${s.assigned}`}
                        style={{ 
                          fontSize: '0.65rem', 
                          padding: '1px 3px', 
                          borderRadius: '3px', 
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {s.time} {s.customer}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ข้อมูลการ์ดลิสต์นัดหมายขวา */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxHeight: '430px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
            {activeTab === 'bigcleaning' ? 'รายละเอียดคิวนัดสำรวจหน้างาน' : 'รายละเอียดคิวนัดพบลูกค้า'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tabSurveys.length > 0 ? (
              tabSurveys.map(survey => (
                <div key={survey.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', backgroundColor: '#f8fafc' }}>
                  <button onClick={() => handleDeleteSurvey(survey.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
                      {survey.assigned}
                    </span>
                  </div>
                  <h4 style={{ margin: '4px 0 2px 0', fontSize: '0.85rem', fontWeight: 'bold' }}>{survey.customer}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{survey.note}</p>
                  
                  {/* แสดงรายชื่อผู้ติดต่อประสานงาน */}
                  {survey.contacts && survey.contacts.length > 0 && (
                    <div style={{ marginTop: '4px', backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>👥 ผู้ติดต่อประสานงาน ({survey.contacts.length}):</span>
                      {survey.contacts.map((c, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                          <span>• {c.name || '-'}</span>
                          {c.phone && <a href={`tel:${c.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>📞 {c.phone}</a>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                    <span>📅 {survey.date}</span>
                    <span>⏰ {survey.time} น.</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '20px 0' }}>
                {activeTab === 'bigcleaning' ? 'ไม่มีนัดหมายลงพื้นที่สำรวจหน้างาน' : 'ไม่มีนัดหมายพบลูกค้า'}
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
                      <button 
                        type="button"
                        onClick={() => setSelectedViewSurvey(survey)}
                        style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                      >
                        🔍 ดูใบประเมิน
                      </button>
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
                      จำนวนคน: <strong>{selectedViewSurvey.lumpSumLaborCount} คน</strong> | ยอดเหมารวม: <strong>{Number(selectedViewSurvey.lumpSumLaborCost || 0).toLocaleString()} ฿</strong>
                    </p>
                  </div>
                )}

                {/* ค่าแรงนอก */}
                {selectedViewSurvey.useOutsourceLabor && (
                  <div style={{ backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#b91c1c', display: 'block', marginBottom: '6px' }}>🔧 ค่าแรงนอก/ซับคอนแทรค (Outsource)</span>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
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
                📋 ใบสำรวจหน้างาน &amp; แบบคำนวณต้นทุนประเมินโครงการละเอียด (Detailed Costing Worksheet)
              </h3>
              <button onClick={() => setIsCostingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)' }}>✕</button>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>จำนวนคนรวม (คน)</label>
                          <input type="number" min={0} value={costingLumpSumLaborCount} onChange={e => setCostingLumpSumLaborCount(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }} />
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
                  <button type="button" onClick={() => setIsCostingModalOpen(false)} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                    ยกเลิก
                  </button>
                  <button type="submit" style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                    บันทึก &amp; ออกใบเสนอราคา
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
