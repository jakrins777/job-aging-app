import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import JobTable from './components/JobTable';

const API_URL = 'https://zany-happiness-q7pwppq9xq4xhxpr4-3000.app.github.dev/api';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // State สำหรับฟิลเตอร์ต่างๆ
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [wcFilter, setWcFilter] = useState('ALL');
  const [operFilter, setOperFilter] = useState('ALL');

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
  // 🚀 สกัดข้อมูลทำ Dropdown อัตโนมัติ (ใช้ useMemo เพื่อความเร็ว)
  // -----------------------------------------------------------------
  const uniqueWCs = useMemo(() => {
    return [...new Set(jobs.map(job => job.currentWc).filter(Boolean))].sort();
  }, [jobs]);

  const uniqueOpers = useMemo(() => {
    return [...new Set(jobs.map(job => job.currentOperNum).filter(Boolean))].sort((a, b) => a - b);
  }, [jobs]);

  // -----------------------------------------------------------------
  // 🚀 ลอจิกการกรองข้อมูล (ประมวลผลทุกฟิลเตอร์ร่วมกัน)
  // -----------------------------------------------------------------
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase().trim();
    const start = dayjs(job.startTransDate);

    // คำนวณ Aging (เผื่อค้นหาใน Global Search)
    let daysInSystem = dayjs().diff(start, 'day');
    if (isNaN(daysInSystem)) daysInSystem = 0;

    // 1. กรองสถานะ
    const matchesStatus = statusFilter === 'ALL' || job.currentStatus === statusFilter;

    // 2. กรอง WC (Dropdown)
    const matchesWc = wcFilter === 'ALL' || job.currentWc === wcFilter;

    // 3. กรอง Oper Num (Dropdown)
    const matchesOper = operFilter === 'ALL' || String(job.currentOperNum) === String(operFilter);

    // 4. กรองวันที่ (Calendar) - input type="date" จะให้ค่าเป็น YYYY-MM-DD
    const matchesDate = !dateFilter || start.format('YYYY-MM-DD') === dateFilter;

    // 5. ค้นหาแบบกว้าง (Global Search - ช่องพิมพ์)
    const matchesSearch = !term || (
      (job.jobId && job.jobId.toLowerCase().includes(term)) ||
      (job.item && job.item.toLowerCase().includes(term)) ||
      (job.productCode && job.productCode.toLowerCase().includes(term)) ||
      (job.currentWcDesc && job.currentWcDesc.toLowerCase().includes(term)) ||
      (String(daysInSystem).includes(term))
    );

    // ต้องตรงตามเงื่อนไขทุกข้อถึงจะแสดงผล
    return matchesStatus && matchesWc && matchesOper && matchesDate && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF5F3', padding: '40px 20px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#E26D5C', margin: 0, letterSpacing: '-0.02em' }}>Job Aging Monitoring</h1>
          <p style={{ fontSize: '14px', color: '#F28F79', marginTop: '4px', margin: 0 }}>Production & Warehouse Job Aging Tracking System</p>
        </div>

        {/* Upload Zone */}
        <div style={{ backgroundColor: '#FFFFFF', border: '2px dashed #FADBD8', borderRadius: '16px', padding: '32px', marginBottom: '24px', textAlign: 'center', transition: 'all 0.3s' }}>
          <input type="file" accept=".csv" onChange={handleUpload} id="csv-upload" style={{ display: 'none' }} />
          <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <span style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: loading ? '#E26D5C' : '#F5B7B1' }}>
              {loading ? '⏳ Processing report data...' : '📁 Click here to upload Infor SyteLine .csv report file'}
            </span>
          </label>
        </div>

        {/* Control Panel (Search & Multi-Filters) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #FADBD8', boxShadow: '0 4px 6px -1px rgba(250, 219, 216, 0.3)', marginBottom: '24px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>

            {/* Global Search */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                🔍 ค้นหาทั่วไป
              </label>
              <input
                type="text"
                placeholder="Item, Job, Description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Calendar Filter (วันที่เข้าระบบ) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                📅 วันที่เข้าระบบ (Start Date)
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ width: '100%', padding: '10px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              />
            </div>

            {/* WC Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                🏭 Work Center (WC)
              </label>
              <select
                value={wcFilter}
                onChange={(e) => setWcFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">ทุก Work Center</option>
                {uniqueWCs.map(wc => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>

            {/* Oper Num Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                ⚙️ Operation Num
              </label>
              <select
                value={operFilter}
                onChange={(e) => setOperFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">ทุก Operation</option>
                {uniqueOpers.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase', marginBottom: '8px' }}>
                🎛️ สถานะ (Status)
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFF5F3', border: '1px solid #FADBD8', borderRadius: '12px', fontSize: '14px', color: '#E26D5C', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="R">Active (Received)</option>
                <option value="S">Suspended (Stopped)</option>
              </select>
            </div>

            {/* KPI Summary Card - ย่อส่วนลงมาให้พอดีกับแถว */}
            <div style={{ backgroundColor: '#FEF0ED', border: '1px solid #FADBD8', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', height: '45px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#E26D5C', textTransform: 'uppercase' }}>พบข้อมูล</span>
              <div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#C25949' }}>{filteredJobs.length}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#E26D5C', marginLeft: '4px' }}>Jobs</span>
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