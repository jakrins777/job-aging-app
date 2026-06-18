import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobTable from './components/JobTable';

const API_URL = 'https://job-aging-app.onrender.com/api';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

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

        {/* 📋 โยนข้อมูลดิบไปให้ JobTable จัดการ (ตอนนี้แผงค้นหาจะมีแค่อันเดียวที่อยู่ใน JobTable แล้ว) */}
        <JobTable jobs={jobs} />

      </div>
    </div>
  );
}

export default App;