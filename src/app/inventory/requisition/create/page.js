'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart, ArrowLeft, Check, Package, Droplet, Scissors, Wrench, Trash2, User, Home } from 'lucide-react';
import Link from 'next/link';
import { fetchItemCatalog, fetchQuotations, fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function CreateRequisition() {
  const showToast = useToast();

  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [itemsData, emps, qs] = await Promise.all([
          fetchItemCatalog(),
          fetchData('Employees'),
          fetchQuotations()
        ]);
        setInventoryItems(itemsData || []);
        setEmployeesList(emps || []);
        
        const approvedQs = (qs || []).filter(q => q.status === 'approved');
        setProjectsList(approvedQs);
        
        if (approvedQs.length > 0) {
          setSelectedProjectId(approvedQs[0].id);
        }
        if (emps && emps.length > 0) {
          setSelectedEmployeeName(emps[0].name);
        }
      } catch (e) {
        console.error(e);
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลตั้งต้น', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: <Package size={24} /> },
    { id: 'popular', name: 'เบิกบ่อย', icon: <Droplet size={24} color="#f59e0b" /> },
    { id: 'น้ำยา', name: 'น้ำยา', icon: <Droplet size={24} color="#3b82f6" /> },
    { id: 'ผ้า', name: 'ผ้า', icon: <Droplet size={24} color="#10b981" /> },
    { id: 'ไม้', name: 'ไม้ / ด้าม', icon: <Wrench size={24} color="#8b5cf6" /> },
    { id: 'ของใช้สิ้นเปลือง', name: 'สิ้นเปลือง', icon: <Scissors size={24} color="#ef4444" /> },
  ];

  const handleAdd = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemove = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const getFilteredItems = () => {
    if (activeCategory === 'all') return inventoryItems;
    if (activeCategory === 'popular') return inventoryItems.filter(i => i.stock > 50); // popular check
    return inventoryItems.filter(i => i.category === activeCategory);
  };

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  
  const cartItemsList = Object.keys(cart).map(id => {
    const item = inventoryItems.find(i => String(i.id) === String(id));
    return { ...item, qty: cart[id] };
  }).filter(Boolean);

  const handleSaveRequisition = async () => {
    if (!selectedProjectId) {
      showToast('กรุณาเลือกไซต์งาน/โครงการที่ต้องการเบิกเข้า', 'error');
      return;
    }
    if (!selectedEmployeeName) {
      showToast('กรุณาระบุชื่อพนักงานผู้เบิก', 'error');
      return;
    }

    const matchedProject = projectsList.find(p => p.id === selectedProjectId);
    const amount = cartItemsList.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);
    const prId = 'PR' + Date.now().toString().slice(-6);

    const prObj = {
      id: prId,
      date: new Date().toISOString().split('T')[0],
      by: selectedEmployeeName,
      projectId: selectedProjectId,
      project: matchedProject ? (matchedProject.projectName || matchedProject.customer) : 'ไซต์งานทั่วไป',
      amount: amount,
      status: 'pending',
      items: cartItemsList
    };

    try {
      await saveData('PurchaseRequests', prObj);
      showToast(`สร้างใบขอเบิกเลขที่ ${prId} สำเร็จ!`, 'success');
      setCart({});
      setShowSummary(false);
      setTimeout(() => {
        window.location.href = '/inventory/requisition';
      }, 1000);
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการบันทึกใบเบิก', 'error');
    }
  };

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* ส่วนหัว */}
      <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '50%', color: '#0ea5e9' }}>
          <ShoppingCart size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-dark)' }}>สร้างใบเบิกสินค้า (PR)</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>เลือกวัสดุอุปกรณ์ทำความสะอาดและระบุไซต์งานปลายทาง</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดรายการสินค้า...</div>
      ) : !showSummary ? (
        <>
          {/* แถบหมวดหมู่ */}
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '16px', minWidth: '100px',
                  backgroundColor: activeCategory === c.id ? '#eff6ff' : 'white',
                  border: activeCategory === c.id ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: activeCategory === c.id ? '0 4px 6px -1px rgba(59,130,246,0.2)' : '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {c.icon}
                <span style={{ fontSize: '1rem', fontWeight: activeCategory === c.id ? 'bold' : '500', color: activeCategory === c.id ? '#1d4ed8' : 'var(--text-main)' }}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          {/* รายการสินค้า */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {getFilteredItems().map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id} style={{ 
                  backgroundColor: 'white', padding: '20px', borderRadius: '16px', 
                  border: qty > 0 ? '2px solid #10b981' : '1px solid var(--border-color)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px 0' }}>{item.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>หน่วยนับ: {item.unit} | ราคา: ฿{item.price.toFixed(2)}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: item.stock < 10 ? '#ef4444' : 'var(--text-muted)', fontWeight: item.stock < 10 ? 'bold' : 'normal' }}>
                      คงเหลือ: {item.stock} {item.unit}
                    </span>
                    
                    {qty === 0 ? (
                      <button onClick={() => handleAdd(item.id)} style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + เพิ่มในรายการ
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => handleRemove(item.id)} style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Minus size={20} />
                        </button>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981', minWidth: '24px', textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => handleAdd(item.id)} style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Plus size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* หน้ารายการสรุป (Summary Form) */
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
            <button onClick={() => setShowSummary(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}>
              <ArrowLeft size={24} color="var(--text-muted)" />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>ระบุข้อมูลปลายทางและผู้เบิก</h2>
          </div>

          {/* Form Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                <Home size={18} color="var(--text-muted)" /> ไซต์งาน/โครงการ (Project) *
              </label>
              {projectsList.length > 0 ? (
                <select 
                  value={selectedProjectId} 
                  onChange={e => setSelectedProjectId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }}
                >
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.projectName || p.customer}</option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem' }}>
                  ⚠️ ไม่พบโครงการที่ได้รับอนุมัติ (กรุณาสร้างและอนุมัติใบเสนอราคาก่อนเพื่อรับโปรเจกต์)
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                <User size={18} color="var(--text-muted)" /> พนักงานผู้เบิกอุปกรณ์ *
              </label>
              {employeesList.length > 0 ? (
                <select 
                  value={selectedEmployeeName} 
                  onChange={e => setSelectedEmployeeName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }}
                >
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="กรอกชื่อผู้เบิก..." 
                  value={selectedEmployeeName} 
                  onChange={e => setSelectedEmployeeName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }}
                />
              )}
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>รายการวัสดุและอุปกรณ์</h3>
          {cartItemsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              ยังไม่ได้เลือกสินค้าใดๆ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItemsList.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>หมวดหมู่: {item.category} | ราคา: ฿{item.price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>
                      {item.qty} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>
                    <button onClick={() => handleRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px' }}>
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartItemsList.length > 0 && (
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={handleSaveRequisition}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px 40px', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                <Check size={28} /> ยืนยันส่งใบเบิกสินค้า
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Bar */}
      {!showSummary && totalItemsCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid var(--border-color)', padding: '16px 24px', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ maxWidth: '800px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '50%', color: '#0ea5e9', position: 'relative' }}>
                <ShoppingCart size={28} />
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.9rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>เลือกแล้ว</p>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{totalItemsCount} รายการ</h3>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (projectsList.length === 0) {
                  showToast('คุณต้องมีโครงการที่อนุมัติแล้วอย่างน้อย 1 รายการเพื่อสร้างใบเบิก', 'error');
                } else {
                  setShowSummary(true);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
            >
              ดูรายการสรุป <Check size={24} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
