'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Briefcase, FileText, CheckCircle, AlertTriangle, Plus, Trash2, X, PlusCircle, Check, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { fetchData, saveData, fetchQuotations, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function OperationsPage() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('bigcleaning'); // 'recurring' or 'bigcleaning'
  
  const [bigCleaningJobs, setBigCleaningJobs] = useState([]);
  const [recurringMaids, setRecurringMaids] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleDays, setRescheduleDays] = useState(1);
  const [rescheduleTeam, setRescheduleTeam] = useState('ทีมปฏิบัติการ A');
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isBigCleaningModalOpen, setIsBigCleaningModalOpen] = useState(false);

  // Form states - Recurring
  const [recRefQ, setRecRefQ] = useState('');
  const [recClient, setRecClient] = useState('');
  const [recMaid, setRecMaid] = useState('');
  const [recSchedule, setRecSchedule] = useState('จันทร์ - ศุกร์ (08.00 - 17.00)');
  const [recStatus, setRecStatus] = useState('เข้างานแล้ว');

  // Form states - Big Cleaning
  const [bcRefQ, setBcRefQ] = useState('');
  const [bcClient, setBcClient] = useState('');
  const [bcDate, setBcDate] = useState('');
  const [bcTime, setBcTime] = useState('08:30 - 16:30');
  const [bcTeamSize, setBcTeamSize] = useState(5);
  const [bcStatus, setBcStatus] = useState('กำลังดำเนินการ');

  /** แปลงใบจองวันทำงานจาก CRM → ใบงานปฏิบัติการ */
  const scheduleToJob = (event) => {
    const ref = event.projectId || event.refQuotation || '';
    const jobId =
      event.jobId ||
      (ref ? String(ref).replace(/^QT/i, 'OPB') : null) ||
      `OPB-${event.id}`;
    return {
      id: jobId,
      client: event.customer || event.client || '-',
      date: event.date || '',
      time: event.time || '08:00',
      teamSize: Number(event.teamSize || event.estimatedPeoplePerDay || 1) || 1,
      estimatedPeoplePerDay: event.estimatedPeoplePerDay || event.teamSize || null,
      manpower: event.manpower || null,
      status: event.jobStatus || 'รอดำเนินการ',
      refQuotation: ref,
      projectName: event.projectName || '',
      team: event.team || '',
      days: Number(event.days) || 1,
      address: event.address || '',
      mapUrl: event.mapUrl || '',
      contacts: event.contacts || [],
      scheduleId: event.id,
      fromSchedule: true,
    };
  };

  const mergeJobsWithSchedules = (jobs, schedules) => {
    const list = Array.isArray(jobs) ? [...jobs] : [];
    const byRef = new Set(
      list.flatMap((j) =>
        [j.id, j.refQuotation, j.projectId, j.scheduleId]
          .filter(Boolean)
          .map((x) => String(x))
      )
    );

    for (const event of schedules || []) {
      const ref = String(event.projectId || event.refQuotation || '');
      const sid = String(event.id || '');
      const already =
        (ref && (byRef.has(ref) || byRef.has(ref.replace(/^QT/i, 'OPB')))) ||
        (sid && byRef.has(sid)) ||
        list.some(
          (j) =>
            String(j.scheduleId) === sid ||
            String(j.refQuotation) === ref ||
            (ref && String(j.id) === ref.replace(/^QT/i, 'OPB'))
        );
      if (already) continue;
      const job = scheduleToJob(event);
      list.push(job);
      byRef.add(String(job.id));
      if (ref) byRef.add(ref);
      if (sid) byRef.add(sid);
    }

    return list.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  };

  const loadAllData = async () => {
    try {
      const [opsRec, opsBc, emps, custs, qs, schedules] = await Promise.all([
        fetchData('operations_recurring'),
        fetchData('operations_bigcleaning'),
        fetchData('Employees'),
        fetchData('Customers'),
        fetchQuotations(),
        fetchData('BigcleanSchedule'),
      ]);

      const scheduleList = Array.isArray(schedules) ? schedules : [];
      const mergedJobs = mergeJobsWithSchedules(opsBc || [], scheduleList);

      // บันทึกใบงานที่ยังไม่มีใน DB (จากคิวจอง CRM) ให้ตารางคงอยู่ถัดไป
      const existingIds = new Set((opsBc || []).map((j) => String(j.id)));
      for (const job of mergedJobs) {
        if (job.fromSchedule && !existingIds.has(String(job.id))) {
          const { fromSchedule, ...toSave } = job;
          try {
            await saveData('operations_bigcleaning', toSave);
            existingIds.add(String(job.id));
          } catch (err) {
            console.error('sync schedule→job', err);
          }
        }
      }

      setRecurringMaids(opsRec || []);
      setBigCleaningJobs(mergedJobs.map(({ fromSchedule, ...j }) => j));
      setEmployees(emps || []);
      setCustomers(custs || []);
      setScheduleEvents(scheduleList);
      
      const approvedQs = (qs || []).filter(q => q.status === 'approved');
      setQuotations(approvedQs);

      if (approvedQs.length > 0) {
        setRecRefQ(approvedQs[0].id);
        setRecClient(approvedQs[0].customer);
        setBcRefQ(approvedQs[0].id);
        setBcClient(approvedQs[0].customer);
      }
      if (emps && emps.length > 0) {
        setRecMaid(emps[0].name);
      }
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลหน้าปฏิบัติการ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync clients when quotation references change
  const handleRecRefQChange = (qid) => {
    setRecRefQ(qid);
    const q = quotations.find(item => item.id === qid);
    if (q) setRecClient(q.customer);
  };

  const handleBcRefQChange = (qid) => {
    setBcRefQ(qid);
    const q = quotations.find(item => item.id === qid);
    if (q) setBcClient(q.customer);
  };

  // Submit handlers
  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    if (!recClient || !recMaid) {
      showToast('กรุณาระบุข้อมูลหน่วยงานและพนักงานให้ครบถ้วน', 'error');
      return;
    }

    const newObj = {
      id: recRefQ ? recRefQ.replace('QT', 'OPR') : 'OPR' + Date.now().toString().slice(-6),
      client: recClient,
      maid: recMaid,
      schedule: recSchedule,
      status: recStatus,
      refQuotation: recRefQ
    };

    try {
      const updated = [...recurringMaids, newObj];
      await saveData('operations_recurring', newObj);
      setRecurringMaids(updated);
      setIsRecurringModalOpen(false);
      showToast('จัดส่งพนักงานลงไซต์เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleSaveBigCleaning = async (e) => {
    e.preventDefault();
    if (!bcClient || !bcDate) {
      showToast('กรุณาระบุสถานที่และวันเข้าทำงานให้ครบถ้วน', 'error');
      return;
    }

    const newObj = {
      id: bcRefQ ? bcRefQ.replace('QT', 'OPB') : 'OPB' + Date.now().toString().slice(-6),
      client: bcClient,
      date: bcDate,
      time: bcTime,
      teamSize: Number(bcTeamSize) || 1,
      status: bcStatus,
      refQuotation: bcRefQ
    };

    try {
      const updated = [...bigCleaningJobs, newObj];
      await saveData('operations_bigcleaning', newObj);
      setBigCleaningJobs(updated);
      setIsBigCleaningModalOpen(false);
      showToast('สร้างใบงาน Big Cleaning เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบใบงานนี้ใช่หรือไม่?')) return;
    
    try {
      if (type === 'recurring') {
        await deleteData('operations_recurring', id);
        setRecurringMaids(recurringMaids.filter(item => item.id !== id));
        showToast('ลบรายการสัญญาแม่บ้านประจำออกแล้ว', 'success');
      } else {
        await deleteData('operations_bigcleaning', id);
        setBigCleaningJobs(bigCleaningJobs.filter(item => item.id !== id));
        showToast('ลบใบงาน Big Cleaning ออกแล้ว', 'success');
      }
    } catch(err) {
      showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  };

  const handleStatusUpdate = async (type, id, newStatus) => {
    try {
      if (type === 'recurring') {
        const updated = recurringMaids.map(item => item.id === id ? { ...item, status: newStatus } : item);
        const match = updated.find(item => item.id === id);
        if (match) await saveData('operations_recurring', match);
        setRecurringMaids(updated);
        showToast('อัปเดตสถานะของแม่บ้านเรียบร้อย', 'success');
      } else {
        const updated = bigCleaningJobs.map(item => item.id === id ? { ...item, status: newStatus } : item);
        const match = updated.find(item => item.id === id);
        if (match) await saveData('operations_bigcleaning', match);
        setBigCleaningJobs(updated);
        showToast('อัปเดตสถานะงาน Big Cleaning เรียบร้อย', 'success');
      }
    } catch (err) {
      showToast('อัปเดตสถานะล้มเหลว', 'error');
    }
  };

  const toDateStr = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day) => {
    const dateStr = toDateStr(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const target = new Date(dateStr);
    return scheduleEvents.filter((e) => {
      if (!e?.date) return false;
      const eStart = new Date(e.date);
      const eEnd = new Date(e.date);
      eEnd.setDate(eEnd.getDate() + (Number(e.days) || 1) - 1);
      return target >= eStart && target <= eEnd;
    });
  };

  const teamColor = (team = '') => {
    if (team.includes('A')) return { bg: '#fef3c7', color: '#b45309' };
    if (team.includes('B')) return { bg: '#dcfce7', color: '#15803d' };
    if (team.includes('C')) return { bg: '#e0f2fe', color: '#0369a1' };
    return { bg: '#f3e8ff', color: '#7e22ce' };
  };

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const blankDays = Array(firstDay).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDayEvents = useMemo(() => {
    if (!selectedCalDay) return [];
    return getEventsForDay(selectedCalDay);
  }, [selectedCalDay, scheduleEvents, calendarDate]);

  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...scheduleEvents]
      .filter((e) => e?.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter((e) => {
        const end = new Date(e.date);
        end.setDate(end.getDate() + (Number(e.days) || 1) - 1);
        return end >= today;
      })
      .slice(0, 8);
  }, [scheduleEvents]);

  const openScheduleDetail = (event) => setDetailEvent(event);

  const openReschedule = (event) => {
    setRescheduleEvent(event);
    setRescheduleDate(event.date || '');
    setRescheduleDays(Number(event.days) || 1);
    setRescheduleTeam(event.team || 'ทีมปฏิบัติการ A');
    setDetailEvent(null);
  };

  const syncJobDateFromSchedule = async (event, next) => {
    const ref = String(next.projectId || next.refQuotation || event.projectId || event.refQuotation || '');
    const jobIdCandidates = [
      next.jobId,
      event.jobId,
      ref ? ref.replace(/^QT/i, 'OPB') : null,
      `OPB-${next.id || event.id}`,
    ].filter(Boolean);

    let matched = bigCleaningJobs.find(
      (j) =>
        jobIdCandidates.includes(String(j.id)) ||
        String(j.scheduleId) === String(next.id || event.id) ||
        (ref && String(j.refQuotation) === ref)
    );

    if (matched) {
      const updatedJob = {
        ...matched,
        date: next.date,
        days: Number(next.days) || 1,
        team: next.team || matched.team,
        teamSize: next.teamSize || next.estimatedPeoplePerDay || matched.teamSize,
        scheduleId: next.id || matched.scheduleId,
      };
      await saveData('operations_bigcleaning', updatedJob);
      setBigCleaningJobs((prev) => prev.map((j) => (j.id === matched.id ? updatedJob : j)));
    }
  };

  const confirmReschedule = async () => {
    if (!rescheduleEvent || !rescheduleDate) {
      showToast('กรุณาเลือกวันเริ่มงานใหม่', 'warning');
      return;
    }
    setIsRescheduling(true);
    try {
      const updatedEvent = {
        ...rescheduleEvent,
        date: rescheduleDate,
        days: Math.max(1, Number(rescheduleDays) || 1),
        team: rescheduleTeam || rescheduleEvent.team,
      };
      await saveData('BigcleanSchedule', updatedEvent);
      setScheduleEvents((prev) => prev.map((e) => (String(e.id) === String(updatedEvent.id) ? updatedEvent : e)));
      await syncJobDateFromSchedule(rescheduleEvent, updatedEvent);

      // เลื่อนปฏิทินไปเดือนของวันใหม่
      const d = new Date(rescheduleDate);
      if (!Number.isNaN(d.getTime())) {
        setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
        setSelectedCalDay(d.getDate());
      }

      showToast(`โยกย้ายคิวเป็นวันที่ ${rescheduleDate} เรียบร้อยแล้ว`, 'success');
      setRescheduleEvent(null);
    } catch (e) {
      console.error(e);
      showToast('โยกย้ายวันไม่สำเร็จ', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>ปฏิบัติการหน้างาน (Operations)</h2>
          <p style={{ color: 'var(--text-muted)' }}>จัดการตารางงาน, การส่งกำลังพลเข้าไซต์งาน และการเช็กชื่อพนักงานประจำวัน</p>
          
          {/* เมนูย่อยปฏิบัติการ */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <Link href="/operations/scheduler" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 ปฏิทินจองทีม Big Cleaning
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <Link href="/operations/execution" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✍️ บันทึกปฏิบัติงาน & ส่งมอบจ๊อบ (Before/After & บิล)
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('bigcleaning')}
          style={{ 
            padding: '16px 24px', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            backgroundColor: 'transparent',
            color: activeTab === 'bigcleaning' ? '#d97706' : 'var(--text-muted)',
            borderBottom: activeTab === 'bigcleaning' ? '4px solid #f59e0b' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            border: 'none', cursor: 'pointer'
          }}>
          <Briefcase size={20} /> ทีม Big Cleaning ({bigCleaningJobs.length})
        </button>
        <button 
          onClick={() => setActiveTab('recurring')}
          style={{ 
            padding: '16px 24px', 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            backgroundColor: 'transparent',
            color: activeTab === 'recurring' ? 'var(--primary-dark)' : 'var(--text-muted)',
            borderBottom: activeTab === 'recurring' ? '4px solid var(--primary-color)' : '4px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            border: 'none', cursor: 'pointer'
          }}>
          <Users size={20} /> แม่บ้านประจำหน่วยงาน ({recurringMaids.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px', minHeight: '500px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดตารางงาน...</div>
        ) : (
          <>
            {/* Tab 1: แม่บ้านประจำ */}
            {activeTab === 'recurring' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>ตารางงานแม่บ้านประจำหน่วยงาน</h3>
                  <button onClick={() => setIsRecurringModalOpen(true)} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} /> จัดพนักงานลงหน่วยงาน
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รหัสจัดงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>หน่วยงาน / ลูกค้า</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>พนักงานประจำ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รอบเวลาทำงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>สถานะ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500', width: '220px' }}>จัดการตารางงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringMaids.map((rec, idx) => (
                      <tr key={rec.id || idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rec.status === 'ลาหยุด 1 คน' ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rec.id}</td>
                        <td style={{ padding: '16px 8px', fontWeight: '600', color: 'var(--text-main)' }}>{rec.client}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} color="var(--primary-color)"/> {rec.maid}</span>
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> {rec.schedule}</span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <select 
                            value={rec.status} 
                            onChange={e => handleStatusUpdate('recurring', rec.id, e.target.value)}
                            style={{ 
                              backgroundColor: rec.status === 'เข้างานแล้ว' ? '#dcfce7' : rec.status === 'ลาหยุด 1 คน' ? '#fee2e2' : '#f1f5f9', 
                              color: rec.status === 'เข้างานแล้ว' ? '#166534' : rec.status === 'ลาหยุด 1 คน' ? '#991b1b' : 'var(--text-muted)', 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' 
                            }}
                          >
                            <option value="เข้างานแล้ว">🟢 เข้างานแล้ว</option>
                            <option value="ยังไม่มา">⚪ ยังไม่มา</option>
                            <option value="ลาหยุด 1 คน">🔴 ลาหยุด 1 คน</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {rec.status === 'ลาหยุด 1 คน' && (
                            <button onClick={async () => {
                              const updated = { ...rec, status: 'มีคนสำรองแล้ว', substituteNote: `จัดส่งคนสำรอง ${new Date().toLocaleDateString('th-TH')}` };
                              await saveData('operations_recurring', updated);
                              setRecurringMaids(recurringMaids.map(r => r.id === rec.id ? updated : r));
                              showToast('บันทึกการจัดส่งพนักงานสำรองแล้ว', 'success');
                            }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><AlertTriangle size={14}/> หาคนแทน</button>
                            )}
                            <button onClick={() => handleDeleteItem('recurring', rec.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="ลบตารางงาน">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {recurringMaids.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่พบข้อมูลงานแม่บ้านประจำหน่วยงาน</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Big Cleaning */}
            {activeTab === 'bigcleaning' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                {/* ปฏิทินคิวจาก CRM */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '28px', alignItems: 'start' }}>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', backgroundColor: '#fffbeb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.15rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarDays size={20} /> ปฏิทินคิวจองจาก CRM
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.95rem' }}>
                          {MONTH_NAMES[calMonth]} {calYear + 543}
                        </span>
                        <button type="button" onClick={() => { setCalendarDate(new Date(calYear, calMonth - 1, 1)); setSelectedCalDay(null); }} style={{ background: 'white', border: '1px solid #fcd34d', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}>
                          <ChevronLeft size={16} />
                        </button>
                        <button type="button" onClick={() => { setCalendarDate(new Date(calYear, calMonth + 1, 1)); setSelectedCalDay(null); }} style={{ background: 'white', border: '1px solid #fcd34d', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: '#92400e', marginBottom: '6px' }}>
                      {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d) => <div key={d}>{d}</div>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {blankDays.map((_, i) => (
                        <div key={`blank-${i}`} style={{ minHeight: '72px', backgroundColor: '#fef3c7', borderRadius: '6px', opacity: 0.4 }} />
                      ))}
                      {daysArray.map((day) => {
                        const dayEvents = getEventsForDay(day);
                        const isSelected = selectedCalDay === day;
                        const isToday =
                          day === new Date().getDate() &&
                          calMonth === new Date().getMonth() &&
                          calYear === new Date().getFullYear();
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedCalDay(day)}
                            style={{
                              minHeight: '72px',
                              border: isSelected ? '2px solid #d97706' : '1px solid #fde68a',
                              borderRadius: '6px',
                              padding: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              backgroundColor: isSelected ? '#fff7ed' : 'white',
                              cursor: 'pointer',
                              textAlign: 'left',
                              boxShadow: isToday ? 'inset 0 0 0 1px #f59e0b' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isToday ? '#d97706' : '#78716c' }}>{day}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', overflow: 'hidden', flex: 1 }}>
                              {dayEvents.slice(0, 2).map((e) => {
                                const c = teamColor(e.team);
                                return (
                                  <div
                                    key={e.id}
                                    title={`${e.customer} — ${e.team}`}
                                    style={{
                                      fontSize: '0.65rem',
                                      padding: '1px 3px',
                                      borderRadius: '3px',
                                      backgroundColor: c.bg,
                                      color: c.color,
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {e.customer || e.projectName || e.team}
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <span style={{ fontSize: '0.6rem', color: '#a16207' }}>+{dayEvents.length - 2} คิว</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#a16207' }}>
                      คิวจาก CRM เมื่ออนุมัติใบเสนอราคา (ขั้น 3) · รวม {scheduleEvents.length} นัดหมาย
                    </p>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', backgroundColor: 'white', minHeight: '320px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      {selectedCalDay
                        ? `คิววันที่ ${selectedCalDay} ${MONTH_NAMES[calMonth]} ${calYear + 543}`
                        : 'คิวที่กำลังจะถึง'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                      {(selectedCalDay ? selectedDayEvents : upcomingBookings).length > 0 ? (
                        (selectedCalDay ? selectedDayEvents : upcomingBookings).map((e) => {
                          const c = teamColor(e.team);
                          return (
                            <div key={e.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: c.bg, color: c.color }}>
                                  {e.team || 'ทีมปฏิบัติการ'}
                                </span>
                                {e.source === 'crm_approved' && (
                                  <span style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>จาก CRM</span>
                                )}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{e.customer || '-'}</div>
                              <div style={{
                                fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}>{e.projectName}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {e.date}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {e.days || 1} วัน</span>
                                {e.teamSize || e.estimatedPeoplePerDay ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> {e.teamSize || e.estimatedPeoplePerDay} คน/วัน</span>
                                ) : null}
                              </div>
                              {e.address ? (
                                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                  <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {e.address}
                                </div>
                              ) : null}
                              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => openScheduleDetail(e)}
                                  style={{ flex: 1, minWidth: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  ดูรายละเอียด
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReschedule(e)}
                                  style={{ flex: 1, minWidth: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  โยกย้ายวัน
                                </button>
                                <Link
                                  href={`/operations/delivery?scheduleId=${encodeURIComponent(e.id)}&quoteId=${encodeURIComponent(e.projectId || e.refQuotation || '')}`}
                                  style={{ flex: '1 1 100%', textAlign: 'center', padding: '7px 8px', borderRadius: '6px', border: '1px solid #a5f3fc', background: '#ecfeff', color: '#0e7490', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                                >
                                  ✓ ยืนยัน → สร้างใบส่งมอบงาน
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {selectedCalDay ? 'ไม่มีคิวในวันนี้' : 'ยังไม่มีการจองคิวจาก CRM'}
                        </div>
                      )}
                    </div>
                    <Link
                      href="/operations/scheduler"
                      style={{ display: 'inline-block', marginTop: '14px', fontSize: '0.85rem', color: '#d97706', fontWeight: 600, textDecoration: 'none' }}
                    >
                      เปิดหน้าจัดตารางเต็ม →
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>โปรเจกต์ Big Cleaning (รายครั้ง)</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ดึงจากใบจองวันทำงาน CRM อัตโนมัติ · {bigCleaningJobs.length} ใบงาน
                    </p>
                  </div>
                  <button onClick={() => setIsBigCleaningModalOpen(true)} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} /> สร้างใบงาน Big Cleaning
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>รหัสใบงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>ลูกค้า / สถานที่</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>วัน-เวลา เข้าปฏิบัติงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>จำนวนทีมงาน</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>สถานะ</th>
                      <th style={{ padding: '16px 8px', fontWeight: '500' }}>ลบใบงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bigCleaningJobs.map((job, idx) => (
                      <tr key={job.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          <div>{job.id}</div>
                          {job.refQuotation ? (
                            <div style={{ fontSize: '0.7rem', color: '#0369a1', marginTop: 2 }}>อ้างอิง {job.refQuotation}</div>
                          ) : null}
                        </td>
                        <td style={{ padding: '16px 8px', fontWeight: '600', color: 'var(--text-main)' }}>
                          <div>{job.client}</div>
                          {job.projectName ? (
                            <div style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{job.projectName}</div>
                          ) : null}
                          {job.team ? (
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', marginTop: 4 }}>{job.team}</div>
                          ) : null}
                          {job.address ? (
                            <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                              <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {job.address}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {job.date}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {job.time}{job.days > 1 ? ` · ${job.days} วัน` : ''}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 8px', fontWeight: '500' }}>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <Users size={16} color="#d97706"/> {job.teamSize} คน
                             {job.estimatedPeoplePerDay ? (
                               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(ประมาณการจากใบประมาณ)</span>
                             ) : null}
                           </span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <select 
                            value={job.status} 
                            onChange={e => handleStatusUpdate('bigcleaning', job.id, e.target.value)}
                            style={{ 
                              backgroundColor: job.status === 'เสร็จสิ้นแล้ว' ? '#dcfce7' : job.status === 'กำลังดำเนินการ' ? '#e0f2fe' : '#f1f5f9', 
                              color: job.status === 'เสร็จสิ้นแล้ว' ? '#166534' : job.status === 'กำลังดำเนินการ' ? '#0284c7' : 'var(--text-muted)', 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' 
                            }}
                          >
                            <option value="รอดำเนินการ">⚪ รอดำเนินการ</option>
                            <option value="กำลังดำเนินการ">🔵 กำลังดำเนินการ</option>
                            <option value="เสร็จสิ้นแล้ว">🟢 เสร็จสิ้นแล้ว</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <button onClick={() => handleDeleteItem('bigcleaning', job.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bigCleaningJobs.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          ยังไม่มีใบงาน — เมื่อจองคิวใน CRM (ขั้น 3) รายการจะขึ้นที่นี่อัตโนมัติ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================== Modal 1: จัดพนักงานลงไซต์งาน (Recurring) ==================== */}
      {isRecurringModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveRecurring} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>จัดส่งแม่บ้านลงไซต์งาน</h3>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>อ้างอิงใบเสนอราคา (โครงการ) *</label>
                {quotations.length > 0 ? (
                  <select 
                    value={recRefQ} 
                    onChange={e => handleRecRefQChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>{q.id} - {q.projectName || q.customer}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ ไม่พบใบเสนอราคาที่ได้รับอนุมัติในระบบ</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ชื่อหน่วยงาน / ลูกค้า *</label>
                <input 
                  type="text" 
                  value={recClient} 
                  onChange={e => setRecClient(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#f8fafc' }}
                  placeholder="กรอกชื่อลูกค้า/บริษัท..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>เลือกพนักงานประจำไซต์ *</label>
                {employees.length > 0 ? (
                  <select 
                    value={recMaid} 
                    onChange={e => setRecMaid(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อพนักงาน..." 
                    value={recMaid} 
                    onChange={e => setRecMaid(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                    required 
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>รอบเวลาทำงาน</label>
                <input 
                  type="text" 
                  value={recSchedule} 
                  onChange={e => setRecSchedule(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>สถานะการทำงานเริ่มต้น</label>
                <select 
                  value={recStatus} 
                  onChange={e => setRecStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="เข้างานแล้ว">🟢 เข้างานแล้ว</option>
                  <option value="ยังไม่มา">⚪ ยังไม่มา</option>
                  <option value="ลาหยุด 1 คน">🔴 ลาหยุด 1 คน</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsRecurringModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกส่งกำลังพล</button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== Modal 2: สร้างใบงาน Big Cleaning ==================== */}
      {isBigCleaningModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSaveBigCleaning} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>สร้างใบงาน Big Cleaning</h3>
              <button type="button" onClick={() => setIsBigCleaningModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>อ้างอิงใบเสนอราคา (โครงการ) *</label>
                {quotations.length > 0 ? (
                  <select 
                    value={bcRefQ} 
                    onChange={e => handleBcRefQChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {quotations.map(q => (
                      <option key={q.id} value={q.id}>{q.id} - {q.projectName || q.customer}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ ไม่พบใบเสนอราคาที่ได้รับอนุมัติในระบบ</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>ลูกค้า / สถานที่จัดงาน *</label>
                <input 
                  type="text" 
                  value={bcClient} 
                  onChange={e => setBcClient(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#f8fafc' }}
                  placeholder="กรอกชื่อลูกค้า..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>วันทำงาน *</label>
                <input 
                  type="date" 
                  value={bcDate} 
                  onChange={e => setBcDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>เวลาเข้าปฏิบัติงาน</label>
                <input 
                  type="text" 
                  value={bcTime} 
                  onChange={e => setBcTime(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>จำนวนทีมงาน (คน) *</label>
                <input 
                  type="number" 
                  min="1" 
                  value={bcTeamSize} 
                  onChange={e => setBcTeamSize(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>สถานะใบงาน</label>
                <select 
                  value={bcStatus} 
                  onChange={e => setBcStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="รอดำเนินการ">⚪ รอดำเนินการ</option>
                  <option value="กำลังดำเนินการ">🔵 กำลังดำเนินการ</option>
                  <option value="เสร็จสิ้นแล้ว">🟢 เสร็จสิ้นแล้ว</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsBigCleaningModalOpen(false)} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกใบงาน</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: รายละเอียดคิวจอง */}
      {detailEvent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>{detailEvent.customer || 'รายละเอียดคิว'}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{detailEvent.projectName || '-'}</p>
              </div>
              <button type="button" onClick={() => setDetailEvent(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 8px', borderRadius: 6, background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.8rem' }}>{detailEvent.team || 'ทีมปฏิบัติการ'}</span>
                {detailEvent.source === 'crm_approved' && (
                  <span style={{ padding: '4px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '0.8rem' }}>จาก CRM</span>
                )}
              </div>
              <div><strong>วันเริ่มงาน:</strong> {detailEvent.date}</div>
              <div><strong>จำนวนวัน:</strong> {detailEvent.days || 1} วัน</div>
              <div><strong>กำลังพล:</strong> {detailEvent.teamSize || detailEvent.estimatedPeoplePerDay || '-'} คน/วัน</div>
              {detailEvent.projectId || detailEvent.refQuotation ? (
                <div><strong>อ้างอิงเอกสาร:</strong> {detailEvent.projectId || detailEvent.refQuotation}</div>
              ) : null}
              {detailEvent.address ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{detailEvent.address}</span>
                </div>
              ) : null}
              {detailEvent.mapUrl ? (
                <a href={detailEvent.mapUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', fontWeight: 600 }}>เปิดแผนที่</a>
              ) : null}
              {Array.isArray(detailEvent.contacts) && detailEvent.contacts.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>ผู้ติดต่อ</div>
                  {detailEvent.contacts.map((ct, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {ct.name || '-'}{ct.phone ? ` · ${ct.phone}` : ''}
                    </div>
                  ))}
                </div>
              )}
              {detailEvent.specialNotes ? (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, fontSize: '0.85rem' }}>
                  <strong>หมายเหตุ:</strong> {detailEvent.specialNotes}
                </div>
              ) : null}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setDetailEvent(null)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, cursor: 'pointer' }}>ปิด</button>
              <button type="button" onClick={() => openReschedule(detailEvent)} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, cursor: 'pointer' }}>โยกย้ายวัน</button>
              <Link
                href={`/operations/delivery?scheduleId=${encodeURIComponent(detailEvent.id)}&quoteId=${encodeURIComponent(detailEvent.projectId || detailEvent.refQuotation || '')}`}
                style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#06b6d4', color: 'white', fontWeight: 700, textDecoration: 'none' }}
              >
                ยืนยันสร้างใบส่งมอบงาน
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal: โยกย้ายวันทำงาน */}
      {rescheduleEvent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#b45309' }}>โยกย้ายวันทำงาน</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rescheduleEvent.customer}</p>
              </div>
              <button type="button" onClick={() => !isRescheduling && setRescheduleEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: '0.85rem' }}>
              วันเดิม: <strong>{rescheduleEvent.date}</strong> · {rescheduleEvent.days || 1} วัน · {rescheduleEvent.team}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>วันเริ่มงานใหม่ *</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>จำนวนวัน</label>
                <input type="number" min={1} value={rescheduleDays} onChange={(e) => setRescheduleDays(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>ทีมปฏิบัติการ</label>
                <select value={rescheduleTeam} onChange={(e) => setRescheduleTeam(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}>
                  {['ทีมปฏิบัติการ A', 'ทีมปฏิบัติการ B', 'ทีมปฏิบัติการ C', 'ทีมปฏิบัติการ D'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" disabled={isRescheduling} onClick={() => setRescheduleEvent(null)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
              <button type="button" disabled={isRescheduling} onClick={confirmReschedule} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, cursor: isRescheduling ? 'wait' : 'pointer', opacity: isRescheduling ? 0.7 : 1 }}>
                {isRescheduling ? 'กำลังบันทึก...' : 'ยืนยันโยกย้าย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
