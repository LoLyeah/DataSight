'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { FileUploader } from '@/components/FileUploader';
import { DatasetTable } from '@/components/DatasetTable';
import { DatasetCharts } from '@/components/DatasetCharts';
import { DatasetAI } from '@/components/DatasetAI';
import { DatasetExport } from '@/components/DatasetExport';
import { ThemeToggle } from '@/components/ThemeToggle';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Database, Plus, Trash2, PieChart, Table as TableIcon, Sparkles, Download, Menu, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { DatasetAIReportTrigger } from '@/components/DatasetAIReportTrigger'; // Let's ignore this and put button directly

export default function Home() {
  const { 
    datasets, 
    activeDatasetId, 
    activeDataset, 
    loadDatasetsMeta, 
    setActiveDatasetId, 
    deleteDataset 
  } = useAppStore();

  useEffect(() => {
    loadDatasetsMeta();
  }, [loadDatasetsMeta]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 h-screen w-full overflow-hidden flex flex-col p-4 font-sans transition-colors duration-300">
      
      {/* Header Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-4 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 backdrop-blur transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white cursor-pointer" onClick={() => setActiveDatasetId(null)}>D</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">DataSight <span className="text-blue-500 dark:text-blue-400">Pro</span></h1>
        </div>
        <div className="flex gap-2 items-center">
          {activeDataset && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-500 dark:text-slate-400 mr-4 self-center hidden md:block">
              Dataset: <span className="text-slate-900 dark:text-slate-100">{activeDataset.name}</span>
            </motion.div>
          )}
          <ThemeToggle />
          <Button 
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 transition-colors"
            onClick={() => setActiveDatasetId(null)}
          >
            Datasets
          </Button>
          <Button 
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white border-0 transition-colors"
            onClick={() => {
              const el = document.getElementById('fileUpload');
              if(el) el.click();
            }}
          >
            Import File
          </Button>
        </div>
      </motion.header>

      {/* Main Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeDatasetId ? 'dataset' : 'home'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto lg:overflow-hidden pb-4"
        >
          {!activeDatasetId ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col max-h-[60vh] transition-colors duration-300"
                 >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Datasets</h2>
                    {datasets.length === 0 ? (
                      <p className="text-slate-500">No datasets yet. Upload a file to begin.</p>
                    ) : (
                      <div className="space-y-3 overflow-y-auto pr-2">
                        <AnimatePresence>
                        {datasets.map(meta => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            key={meta.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-colors" onClick={() => setActiveDatasetId(meta.id)}>
                            <div className="overflow-hidden">
                               <p className="font-medium text-slate-900 dark:text-slate-200 truncate">{meta.name}</p>
                               <p className="text-xs text-slate-500">{format(new Date(meta.createdAt), 'MMM d, yyyy')}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg shrink-0 ml-2" onClick={(e) => { e.stopPropagation(); deleteDataset(meta.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                    )}
                 </motion.div>
                 
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col justify-center transition-colors duration-300"
                 >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">New Dataset</h2>
                    <FileUploader />
                 </motion.div>
              </div>
            </div>
          ) : activeDataset ? (
             <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1 grid grid-cols-1 lg:grid-cols-12 grid-rows-none lg:grid-rows-6 gap-4 h-full">
                
                {/* Feature 1: AI Chat & Summary */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 lg:row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto thin-scrollbar transition-colors duration-300">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider">AI Insights</span>
                   </div>
                   <DatasetAI dataset={activeDataset} />
                </motion.div>

                {/* Main Data Table Card */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-9 lg:row-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden transition-colors duration-300">
                   <DatasetTable dataset={activeDataset} />
                </motion.div>

                {/* Export / Format Options Card */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 lg:row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto transition-colors duration-300">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Export Options</h3>
                   <DatasetExport dataset={activeDataset} />
                </motion.div>

                {/* AI Report Generator Box (To match theme) */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 lg:row-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col transition-colors duration-300">
                   <div className="relative z-10 h-full flex flex-col">
                      <h3 className="text-lg font-bold mb-2">AI Narrative Report</h3>
                      <p className="text-sm text-blue-100 mb-4">Generate a comprehensive summary report analyzing key trends and outliers.</p>
                      <DatasetAI dataset={activeDataset} mode="report" />
                      <div className="mt-auto pt-4 space-y-2">
                         <div className="text-xs text-blue-200">Powered by OpenAI / Groq</div>
                      </div>
                   </div>
                   <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 dark:bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                </motion.div>

                {/* Quick Stats / Charts */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-5 lg:row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto flex flex-col transition-colors duration-300">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Visualizations</h3>
                   <div className="flex-1 min-h-[250px]">
                      <DatasetCharts dataset={activeDataset} />
                   </div>
                </motion.div>

                {/* System Status Card */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 lg:row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors duration-300">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Status</h3>
                   <div className="space-y-4 pt-2">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                         Local Offline Storage
                       </div>
                       <span className="text-xs text-slate-500">Active</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         AI Model
                       </div>
                       <span className="text-xs text-slate-500">Connected</span>
                     </div>
                     <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono transition-colors duration-300">
                       Rows: {activeDataset.data.length} | Columns: {activeDataset.columns.length}
                     </div>
                   </div>
                </motion.div>
             </motion.div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
               <motion.div 
                 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                 className="flex flex-col items-center gap-4 text-slate-500"
               >
                  <Database className="w-8 h-8 opacity-50" />
                  <span>Loading dataset...</span>
               </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style jsx global>{`
        .thin-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
          border-radius: 20px;
        }
        .dark .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
        }
      `}</style>
    </div>
  );
}
