import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs'; // นำเข้า dayjs มาใช้คำนวณวันที่สำหรับระบบค้นหา
import JobTable from './components/JobTable';

const API_URL = 'https://zany-happiness-q7pwppq9xq4xhxpr4-3000.app.github.dev/api';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);

    try {
      await axios.post(`${API_URL}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Report uploaded and processed successfully!');
      fetchJobs();
    } catch (error) {
      alert('Failed to upload the report file.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // 🚀 ระบบ Global Search: ค้นหาได้จากทุกคอลัมน์
  // -----------------------------------------------------------------
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase().trim();

    // 1. ตรวจสอบสถานะ (Status Filter)
    const matchesStatus = statusFilter === 'ALL' || job.currentStatus === statusFilter;

    // ถ้าไม่ได้พิมพ์ค้นหาอะไรเลย ให้กรองแค่สถานะอย่างเดียว
    if (!term) return matchesStatus;

    // จำลองการคำนวณวันเหมือนในตาราง เพื่อให้ค้นหาจำนวนวัน (Aging) ได้
    const start = dayjs(job.startTransDate);
    let daysInSystem = dayjs().diff(start, 'day');
    if (isNaN(daysInSystem)) daysInSystem = 0;

    // 2. กวาดข้อมูลหาทุกฟิลด์ที่มี
    const matchesSearch = (
      (job.jobId && job.jobId.toLowerCase().includes(term)) ||                               // ค้นหา Job-Suffix
      (job.item && job.item.toLowerCase().includes(term)) ||                                 // ค้นหา Item
      (job.productCode && job.productCode.toLowerCase().includes(term)) ||                   // ค้นหา Product Code
      (job.currentWc && job.currentWc.toLowerCase().includes(term)) ||                       // ค้นหา WC
      (job.currentWcDesc && job.currentWcDesc.toLowerCase().includes(term)) ||               // ค้นหา WC Description
      (job.currentOperNum && String(job.currentOperNum).includes(term)) ||                   // ค้นหา Oper Num
      (job.qtyRelease && String(job.qtyRelease).includes(term)) ||                           // ค้นหา Qty Release
      (job.qtyCurrent && String(job.qtyCurrent).includes(term)) ||                           // ค้นหา Qty
      (job.currentStatus && job.currentStatus.toLowerCase() === term) ||                     // ค้นหาสถานะ R, S
      (start.format('DD/MM/YYYY').includes(term)) ||                                         // ค้นหาวันที่เข้าระบบ (Trans Date) เช่น "09/06"
      (String(daysInSystem).includes(term))                                                  // ค้นหาจำนวนวัน (Aging) เช่นพิมพ์ "5" หาคนที่ค้าง 5 วัน
    );

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF5F3', padding: '40px 20px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#E26D5C', margin: 0, letterSpacing: '-0.02em' }}>Job Aging Monitoring</h1>
          <p style={{ fontSize: '14px', color: '#F28F79', marginTop: '4px', margin: 0 }}>Production & Warehouse Job Aging Tracking System</p>
        </div>

        {/* Upload Zone */}
        <div style={{ backgroundColor: '#FFFFFF', border: '2px dashed #FADBD8', borderRadius: '16px', padding: '32px', marginBottom: '32px', textAlign: 'center', transition: 'all 0.3s' }}>
          <input type="file" accept=".csv" onChange={handleUpload} id="csv-upload" style={{ display: 'none' }} />
          <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <span style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: loading ? '#E26D5C' : '#F5B7B1' }}>
              {loading ? '⏳ Processing report data...' : '📁 Click here to upload Infor SyteLine .csv report file'}
            </span>
          </label>
        </div>

        {/* Control Panel (Search & Filter Bar) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #FADBD8', boxShadow: '0 4px 6px -1px rgba(250, 219, 216, 0.3)', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
            
            {/* 🔍 เปลี่ยนชื่อและ Placeholder ให้สื่อว่าค้นหาได้ทุกอย่าง */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                🔍 Global Search (ค้นหาได้ทุกข้อมูล)
              </label>
              <input
                type="text"
                placeholder="Search Item, Job, WC, Date, or Days..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                🎛️ Job Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">Show All Jobs</option>
                <option value="R">Active Jobs Only (Received)</option>
                <option value="S">Suspended Jobs Only (Stopped)</option>
              </select>
            </div>

            {/* KPI Summary Card */}
            <div style={{ backgroundColor: '#FEF0ED', border: '1px solid #FADBD8', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#E26D5C', margin: 0, textTransform: 'uppercase' }}>Total Outstanding</p>
                <p style={{ fontSize: '13px', color: '#F28F79', margin: '2px 0 0 0' }}>{searchTerm ? 'Filtered Results' : 'All Data'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#C25949', letterSpacing: '-0.05em' }}>{filteredJobs.length}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#E26D5C', marginLeft: '4px' }}>Jobs</span>
              </div>
            </div>

          </div>
        </div>

        {/* Data Table */}
        <JobTable jobs={filteredJobs} />
      </div>
    </div>
  );
}

export default App;