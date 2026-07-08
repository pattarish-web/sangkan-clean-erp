'use client';
import { useState, useEffect } from 'react';
import { Calculator, FileText, Printer, Save, Download, Plus, Trash2, Building, Send, CreditCard, ArrowLeft, Camera, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { saveQuotation, fetchQuotations, fetchCustomers, saveData, fetchSetting } from '@/utils/api';
import { loadSettingJson } from '@/lib/app-storage';
import { useToast } from '@/components/Toast';

export default function QuotationPage() {
  const showToast = useToast();
  const [quotationType, setQuotationType] = useState('bigcleaning');

  const [otherProductName, setOtherProductName] = useState('ผลิตภัณฑ์น้ำยาล้างพื้นผิวสูตรเข้มข้น');
  const [otherProductUnit, setOtherProductUnit] = useState('แกลลอน');
  const [otherProductQty, setOtherProductQty] = useState(10);
  const [otherProductPrice, setOtherProductPrice] = useState(120);

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const edit = params.get('edit');
    const id = params.get('id');

    async function loadData() {
      // โหลดรายชื่อลูกค้าจาก LocalStorage
      try {
        const customers = await fetchCustomers();
        setDbCustomers(customers);
      } catch (e) {
        console.error('Error fetching customers:', e);
      }

      if (edit === 'true' && id) {
        setIsEditMode(true);
        setDocNo(id);

        try {
          const allData = await fetchQuotations();
          const found = allData.find(q => q.id === id);

          if (found) {
            setProjectName(found.projectName || '');
            setCustomerName(found.customer || '');
            setCustomerAddress(found.address || '');
            setCustomerTaxId(found.taxId || '');
            setItems(found.items || []);
            setDocDate(found.date || '2026-07-03');
            setNote(found.note || found.remarks || '1. การชำระเงิน: มัดจำ 50% ก่อนเริ่มงาน และชำระส่วนที่เหลือเมื่องานเสร็จสิ้น\n2. กรุณาชำระเงินภายใน 7 วันหลังได้รับเอกสารวางบิล');
            setSitePhotos(found.sitePhotos || []);
            return;
          }
        } catch (e) {
          console.error('Error fetching quotation:', e);
        }
      } else {
        // โหมดสร้างใหม่: ปรับให้ดึงรันเลขเอกสารล่าสุดต่อจากใบสุดท้าย
        const today = new Date().toISOString().split('T')[0];
        setDocDate(today);
        try {
          const allData = await fetchQuotations();
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const prefix = `QT${year}${month}`;
          
          const thisMonthNums = allData
            .map(q => q.id)
            .filter(id => id && id.startsWith(prefix))
            .map(id => parseInt(id.replace(prefix, ''), 10))
            .filter(n => !isNaN(n));

          if (thisMonthNums.length > 0) {
            const max = Math.max(...thisMonthNums);
            const next = max + 1;
            setDocNo(`${prefix}${next.toString().padStart(3, '0')}`);
          } else {
            setDocNo(`${prefix}001`);
          }
        } catch (e) {
          console.error('Error running doc number:', e);
        }

        const fromSurvey = params.get('fromSurvey');
        if (fromSurvey === 'true') {
          const survey = await loadSettingJson('sangkan_current_survey', null);
          if (survey) {
            try {
              if (survey.surveyId) setLinkedSurveyId(survey.surveyId);
              setCustomerName(survey.customer || '');
              setProjectName(survey.projectName || '');
              if (survey.salesperson) setSalesPerson(survey.salesperson);
              setQuotationType('bigcleaning');
              
              // สร้างรายละเอียดสโคปงาน (Scope of Work) แบบละเอียด
              const scopeLines = [];
              scopeLines.push(`บริการทำความสะอาดครั้งใหญ่ (Big Cleaning) โครงการ: ${survey.projectName || 'ตามที่ระบุ'}`);
              scopeLines.push(`สถานที่ปฏิบัติงาน: ${survey.siteType || 'ทั่วไป'} พื้นที่ประมาณ ${survey.areaSqm || 0} ตร.ม.`);
              scopeLines.push(`ระยะเวลาปฏิบัติงาน: ${survey.days || 1} วันทำการ`);
              scopeLines.push('');
              scopeLines.push('ขอบเขตงาน (Scope of Work):');
              scopeLines.push('1. ทำความสะอาดพื้นผิวทุกประเภท (กระเบื้อง, หินอ่อน, ไม้, คอนกรีต, พรม)');
              scopeLines.push('2. เช็ดทำความสะอาดกระจก หน้าต่าง ผนัง และเพดาน');
              scopeLines.push('3. ทำความสะอาดห้องน้ำ สุขภัณฑ์ทั้งหมด');
              scopeLines.push('4. เก็บเศษขยะ ฝุ่นผง คราบสกปรกทั่วไปและจุดสะสม');
              scopeLines.push('5. ขัดล้างคราบฝังแน่นตามจุดที่ระบุ (ถ้ามี)');

              // เงื่อนไขพิเศษจากใบสำรวจ
              const conditions = [];
              if (survey.nightShift) conditions.push('ปฏิบัติงานกลางคืน (Night Shift)');
              if (survey.highRise) conditions.push('งานที่สูง/กระจกภายนอกอาคาร (มีโรยตัว/นั่งร้าน)');
              if (survey.heavyStains) conditions.push('มีคราบฝังแน่นต้องใช้น้ำยาเฉพาะทาง');
              if (survey.noWaterElectricity) conditions.push('ต้องจัดเตรียมแหล่งน้ำ/ไฟฟ้าเอง');
              if (conditions.length > 0) {
                scopeLines.push('');
                scopeLines.push('เงื่อนไขพิเศษ:');
                conditions.forEach((c, i) => scopeLines.push(`  ${i + 1}. ${c}`));
              }
              if (survey.specialNotes) {
                scopeLines.push(`หมายเหตุ: ${survey.specialNotes}`);
              }

              const fullDescription = scopeLines.join('\n');

              // คำนวณราคารวมเสนอขายที่บวกมาร์กอัปแล้ว (Selling Price)
              const sellPrice = Math.round(survey.calculatedPrice || 0);

              // สร้างรายละเอียดข้อความภาษาไทยที่หรูหรา สวยงาม น่าเชื่อถือ
              const professionalDescription = `บริการทำความสะอาดครั้งใหญ่ (Big Cleaning Service) เต็มรูปแบบ
- โครงการ: ${survey.projectName || 'ตามที่ตกลง'}
- ลักษณะหน้างาน: ${survey.siteType || 'ทั่วไป'} (ขนาดพื้นที่ประมาณ ${survey.areaSqm || 0} ตร.ม.)
- ระยะเวลาดำเนินการ: ${survey.days || 1} วันทำการ
- การจัดเตรียมทีมงาน: จัดเตรียมทีมงานผู้เชี่ยวชาญ หัวหน้าควบคุมงาน แม่บ้านปฏิบัติการ และช่างเทคนิคเฉพาะด้าน พร้อมรถจัดส่งอุปกรณ์ เคมีภัณฑ์น้ำยา และเครื่องมือทำความสะอาดครบวงจร
${survey.nightShift ? '- ปฏิบัติการรูปแบบพิเศษ: งานช่วงกลางคืน (Night Shift)\n' : ''}${survey.highRise ? '- อุปกรณ์สนับสนุนความสูง: รถกระเช้า / นั่งร้านโรยตัวภายนอกอาคาร\n' : ''}${survey.heavyStains ? '- เทคนิคขจัดคราบฝังลึกพิเศษ\n' : ''}${survey.noWaterElectricity ? '- จัดเตรียมชุดสำรองกระแสไฟและถังน้ำแรงดันสูงเคลื่อนที่\n' : ''}`;

              const finalItems = [
                {
                  id: 1,
                  description: professionalDescription,
                  qty: 1,
                  unit: 'งาน',
                  price: sellPrice
                }
              ];

              setItems(finalItems);
            } catch (e) {
              console.error(e);
            }
          }
        } else if (type === 'recurring') {
          setQuotationType('recurring');
        } else if (type === 'others') {
          setQuotationType('others');
          setItems([
            { id: 1, description: 'ผลิตภัณฑ์น้ำยาล้างพื้นผิวสูตรเข้มข้น (แกลลอน)', qty: 10, unit: 'แกลลอน', price: 120 },
            { id: 2, description: 'ผ้าไมโครไฟเบอร์แบบหนาพิเศษ (ผืน)', qty: 50, unit: 'ผืน', price: 35 }
          ]);
        }
      }
    }
    loadData();
  }, []);

  const [items, setItems] = useState([
    { id: 1, description: 'บริการ Big Cleaning บ้านเดี่ยว 2 ชั้น', qty: 1, unit: 'งาน', price: 15000 },
    { id: 2, description: 'บริการทำความสะอาดและซักพรม (แถมฟรี)', qty: 1, unit: 'งาน', price: 0 }
  ]);

  const [docNo, setDocNo] = useState('QT202607001');
  const [docDate, setDocDate] = useState('2026-07-03');
  const [validityDays, setValidityDays] = useState(30);
  const [whtRate, setWhtRate] = useState(3);
  const [note, setNote] = useState('1. การชำระเงิน: มัดจำ 50% ก่อนเริ่มงาน และชำระส่วนที่เหลือเมื่องานเสร็จสิ้น\n2. กรุณาชำระเงินภายใน 7 วันหลังได้รับเอกสารวางบิล');
  const [selectedBank, setSelectedBank] = useState('KBANK');
  
  // New States
  const [linkedSurveyId, setLinkedSurveyId] = useState('');
  const [sitePhotos, setSitePhotos] = useState([]);
  const [salesPerson, setSalesPerson] = useState('ผู้ดูแลระบบ (คุณ)');
  const [projectName, setProjectName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerContacts, setCustomerContacts] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [dbCustomers, setDbCustomers] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  
  // Gemini AI States
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [isGeminiGenerating, setIsGeminiGenerating] = useState(false);
  const [geminiGeneratedItems, setGeminiGeneratedItems] = useState([]);
  
  const [isGeminiCustomerOpen, setIsGeminiCustomerOpen] = useState(false);
  const [geminiCustomerPrompt, setGeminiCustomerPrompt] = useState('');
  const [isGeminiCustomerLoading, setIsGeminiCustomerLoading] = useState(false);
  const [geminiCustomerResult, setGeminiCustomerResult] = useState(null);
  
  const [isEstimatorModalOpen, setIsEstimatorModalOpen] = useState(false);

  // Estimation States
  const [placeTypes, setPlaceTypes] = useState([
    'บ้านพักอาศัย / คอนโด',
    'สำนักงาน / ออฟฟิศ',
    'โรงงาน / โกดัง',
    'หลังก่อสร้าง (Post-Construction)'
  ]);
  const [selectedPlace, setSelectedPlace] = useState(placeTypes[0]);
  const [areaSize, setAreaSize] = useState('');
  
  const [scopes, setScopes] = useState([
    { id: 's1', label: 'ทำความสะอาดพื้นผิวและเฟอร์นิเจอร์ทั่วไป', type: 'boolean', checked: true, price: 50 }, // 50 baht / sqm
    { id: 's2_in', label: 'เช็ดกระจกภายใน', type: 'boolean', checked: false, price: 500 },
    { id: 's2_out', label: 'เช็ดกระจกภายนอก', type: 'boolean', checked: false, price: 1500 },
    { id: 's_scrub', label: 'ขัดล้างพื้น', type: 'area', checked: false, value: '', pricePerUnit: 30 },
    { id: 's_scaffold', label: 'งานนั่งร้านที่สูง', type: 'height', checked: false, value: '', pricePerUnit: 500 },
    { id: 's_pressure', label: 'ฉีดล้างด้วยเครื่องแรงดันสูง', type: 'boolean', checked: false, price: 2000 },
    { id: 's_disinfect', label: 'ฉีดพ่นฆ่าเชื้อ', type: 'area', checked: false, value: '', pricePerUnit: 20 },
    { id: 's_carpet', label: 'ซักพรม', type: 'sizes', checked: false, sizes: { small: 0, medium: 0, large: 0 }, prices: { small: 300, medium: 500, large: 800 } },
    { id: 's_sofa', label: 'ซัก/ดูดไรฝุ่นโซฟา', type: 'sizes', checked: false, sizes: { small: 0, medium: 0, large: 0 }, prices: { small: 500, medium: 1000, large: 1500 } },
    { id: 's5', label: 'ขจัดคราบฝังลึก / คราบสี / ปูน (หลังก่อสร้าง)', type: 'boolean', checked: false, price: 5000 },
  ]);

  // Recurring States
  const [recurringWorkers, setRecurringWorkers] = useState(1);
  const [recurringWorkDays, setRecurringWorkDays] = useState('6 วัน (จันทร์-เสาร์)');
  const [recurringPlaceType, setRecurringPlaceType] = useState('สำนักงาน / ออฟฟิศ');
  const [workOnHolidays, setWorkOnHolidays] = useState(false);
  const [includeEquipment, setIncludeEquipment] = useState(false);
  const [includeConsumables, setIncludeConsumables] = useState(false);
  const [consumables, setConsumables] = useState({
    soapGallons: '',
    trashBags: {
      '18x20 นิ้ว': '',
      '24x28 นิ้ว': '',
      '30x40 นิ้ว': '',
      '36x45 นิ้ว': '',
    },
    tissues: {
      'ม้วนใหญ่ (Jumbo Roll)': '',
      'ม้วนเล็ก (Toilet Roll)': '',
      'เช็ดมือ (Hand Towel)': '',
    }
  });
  
  const [includeBigCleaning, setIncludeBigCleaning] = useState(false);
  const [bigCleaningTimes, setBigCleaningTimes] = useState('');
  const [bigCleaningCost, setBigCleaningCost] = useState('');

  const banks = [
    { id: 'KBANK', name: 'ธนาคารกสิกรไทย', accName: 'บจก. สั่งการ คลีน', accNo: '012-3-45678-9', color: '#00A950' },
    { id: 'SCB', name: 'ธนาคารไทยพาณิชย์', accName: 'บจก. สั่งการ คลีน', accNo: '987-6-54321-0', color: '#4E2A84' },
    { id: 'BBL', name: 'ธนาคารกรุงเทพ', accName: 'บจก. สั่งการ คลีน', accNo: '111-2-33344-5', color: '#1E4598' }
  ];

  const handlePullFromDB = () => {
    setCustomerName('บจก. อัลฟ่า เทค (สำนักงานใหญ่)');
    setCustomerAddress('123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110');
    setCustomerTaxId('0105555555555');
    setCustomerContacts([
      { name: 'คุณสมชาย (ผู้จัดการทั่วไป)', phone: '081-234-5678' },
      { name: 'คุณวิภาดา (ฝ่ายจัดซื้อ)', phone: '089-111-2222' }
    ]);
    setContactName('คุณสมชาย (ผู้จัดการทั่วไป)');
    setContactPhone('081-234-5678');
  };

  const handleSelectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerAddress(customer.address);
    setCustomerTaxId(customer.taxId);
    setCustomerContacts(customer.contacts);
    
    if (customer.contacts && customer.contacts.length > 0) {
      setContactName(customer.contacts[0].name);
      setContactPhone(customer.contacts[0].phone);
    } else {
      setContactName('');
      setContactPhone('');
    }
    
    setIsCustomerModalOpen(false);
    setCustomerSearchQuery('');
  };

  const handleOnlineSearch = async () => {
    if (!customerSearchQuery.trim()) return;
    setIsSearchingOnline(true);
    setOnlineResults([]);
    
    try {
      const res = await fetch(`/api/customer-lookup?q=${encodeURIComponent(customerSearchQuery.trim())}`);
      if (!res.ok) throw new Error('API Lookup failed');
      const data = await res.json();
      setOnlineResults([data]);
      setIsSearchingOnline(false);
      showToast('ค้นหาและดึงข้อมูลทะเบียนราษฎร์/กรมพัฒนาธุรกิจการค้าออนไลน์เรียบร้อย!', 'success');
    } catch (err) {
      console.error(err);
      setIsSearchingOnline(false);
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูลออนไลน์ หรือโครงสร้างเน็ตขัดข้อง', 'error');
    }
  };

  const handleSelectOnlineCustomer = async (cust) => {
    try {
      // 1. เซฟเก็บถาวรลงใน LocalStorage
      await saveData('Customers', cust);
      
      // 2. เพิ่มลงใน state ท้องถิ่น เพื่อให้แอดมินเห็นใน List ครั้งต่อไป
      setDbCustomers(prev => {
        if (prev.find(c => c.id === cust.id)) return prev;
        return [...prev, cust];
      });

      // 3. ผูกค่าเข้ากับเอกสารปัจจุบัน
      handleSelectCustomer(cust);
      
      showToast(`นำเข้าข้อมูล บจก. ${cust.name} สำเร็จและประยุกต์ใส่เอกสารให้ทันทีแล้วค่ะ! 🌐✨`, 'success');
      setOnlineResults([]);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้าใหม่', 'error');
    }
  };

  const handleGeminiGenerate = async () => {
    if (!geminiPrompt.trim()) return;
    setIsGeminiGenerating(true);
    setGeminiGeneratedItems([]);

    setTimeout(() => {
      const prompt = geminiPrompt.toLowerCase();
      let genItems = [];

      if (prompt.includes('โกดัง') || prompt.includes('โรงงาน') || prompt.includes('warehouse')) {
        genItems = [
          { id: 1, description: 'บริการ Big Cleaning ขัดล้างคราบน้ำมัน คราบจาระบี และคราบยางรถพื้นคลังสินค้า', qty: 1, unit: 'งาน', price: 18500 },
          { id: 2, description: 'บริการปัดกวาดหยากไย่และฝุ่นละอองบนโครงสร้างเหล็กแปและเพดานสูง (ใช้เครื่องจักรรถกระเช้า/นั่งร้าน)', qty: 1, unit: 'งาน', price: 9000 },
          { id: 3, description: 'บริการเช็ดทำความสะอาดผนังเมทัลชีทและกระจกหน้าต่างโดยรอบโกดัง', qty: 1, unit: 'งาน', price: 4500 },
          { id: 4, description: 'บริการทำความสะอาดห้องน้ำพนักงาน และพื้นที่ออฟฟิศส่วนควบคุมการผลิต', qty: 1, unit: 'งาน', price: 3000 }
        ];
      } else if (prompt.includes('พรม') || prompt.includes('carpet')) {
        genItems = [
          { id: 1, description: 'บริการซักพรมปูพื้นออฟฟิศด้วยเครื่องสกัดและระบบพ่นดูดน้ำยาเคมีภัณฑ์เฉพาะทางขจัดคราบฝังลึก', qty: 1, unit: 'งาน', price: 12000 },
          { id: 2, description: 'บริการดูดฝุ่นเก็บรายละเอียดและเก็บขอบพรมบริเวณซอกมุมออฟฟิศ', qty: 1, unit: 'งาน', price: 2500 },
          { id: 3, description: 'บริการพ่นสเปรย์ฆ่าเชื้อแบคทีเรียและเชื้อโรคสะสมบนพื้นผิวพรมและปรับอากาศหลังซัก', qty: 1, unit: 'งาน', price: 3500 }
        ];
      } else if (prompt.includes('บ้าน') || prompt.includes('คอนโด') || prompt.includes('home') || prompt.includes('townhouse')) {
        genItems = [
          { id: 1, description: 'บริการ Big Cleaning ปัดกวาดเช็ดถูทำความสะอาดห้องนอน ห้องนั่งเล่น และห้องครัวแบบละเอียดทุกจุด', qty: 1, unit: 'งาน', price: 8500 },
          { id: 2, description: 'บริการขัดล้างทำความสะอาดพื้นผิว สุขภัณฑ์ห้องน้ำ และล้างคราบตะกรันน้ำยาฆ่าเชื้อ', qty: 1, unit: 'งาน', price: 3000 },
          { id: 3, description: 'บริการเช็ดกระจกภายนอกและภายใน บานมุ้งลวด และล้างคราบสกปรกสะสมที่กรอบหน้าต่าง', qty: 1, unit: 'งาน', price: 2500 }
        ];
      } else {
        // เจนทั่วไปแบบเนียนๆ สวยๆ
        const cleanPrompt = geminiPrompt.replace(/ช่วยคิดราคา|ใบเสนอราคา|ขอสโคปงาน|ขอ|หน่อย/g, '').trim();
        genItems = [
          { id: 1, description: `บริการ Big Cleaning ทำความสะอาดพิเศษสำหรับงาน: ${cleanPrompt}`, qty: 1, unit: 'งาน', price: 12000 },
          { id: 2, description: `ค่าอุปกรณ์พิเศษ เคมีภัณฑ์ และน้ำยาขจัดคราบเฉพาะทางสำหรับไซต์งานนี้`, qty: 1, unit: 'งาน', price: 3500 },
          { id: 3, description: `ค่าบริการเดินทางขนย้ายอุปกรณ์และจัดส่งทีมงานควบคุมงานถึงสถานที่ปฏิบัติงาน`, qty: 1, unit: 'งาน', price: 1500 }
        ];
      }

      setGeminiGeneratedItems(genItems);
      setIsGeminiGenerating(false);
      showToast('Gemini AI ประมวลผลและสร้างรายการประมาณราคากลางเสร็จแล้วค่ะ! ✨🤖', 'success');
    }, 2000);
  };

  const handleApplyGeminiItems = () => {
    if (geminiGeneratedItems.length === 0) return;
    setItems(geminiGeneratedItems);
    setIsGeminiModalOpen(false);
    showToast('นำเข้าสโคปงานและราคากลางจาก Gemini AI ลงใบเสนอราคาสำเร็จ! 📄✨', 'success');
  };

  const handleGeminiCustomerSearch = async () => {
    if (!geminiCustomerPrompt.trim()) return;
    setIsGeminiCustomerLoading(true);
    setGeminiCustomerResult(null);

    try {
      const res = await fetch(`/api/customer-lookup?q=${encodeURIComponent(geminiCustomerPrompt.trim())}`);
      if (!res.ok) throw new Error('Gemini API Lookup failed');
      const data = await res.json();
      setGeminiCustomerResult(data);
      setIsGeminiCustomerLoading(false);
      showToast('Gemini AI ค้นหาข้อมูลบริษัทและเจาะลึกที่อยู่เสร็จเรียบร้อย! ✨🤖', 'success');
    } catch (err) {
      console.error(err);
      setIsGeminiCustomerLoading(false);
      showToast('เกิดข้อผิดพลาดในการเรียกใช้ระบบวิเคราะห์ข้อมูลบริษัท', 'error');
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // กำหนดขนาดสูงสุดของภาพที่จะถูกบีบอัด (กว้าง/สูงไม่เกิน 800px)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          // วาดภาพลง Canvas เพื่อทำบีบอัดขนาดไฟล์
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // แปลงเป็น JPEG ความละเอียด 60% (ลดขนาดไฟล์เหลือประมาณ 50-100KB ต่อรูป)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          
          showToast('กำลังส่งภาพขึ้น Google Drive...', 'info');

          fetchSetting('GOOGLE_SHEET_API_URL').then((apiLink) => {
          if (apiLink && typeof apiLink === 'string') {
            fetch(apiLink, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'upload_image',
                data: {
                  image: compressedDataUrl,
                  id: docNo || 'temp',
                  name: 'survey_photo_' + (sitePhotos.length + 1) + '_' + Math.random().toString(36).substr(2, 4)
                }
              })
            })
            .then(res => res.json())
            .then(resJson => {
              if (resJson.status === 'success' && resJson.url) {
                setSitePhotos(prev => [...prev, resJson.url]);
                showToast('แนบภาพขึ้น Google Drive สำเร็จ! ☁️✨', 'success');
              } else {
                setSitePhotos(prev => [...prev, compressedDataUrl]);
                showToast('อัปโหลดขึ้น Cloud ล้มเหลว กำลังใช้หน่วยความจำเครื่องแทน...', 'warning');
              }
            })
            .catch(err => {
              console.error('Cloud Upload error:', err);
              setSitePhotos(prev => [...prev, compressedDataUrl]);
              showToast('เชื่อมต่อคลาวด์ขัดข้อง กำลังบันทึกในหน่วยความจำเครื่องแทน...', 'warning');
            });
          } else {
            setSitePhotos(prev => [...prev, compressedDataUrl]);
            showToast('บันทึกรูปชั่วคราวในเครื่อง (กรุณาเชื่อมระบบคลาวด์ในหน้าตั้งค่า)', 'info');
          }
          }).catch(() => {
            setSitePhotos(prev => [...prev, compressedDataUrl]);
            showToast('บันทึกรูปชั่วคราวในเครื่อง (กรุณาเชื่อมระบบคลาวด์ในหน้าตั้งค่า)', 'info');
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const filteredCustomers = dbCustomers.filter(c =>
    String(c.name || '').includes(customerSearchQuery) || String(c.taxId || '').includes(customerSearchQuery)
  );

  const handleAutoEstimate = () => {
    if (quotationType === 'bigcleaning') {
      const area = Number(areaSize) || 100; // default 100 sqm if not entered
      let totalEstimatedPrice = 0;
      let scopeDetails = [];
      
      scopes.forEach(scope => {
        if (scope.checked) {
          let desc = '';
          if (scope.id === 's1') desc = 'งานทำความสะอาดทั่วไป: ดูแลความสะอาดพื้นผิว เฟอร์นิเจอร์ และบริเวณทั่วไปภายในสถานที่';
          else if (scope.id === 's2_in' || scope.id === 's2_out') desc = `งานเช็ดกระจก: บริการเช็ดทำความสะอาดกระจก${scope.id === 's2_in' ? 'ภายใน' : 'ภายนอก'} (รวมถึงกรอบกระจก)`;
          else if (scope.id === 's_pressure') desc = 'งานล้างด้วยเครื่องแรงดันสูง: บริการฉีดล้างบริเวณพื้นที่ภายนอกหรือส่วนที่เหมาะสมเพื่อขจัดคราบสะสม';
          else if (scope.id === 's5') desc = 'งานจัดการคราบพิเศษ: ขจัดคราบฝังลึก คราบสี หรือคราบปูนจากการก่อสร้าง/รีโนเวท ให้กลับมาสะอาดเหมือนใหม่';
          
          if (scope.type === 'boolean') {
            if (scope.id === 's1') {
              totalEstimatedPrice += area * scope.price;
            } else {
              totalEstimatedPrice += scope.price;
            }
            scopeDetails.push(`- ${desc || scope.label}`);
          } else if (scope.type === 'area' || scope.type === 'height') {
            const unitName = scope.type === 'area' ? 'ตร.ม.' : 'เมตร';
            const val = Number(scope.value) || 0;
            if (val > 0) {
              totalEstimatedPrice += val * scope.pricePerUnit;
              scopeDetails.push(`- ${desc || scope.label} (${val} ${unitName})`);
            }
          } else if (scope.type === 'sizes') {
            const s = scope.sizes;
            const unitLabel = scope.id === 's_carpet' ? 'ผืน' : 'ตัว';
            let sizeDetails = [];
            
            if (Number(s.small) > 0) {
              totalEstimatedPrice += Number(s.small) * scope.prices.small;
              sizeDetails.push(`ขนาดเล็ก ${s.small} ${unitLabel}`);
            }
            if (Number(s.medium) > 0) {
              totalEstimatedPrice += Number(s.medium) * scope.prices.medium;
              sizeDetails.push(`ขนาดกลาง ${s.medium} ${unitLabel}`);
            }
            if (Number(s.large) > 0) {
              totalEstimatedPrice += Number(s.large) * scope.prices.large;
              sizeDetails.push(`ขนาดใหญ่ ${s.large} ${unitLabel}`);
            }
            
            if (sizeDetails.length > 0) {
              scopeDetails.push(`- ${desc || scope.label} (${sizeDetails.join(', ')})`);
            }
          }
        }
      });
      
      // Deduplicate mirror descriptions if both are checked, or let them be two lines. Two lines is fine (inside / outside).
      
      const hasScaffold = scopes.find(s => s.id === 's_scaffold')?.checked;
      
      const equipmentList = `2. มาตรฐานอุปกรณ์และเครื่องมือ (Professional Equipment)
เราเลือกใช้เครื่องมือที่ทันสมัยและได้มาตรฐาน เพื่อประสิทธิภาพสูงสุดในการทำงาน:
- เครื่องขัดล้างทำความสะอาดพื้น (Floor Scrubber)
- เครื่องดูดฝุ่นอุตสาหกรรม (Industrial Vacuum)
${hasScaffold ? '- อุปกรณ์ทำความสะอาดที่สูง (นั่งร้านและบันไดอเนกประสงค์)\n' : ''}- อุปกรณ์จัดการความสะอาดทั่วไป (ไม้ถูพื้นคุณภาพสูง, ผ้าไมโครไฟเบอร์แบบแยกประเภทการใช้งาน)

3. ผลิตภัณฑ์น้ำยาทำความสะอาด (Premium Cleaning Agents)
เราเลือกใช้ผลิตภัณฑ์ที่ปลอดภัยและเหมาะสมกับพื้นผิวแต่ละประเภท:
- น้ำยาทำความสะอาดอเนกประสงค์: สำหรับจัดการคราบทั่วไป
- ผลิตภัณฑ์ดูแลกระจก: เพื่อความใสสะอาดปราศจากคราบ
- ผลิตภัณฑ์ดูแลพื้นผิวและเฟอร์นิเจอร์: เน้นการทำความสะอาดพร้อมถนอมผิววัสดุ
- ผลิตภัณฑ์ปั่นเงา: คืนความเงางามให้กับพื้นบ้านของคุณ

* อุปกรณ์และน้ำยาอาจมีการปรับเปลี่ยนตามความเหมาะสมของหน้างาน`;

      const finalDescription = `บริการ Big Cleaning ${selectedPlace} (${area} ตร.ม.)\n\n1. ขอบเขตการให้บริการ (Scope of Work)\nเราให้บริการทำความสะอาดแบบเจาะลึกทุกตารางนิ้ว ครอบคลุมงานดังนี้:\n${scopeDetails.join('\n')}\n\n${equipmentList}`;
      
      setItems([{ id: Date.now(), description: finalDescription, qty: 1, unit: 'งาน', price: totalEstimatedPrice }]);
    } else if (quotationType === 'recurring') {
      let totalEstimatedPrice = 0;
      let scopeDetails = [];

      let baseRatePerWorker = 15000;
      if (recurringWorkDays.includes('7 วัน')) baseRatePerWorker = 20000;
      else if (recurringWorkDays.includes('5 วัน')) baseRatePerWorker = 13000;
      else if (recurringWorkDays.includes('3 วัน')) baseRatePerWorker = 8000;
      else if (recurringWorkDays.includes('1 วัน')) baseRatePerWorker = 3000;
      
      let basePrice = recurringWorkers * baseRatePerWorker;
      totalEstimatedPrice += basePrice;
      
      scopeDetails.push(`- จัดส่งแม่บ้านประจำ ${recurringPlaceType} จำนวน ${recurringWorkers} คน`);
      scopeDetails.push(`- วันทำงาน: ${recurringWorkDays}`);
      if (workOnHolidays) {
         scopeDetails.push(`- ปฏิบัติงานในวันหยุดนักขัตฤกษ์`);
         totalEstimatedPrice += recurringWorkers * 1000;
      } else {
         scopeDetails.push(`- หยุดวันนักขัตฤกษ์ตามประกาศบริษัท`);
      }
      
      if (includeEquipment) {
         scopeDetails.push(`- รวมจัดเตรียมอุปกรณ์ทำความสะอาดและน้ำยามาตรฐาน`);
         totalEstimatedPrice += 2000;
      }
      
      if (includeConsumables) {
         let consLines = [];
         if (Number(consumables.soapGallons) > 0) consLines.push(`สบู่เหลว ${consumables.soapGallons} แกลลอน`);
         
         const trashBagsUsed = Object.entries(consumables.trashBags).filter(([size, qty]) => Number(qty) > 0);
         if (trashBagsUsed.length > 0) {
            const trashDetails = trashBagsUsed.map(([size, qty]) => `ขนาด ${size} (${qty} กก.)`).join(', ');
            consLines.push(`ถุงขยะ ${trashDetails}`);
         }
         
         const tissuesUsed = Object.entries(consumables.tissues).filter(([type, qty]) => Number(qty) > 0);
         if (tissuesUsed.length > 0) {
            const tissueDetails = tissuesUsed.map(([type, qty]) => `${type} (${qty} ม้วน/ห่อ)`).join(', ');
            consLines.push(`กระดาษทิชชู่ ${tissueDetails}`);
         }
         
         if (consLines.length > 0) {
            scopeDetails.push(`- รวมจัดเตรียมของใช้สิ้นเปลืองประจำเดือน: ${consLines.join(', ')}`);
            totalEstimatedPrice += 1500;
         }
      }
      
      if (includeBigCleaning && Number(bigCleaningTimes) > 0 && Number(bigCleaningCost) > 0) {
         scopeDetails.push(`- ฟรีบริการ Big Cleaning ประจำปี จำนวน ${bigCleaningTimes} ครั้ง`);
         const bigCleanTotal = Number(bigCleaningTimes) * Number(bigCleaningCost);
         totalEstimatedPrice += (bigCleanTotal / 12);
      }

      const finalDescription = `บริการแม่บ้านประจำ ${recurringPlaceType}\n\nรายละเอียดบริการ:\n${scopeDetails.join('\n')}`;
      
      setItems([{ id: Date.now(), description: finalDescription, qty: 1, unit: 'เดือน', price: totalEstimatedPrice }]);
    } else if (quotationType === 'others') {
      setItems([{ id: Date.now(), description: otherProductName, qty: Number(otherProductQty) || 1, unit: otherProductUnit || 'รายการ', price: Number(otherProductPrice) || 0 }]);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: '', qty: 1, unit: 'รายการ', price: 0 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const vat = subtotal * 0.07;
  const whtAmount = subtotal * (whtRate / 100);
  const total = subtotal + vat;
  const netPayable = total - whtAmount;

  const handleSaveQuotation = async () => {
    // 1. Create updated quotation object
    const updatedQuotation = {
      id: docNo,
      date: docDate,
      customer: customerName || 'ไม่ได้ระบุชื่อลูกค้า',
      address: customerAddress,
      taxId: customerTaxId,
      projectName: projectName || 'ไม่ได้ระบุชื่อโปรเจกต์',
      quotationType: quotationType,
      items: items,
      total: total,
      note: note,
      status: isEditMode ? 'pending' : 'pending',
      linkedSurveyId: linkedSurveyId,
      salesPerson: salesPerson,
      sitePhotos: sitePhotos
    };

    try {
      // 2. Save via helper
      const success = await saveQuotation(updatedQuotation);
      if (success === false) return;
      
      // Update linkedQuotationId in the all surveys history if applicable
      if (linkedSurveyId) {
        try {
          const { fetchData } = await import('@/utils/api');
          const allSurveys = await fetchData('AllSurveys');
          const matched = allSurveys.find(s => s.surveyId === linkedSurveyId || s.id === linkedSurveyId);
          if (matched) {
            await saveData('AllSurveys', { ...matched, linkedQuotationId: docNo });
          }
        } catch (e) {
          console.error('Error linking quotation to survey registry:', e);
        }
      }

      showToast(`บันทึกใบเสนอราคาเลขที่ ${docNo} สำเร็จ! ข้อมูลอัปเดตลง Database แล้ว`, 'success');
      window.location.href = '/quotation';
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/quotation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', transition: 'background-color 0.2s', textDecoration: 'none' }}>
             <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {isEditMode ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ระบบคำนวณราคาอัตโนมัติ (เฉพาะบริการ Big Cleaning)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsGeminiModalOpen(true)} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <span style={{ fontSize: '16px' }}>✨</span> ถาม Gemini (AI ช่วยคิดราคา)
          </button>

          <button onClick={() => setIsEstimatorModalOpen(true)} style={{ backgroundColor: '#f1f5f9', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <Calculator size={18} /> เปิดระบบประเมินราคา
          </button>

          <button onClick={handleSaveQuotation} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
            <FileText size={18} /> {isEditMode ? 'บันทึกการแก้ไข' : 'สร้างใบเสนอราคา'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Main: พรีวิวใบเสนอราคา */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', marginBottom: '8px' }}>
                <Building size={32} />
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Sangkan Clean</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>123/45 ถนนทำความสะอาด แขวงสะอาด เขตปัดกวาด กทม. 10000</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>โทร: 02-111-2222 | เลขผู้เสียภาษี: 0105555555555</p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 8px 0' }}>ใบเสนอราคา</h2>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>เลขที่:</span>
                <input type="text" value={docNo} onChange={e => setDocNo(e.target.value)} style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', width: '160px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-dark)' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>วันที่:</span>
                <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', width: '160px', color: 'var(--text-muted)' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ยืนราคา:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', width: '160px', overflow: 'hidden' }}>
                  <input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} style={{ padding: '4px 8px', border: 'none', outline: 'none', width: '110px', textAlign: 'right', color: 'var(--text-muted)' }} />
                  <span style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', color: 'var(--text-muted)', fontSize: '0.9rem', width: '50px', textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>วัน</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>พนักงานขาย:</span>
                <select 
                  value={salesPerson} 
                  onChange={e => setSalesPerson(e.target.value)} 
                  style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', width: '160px', color: 'var(--primary-dark)', fontWeight: '500' }}>
                  <option value="ผู้ดูแลระบบ (คุณ)">ผู้ดูแลระบบ (คุณ)</option>
                  <option value="ส่วนกลาง">ส่วนกลาง</option>
                  <option value="เซลล์ สมปอง">เซลล์ สมปอง</option>
                  <option value="เซลล์ สมศรี">เซลล์ สมศรี</option>
                </select>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', width: '100%', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <p style={{ fontWeight: 'bold', margin: 0, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>ข้อมูลลูกค้า:</p>
                <button onClick={() => setIsCustomerModalOpen(true)} style={{ fontSize: '0.85rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
                  🔍 ค้นหาจากฐานข้อมูลลูกค้า
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 1fr', gap: '12px 16px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ชื่อลูกค้า:</span>
                <input type="text" placeholder="กรอกชื่อลูกค้า/บริษัท..." value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%', fontWeight: '600', color: 'var(--text-main)' }} />
                
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>เลขผู้เสียภาษี:</span>
                <input type="text" placeholder="13 หลัก..." value={customerTaxId} onChange={e => setCustomerTaxId(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%' }} />

                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', alignSelf: 'flex-start', marginTop: '6px' }}>ที่อยู่:</span>
                <textarea placeholder="กรอกที่อยู่..." value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={2} style={{ gridColumn: 'span 3', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%', resize: 'none' }} />

                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ชื่อโครงการ:</span>
                <input type="text" placeholder="เช่น ทำความสะอาดตึก A ประจำปี..." value={projectName} onChange={e => setProjectName(e.target.value)} style={{ gridColumn: 'span 3', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%' }} />
                
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ผู้ติดต่อ:</span>
                {customerContacts.length > 0 ? (
                  <select 
                    value={contactName} 
                    onChange={e => {
                      if (e.target.value === 'พิมพ์ใหม่') {
                        setCustomerContacts([]);
                        setContactName('');
                        setContactPhone('');
                      } else {
                        setContactName(e.target.value);
                        const contact = customerContacts.find(c => c.name === e.target.value);
                        if (contact) setContactPhone(contact.phone);
                      }
                    }} 
                    style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%' }}>
                    {customerContacts.map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                    <option value="พิมพ์ใหม่">-- พิมพ์ชื่อเอง --</option>
                  </select>
                ) : (
                  <input type="text" placeholder="ชื่อผู้ติดต่อ..." value={contactName} onChange={e => setContactName(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%' }} />
                )}
                
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>เบอร์โทร:</span>
                <input type="text" placeholder="เบอร์โทร..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', width: '100%' }} />
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 0', width: '5%' }}>ลำดับ</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '55%' }}>รายการ (Description)</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '8%' }}>จำนวน</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '8%' }}>หน่วย</th>
                <th style={{ padding: '12px', textAlign: 'right', width: '12%' }}>ราคาต่อหน่วย</th>
                <th style={{ padding: '12px', textAlign: 'right', borderRadius: '0 8px 0 0', width: '12%' }}>จำนวนเงิน (บาท)</th>
                <th style={{ padding: '12px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'top', paddingTop: '16px' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <textarea 
                      value={item.description} 
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      style={{ width: '100%', minHeight: '160px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', backgroundColor: '#f8fafc', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6' }} 
                      placeholder="กรอกรายละเอียดบริการ..."
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      style={{ width: '60px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' }} 
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                    <input 
                      type="text" 
                      value={item.unit} 
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      style={{ width: '60px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' }} 
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top' }}>
                    <input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      style={{ width: '100px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'right' }} 
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', verticalAlign: 'top', paddingTop: '20px' }}>
                    {(Number(item.qty) * Number(item.price)).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top', paddingTop: '16px' }}>
                    <button onClick={() => handleRemoveItem(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: '600', backgroundColor: '#e0f2fe', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '32px' }}>
            <Plus size={16} /> เพิ่มรายการใหม่
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px' }}>
            
            {/* ซ้าย: รูปภาพ, หมายเหตุ และ บัญชีรับชำระ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* รูปสำรวจหน้างาน */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                  <Camera size={18} color="var(--text-muted)" /> รูปสำรวจหน้างาน (Site Survey Photos)
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {sitePhotos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {photo.startsWith('data:image/') || photo.startsWith('http') ? (
                        <img src={photo} alt={`Site Survey ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <ImageIcon size={24} color="var(--text-muted)" />
                          <span style={{ position: 'absolute', bottom: '4px', left: '0', right: '0', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>รูปที่ {index + 1}</span>
                        </>
                      )}
                      <button onClick={() => setSitePhotos(sitePhotos.filter((_, i) => i !== index))} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', zIndex: 10 }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => document.getElementById('survey-photo-upload').click()} style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', border: '2px dashed var(--border-color)', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary-color)', gap: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Plus size={24} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>แนบรูป</span>
                  </button>
                  <input type="file" id="survey-photo-upload" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>* รูปภาพเหล่านี้จะถูกแนบท้ายใบเสนอราคาเพื่อใช้ประกอบการพิจารณา</p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                  <FileText size={18} color="var(--text-muted)" /> หมายเหตุ / เงื่อนไข
                </label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-family)', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                  <CreditCard size={18} color="var(--text-muted)" /> ข้อมูลบัญชีรับชำระเงิน
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {banks.map(bank => (
                    <div 
                      key={bank.id} 
                      onClick={() => setSelectedBank(bank.id)}
                      style={{ 
                        border: selectedBank === bank.id ? `2px solid ${bank.color}` : '1px solid var(--border-color)', 
                        borderRadius: '8px', padding: '12px', cursor: 'pointer',
                        backgroundColor: selectedBank === bank.id ? '#f8fafc' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: bank.color }}></div>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: bank.color }}>{bank.name}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ชื่อ: {bank.accName}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500' }}>เลขบัญชี: {bank.accNo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ขวา: สรุปยอดเงิน */}
            <div style={{ width: '350px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>รวมเป็นเงิน (Subtotal):</span>
                <span style={{ fontWeight: '500' }}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                <span style={{ fontWeight: '500' }}>{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>จำนวนเงินรวมทั้งสิ้น:</span>
                <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444' }}>หักภาษี ณ ที่จ่าย</span>
                  <select 
                    value={whtRate} 
                    onChange={e => setWhtRate(Number(e.target.value))}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value={0}>0%</option>
                    <option value={1}>1%</option>
                    <option value={2}>2%</option>
                    <option value={3}>3% (บริการ)</option>
                    <option value={5}>5%</option>
                  </select>
                </div>
                <span style={{ fontWeight: '500', color: '#ef4444' }}>- {whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 0 0', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                <span>ยอดชำระสุทธิ:</span>
                <span>{netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <p style={{ textAlign: 'right', margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>* ยอดที่ลูกค้าต้องโอนจริง</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', backgroundColor: 'white', border: '1px solid var(--border-color)', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              <Printer size={18} /> พิมพ์ใบเสนอราคา
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', backgroundColor: '#10b981', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              <Download size={18} /> ดาวน์โหลด PDF
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', backgroundColor: 'var(--primary-color)', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              <Send size={18} /> ส่ง Email ให้ลูกค้า
            </button>
          </div>

        </div>
      </div>

      {/* Modal ค้นหาลูกค้า */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.4rem' }}>ค้นหาและจัดเตรียมข้อมูลลูกค้า</h2>
              <button onClick={() => { setIsCustomerModalOpen(false); setIsGeminiCustomerOpen(false); setGeminiCustomerResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '16px' }}>
              <button 
                type="button" 
                onClick={() => setIsGeminiCustomerOpen(false)}
                style={{ padding: '8px 12px', background: 'none', border: 'none', borderBottom: !isGeminiCustomerOpen ? '2px solid var(--primary-color)' : 'none', fontWeight: 'bold', color: !isGeminiCustomerOpen ? 'var(--primary-dark)' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                📂 ค้นหาฐานข้อมูลหลัก/เน็ต
              </button>
              <button 
                type="button" 
                onClick={() => { setIsGeminiCustomerOpen(true); setGeminiCustomerResult(null); }}
                style={{ padding: '8px 12px', background: 'none', border: 'none', borderBottom: isGeminiCustomerOpen ? '2px solid #2563eb' : 'none', fontWeight: 'bold', color: isGeminiCustomerOpen ? '#1d4ed8' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ✨ ถาม Gemini AI (เชื่อมโยงฐานข้อมูล DBD)
              </button>
            </div>
            
            {!isGeminiCustomerOpen ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="ค้นหาจากชื่อ หรือ เลขผู้เสียภาษี..." 
                    value={customerSearchQuery}
                    onChange={e => setCustomerSearchQuery(e.target.value)}
                    style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
                    autoFocus
                  />
                  {customerSearchQuery && (
                    <button 
                      type="button" 
                      onClick={handleOnlineSearch}
                      disabled={isSearchingOnline}
                      style={{ padding: '0 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isSearchingOnline ? 'กำลังค้น...' : '🔍 ค้นหาเน็ต'}
                    </button>
                  )}
                </div>

                {isSearchingOnline && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <div>กำลังค้นหาและดึงข้อมูลจากอินเทอร์เน็ต...</div>
                  </div>
                )}

                {!isSearchingOnline && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* ฐานข้อมูลภายใน */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', marginTop: 0 }}>📂 ในฐานข้อมูลปัจจุบัน</h4>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <div 
                              key={customer.id} 
                              onClick={() => handleSelectCustomer(customer)}
                              style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: 'white' }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>{customer.name}</h4>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{customer.address}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--primary-color)' }}>เลขผู้เสียภาษี: {customer.taxId}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}>
                            ไม่พบข้อมูลในระบบ
                            {customerSearchQuery && (
                              <div style={{ marginTop: '8px' }}>
                                <button 
                                  type="button" 
                                  onClick={handleOnlineSearch}
                                  style={{ padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  🌐 กดค้นหาจากอินเทอร์เน็ตด่วน
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ผลลัพธ์จากอินเทอร์เน็ต */}
                    {onlineResults.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#0369a1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🌐 ผลการค้นหาจากระบบออนไลน์ (พร้อมดึงเข้าฐานข้อมูล)
                        </h4>
                        <div style={{ border: '1px solid #bae6fd', borderRadius: '8px', overflow: 'hidden' }}>
                          {onlineResults.map(customer => (
                            <div 
                              key={customer.id} 
                              onClick={() => handleSelectOnlineCustomer(customer)}
                              style={{ padding: '16px', borderBottom: '1px solid #bae6fd', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: '#f0f9ff' }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem' }}>{customer.name}</h4>
                                <span style={{ fontSize: '0.75rem', backgroundColor: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>นำเข้าทันที</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{customer.address}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--primary-color)' }}>เลขผู้เสียภาษี: {customer.taxId}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // Gemini AI Customer Search Tab
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>ป้อนคำสั่งให้ Gemini AI ค้นหาและเจนข้อมูลบริษัท (Prompt)</label>
                  <input 
                    type="text" 
                    value={geminiCustomerPrompt}
                    onChange={e => setGeminiCustomerPrompt(e.target.value)}
                    placeholder="เช่น: บจก. อนันดา ขอเลขผู้เสียภาษีและที่อยู่สาขาหลัก"
                    style={{ width: '100%', padding: '12px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setGeminiCustomerPrompt('บจก. อนันดา โฮลดิ้งส์ ขอข้อมูลที่อยู่')} style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>💡 บจก. อนันดา</button>
                    <button type="button" onClick={() => setGeminiCustomerPrompt('บมจ. แสนสิริ ค้นหาที่อยู่ด่วน')} style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>💡 บมจ. แสนสิริ</button>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleGeminiCustomerSearch}
                  disabled={isGeminiCustomerLoading || !geminiCustomerPrompt.trim()}
                  style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  {isGeminiCustomerLoading ? (
                    <>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      กำลังดึงข้อมูลทะเบียนราษฎร์จาก DBD DataWarehouse (กรมพัฒน์ฯ)...
                    </>
                  ) : '🤖 สั่ง Gemini AI วิเคราะห์ที่อยู่และเลขผู้เสียภาษี'}
                </button>

                {geminiCustomerResult && (
                  <div style={{ marginTop: '8px', border: '1px solid #93c5fd', borderRadius: '8px', padding: '16px', backgroundColor: '#eff6ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#1e40af', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🏢 คลังข้อมูลธุรกิจ DBD DataWarehouse
                      </h4>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#eab308', color: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>กรมพัฒนาธุรกิจการค้า 🔗</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', color: '#1e293b' }}>
                      <div><strong>ชื่อบริษัท:</strong> {geminiCustomerResult.name}</div>
                      <div><strong>ที่อยู่จดทะเบียน:</strong> {geminiCustomerResult.address}</div>
                      <div><strong>เลขผู้เสียภาษี:</strong> {geminiCustomerResult.taxId}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { handleSelectOnlineCustomer(geminiCustomerResult); setIsCustomerModalOpen(false); setIsGeminiCustomerOpen(false); setGeminiCustomerResult(null); }}
                      style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', marginTop: '12px', cursor: 'pointer' }}
                    >
                      📥 นำเข้าลงระบบและเลือกเป็นลูกค้า
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isEstimatorModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <button onClick={() => setIsEstimatorModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--primary-dark)', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
              <div style={{ backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '8px' }}>
                <Calculator size={28} style={{ color: 'var(--primary-color)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>ระบบประเมินราคาอัตโนมัติ</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>คำนวณราคาและออกรายละเอียดใบเสนอราคา</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ประเภทบริการ</label>
                <select 
                  value={quotationType} 
                  onChange={(e) => setQuotationType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                >
                  <option value="bigcleaning">Big Cleaning (เหมาจ่าย)</option>
                  <option value="recurring">แม่บ้านประจำ (รายเดือน/รายปี)</option>
                  <option value="others">บริการอื่นๆ / ขายสินค้าและน้ำยา</option>
                </select>
              </div>

              {quotationType === 'bigcleaning' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ขนาดพื้นที่ (ตารางเมตร)</label>
                    <input type="number" placeholder="เช่น 200" value={areaSize} onChange={e => setAreaSize(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ประเภทสถานที่</label>
                    <select 
                      value={selectedPlace} 
                      onChange={e => setSelectedPlace(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                    >
                      {placeTypes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ขอบเขตงาน (เลือกหลายข้อได้)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {scopes.map((scope, idx) => (
                        <div key={scope.id} style={{ paddingBottom: '12px', borderBottom: idx < scopes.length - 1 ? '1px solid #e2e8f0' : 'none', marginBottom: idx < scopes.length - 1 ? '4px' : '0' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', lineHeight: '1.4' }}>
                            <input 
                              type="checkbox" 
                              checked={scope.checked} 
                              onChange={(e) => {
                                const newScopes = [...scopes];
                                newScopes[idx].checked = e.target.checked;
                                setScopes(newScopes);
                              }} 
                              style={{ marginTop: '3px', transform: 'scale(1.1)' }} 
                            />
                            <span style={{ color: scope.checked ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: scope.checked ? '500' : 'normal' }}>{scope.label}</span>
                          </label>
                          
                          {scope.checked && (scope.type === 'area' || scope.type === 'height') && (
                            <div style={{ paddingLeft: '28px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                              <input 
                                 type="number" 
                                 min="0"
                                 placeholder={scope.type === 'area' ? 'ตารางเมตร' : 'เมตร'} 
                                 value={scope.value} 
                                 onChange={e => {
                                    const newScopes = [...scopes];
                                    newScopes[idx].value = e.target.value;
                                    setScopes(newScopes);
                                 }}
                                 style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100px', fontSize: '0.85rem' }} 
                              />
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{scope.type === 'area' ? 'ตร.ม.' : 'เมตร'}</span>
                            </div>
                          )}

                          {scope.checked && scope.type === 'sizes' && (
                            <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                               {['small', 'medium', 'large'].map(sz => (
                                  <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', width: '70px', color: 'var(--text-muted)' }}>
                                      {sz === 'small' ? 'ขนาดเล็ก' : sz === 'medium' ? 'ขนาดกลาง' : 'ขนาดใหญ่'}
                                    </span>
                                    <input 
                                       type="number" 
                                       min="0"
                                       value={scope.sizes[sz]} 
                                       onChange={e => {
                                          const newScopes = [...scopes];
                                          newScopes[idx].sizes[sz] = e.target.value;
                                          setScopes(newScopes);
                                       }}
                                       style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '70px', fontSize: '0.85rem', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{scope.id === 's_carpet' ? 'ผืน' : 'ตัว'}</span>
                                  </div>
                               ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
                {quotationType === 'recurring' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ประเภทสถานที่</label>
                    <select value={recurringPlaceType} onChange={e => setRecurringPlaceType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}>
                      {placeTypes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>จำนวนพนักงาน (คน)</label>
                    <input type="number" min="1" value={recurringWorkers} onChange={e => setRecurringWorkers(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>จำนวนวันทำงาน/สัปดาห์</label>
                    <select value={recurringWorkDays} onChange={e => setRecurringWorkDays(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}>
                      <option>7 วัน (ทุกวัน)</option>
                      <option>6 วัน (จันทร์-เสาร์)</option>
                      <option>5 วัน (จันทร์-ศุกร์)</option>
                      <option>3 วัน / สัปดาห์</option>
                      <option>1 วัน / สัปดาห์</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={workOnHolidays} onChange={e => setWorkOnHolidays(e.target.checked)} style={{ transform: 'scale(1.1)' }} /> ทำงานวันหยุดนักขัตฤกษ์
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeEquipment} onChange={e => setIncludeEquipment(e.target.checked)} style={{ transform: 'scale(1.1)' }} /> รับอุปกรณ์และน้ำยาทำความสะอาดด้วย
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeConsumables} onChange={e => setIncludeConsumables(e.target.checked)} style={{ transform: 'scale(1.1)' }} /> รับของใช้สิ้นเปลือง (สบู่, ทิชชู่, ถุงขยะ)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeBigCleaning} onChange={e => setIncludeBigCleaning(e.target.checked)} style={{ transform: 'scale(1.1)' }} /> พ่วงบริการ Big Cleaning ประจำปี
                    </label>
                  </div>
                  
                  {includeBigCleaning && (
                    <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '8px', border: '1px solid #fdba74', display: 'flex', gap: '16px' }}>
                       <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.85rem', color: '#9a3412', display: 'block', marginBottom: '6px', fontWeight: '600' }}>จำนวนครั้ง/ปี:</label>
                          <input type="number" min="0" value={bigCleaningTimes} onChange={e => setBigCleaningTimes(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fdba74', outline: 'none' }} placeholder="เช่น 2" />
                       </div>
                       <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.85rem', color: '#9a3412', display: 'block', marginBottom: '6px', fontWeight: '600' }}>ต้นทุน Big Clean ต่อครั้ง (บาท):</label>
                          <input type="number" min="0" value={bigCleaningCost} onChange={e => setBigCleaningCost(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fdba74', outline: 'none' }} placeholder="เช่น 15000" />
                       </div>
                    </div>
                  )}
                  
                  {includeConsumables && (
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                       <div>
                          <label style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>สบู่เหลว</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input type="number" min="0" value={consumables.soapGallons} onChange={e => setConsumables({...consumables, soapGallons: e.target.value})} style={{ width: '120px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="จำนวน..." />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>แกลลอน</span>
                          </div>
                       </div>
                       <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: 0 }} />
                       <div>
                          <label style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>ถุงขยะ (กิโลกรัม)</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {Object.keys(consumables.trashBags).map(size => (
                               <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <span style={{ fontSize: '0.9rem', width: '90px', color: 'var(--text-main)' }}>{size}:</span>
                                 <input type="number" min="0" value={consumables.trashBags[size]} onChange={e => setConsumables({...consumables, trashBags: {...consumables.trashBags, [size]: e.target.value}})} style={{ width: '90px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }} placeholder="กก." />
                               </div>
                            ))}
                          </div>
                       </div>
                       <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: 0 }} />
                       <div>
                          <label style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>กระดาษทิชชู่ (ม้วน/ห่อ)</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.keys(consumables.tissues).map(type => (
                               <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <span style={{ fontSize: '0.9rem', width: '160px', color: 'var(--text-main)' }}>{type}:</span>
                                 <input type="number" min="0" value={consumables.tissues[type]} onChange={e => setConsumables({...consumables, tissues: {...consumables.tissues, [type]: e.target.value}})} style={{ width: '90px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }} placeholder="จำนวน" />
                               </div>
                            ))}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {quotationType === 'others' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ชื่อสินค้า / บริการพิเศษ</label>
                    <input type="text" value={otherProductName} onChange={e => setOtherProductName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} placeholder="เช่น น้ำยาขัดพื้นปูน, บริการอบโอโซน" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>จำนวน</label>
                      <input type="number" min="1" value={otherProductQty} onChange={e => setOtherProductQty(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>หน่วย</label>
                      <input type="text" value={otherProductUnit} onChange={e => setOtherProductUnit(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} placeholder="เช่น แกลลอน, ชิ้น, ครั้ง" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>ราคาต่อหน่วย (บาท)</label>
                    <input type="number" min="0" value={otherProductPrice} onChange={e => setOtherProductPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  handleAutoEstimate();
                  setIsEstimatorModalOpen(false);
                }} 
                style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', marginTop: '16px', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 169, 80, 0.2)' }} 
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#008a40'} 
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
              >
                เพิ่มรายการลงในใบเสนอราคา
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== Modal: Gemini AI ผู้ช่วยประเมินราคา ==================== */}
      {isGeminiModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #3b82f6' }}>
            <button onClick={() => { setIsGeminiModalOpen(false); setGeminiGeneratedItems([]); setGeminiPrompt(''); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #eff6ff', paddingBottom: '16px' }}>
              <div style={{ backgroundColor: '#dbeafe', padding: '10px', borderRadius: '10px', fontSize: '24px' }}>
                ✨🤖
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>Gemini AI ผู้ช่วยประเมินราคาอัจฉริยะ</h2>
                <p style={{ fontSize: '0.85rem', color: '#60a5fa', margin: 0, marginTop: '2px' }}>วิเคราะห์ขอบเขตงานและจัดสรรราคากลางด้วย AI ของ Google DeepMind</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>อธิบายลักษณะงานที่ต้องการให้ Gemini ประเมิน (Prompt)</label>
                <textarea 
                  rows="4" 
                  value={geminiPrompt} 
                  onChange={e => setGeminiPrompt(e.target.value)} 
                  placeholder="ตัวอย่าง: ทำความสะอาดโกดังเก็บของ 1000 ตร.ม. ขจัดคราบน้ำมันและคราบเขม่าบนผนัง ขอพนักงาน 8 คน ทำงาน 2 วัน พร้อมอุปกรณ์รถกระเช้า..." 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>

              {/* คำแนะนำควิกคีย์ */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ตัวอย่างคำสั่งแนะนำ:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {[
                    'บิ๊กคลีนนิ่งโกดังโรงงาน 800 ตรม คราวน้ำมันเพดานสูง',
                    'ซักพรมและดูดไรฝุ่นออฟฟิศขนาด 400 ตารางเมตร',
                    'Big Cleaning คอนโดหรู 2 ห้องนอน ขัดห้องน้ำและเช็ดระเบียงกระจก'
                  ].map(txt => (
                    <button 
                      key={txt} 
                      type="button" 
                      onClick={() => setGeminiPrompt(txt)} 
                      style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-main)' }}
                    >
                      💡 {txt}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGeminiGenerate}
                disabled={isGeminiGenerating || !geminiPrompt.trim()}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isGeminiGenerating ? (
                  <>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Gemini กำลังวิเคราะห์โจทย์...
                  </>
                ) : '🚀 ส่งคำสั่งประเมินราคาด้วย Gemini AI'}
              </button>

              {/* แสดงผลการเจน */}
              {geminiGeneratedItems.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '2px dashed #bfdbfe', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '12px' }}>📊 รายการประเมินราคากลางที่สร้างโดย Gemini AI</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {geminiGeneratedItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{item.description}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            จำนวน: {item.qty} {item.unit} x ราคาต่อหน่วย: {item.price.toLocaleString()} บาท
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0369a1' }}>
                          {(item.qty * item.price).toLocaleString()} ฿
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontWeight: '600', color: '#1e40af' }}>ราคารวมที่ประเมินได้:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                      {geminiGeneratedItems.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString()} บาท
                    </span>
                  </div>

                  <button 
                    onClick={handleApplyGeminiItems}
                    style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '16px', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                  >
                    📥 นำรายการประเมินทั้งหมดลงสู่ใบเสนอราคาหลัก
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
