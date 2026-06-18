const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// ตรวจสอบและสร้างโฟลเดอร์ uploads อัตโนมัติ
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });

const corsOptions = {
  origin: [
    'https://job-aging-app.vercel.app', // โดเมน Vercel ของพี่
    'http://localhost:3000',            // เผื่อไว้ทดสอบในเครื่อง
    'http://localhost:5173'             // เผื่อใช้ Vite
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // อนุญาตให้ส่ง Cookie หรือ Header พิเศษได้
};

app.use(cors());
app.use(express.json());

// 🛠️ ฟังก์ชันช่วยแปลงตัวเลขอย่างปลอดภัย (แก้ปัญหาสัญลักษณ์ ขีด '-' และค่าว่าง)
const safeParseInt = (value) => {
  if (!value || value === '-') return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// 🛠️ ฟังก์ชันช่วยแกะฟอร์แมตวันที่ DD/MM/YYYY จากไฟล์ SyteLine ให้แม่นยำ
const safeParseDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return new Date();
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // ใน JS เดือนเริ่มนับจาก 0 (ม.ค. คือ 0)
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  const fallbackDate = new Date(dateStr);
  return !isNaN(fallbackDate.getTime()) ? fallbackDate : new Date();
};

// API สำหรับรับและประมวลผลไฟล์ CSV
app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // 1. กรองบรรทัดว่างออก แล้วบันทึกข้อมูลดิบทั้งหมดลง History Log
        const historyData = results
          .filter(row => row.Job && row.Job.trim() !== '')
          .map(row => ({
            job: row.Job.trim(),
            suffix: String(row.Suffix || '0').trim(),
            operNum: safeParseInt(row['Oper Num']),
            jobStatus: row['Job Status'] || 'R',
            item: row.Item || '',
            qtyRelease: safeParseInt(row['Qty Release']),
            qty: safeParseInt(row.Qty),
            productCode: row['Product Code'] || '',
            wc: row.WC || '',
            wcDesc: row['WC Description'] || '',
            transDate: safeParseDate(row['Trans Date'])
          }));

        if (historyData.length > 0) {
          await prisma.jobHistoryLog.createMany({
            data: historyData
          });
        }

        // 2. ลอจิกการจัดกลุ่มและเลือกขั้นตอน (Deduplication Logic ตามที่คุณต้องการ)
        const groupedJobs = {};

        results.forEach(row => {
          if (!row.Job || row.Job.trim() === '') return; // ข้ามแถวที่ไม่มีข้อมูล Job

          const jobId = `${row.Job.trim()}-${String(row.Suffix || '0').trim()}`;
          const currentOperNum = safeParseInt(row['Oper Num']);
          const transDate = safeParseDate(row['Trans Date']);

          if (!groupedJobs[jobId]) {
            groupedJobs[jobId] = {
              row: row,
              highestOperNum: currentOperNum,
              earliestDate: transDate,
              latestDate: transDate
            };
          } else {
            // ก) บันทึกวันที่เก่าที่สุดไว้ตั้งต้นทำ Aging เสมอ
            if (transDate < groupedJobs[jobId].earliestDate) {
              groupedJobs[jobId].earliestDate = transDate;
            }

            // ข) คัดเลือกขั้นตอนล่าสุด: ดึงจากหมายเลข Oper Num ที่มาทีหลัง
            // และเพิ่มเงื่อนไข: ถ้า Oper เท่ากัน ให้ยึดตามวันที่อัปเดตล่าสุดมาแทนข้อมูลเก่า
            if (
              currentOperNum > groupedJobs[jobId].highestOperNum ||
              (currentOperNum === groupedJobs[jobId].highestOperNum && transDate > groupedJobs[jobId].latestDate)
            ) {
              groupedJobs[jobId].row = row;
              groupedJobs[jobId].highestOperNum = currentOperNum;
              groupedJobs[jobId].latestDate = transDate;
            }
          }
        });

        // 3. ปรับปรุงสถานะลงตารางหลักเพื่อไปทำ Dashboard (Upsert)
        for (const key in groupedJobs) {
          const { row, earliestDate } = groupedJobs[key];
          const jobId = key;
          const job = row.Job.trim();
          const suffix = String(row.Suffix || '0').trim();

          // ตรวจสอบข้อมูลเดิมเพื่อรักษาวันที่เปิดแรกสุด (startTransDate) ไม่ให้เปลี่ยนไปตามไฟล์ใหม่
          const existingJob = await prisma.jobMaster.findUnique({
            where: { jobId }
          });

          const startTransDate = existingJob ? existingJob.startTransDate : earliestDate;

          await prisma.jobMaster.upsert({
            where: { jobId },
            update: {
              item: row.Item || '',
              qtyRelease: safeParseInt(row['Qty Release']),
              qtyCurrent: safeParseInt(row.Qty),
              productCode: row['Product Code'] || '',
              lastTransDate: safeParseDate(row['Trans Date']),
              currentOperNum: safeParseInt(row['Oper Num']),
              currentStatus: row['Job Status'] || 'R',
              currentWc: row.WC || '',
              currentWcDesc: row['WC Description'] || ''
            },
            create: {
              jobId,
              job,
              suffix,
              item: row.Item || '',
              qtyRelease: safeParseInt(row['Qty Release']),
              qtyCurrent: safeParseInt(row.Qty),
              productCode: row['Product Code'] || '',
              startTransDate: startTransDate,
              lastTransDate: safeParseDate(row['Trans Date']),
              currentOperNum: safeParseInt(row['Oper Num']),
              currentStatus: row['Job Status'] || 'R',
              currentWc: row.WC || '',
              currentWcDesc: row['WC Description'] || ''
            }
          });
        }

        fs.unlinkSync(req.file.path); // ลบไฟล์ชั่วคราวทิ้งหลังเสร็จงาน
        res.status(200).json({ message: 'CSV processed and database updated successfully.' });
      } catch (error) {
        console.error("❌ Error processing data: ", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
      }
    });
});

// API สำหรับดึงข้อมูลไปโชว์ที่ Dashboard
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.jobMaster.findMany({
      orderBy: { startTransDate: 'asc' }
    });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});