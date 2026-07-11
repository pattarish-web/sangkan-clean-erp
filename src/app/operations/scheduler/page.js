'use client';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, AlertTriangle, Check, Plus, Users, ArrowLeft, ChevronLeft, ChevronRight, X, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations, fetchData, saveData, deleteData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function BigCleaningScheduler() {
  const showToast = useToast();
  
  const [quotations, setQuotations] = useState([]);
  const [events, setEvents] = useState([]); // { id, projectId, projectName, customer, date, team, days }
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form States for Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ทีมปฏิบัติการ A');
  const [durationDays, setDurationDays] = useState(1);

  // ทีมงานที่ว่างให้จัดสรร
  const teams = ['ทีมปฏิบัติการ A', 'ทีมปฏิบัติการ B', 'ทีมปฏิบัติการ C', 'ทีมปฏิบัติการ D'];

  useEffect(() => {
    async function loadData() {
      try {
        const qData = await fetchQuotations();
        // กรองเฉพาะงานที่ไม่ใช่แม่บ้านประจำ (หรือจำลองกรองเฉพาะ Big Cleaning)
        const bigCleanQuotes = qData.filter(q => {
          if (q.items && q.items[0]) {
            return q.items[0].unit !== 'เดือน';
          }
          return true;
        });
        setQuotations(bigCleanQuotes);

        // โหลดนัดหมายจาก Database
        const savedEvents = await fetchData('BigcleanSchedule');
        setEvents(savedEvents || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  // บันทึกนัดหมายคิวงาน
  const handleAddBooking = async () => {
    if (!selectedQuoteId || !selectedDate) {
      showToast('กรุณาระบุเลขใบเสนอราคาและเลือกวันที่นัดหมาย!', 'warning');
      return;
    }

    const quote = quotations.find(q => q.id === selectedQuoteId);

    if (quote && quote.status !== 'approved') {
      showToast('⚠️ ไม่สามารถจองคิวทีมปฏิบัติการได้! ใบเสนอราคาของโครงการนี้ยังไม่ได้รับการอนุมัติ (Approved) จากลูกค้า', 'error');
      return;
    }
    
    // ตรวจสอบการทับซ้อนของคิวงาน (Conflict Check)
    // เช็คว่าทีมที่เลือก มีงานอยู่แล้วในวันที่ตรงกันหรือไม่
    const hasConflict = events.some(e => {
      // เช็คขอบเขตวันของงานแต่ละอัน
      const start1 = new Date(e.date);
      const end1 = new Date(e.date);
      end1.setDate(end1.getDate() + (e.days - 1));

      const start2 = new Date(selectedDate);
      const end2 = new Date(selectedDate);
      end2.setDate(end2.getDate() + (Number(durationDays) - 1));

      const isOverlapping = (start2 <= end1 && end2 >= start1);
      return e.team === selectedTeam && isOverlapping;
    });

    if (hasConflict) {
      showToast(`⚠️ เกิดการจองซ้อน! ${selectedTeam} มีคิวงานอื่นในช่วงเวลาดังกล่าวอยู่แล้ว`, 'error');
      return;
    }

    const newEvent = {
      id: `BC${Date.now()}`,
      projectId: selectedQuoteId,
      projectName: quote ? (quote.projectName || 'บริการ Big Cleaning') : 'บริการ Big Cleaning',
      customer: quote ? quote.customer : 'ไม่ได้ระบุชื่อลูกค้า',
      date: selectedDate,
      team: selectedTeam,
      days: Number(durationDays) || 1
    };

    const updated = [...events, newEvent];
    setEvents(updated);
    await saveData('BigcleanSchedule', newEvent);
    setIsModalOpen(false);
    showToast(`จองคิวงานนัดหมายของทีมสำเร็จเรียบร้อยแล้ว!`, 'success');
  };

  // ลบนัดหมายคิวงาน
  const handleDeleteBooking = async (id) => {
    if (confirm('คุณต้องการยกเลิกการนัดหมายและคิวจัดทีมงานครั้งนี้ใช่หรือไม่?')) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      await deleteData('BigcleanSchedule', String(id));
      showToast('ยกเลิกคิวงานและตารางของทีมเรียบร้อยแล้ว', 'info');
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

  // ช่วยกรองนัดหมายที่ตรงกับวันในปฏิทิน
  const getEventsForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    return events.filter(e => {
      // เช็คว่าวันนั้นอยู่ในขอบเขตการทำงานหรือไม่ (e.date ถึง e.date + e.days)
      const eStart = new Date(e.date);
      const eEnd = new Date(e.date);
      eEnd.setDate(eEnd.getDate() + (e.days - 1));

      const target = new Date(dateStr);
      return target >= eStart && target <= eEnd;
    });
  };

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/operations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>ตารางนัดหมาย & จัดทีม Big Cleaning</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>ปฏิทินควบคุมงานภาคปฏิบัติการ วางแผนคิวงานและทีมขัดล้างทำความสะอาดครั้งเดียว</p>
          </div>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} /> นัดวัน & จัดกำลังทีม
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* คอนเทนเนอร์ปฏิทิน */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} /> {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
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

          {/* ตารางปฏิทิน */}
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
              <div key={`blank-${i}`} style={{ height: '90px', backgroundColor: '#f8fafc', borderRadius: '6px' }}></div>
            ))}
            {daysArray.map(day => {
              const dayEvents = getEventsForDay(day);

              return (
                <div key={day} style={{ height: '90px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'white' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{day}</span>
                  
                  {/* แถบกิจกรรมย่อในปฏิทิน */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', overflowY: 'auto', flex: 1 }}>
                    {dayEvents.map(e => (
                      <div 
                        key={e.id}
                        title={`${e.projectName} - ${e.team}`}
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '2px 4px', 
                          borderRadius: '3px', 
                          backgroundColor: e.team.includes('A') ? '#fef3c7' : e.team.includes('B') ? '#dcfce7' : '#e0f2fe',
                          color: e.team.includes('A') ? '#b45309' : e.team.includes('B') ? '#15803d' : '#0369a1',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {e.team.replace('ปฏิบัติการ ', '')}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ข้อมูลรายการจองทีมขวา */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              รายการคิวงาน Big Cleaning ทั้งหมด
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {events.length > 0 ? (
                events.map(e => (
                  <div key={e.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                    <button 
                      onClick={() => handleDeleteBooking(e.id)} 
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <X size={16} />
                    </button>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {e.team}
                      </span>
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{e.projectName}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ลูกค้า: {e.customer}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} /> {e.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> ระยะเวลา {e.days} วัน
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ยังไม่มีการจัดตารางทีมงาน Big Cleaning
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal จองคิวงาน & จัดกำลังพล */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)' }}>จัดตารางงาน Big Cleaning</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>เลือกใบเสนอราคา (โครงการที่ได้รับอนุมัติ)</label>
                <select value={selectedQuoteId} onChange={e => setSelectedQuoteId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}>
                  <option value="">-- กรุณาเลือกโครงการ --</option>
                  {quotations.map(q => (
                    <option key={q.id} value={q.id}>{q.id} - {q.projectName || 'ทั่วไป'} ({q.customer})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>จัดสรรทีมปฏิบัติการ</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}>
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>วันเริ่มทำความสะอาด</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>จำนวนวันทำงาน</label>
                  <input type="number" min={1} value={durationDays} onChange={e => setDurationDays(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleAddBooking} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกตารางนัด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
