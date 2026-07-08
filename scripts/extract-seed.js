const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '../src/utils/api.js');
const outPath = path.join(__dirname, '../src/lib/seed-data.js');
const src = fs.readFileSync(apiPath, 'utf8');
const start = src.indexOf('const SEED_DATA = {');
const end = src.indexOf('};', start) + 2;
let block = src.slice(start, end);
block = block.replace('const SEED_DATA', 'export const SEED_DATA');
block = block.replace("status: 'กำลังปฏิบัติงาน'", "status: 'เข้างานแล้ว'");
fs.writeFileSync(outPath, `${block}\n`);
console.log('Written', outPath);
