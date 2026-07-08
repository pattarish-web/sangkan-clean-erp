export const SEED_DATA = {
  Quotations: [
    {
      id: 'QT202607001',
      date: '2026-07-03',
      customer: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
      taxId: '0105512345678',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      total: 6500,
      status: 'approved',
      items: [
        { id: 1, description: 'บริการทำความสะอาด (Big Cleaning) พื้นที่ 500 ตรม.', qty: 1, unit: 'งาน', price: 6500 }
      ]
    },
    {
      id: 'QT202607002',
      date: '2026-07-04',
      customer: 'โรงแรม แกรนด์ พาราไดซ์',
      address: '99/9 ถ.สุขุมวิท กทม 10110',
      taxId: '0205512345678',
      projectName: 'ทำความสะอาดกระจกอาคารสูง 15 ชั้น',
      total: 12500,
      status: 'pending',
      items: [
        { id: 1, description: 'งานเช็ดกระจกภายนอกอาคาร (15 ชั้น)', qty: 15, unit: 'ชั้น', price: 800 },
        { id: 2, description: 'งานเช็ดกระจกภายใน', qty: 1, unit: 'งาน', price: 500 }
      ]
    },
    {
      id: 'QT202607003',
      date: '2026-07-05',
      customer: 'บมจ. เบต้า อินดัสทรี',
      address: '88/8 นิคมอุตสาหกรรมเบต้า ชลบุรี 20000',
      taxId: '0305512345678',
      projectName: 'ทำความสะอาดโรงงานครบวงจร',
      total: 45000,
      status: 'approved',
      items: [
        { id: 1, description: 'ทำความสะอาดโรงงานแบบครบวงจร พื้นที่ 1,500 ตรม.', qty: 1, unit: 'งาน', price: 45000 }
      ]
    },
    {
      id: 'QT202607004',
      date: '2026-07-06',
      customer: 'หมู่บ้าน พฤกษา นารา',
      address: '11/11 ถนนบางนา-ตราด สมุทรปราการ 10540',
      taxId: '0405512345678',
      projectName: 'บริการแม่บ้านประจำส่วนกลาง',
      total: 8500,
      status: 'pending',
      items: [
        { id: 1, description: 'บริการแม่บ้านประจำ จำนวน 2 คน (22 วันทำการ)', qty: 1, unit: 'เดือน', price: 8500 }
      ]
    }
  ],
  Deposits: [
    {
      id: 'DP202607001',
      date: '2026-07-03',
      refQuotation: 'QT202607001',
      customer: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      description: 'เงินมัดจำล่วงหน้า 50% สำหรับโครงการ Big Cleaning สำนักงานใหญ่',
      price: 3250,
      total: 3250,
      status: 'paid'
    },
    {
      id: 'DP202607002',
      date: '2026-07-04',
      refQuotation: 'QT202607002',
      customer: 'โรงแรม แกรนด์ พาราไดซ์',
      address: '99/9 ถ.สุขุมวิท กทม 10110',
      projectName: 'ทำความสะอาดกระจกอาคารสูง 15 ชั้น',
      description: 'เงินมัดจำล่วงหน้า 50% สำหรับโครงการทำความสะอาดกระจกอาคารสูง',
      price: 6250,
      total: 6250,
      status: 'unpaid'
    }
  ],
  Invoices: [
    {
      id: 'INV202607001',
      date: '2026-07-06',
      refQuotation: 'QT202607001',
      customer: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      total: 6500,
      status: 'paid',
      items: [{ id: 1, description: 'บริการทำความสะอาด (Big Cleaning) พื้นที่ 500 ตรม.', qty: 1, unit: 'งาน', price: 6500 }]
    },
    {
      id: 'INV202607002',
      date: '2026-07-07',
      refQuotation: 'QT202607002',
      customer: 'โรงแรม แกรนด์ พาราไดซ์',
      address: '99/9 ถ.สุขุมวิท กทม 10110',
      projectName: 'ทำความสะอาดกระจกอาคารสูง 15 ชั้น',
      total: 12500,
      status: 'unpaid',
      items: [{ id: 1, description: 'งานเช็ดกระจก 15 ชั้น', qty: 1, unit: 'งาน', price: 12500 }]
    }
  ],
  Taxinvoices: [
    {
      id: 'TI202607001',
      date: '2026-07-08',
      refInvoice: 'INV202607001',
      customer: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
      taxId: '0105512345678',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      subtotal: 6500,
      vat: 455,
      total: 6955,
      status: 'issued',
      items: [{ id: 1, description: 'บริการทำความสะอาด (Big Cleaning)', qty: 1, unit: 'งาน', price: 6500 }]
    }
  ],
  Expenses: [
    {
      id: 'EXP202607001',
      date: '2026-07-03',
      description: 'ค่าน้ำมันรถ - เดินทางไปสำรวจพื้นที่ บจก. อัลฟ่า เทค',
      category: 'ค่าเดินทาง',
      amount: 350,
      projectId: 'QT202607001',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      status: 'recorded'
    },
    {
      id: 'EXP202607002',
      date: '2026-07-04',
      description: 'ซื้อน้ำยาทำความสะอาด 3 แกลลอน สำหรับงาน Big Cleaning',
      category: 'ค่าวัสดุอุปกรณ์',
      amount: 1200,
      projectId: 'QT202607001',
      projectName: 'Big Cleaning สำนักงานใหญ่',
      status: 'recorded'
    },
    {
      id: 'EXP202607003',
      date: '2026-07-05',
      description: 'ค่าอาหารพนักงาน - ประชุมทีมประจำเดือน',
      category: 'ค่าอาหาร/เลี้ยงรับรอง',
      amount: 850,
      projectId: null,
      projectName: 'ส่วนกลาง',
      status: 'recorded'
    }
  ],
  Customers: [
    {
      id: 'CUS001',
      name: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
      taxId: '0105512345678',
      phone: '02-555-1234',
      email: 'info@alphatech.co.th',
      contacts: [{ name: 'คุณสมชาย (ผู้จัดการทั่วไป)', phone: '081-111-2222' }]
    },
    {
      id: 'CUS002',
      name: 'โรงแรม แกรนด์ พาราไดซ์',
      address: '99/9 ถ.สุขุมวิท กทม 10110',
      taxId: '0205512345678',
      phone: '02-555-5678',
      email: 'info@grandparadise.com',
      contacts: [{ name: 'คุณนลินี (ผู้จัดการโรงแรม)', phone: '083-555-6666' }]
    },
    {
      id: 'CUS003',
      name: 'บมจ. เบต้า อินดัสทรี',
      address: '88/8 นิคมอุตสาหกรรมเบต้า ชลบุรี 20000',
      taxId: '0305512345678',
      phone: '038-555-9012',
      email: 'purchase@betaindustry.co.th',
      contacts: [{ name: 'คุณเอกราช (หัวหน้าช่าง)', phone: '082-333-4444' }]
    },
    {
      id: 'CUS004',
      name: 'หมู่บ้าน พฤกษา นารา',
      address: '11/11 ถนนบางนา-ตราด สมุทรปราการ 10540',
      taxId: '0405512345678',
      phone: '02-555-3456',
      email: 'juristic@prueksanara.co.th',
      contacts: [{ name: 'คุณสุดา (นิติบุคคล)', phone: '084-777-8888' }]
    }
  ],
  Employees: [
    { id: 'SKC0001', name: 'สมปอง ทองดี', position: 'แม่บ้านประจำ', phone: '081-234-5678', status: 'active', photo: '', username: 'SKC0001', password: '5678' },
    { id: 'SKC0002', name: 'สมใจ รักสะอาด', position: 'หัวหน้าแม่บ้าน', phone: '082-345-6789', status: 'active', photo: '', username: 'SKC0002', password: '6789' },
    { id: 'SKC0003', name: 'บุญมี สีทา', position: 'สายตรวจ (QA)', phone: '083-456-7890', status: 'inactive', photo: '', username: 'SKC0003', password: '7890' },
  ],
  Inventory: [
    { id: 'INV-CH-001', name: 'น้ำยาล้างห้องน้ำสูตรเข้มข้น (แกลลอน 5L)', category: 'chemical', qty: 15, unit: 'แกลลอน', minStock: 20, price: 350 },
    { id: 'INV-CH-002', name: 'น้ำยาเช็ดกระจก (ขวด 500ml)', category: 'chemical', qty: 45, unit: 'ขวด', minStock: 30, price: 65 },
    { id: 'INV-EQ-001', name: 'เครื่องขัดพื้นรอบต่ำ 18 นิ้ว', category: 'equipment', qty: 5, unit: 'เครื่อง', minStock: 2, price: 12500 },
    { id: 'INV-EQ-002', name: 'เครื่องดูดฝุ่นอุตสาหกรรม 60L', category: 'equipment', qty: 3, unit: 'เครื่อง', minStock: 3, price: 8900 },
    { id: 'INV-SP-001', name: 'ผ้าไมโครไฟเบอร์ (แพ็ค 10 ผืน)', category: 'supply', qty: 120, unit: 'แพ็ค', minStock: 50, price: 150 },
    { id: 'INV-SP-002', name: 'ถุงขยะดำ 30x40 นิ้ว (กิโลกรัม)', category: 'supply', qty: 18, unit: 'กิโลกรัม', minStock: 30, price: 45 },
  ],
  Itemcatalog: [
    {
        "id": "ITEM-001",
        "name": "ผลิตภัณฑ์อเนกประสงค์น็อก",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 100.0,
        "stock": 120
    },
    {
        "id": "ITEM-003",
        "name": "ผลิตภัณฑ์ล้างห้องน้ำ",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 85.0,
        "stock": 45
    },
    {
        "id": "ITEM-013",
        "name": "ผ้าไมโครไฟเบอร์สีน้ำเงิน",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 35.0,
        "stock": 350
    },
    {
        "id": "ITEM-025",
        "name": "ไม้กวาดดอกหญ้า",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 50.0,
        "stock": 15
    },
    {
        "id": "ITEM-036",
        "name": "ราวตากผ้า",
        "unit": "อัน",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 390.0,
        "stock": 5
    },
    {
        "id": "ITEM-045",
        "name": "'ถุงขยะสีดำ 18x20\"",
        "unit": "กิโลกรัม",
        "category": "ของใช้สิ้นเปลือง",
        "price": 35.0,
        "stock": 80
    },
    {
        "id": "ITEM-048",
        "name": "เครื่องดูดฝุ่น",
        "unit": "เครื่อง",
        "category": "เครื่องจักร",
        "price": 5300.0,
        "stock": 12
    },
    {
        "id": "ITEM-054",
        "name": "ถังบีบม็อบ25ลิตร/สีเหลือง",
        "unit": "ใบ",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 935.0,
        "stock": 8
    },
    {
        "id": "ITEM-055",
        "name": "ผลิตภัณฑ์อเนกประสงค์ครีม",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 330.0,
        "stock": 0
    },
    {
        "id": "ITEM-056",
        "name": "ผลิตภัณฑ์ล้างจานซันไลท์",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 210.0,
        "stock": 0
    },
    {
        "id": "ITEM-057",
        "name": "ผลิตภัณฑ์ล้างจาน",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 85.0,
        "stock": 0
    },
    {
        "id": "ITEM-058",
        "name": "ผลิตภัณฑ์ปรับผ้านุ่ม",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 180.0,
        "stock": 0
    },
    {
        "id": "ITEM-059",
        "name": "ผลิตภัณฑ์ถูพื้น",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 85.0,
        "stock": 0
    },
    {
        "id": "ITEM-060",
        "name": "ผลิตภัณฑ์ดันฝุ่น",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 320.0,
        "stock": 0
    },
    {
        "id": "ITEM-061",
        "name": "ผลิตภัณฑ์เช็ดกระจก",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 85.0,
        "stock": 0
    },
    {
        "id": "ITEM-062",
        "name": "ผลิตภัณฑ์ฆ่าเชื้อดับกลิ่น",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 85.0,
        "stock": 0
    },
    {
        "id": "ITEM-063",
        "name": "ผลิตภัณฑ์กัดสนิม",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 130.0,
        "stock": 0
    },
    {
        "id": "ITEM-064",
        "name": "ผลิตภัณฑ์ผงซักฟอก1กก.",
        "unit": "ถุง",
        "category": "น้ำยา",
        "price": 65.0,
        "stock": 0
    },
    {
        "id": "ITEM-065",
        "name": "ผ้าไมโครไฟเบอร์สีเทา",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-066",
        "name": "ผ้าไมโครไฟเบอร์สีแดง",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-067",
        "name": "ผ้าไมโครไฟเบอร์สีเขียว",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-068",
        "name": "ผ้าม็อบสีน้ำเงิน 10 นิ้ว",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 100.0,
        "stock": 0
    },
    {
        "id": "ITEM-069",
        "name": "ผ้าม็อบสีแดง10นิ้ว",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 100.0,
        "stock": 0
    },
    {
        "id": "ITEM-070",
        "name": "ผ้าดันฝุ่นสีขาว24นิ้ว",
        "unit": "ผืน",
        "category": "ผ้า",
        "price": 160.0,
        "stock": 0
    },
    {
        "id": "ITEM-071",
        "name": "ไม้ม็อบปีกนกพลาสติกสีน้ำเงิน 10นิ้ว",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 195.0,
        "stock": 0
    },
    {
        "id": "ITEM-072",
        "name": "ไม้ปาดน้ำ24นิ้ว",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 290.0,
        "stock": 0
    },
    {
        "id": "ITEM-073",
        "name": "ไม้ปัดขนไก่พลาสติก",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 70.0,
        "stock": 0
    },
    {
        "id": "ITEM-074",
        "name": "ไม้ดันฝุ่นโครงเหล็ก24นิ้ว",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 200.0,
        "stock": 0
    },
    {
        "id": "ITEM-075",
        "name": "ไม้กวาดหยากไย่",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 85.0,
        "stock": 0
    },
    {
        "id": "ITEM-076",
        "name": "ไม้กวาด กทม.",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 60.0,
        "stock": 0
    },
    {
        "id": "ITEM-077",
        "name": "ไม้+ผ้าไมโครไฟเบอร์40CM",
        "unit": "ชุด",
        "category": "ไม้",
        "price": 565.0,
        "stock": 0
    },
    {
        "id": "ITEM-078",
        "name": "ที่โกยผง",
        "unit": "อัน",
        "category": "ไม้",
        "price": 45.0,
        "stock": 0
    },
    {
        "id": "ITEM-079",
        "name": "ชุดไม้เช็ดกระจกขนแกะ",
        "unit": "ชุด",
        "category": "ไม้",
        "price": 270.0,
        "stock": 0
    },
    {
        "id": "ITEM-080",
        "name": "ชุดไม้กรีดกระจก35CM",
        "unit": "ชุด",
        "category": "ไม้",
        "price": 250.0,
        "stock": 0
    },
    {
        "id": "ITEM-081",
        "name": "แปรงซักผ้าขนไนล่อน",
        "unit": "ด้าม",
        "category": "แปรง",
        "price": 30.0,
        "stock": 0
    },
    {
        "id": "ITEM-082",
        "name": "แปรงขัดพื้นไนล่อนด้ามยาว",
        "unit": "ด้าม",
        "category": "แปรง",
        "price": 150.0,
        "stock": 0
    },
    {
        "id": "ITEM-083",
        "name": "แปรงขัดชักโครก",
        "unit": "ด้าม",
        "category": "แปรง",
        "price": 45.0,
        "stock": 0
    },
    {
        "id": "ITEM-084",
        "name": "อะไหล่ยางฮังเกอร์35CM",
        "unit": "ชิ้น",
        "category": "อะไหล่",
        "price": 350.0,
        "stock": 0
    },
    {
        "id": "ITEM-085",
        "name": "อะไหล่ผ้าม๊อบไมโคร40CM",
        "unit": "ชิ้น",
        "category": "อะไหล่",
        "price": 350.0,
        "stock": 0
    },
    {
        "id": "ITEM-086",
        "name": "ถังชูเกอร์",
        "unit": "ใบ",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 190.0,
        "stock": 0
    },
    {
        "id": "ITEM-087",
        "name": "ถังกลม",
        "unit": "ใบ",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 220.0,
        "stock": 0
    },
    {
        "id": "ITEM-088",
        "name": "ขันน้ำ",
        "unit": "ใบ",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 20.0,
        "stock": 0
    },
    {
        "id": "ITEM-089",
        "name": "กระบอกฉีดน้ำ",
        "unit": "กระบอก",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 38.0,
        "stock": 0
    },
    {
        "id": "ITEM-090",
        "name": "สก็อตไบร์ทฟองน้ำ3X4",
        "unit": "ชิ้น",
        "category": "ของใช้สิ้นเปลือง",
        "price": 30.0,
        "stock": 0
    },
    {
        "id": "ITEM-091",
        "name": "ฟองน้ำตาข่าย",
        "unit": "อัน",
        "category": "ของใช้สิ้นเปลือง",
        "price": 15.0,
        "stock": 0
    },
    {
        "id": "ITEM-092",
        "name": "ถุงมือยางL",
        "unit": "คู่",
        "category": "ของใช้สิ้นเปลือง",
        "price": 28.0,
        "stock": 0
    },
    {
        "id": "ITEM-093",
        "name": "ถุงมือยางM",
        "unit": "คู่",
        "category": "ของใช้สิ้นเปลือง",
        "price": 28.0,
        "stock": 0
    },
    {
        "id": "ITEM-094",
        "name": "'ถุงขยะสีดำ ขนาด24x28\"",
        "unit": "กิโลกรัม",
        "category": "ของใช้สิ้นเปลือง",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-095",
        "name": "'ถุงขยะสีดำ ขนาด30x40\"",
        "unit": "กิโลกรัม",
        "category": "ของใช้สิ้นเปลือง",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-096",
        "name": "ลอกแว็กซ์",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 120.0,
        "stock": 0
    },
    {
        "id": "ITEM-097",
        "name": "ด้ามต่อชุดกรีดกระจก",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 520.0,
        "stock": 0
    },
    {
        "id": "ITEM-098",
        "name": "'แผ่นดำ18\"",
        "unit": "แผ่น",
        "category": "ของใช้สิ้นเปลือง",
        "price": 320.0,
        "stock": 0
    },
    {
        "id": "ITEM-099",
        "name": "'แผ่นแดง18\"",
        "unit": "แผ่น",
        "category": "ของใช้สิ้นเปลือง",
        "price": 320.0,
        "stock": 0
    },
    {
        "id": "ITEM-100",
        "name": "รองเท้าบู๊ท11",
        "unit": "คู่",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 160.0,
        "stock": 0
    },
    {
        "id": "ITEM-101",
        "name": "'ถุงขยะสีดำ ขนาด36x45\"",
        "unit": "กิโลกรัม",
        "category": "ของใช้สิ้นเปลือง",
        "price": 35.0,
        "stock": 0
    },
    {
        "id": "ITEM-102",
        "name": "ไม้กวาดไนล่อน",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 200.0,
        "stock": 0
    },
    {
        "id": "ITEM-103",
        "name": "กระดาษชำระ",
        "unit": "ม้วน",
        "category": "ของใช้สิ้นเปลือง",
        "price": 3.82,
        "stock": 0
    },
    {
        "id": "ITEM-104",
        "name": "ผลิตภัณฑ์เคลือบเงา",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 295.0,
        "stock": 0
    },
    {
        "id": "ITEM-105",
        "name": "ผลิตภัณฑ์ซักพรม",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 220.0,
        "stock": 0
    },
    {
        "id": "ITEM-106",
        "name": "แว็กเงาพื้น เฟอร์แฟ็ค",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 350.0,
        "stock": 0
    },
    {
        "id": "ITEM-107",
        "name": "น้ำทำความสะอาดกระจก",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 150.0,
        "stock": 0
    },
    {
        "id": "ITEM-108",
        "name": "สก็อตไบร์ทเขียว6x9",
        "unit": "แผ่น",
        "category": "ของใช้สิ้นเปลือง",
        "price": 30.0,
        "stock": 0
    },
    {
        "id": "ITEM-109",
        "name": "ถังบีบม๊อบ/ถังปั่น",
        "unit": "ชุด",
        "category": "อุปกรณ์ประจำไซส์",
        "price": 400.0,
        "stock": 0
    },
    {
        "id": "ITEM-110",
        "name": "ไม้ปาดน้ำ18 นิ้ว",
        "unit": "ด้าม",
        "category": "ไม้",
        "price": 300.0,
        "stock": 0
    },
    {
        "id": "ITEM-111",
        "name": "กระดาษชำระม้วนใหญ่",
        "unit": "ม้วน",
        "category": "ของใช้สิ้นเปลือง",
        "price": 52.0,
        "stock": 0
    },
    {
        "id": "ITEM-112",
        "name": "สบู่เหลวล้างมือ",
        "unit": "แกลลอน",
        "category": "น้ำยา",
        "price": 95.0,
        "stock": 0
    }
],
  operations_recurring: [
    {
      id: 'OP-REC-001',
      client: 'บมจ. เบต้า อินดัสทรี',
      maid: 'สมใจ รักสะอาด',
      schedule: 'จันทร์ - ศุกร์ (08.00 - 17.00)',
      status: 'เข้างานแล้ว',
      refQuotation: 'QT202607003'
    },
    {
      id: 'OP-REC-002',
      client: 'บมจ. เบต้า อินดัสทรี',
      maid: 'สมปอง ทองดี',
      schedule: 'จันทร์ - ศุกร์ (08.00 - 17.00)',
      status: 'เข้างานแล้ว',
      refQuotation: 'QT202607003'
    }
  ],
  operations_bigcleaning: [
    {
      id: 'OP-BC-001',
      client: 'บจก. อัลฟ่า เทค (สำนักงานใหญ่)',
      date: '2026-07-06',
      time: '08:30 - 16:30',
      teamSize: 5,
      status: 'เสร็จสิ้นแล้ว',
      refQuotation: 'QT202607001'
    }
  ],
  purchaserequests: [
    {
      id: 'PR987123',
      date: '2026-07-03',
      by: 'สมใจ รักสะอาด',
      projectId: 'QT202607003',
      project: 'ทำความสะอาดโรงงานครบวงจร',
      amount: 1550,
      status: 'approved',
      items: [
        { id: 'ITEM-001', name: 'ผลิตภัณฑ์อเนกประสงค์น็อก', unit: 'แกลลอน', category: 'น้ำยา', price: 100, qty: 5 },
        { id: 'ITEM-085', name: 'อะไหล่ผ้าม๊อบไมโคร40CM', unit: 'ชิ้น', category: 'อะไหล่', price: 350, qty: 3 }
      ]
    },
    {
      id: 'PR987124',
      date: '2026-07-04',
      by: 'สมปอง ทองดี',
      projectId: 'QT202607001',
      project: 'Big Cleaning สำนักงานใหญ่',
      amount: 600,
      status: 'pending',
      items: [
        { id: 'ITEM-108', name: 'สก็อตไบร์ทเขียว6x9', unit: 'แผ่น', category: 'ของใช้สิ้นเปลือง', price: 30, qty: 20 }
      ],
      headcount: 5,
      inspector: 'วิชัย ตรวจงานดี',
      managerComment: ''
    }
  ],
  crmlogs: [
    { id: 'LOG001', date: '2026-07-06', customer: 'โรงแรม แกรนด์ พาราดลย์', type: 'โทรศัพท์', text: 'โทรนำเสนอแพ็กเกจ Big Cleaning โถงรับแขกหน้าโรงแรม', serviceType: 'bigcleaning' },
    { id: 'LOG002', date: '2026-07-05', customer: 'บจก. อัลฟ่า เทค', type: 'อีเมล', text: 'ส่งรายละเอียดขอบเขตการเช็ดกระจกภายนอกที่นั่งร้านสูง', serviceType: 'bigcleaning' }
  ],
  surveyschedules: [
    { id: 'SS001', date: '2026-07-08', time: '10:30', customer: 'บจก. มิตซู ไทยแลนด์', assigned: 'เซลล์ สมปอง', note: 'สำรวจโรงงานล้างทำความสะอาดพื้นโรงรถและโกดังเก็บสินค้า', serviceType: 'bigcleaning', contacts: [] },
    { id: 'SS002', date: '2026-07-10', time: '14:00', customer: 'คอนโดมิเนียม รอยัล ปาร์ค', assigned: 'เซลล์ สมศรี', note: 'ประเมินขัดพื้นหินอ่อนหน้าโถงล็อบบี้และเช็ดกระจกชั้นลอย', serviceType: 'bigcleaning', contacts: [] }
  ],
  bigcleanschedule: [
    { id: 'BC001', projectId: 'QT202607001', projectName: 'บริการ Big Cleaning คอนโด', customer: 'โรงแรม แกรนด์ พาราดลย์', date: '2026-07-06', team: 'ทีมปฏิบัติการ A', days: 1 },
    { id: 'BC002', projectId: 'QT202607002', projectName: 'บริการขัดล้างพื้นหินและเช็ดกระจกสูง', customer: 'บจก. อัลฟ่า เทค', date: '2026-07-15', team: 'ทีมปฏิบัติการ B', days: 2 }
  ]
};
