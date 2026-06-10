import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs'; 

function JobTable({ jobs }) {
  // -----------------------------------------
  // ลอจิกสำหรับการแบ่งหน้า (Pagination Logic)
  // -----------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // กำหนดจำนวนรายการต่อ 1 หน้า (เปลี่ยนเลขได้ตามชอบ)

  // ถ้ารายการ jobs เปลี่ยนไป (เช่น มีการค้นหา หรือ ฟิลเตอร์) ให้กลับมาเริ่มที่หน้า 1 ใหม่เสมอ
  useEffect(() => {
    setCurrentPage(1);
  }, [jobs]);

  // คำนวณหา Index ของข้อมูลที่จะตัดมาโชว์ในหน้านั้นๆ
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = jobs.slice(indexOfFirstItem, indexOfLastItem);
  
  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  // ฟังก์ชันเปลี่ยนหน้า
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
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

              // Pastel Color Alert Logic
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
            
            {jobs.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: '#F5B7B1', fontSize: '14px' }}>
                  No data available. Please upload a .csv report file to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* แถบควบคุมการเปลี่ยนหน้า (Pagination Footer) */}
      {jobs.length > 0 && (
        <div style={{ padding: '16px 24px', backgroundColor: '#FFF5F3', borderTop: '1px solid #FADBD8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ fontSize: '13px', color: '#E26D5C', fontWeight: '600' }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, jobs.length)} of {jobs.length} Entries
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default JobTable;