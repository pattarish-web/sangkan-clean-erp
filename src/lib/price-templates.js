/** เทมเพลตราคากลาง — ไม่ใช่ AI จริง */
export function generatePriceTemplateItems(promptText) {
  const prompt = (promptText || '').toLowerCase();
  let genItems = [];

  if (prompt.includes('โกดัง') || prompt.includes('โรงงาน') || prompt.includes('warehouse')) {
    genItems = [
      { id: 1, description: 'บริการ Big Cleaning ขัดล้างคราบน้ำมัน คราบจาระบี และคราบยางรถพื้นคลังสินค้า', qty: 1, unit: 'งาน', price: 18500 },
      { id: 2, description: 'บริการปัดกวาดหยากไย่และฝุ่นละอองบนโครงสร้างเหล็กแปและเพดานสูง', qty: 1, unit: 'งาน', price: 9000 },
      { id: 3, description: 'บริการเช็ดทำความสะอาดผนังเมทัลชีทและกระจกหน้าต่างโดยรอบโกดัง', qty: 1, unit: 'งาน', price: 4500 },
      { id: 4, description: 'บริการทำความสะอาดห้องน้ำพนักงาน และพื้นที่ออฟฟิศส่วนควบคุมการผลิต', qty: 1, unit: 'งาน', price: 3000 },
    ];
  } else if (prompt.includes('พรม') || prompt.includes('carpet')) {
    genItems = [
      { id: 1, description: 'บริการซักพรมปูพื้นออฟฟิศด้วยเครื่องสกัดและระบบพ่นดูดน้ำยาเคมีภัณฑ์', qty: 1, unit: 'งาน', price: 12000 },
      { id: 2, description: 'บริการดูดฝุ่นเก็บรายละเอียดและเก็บขอบพรมบริเวณซอกมุมออฟฟิศ', qty: 1, unit: 'งาน', price: 2500 },
      { id: 3, description: 'บริการพ่นสเปรย์ฆ่าเชื้อแบคทีเรียบนพื้นผิวพรม', qty: 1, unit: 'งาน', price: 3500 },
    ];
  } else if (prompt.includes('บ้าน') || prompt.includes('คอนโด') || prompt.includes('home') || prompt.includes('townhouse')) {
    genItems = [
      { id: 1, description: 'บริการ Big Cleaning ทำความสะอาดห้องนอน ห้องนั่งเล่น และห้องครัว', qty: 1, unit: 'งาน', price: 8500 },
      { id: 2, description: 'บริการขัดล้างห้องน้ำ สุขภัณฑ์ และล้างคราบตะกรัน', qty: 1, unit: 'งาน', price: 3000 },
      { id: 3, description: 'บริการเช็ดกระจกภายในและภายนอก บานมุ้งลวด', qty: 1, unit: 'งาน', price: 2500 },
    ];
  } else {
    const cleanPrompt = (promptText || '').replace(/ช่วยคิดราคา|ใบเสนอราคา|ขอสโคปงาน|ขอ|หน่อย/g, '').trim();
    genItems = [
      { id: 1, description: `บริการ Big Cleaning: ${cleanPrompt || 'ตามที่ระบุ'}`, qty: 1, unit: 'งาน', price: 12000 },
      { id: 2, description: 'ค่าอุปกรณ์พิเศษ เคมีภัณฑ์ และน้ำยาขจัดคราบเฉพาะทาง', qty: 1, unit: 'งาน', price: 3500 },
      { id: 3, description: 'ค่าบริการเดินทางขนย้ายอุปกรณ์และจัดส่งทีมงาน', qty: 1, unit: 'งาน', price: 1500 },
    ];
  }

  return genItems;
}
