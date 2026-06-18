import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';

function JobTable({ jobs }) {
  // -----------------------------------------
  // 1. State สำหรับฟิลเตอร์ต่างๆ (Search, Dropdown, Calendar)
  // -----------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [wcFilter, setWcFilter] = useState('ALL');
  const [operFilter, setOperFilter] = useState('ALL');

  // -----------------------------------------
  // 2. สกัดข้อมูลทำ Dropdown (ใช้ useMemo เพื่อความเร็ว)
  // -----------------------------------------
  const uniqueWCs = useMemo(() => {
    return [...new Set(jobs.map(job => job.currentWc).filter(Boolean))].sort();
  }, [jobs]);

  const uniqueOpers = useMemo(() => {
    return [...new Set(jobs.map(job => job.currentOperNum).filter(Boolean))].sort((a, b) => a - b);
  }, [jobs]);

  // -----------------------------------------
  // 3. ลอจิกการกรองข้อมูล (Filter Logic)
  // -----------------------------------------
  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase().trim();
    const start = dayjs(job.startTransDate);

    let daysInSystem = dayjs().diff(start, 'day');
    if (isNaN(daysInSystem)) daysInSystem = 0;

    const matchesStatus = statusFilter === 'ALL' || job.currentStatus === statusFilter;
    const matchesWc = wcFilter === 'ALL' || job.currentWc === wcFilter;
    const matchesOper = operFilter === 'ALL' || String(job.currentOperNum) === String(operFilter);
    const matchesDate = !dateFilter || start.format('YYYY-MM-DD') === dateFilter;

    const matchesSearch = !term || (
      (job.jobId && job.jobId.toLowerCase().includes(term)) ||
      (job.item && job.item.toLowerCase().includes(term)) ||
      (job.productCode && job.productCode.toLowerCase().includes(term)) ||
      (job.currentWcDesc && job.currentWcDesc.toLowerCase().includes(term)) ||
      (String(daysInSystem).includes(term))
    );

    return matchesStatus && matchesWc && matchesOper && matchesDate && matchesSearch;
  });

  // -----------------------------------------
  // 4. ลอจิกสำหรับการแบ่งหน้า (Pagination Logic)
  // -----------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [jumpToPage, setJumpToPage] = useState('');

  // ถ้ารายการ jobs หรือการค้นหาเปลี่ยนไป ให้กลับมาเริ่มที่หน้า 1 ใหม่เสมอ
  useEffect(() => {
    setCurrentPage(1);
  }, [jobs, searchTerm, statusFilter, dateFilter, wcFilter, operFilter]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // ใช้ filteredJobs แทน jobs ปกติ เพื่อให้ตารางโชว์เฉพาะข้อมูลที่ค้นหาเจอ
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleJumpPage = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(jumpToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setJumpToPage('');
    } else {
      alert(`กรุณากรอกเลขหน้าให้ถูกต้อง (1 - ${totalPages})`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 🎛️ โซนแผงควบคุม (Filter Bar) - ย้ายมาอยู่ใน JobTable */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #FADBD8', boxShadow: '0 4px 6px -1px rgba(250, 219, 216, 0.3)' }}>
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
              📅 วันที่เข้าระบบ
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
              🏭 Work Center
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
              ⚙️ Operation
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
              🎛️ สถานะ
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
        </div>
      </div>

      {/* 📋 โซนตารางข้อมูล */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #FADBD8', boxShadow: '0 4px 6px -1px rgba(250, 219, 216, 0.4)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', fontFamily: 'sans-serif' }}>

            {/* Table Header */}
            <thead>
              <tr style={{ backgroundColor: '#FEF0ED', borderBottom: '1px solid #FADBD8' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase' }}>Job-Suffix</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase' }}>Item</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase' }}>Oper Num</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase' }}>WC</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase' }}>WC Description</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase', textAlign: 'center' }}>Last Transaction Date</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#D96C5C', textTransform: 'uppercase', textAlign: 'center' }}>Aging</th>
              </tr>
            </thead>

            {/* Table Body (ใช้ currentJobs แทน jobs ตัวเต็ม) */}
            <tbody>
              {currentJobs.map((job) => {
                const start = dayjs(job.startTransDate);
                let daysInSystem = dayjs().diff(start, 'day');
                if (isNaN(daysInSystem)) daysInSystem = 0;

                let ageBg = '#E8F5E9';
                let ageText = '#2E7D32';
                if (daysInSystem >= 7) {
                  ageBg = '#FCE8E6';
                  ageText = '#C5221F';
                } else if (daysInSystem >= 4) {
                  ageBg = '#FFF3E0';
                  ageText = '#E65100';
                }

                const isStopped = job.currentStatus === 'S';
                const statusBg = isStopped ? '#FCE8E6' : '#E8F5E9';
                const statusText = isStopped ? '#C5221F' : '#2E7D32';

                return (
                  <tr key={job.jobId} style={{ borderBottom: '1px solid #FFF5F3', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#5C4D4A' }}>{job.jobId}</td>
                    <td style={{ padding: '16px', color: '#E26D5C', fontWeight: '500' }}>{job.item}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ backgroundColor: '#FEF0ED', color: '#D96C5C', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>
                        {job.currentOperNum}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ backgroundColor: '#FFF5F3', color: '#E26D5C', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #FADBD8' }}>
                        {job.currentWc}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#E8998D', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.currentWcDesc}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#D96C5C' }}>
                      {start.format('DD/MM/YYYY')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: statusBg, color: statusText, fontWeight: '700', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', display: 'inline-block' }}>
                        {isStopped ? '🛑 Stopped' : '✅ Received'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: ageBg, color: ageText, fontWeight: '700', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', display: 'inline-block' }}>
                        {daysInSystem} {daysInSystem <= 1 ? 'Day' : 'Days'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: '#F5B7B1', fontSize: '14px' }}>
                    ไม่พบข้อมูลที่ค้นหา หรือ กรุณาอัพโหลดไฟล์ .csv
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* แถบควบคุมการเปลี่ยนหน้า (Pagination Footer) */}
        {filteredJobs.length > 0 && (
          <div style={{ padding: '16px 24px', backgroundColor: '#FFF5F3', borderTop: '1px solid #FADBD8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>

            <div style={{ fontSize: '13px', color: '#E26D5C', fontWeight: '600' }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredJobs.length)} of {filteredJobs.length} Entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#FADBD8' : '#E26D5C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4D4A' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#FADBD8' : '#E26D5C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Next
              </button>

              <form
                onSubmit={handleJumpPage}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '2px solid #FADBD8', paddingLeft: '16px', marginLeft: '4px' }}
              >
                <span style={{ fontSize: '13px', color: '#5C4D4A', fontWeight: '600' }}>Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  placeholder="..."
                  style={{ width: '60px', padding: '6px 8px', border: '1px solid #FADBD8', borderRadius: '6px', textAlign: 'center', outline: 'none', fontSize: '14px', color: '#5C4D4A' }}
                />
                <button
                  type="submit"
                  style={{ padding: '6px 12px', backgroundColor: '#E26D5C', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobTable;