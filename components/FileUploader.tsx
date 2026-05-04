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
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          try {
            let fixedText = text.trim();
            if (fixedText.endsWith(']') && !fixedText.startsWith('[')) {
                fixedText = '[' + fixedText;
            } else if (fixedText.startsWith('[') && !fixedText.endsWith(']')) {
                fixedText = fixedText.replace(/,\s*$/, '') + ']';
            } else if (fixedText.startsWith('{') && !fixedText.endsWith(']')) {
                fixedText = '[' + fixedText.replace(/,\s*$/, '') + ']';
            }
            data = JSON.parse(fixedText);
          } catch (err2) {
            try {
              // Attempt to parse as JSONL (JSON Lines)
              data = text.split('\n').map(line => line.trim()).filter(Boolean).map(line => JSON.parse(line));
            } catch (err3) {
              throw new Error("Failed to parse JSON. Please ensure the file contains valid JSON.");
            }
          }
        }
        
        function flattenData(dataObj: any): any[] {
            if (!Array.isArray(dataObj)) return [dataObj];
            if (dataObj.length === 0) return [];
            
            let result: any[] = [];
            
            for (const item of dataObj) {
                if (typeof item !== 'object' || item === null) {
                    result.push({ value: item });
                    continue;
                }
                
                let flattenedItem: any = {};
                let nestedArrays: Record<string, any[]> = {};
                
                for (const [key, val] of Object.entries(item)) {
                    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                        nestedArrays[key] = val;
                    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                        for(const [k, v] of Object.entries(val)) {
                            flattenedItem[key + '_' + k] = v;
                        }
                    } else {
                        // arrays of primitives or normal primitives
                        flattenedItem[key] = Array.isArray(val) ? val.join(', ') : val;
                    }
                }
                
                const arrayKeys = Object.keys(nestedArrays);
                if (arrayKeys.length === 0) {
                    result.push(flattenedItem);
                } else {
                    let expanded = [flattenedItem];
                    
                    for (const key of arrayKeys) {
                        let nextExpanded: any[] = [];
                        for (const row of expanded) {
                            for (const nestedItem of nestedArrays[key]) {
                                const subItems = flattenData([nestedItem]);
                                for (const sub of subItems) {
                                    let newRow = { ...row };
                                    for (const [subK, subV] of Object.entries(sub)) {
                                        newRow[key + '_' + subK] = subV;
                                    }
                                    nextExpanded.push(newRow);
                                }
                            }
                        }
                        expanded = nextExpanded;
                    }
                    result.push(...expanded);
                }
            }
            return result;
        }

        let baseData = data;
        if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
            const firstArrayValues = Object.values(data).find(v => Array.isArray(v));
            baseData = firstArrayValues ? firstArrayValues : [data];
        }
        
        parsedData = flattenData(baseData);
        
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
      alert(err instanceof Error ? err.message : 'Error parsing file.');
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
