'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Printer, FileText, Download, CheckSquare, Plus, ChevronDown, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchData, saveData } from '@/utils/api';
import { useToast } from '@/components/Toast';

export default function PurchasingPage() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const pendingItems = [
    { id: 1, name: 'ผลิตภัณฑ์อเนกประสงค์น็อก', qty: 20, unit: 'แกลลอน', vendor: 'บริษัท น้ำยาไทย จำกัด', prSource: 'PR-202607-001, PR-202607-005', estimatedCost: 2000 },
    { id: 3, name: 'ผลิตภัณฑ์ล้างห้องน้ำ', qty: 15, unit: 'แกลลอน', vendor: 'บริษัท น้ำยาไทย จำกัด', prSource: 'PR-202607-001', estimatedCost: 1275 },
    { id: 13, name: 'ผ้าไมโครไฟเบอร์สีน้ำเงิน', qty: 50, unit: 'ผืน', vendor: 'ร้าน อุปกรณ์คลีนนิ่ง', prSource: 'PR-202607-001, PR-202607-003', estimatedCost: 1750 },
    { id: 45, name: 'ถุงขยะสีดำ 18x20"', qty: 30, unit: 'กิโลกรัม', vendor: 'หจก. พลาสติกไทย', prSource: 'PR-202607-001, PR-202607-008', estimatedCost: 1050 },
  ];

  const groupedByVendor = pendingItems.reduce((acc, item) => {
    if (!acc[item.vendor]) acc[item.vendor] = [];
    acc[item.vendor].push(item);
    return acc;
  }, {});

  const loadData = async () => {
    try {
      const data = await fetchData('PurchaseOrders');
      setPurchaseOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFromPR = async (vendorName, itemsList) => {
    const poNo = `PO202607${Math.floor(100 + Math.random() * 900)}`;
    const totalCost = itemsList.reduce((sum, i) => sum + i.estimatedCost, 0);

    const newPO = {
      id: poNo,
      date: new Date().toISOString().split('T')[0],
      vendor: vendorName,
      supplierName: vendorName,
      total: totalCost,
      status: 'pending',
      items: itemsList.map(i => ({
        name: i.name,
        qty: i.qty,
        price: i.estimatedCost / i.qty
      }))
    };

    try {
      const updated = [...purchaseOrders, newPO];
      await saveData('PurchaseOrders', newPO);
      setPurchaseOrders(updated);
      showToast(`📝 สร้างใบสั่งซื้อ ${poNo} สำหรับ ${vendorName} เรียบร้อยแล้ว!`, 'success');
      setActiveTab('history');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกใบสั่งซื้อ', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleReceiveStock = async (poId) => {
    try {
      const targetPo = purchaseOrders.find(po => po.id === poId);
      if (!targetPo) return;
      
      const updatedPo = { ...targetPo, status: 'received' };
      await saveData('PurchaseOrders', updatedPo);
      
      const updatedList = purchaseOrders.map(po => po.id === poId ? updatedPo : po);
      setPurchaseOrders(updatedList);
      showToast(`📥 รับของจากใบสั่งซื้อ ${poId} เข้าสต็อกคลังสินค้าแล้ว!`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 8px 0' }}>รายการสั่งซื้อ (Purchase Orders)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>สร้างใบสั่งซื้อจากรายการที่อนุมัติแล้ว หรือสั่งสต๊อกเพิ่ม</p>
        </div>
        <Link href="/inventory/po" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 2px 4px rgba(14,165,233,0.2)' }}>
          <Plus size={20} /> สร้างใบสั่งซื้อ (PO) ใหม่
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc', padding: '0 20px' }}>
          <button 
            onClick={() => setActiveTab('pending')}
            style={{ padding: '20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'pending' ? 'bold' : '500', color: activeTab === 'pending' ? '#0ea5e9' : 'var(--text-muted)', borderBottom: activeTab === 'pending' ? '3px solid #0ea5e9' : '3px solid transparent', fontSize: '1rem' }}
          >
            รายการรอสั่งซื้อ (จาก PR) <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', marginLeft: '8px' }}>4</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ padding: '20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'history' ? 'bold' : '500', color: activeTab === 'history' ? '#0ea5e9' : 'var(--text-muted)', borderBottom: activeTab === 'history' ? '3px solid #0ea5e9' : '3px solid transparent', fontSize: '1rem' }}
          >
            ประวัติใบสั่งซื้อ (PO History) ({purchaseOrders.length})
          </button>
        </div>

        {activeTab === 'pending' && (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              รายการด้านล่างถูกดึงมาจากใบขอเบิกสินค้า (PR) ที่ผ่านการอนุมัติจากผู้จัดการแล้ว ระบบได้จัดกลุ่มตามผู้จัดจำหน่ายให้โดยอัตโนมัติ
            </div>

            {Object.keys(groupedByVendor).map((vendor, index) => {
              const items = groupedByVendor[vendor];
              const vendorTotal = items.reduce((sum, item) => sum + item.estimatedCost, 0);

              return (
                <div key={index} style={{ marginBottom: '32px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>{vendor}</h3>
                    </div>
                    <button onClick={() => handleCreateFromPR(vendor, items)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      <CheckSquare size={18} /> ออกใบสั่งซื้อ (PO) เจ้านี้
                    </button>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'white', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '16px 24px', fontWeight: '500' }}>ชื่อสินค้า</th>
                        <th style={{ padding: '16px 8px', fontWeight: '500' }}>อ้างอิงใบเบิก (PR)</th>
                        <th style={{ padding: '16px 8px', fontWeight: '500', textAlign: 'center' }}>จำนวนที่ต้องสั่ง</th>
                        <th style={{ padding: '16px 24px', fontWeight: '500', textAlign: 'right' }}>ประมาณการค่าใช้จ่าย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: '500' }}>{item.name}</td>
                          <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.prSource}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>{item.qty} {item.unit}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)' }}>฿{formatCurrency(item.estimatedCost)}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#fafafa' }}>
                        <td colSpan={3} style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>รวมประมาณการสั่งซื้อจากเจ้านี้:</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>฿{formatCurrency(vendorTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>กำลังโหลดประวัติใบสั่งซื้อ...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: '600' }}>เลขที่ใบสั่งซื้อ</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600' }}>วันที่</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600' }}>ผู้จัดจำหน่าย (Supplier)</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'right' }}>ยอดสั่งซื้อรวม</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>การรับของ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 20px', color: '#0ea5e9', fontWeight: 'bold', fontFamily: 'monospace' }}>{po.id}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{po.date}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontWeight: '500' }}>{po.vendor || po.supplierName}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold' }}>฿{formatCurrency(po.total)}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {po.status === 'pending' ? (
                          <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> รอจัดส่ง
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> ได้รับสินค้าแล้ว
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {po.status === 'pending' ? (
                          <button 
                            onClick={() => handleReceiveStock(po.id)}
                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                          >
                            📥 รับของเข้าคลัง
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>จัดส่งเรียบร้อย</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่พบประวัติการออกใบสั่งซื้อ (PO)</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
