import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

function UploadZone({ apiUrl, loading, setLoading, onUploadSuccess }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);

    try {
      await axios.post(`${apiUrl}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Data upload and processing successful!');
      onUploadSuccess(); // เรียกฟังก์ชันรีเฟรชตารางของตัวแม่ (App.jsx)
    } catch (error) {
      alert('An error occurred during the upload.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, setLoading, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-10 mb-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      {loading ? (
        <p className="text-blue-500 font-semibold">Processing CSV file...</p>
      ) : (
        <p className="text-gray-600">
          Drag the .csv file from Infor SyteLine and drop it here, or click to select the file.
        </p>
      )}
    </div>
  );
}

export default UploadZone;