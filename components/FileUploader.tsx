import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { motion } from 'motion/react';

export function FileUploader() {
  const addDataset = useAppStore(state => state.addDataset);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsedData: any[] = [];
      
      if (extension === 'csv') {
        parsedData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // nicely parse numbers/booleans
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
          });
        });
      } else if (extension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          parsedData = data;
        } else if (typeof data === 'object' && data !== null) {
          // If it's a single object, wrap in array or look for an array inside (heuristic)
          const firstArrayValues = Object.values(data).find(v => Array.isArray(v));
          if (firstArrayValues) {
             parsedData = firstArrayValues as any[];
          } else {
             parsedData = [data];
          }
        }
      } else if (extension === 'xls' || extension === 'xlsx') {
         const data = await file.arrayBuffer();
         const workbook = XLSX.read(data, { type: 'array' });
         const firstSheetName = workbook.SheetNames[0];
         const worksheet = workbook.Sheets[firstSheetName];
         parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else {
         alert('Unsupported file format. Please upload CSV, JSON, XLS, or XLSX.');
         return;
      }
      
      if (parsedData.length > 0) {
        await addDataset(file.name, parsedData);
      } else {
        alert('No data found in the file.');
      }
      
    } catch (err) {
      console.error(err);
      alert('Error parsing file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 cursor-pointer 
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileUpload')?.click()}
    >
      <input
        type="file"
        id="fileUpload"
        className="hidden"
        accept=".csv,.json,.xls,.xlsx"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <UploadCloud className={`w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
        <div>
           {loading ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-semibold text-slate-900 dark:text-slate-200 animate-pulse">Processing file...</motion.p>
           ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">Click or drag file to this area</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports CSV, JSON, XLS, XLSX</p>
              </motion.div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
