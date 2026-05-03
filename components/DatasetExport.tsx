'use client';

import React from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Dataset } from '@/store/appStore';
import { motion } from 'motion/react';

export function DatasetExport({ dataset }: { dataset: Dataset }) {

  const exportCSV = () => {
    const csv = Papa.unparse(dataset.data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataset.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${dataset.name}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const head = [dataset.columns];
    const body = dataset.data.map(row => dataset.columns.map(col => String(row[col] ?? '')));
    
    doc.text(`Dataset: ${dataset.name}`, 14, 15);
    
    autoTable(doc, {
      head: head,
      body: body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`${dataset.name}.pdf`);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="grid grid-cols-2 gap-2 h-full items-center">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportPDF} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 h-full text-slate-900 dark:text-slate-200">
          <span className="text-xs font-bold"><FileDown className="h-5 w-5 mb-1" /> PDF</span>
          <span className="text-[10px] text-slate-500">Report Table</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel} className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-500/50 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors duration-300 h-full">
          <span className="text-xs font-bold"><FileSpreadsheet className="h-5 w-5 mb-1" /> XLSX</span>
          <span className="text-[10px] opacity-70">Spreadsheet</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {}} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 cursor-not-allowed transition-colors duration-300 h-full">
          <span className="text-xs font-bold text-slate-400">JSON</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Raw Data</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportCSV} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 h-full text-slate-900 dark:text-slate-200">
          <span className="text-xs font-bold"><FileText className="h-5 w-5 mb-1" /> CSV</span>
          <span className="text-[10px] text-slate-500">Table Data</span>
        </motion.button>
      </div>
    </div>
  );
}
