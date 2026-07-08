'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, ArrowLeft, Plus, Edit2, Sliders, Calendar, Briefcase, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import Link from 'next/link';
import { fetchQuotations } from '@/utils/api';
import { loadSettingJson, saveSettingJson } from '@/lib/app-storage';
import { useToast } from '@/components/Toast';

export default function ProfitabilityDashboard() {
  const showToast = useToast();
  
  // โครงสร้างและข้อมูลหลัก
  const [quotations, setQuotations] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, bigcleaning, recurring
  const [adminSettings, setAdminSettings] = useState({ commissionRate: 10, minMargin: 25 });
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // States สำหรับแก้ไขต้นทุนจริง (Actual Costs Form Modal)
  const [selectedProject, setSelectedProject] = useState(null);
  const [actLabor, setActLabor] = useState('');
  const [actSupplies, setActSupplies] = useState('');
  const [actTransport, setActTransport] = useState('');
  const [actOther, setActOther] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // สำหรับเก็บรายเดือนของสัญญาระยะยาว (Recurring monthly logs)
  const [monthlyLogs, setMonthlyLogs] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const qData = await fetchQuotations();
        setQuotations(qData);

        const settings = await loadSettingJson('sangkan_settings', { commissionRate: 10, minMargin: 25 });
        setAdminSettings(settings);

        const parsed = await loadSettingJson('sangkan_actual_costs', {});
        if (Object.keys(parsed).length > 0) {
          setQuotations(prev => prev.map(q => {
            if (parsed[q.id]) {
              return { ...q, actualCosts: parsed[q.id] };
            }
            return q;
          }));
        }

        const monthly = await loadSettingJson('sangkan_monthly_logs', {});
        setMonthlyLogs(monthly);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  // เปิดแบบฟอร์มบันทึกต้นทุนจริง
  const openEditModal = (project) => {
    setSelectedProject(project);
    const existing = project.actualCosts || {};
    setActLabor(existing.labor || '');
    setActSupplies(existing.supplies || '');
    setActTransport(existing.transport || '');
    setActOther(existing.other || '');
    setIsPaid(existing.isPaid || false);
    setIsModalOpen(true);
  };

  // บันทึกฟอร์มต้นทุนจริง
  const handleSaveActualCosts = async () => {
    if (!selectedProject) return;

    const actual = {
      labor: Number(actLabor) || 0,
      supplies: Number(actSupplies) || 0,
      transport: Number(actTransport) || 0,
      other: Number(actOther) || 0,
      isPaid: isPaid
    };

    const savedCosts = await loadSettingJson('sangkan_actual_costs', {});
    savedCosts[selectedProject.id] = actual;
    await saveSettingJson('sangkan_actual_costs', savedCosts);

    // อัปเดต state
    setQuotations(prev => prev.map(q => {
      if (q.id === selectedProject.id) {
        return { ...q, actualCosts: actual };
      }
      return q;
    }));

    setIsModalOpen(false);
    showToast(`บันทึกต้นทุนจริงของใบเสนอราคา ${selectedProject.id} เรียบร้อยแล้ว!`, 'success');
  };

  // เพิ่มบันทึกประจำเดือนสำหรับแม่บ้านประจำ
  const handleAddMonthlyLog = async (projectId, monthName, revenue, labor, supplies, transport, wht) => {
    const projectLogs = monthlyLogs[projectId] || [];
    const newLog = {
      id: Date.now(),
      month: monthName,
      revenue: Number(revenue) || 0,
      labor: Number(labor) || 0,
      supplies: Number(supplies) || 0,
      transport: Number(transport) || 0,
      wht: Number(wht) || 0,
      isPaid: true
    };

    const updated = {
      ...monthlyLogs,
      [projectId]: [...projectLogs, newLog]
    };
    
    setMonthlyLogs(updated);
    await saveSettingJson('sangkan_monthly_logs', updated);
    showToast(`เพิ่มบันทึกรายรับ-รายจ่ายของรอบเดือน ${monthName} สำเร็จ!`, 'success');
  };

  // คำนวณเปอร์เซ็นต์กำไรและคอมมิชชัน
  const calculateMetrics = (project) => {
    const isRecurring = project.id.startsWith('QT') && project.items && project.items[0]?.unit === 'เดือน';
    const revenue = project.total || 0;
    
    // ต้นทุนประเมินคร่าวๆ จากประเมินราคา
    let estCost = revenue * 0.6; // default 60% if not estimated
    if (project.items && project.items[0]) {
      // ตัวอย่างจำลองดึงข้อมูลประเมินต้นทุน
      estCost = project.total * 0.55;
    }
    const estProfit = revenue - estCost;
    const estMargin = (estProfit / (revenue || 1)) * 100;

    // ต้นทุนจริง
    const actual = project.actualCosts || { labor: 0, supplies: 0, transport: 0, other: 0, isPaid: false };
    const totalActualCost = actual.labor + actual.supplies + actual.transport + actual.other;
    
    // หากไม่มีการลงบันทึกต้นทุนจริง ให้มองว่ามีค่าเป็น 0
    const hasLoggedActual = totalActualCost > 0;
    const actCost = hasLoggedActual ? totalActualCost : estCost; 
    const actProfit = revenue - actCost;
    const actMargin = (actProfit / (revenue || 1)) * 100;

    // ส่วนต่างกำไรจริงเทียบประเมิน
    const variance = hasLoggedActual ? actProfit - estProfit : 0;

    // คอมมิชชัน (คำนวณตาม % ของกำไรจริง)
    const commRate = adminSettings.commissionRate || 10;
    const commission = actProfit > 0 ? (actProfit * (commRate / 100)) : 0;

    return {
      isRecurring,
      revenue,
      estCost,
      estProfit,
      estMargin,
      actCost,
      actProfit,
      actMargin,
      variance,
      commission,
      hasLoggedActual,
      isPaid: actual.isPaid
    };
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/finance/expenses" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--text-main)', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>รายงานวิเคราะห์กำไร & ค่าคอมมิชชัน</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>เปรียบเทียบกำไรประเมินกับต้นทุนจริง และคำนวณค่าคอมมิชชันฝ่ายขายตามผลงานจริง</p>
          </div>
        </div>
        
        <Link href="/settings" style={{ backgroundColor: 'white', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', textDecoration: 'none' }}>
          <Sliders size={18} /> ปรับราคากลางแอดมิน
        </Link>
      </div>

      {/* สรุปภาพรวมการเงิน (KPI Widgets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '8px', color: '#0284c7' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ยอดรวมรายได้ปิดดีล</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
              {quotations.reduce((sum, q) => sum + (q.total || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿
            </h3>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', color: '#16a34a' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>กำไรจริงเฉลี่ย (%)</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#16a34a' }}>
              {adminSettings.minMargin}% (เป้า)
            </h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', color: '#d97706' }}>
            <Percent size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ค่าคอมมิชชันฝ่ายขาย</p>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#d97706' }}>
              {adminSettings.commissionRate}% ของกำไร
            </h3>
          </div>
        </div>
      </div>

      {/* ตัวกรองตารางงาน */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setFilterType('all')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: filterType === 'all' ? 'var(--primary-color)' : '#e2e8f0', color: filterType === 'all' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>ทั้งหมด</button>
        <button onClick={() => setFilterType('bigcleaning')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: filterType === 'bigcleaning' ? 'var(--primary-color)' : '#e2e8f0', color: filterType === 'bigcleaning' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>งานสั้น (Big Cleaning)</button>
        <button onClick={() => setFilterType('recurring')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: filterType === 'recurring' ? 'var(--primary-color)' : '#e2e8f0', color: filterType === 'recurring' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>สัญญารายเดือน (แม่บ้านประจำ)</button>
      </div>

      {/* ตารางงานโครงการ */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px' }}>รายละเอียดโครงการ / ดีล</th>
              <th style={{ padding: '16px' }}>ประเภท</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>รายรับดีล</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>กำไรประเมิน</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>กำไรจริง</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>ค่าคอมมิชชัน</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>สถานะต้นทุน</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {quotations
              .filter(q => {
                const metrics = calculateMetrics(q);
                if (filterType === 'bigcleaning') return !metrics.isRecurring;
                if (filterType === 'recurring') return metrics.isRecurring;
                return true;
              })
              .map(q => {
                const m = calculateMetrics(q);
                const isExpanded = expandedProjectId === q.id;

                return (
                  <>
                    <tr key={q.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => setExpandedProjectId(isExpanded ? null : q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div>
                            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{q.projectName || 'โปรเจกต์ทั่วไป'}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>ลูกค้า: {q.customer} | เลขใบเสนอราคา: {q.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: m.isRecurring ? '#e0f2fe' : '#fef3c7', color: m.isRecurring ? '#0369a1' : '#b45309', fontWeight: '500' }}>
                          {m.isRecurring ? 'แม่บ้านประจำ' : 'Big Cleaning'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>{m.revenue.toLocaleString()} ฿</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {m.estProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿ ({m.estMargin.toFixed(0)}%)
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: m.actProfit < m.estProfit && m.hasLoggedActual ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                        {m.actProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿ ({m.actMargin.toFixed(0)}%)
                        {m.hasLoggedActual && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: m.variance >= 0 ? '#16a34a' : '#ef4444' }}>
                            {m.variance >= 0 ? `+${m.variance.toLocaleString()}` : m.variance.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>
                        {m.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿
                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: m.isPaid ? '#16a34a' : '#ef4444' }}>
                          ({m.isPaid ? 'จ่ายคอมมิชชันแล้ว' : 'ค้างชำระ/รอตรวจ'})
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {m.hasLoggedActual ? (
                          <span style={{ color: '#16a34a', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> บันทึกแล้ว
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> รอสรุปงบ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button onClick={() => openEditModal(q)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '4px' }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* รายละเอียดเพิ่มเติมกรณีเป็นสัญญาระยะยาว (Expanded Detail Drawer) */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan={8} style={{ padding: '20px' }}>
                          <div style={{ borderLeft: '3px solid var(--primary-color)', paddingLeft: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0' }}>บันทึกงวดสัญญารายเดือน (Monthly Log Tracking)</h4>
                            
                            {m.isRecurring ? (
                              <div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem' }}>รอบเดือน</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>รายรับงวด</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>ค่าแรงแม่บ้าน</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>ค่าน้ำยา/อุปกรณ์จริง</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>กำไรเดือนนี้</th>
                                      <th style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>ค่าคอมมิชชันรอบนี้</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(monthlyLogs[q.id] || []).length > 0 ? (
                                      monthlyLogs[q.id].map(log => {
                                        const monthlyProfit = log.revenue - (log.labor + log.supplies + log.transport);
                                        const monthlyComm = monthlyProfit > 0 ? monthlyProfit * (adminSettings.commissionRate / 100) : 0;
                                        return (
                                          <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{log.month}</td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>{log.revenue.toLocaleString()} ฿</td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>{log.labor.toLocaleString()} ฿</td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right' }}>{log.supplies.toLocaleString()} ฿</td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right', color: monthlyProfit > 0 ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>{monthlyProfit.toLocaleString()} ฿</td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.85rem', textAlign: 'right', color: '#d97706', fontWeight: 'bold' }}>{monthlyComm.toLocaleString()} ฿</td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ยังไม่มีการบันทึกงบรายเดือนของงวดนี้</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* ปุ่มฟอร์มด่วนสำหรับเพิ่มรอบเดือนแม่บ้าน */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                                  <input type="text" placeholder="ชื่อเดือน เช่น ม.ค. 2026" id={`m_${q.id}`} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '130px' }} />
                                  <input type="number" placeholder="ค่าแรงจริงเดือนนี้" id={`l_${q.id}`} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '130px' }} />
                                  <input type="number" placeholder="ค่าของตัดจริงเดือนนี้" id={`s_${q.id}`} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '130px' }} />
                                  <button onClick={() => {
                                    const mEl = document.getElementById(`m_${q.id}`);
                                    const lEl = document.getElementById(`l_${q.id}`);
                                    const sEl = document.getElementById(`s_${q.id}`);
                                    if (mEl && mEl.value && lEl && lEl.value && sEl && sEl.value) {
                                      handleAddMonthlyLog(q.id, mEl.value, q.total || 0, lEl.value, sEl.value, 0, 0);
                                      mEl.value = '';
                                      lEl.value = '';
                                      sEl.value = '';
                                    } else {
                                      showToast('กรุณากรอกข้อมูลเดือน ค่าแรง และค่าน้ำยาคลังให้ครบถ้วน!', 'warning');
                                    }
                                  }} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                    + เพิ่มรอบงวดเดือนนี้
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>ตารางสรุปงบ Big Cleaning</h5>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  งาน Big Cleaning เป็นงานแบบครั้งเดียวจบ ไม่มีการผูกสัญญารายเดือน ต้นทุนจริงทั้งหมดจะถูกบันทึกรวบยอดโดยใช้ปุ่มจัดการ (รูปปากกา) ที่แถบตารางขวา
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Modal บันทึกงบจริงรายโครงการ */}
      {isModalOpen && selectedProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)' }}>บันทึกงบต้นทุนและชำระจริง: {selectedProject.id}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าแรงแม่บ้านหน้างานจริง (บาท)</label>
                <input type="number" value={actLabor} onChange={e => setActLabor(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าวัสดุและค่าน้ำยาใช้จริง (บาท)</label>
                <input type="number" value={actSupplies} onChange={e => setActSupplies(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าพาหนะ/เดินทางจริง (บาท)</label>
                <input type="number" value={actTransport} onChange={e => setActTransport(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>ค่าจิปาถะ/อุปกรณ์ด่วนอื่นๆ (บาท)</label>
                <input type="number" value={actOther} onChange={e => setActOther(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" id="isPaid" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="isPaid" style={{ fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', color: '#16a34a' }}>
                  ลูกค้ารวมชำระเงินงวดนี้ครบถ้วนแล้ว (อนุมัติค่าคอมมิชชันของเซลส์)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleSaveActualCosts} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกงบจริง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
