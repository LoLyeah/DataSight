'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Dataset } from '@/store/appStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function DatasetCharts({ dataset }: { dataset: Dataset }) {
  const [xAxis, setXAxis] = useState<string>(dataset.columns[0] || '');
  const [yAxis, setYAxis] = useState<string>(dataset.columns.length > 1 ? dataset.columns[1] : dataset.columns[0]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [aggregation, setAggregation] = useState<'none' | 'sum' | 'count'>('none');

  const chartData = useMemo(() => {
    let rawData = dataset.data;
    let processedData = [];
    
    if (aggregation !== 'none') {
        const grouped = new Map<string, any>();
        rawData.forEach(row => {
            const xVal = String(row[xAxis] ?? 'Unknown');
            if (!grouped.has(xVal)) {
                grouped.set(xVal, { [xAxis]: xVal, [yAxis]: 0 });
            }
            
            const current = grouped.get(xVal);
            if (aggregation === 'count') {
                current[yAxis] += 1;
            } else if (aggregation === 'sum') {
                const yVal = Number(row[yAxis]);
                if (!isNaN(yVal)) {
                    current[yAxis] += yVal;
                }
            }
        });
        
        processedData = Array.from(grouped.values());
        // Sort by X or Y if needed, let's keep it order of appearance
    } else {
        // If no aggregation, cap at 100 to avoid performance issues
        if (rawData.length > 100) {
            rawData = rawData.slice(0, 100);
        }
        
        // Ensure yAxis values are numeric for proper charting
        processedData = rawData.map(row => ({
            ...row,
            [yAxis]: !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : 0
        }));
    }
    
    return processedData;
  }, [dataset.data, xAxis, yAxis, aggregation]);

  return (
    <div className="flex flex-col h-full min-h-[500px] space-y-4 min-w-0">
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end shrink-0 transition-colors duration-300">
          <div className="space-y-2">
             <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase">Chart Type</Label>
             <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
               <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                 <SelectValue placeholder="Select type" />
               </SelectTrigger>
               <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                 <SelectItem value="bar" className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">Bar Chart</SelectItem>
                 <SelectItem value="line" className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">Line Chart</SelectItem>
               </SelectContent>
             </Select>
          </div>
          
          <div className="space-y-2">
             <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase">X Axis (Categories)</Label>
             <Select value={xAxis} onValueChange={setXAxis}>
               <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                 <SelectValue placeholder="Select X axis" />
               </SelectTrigger>
               <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                  {dataset.columns.map(c => <SelectItem key={c} value={c} className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">{c}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
          
          <div className="space-y-2">
             <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase">Y Axis (Values)</Label>
             <Select value={yAxis} onValueChange={setYAxis}>
               <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                 <SelectValue placeholder="Select Y axis" />
               </SelectTrigger>
               <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                  {dataset.columns.map(c => <SelectItem key={c} value={c} className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">{c}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
             <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase">Aggregation</Label>
             <Select value={aggregation} onValueChange={(val: any) => setAggregation(val)}>
               <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                 <SelectValue placeholder="Select aggregation" />
               </SelectTrigger>
               <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                 <SelectItem value="none" className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">None (First 100 rows)</SelectItem>
                 <SelectItem value="sum" className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">Sum by X Axis</SelectItem>
                 <SelectItem value="count" className="focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-slate-100 cursor-pointer">Count by X Axis</SelectItem>
               </SelectContent>
             </Select>
          </div>
      </div>
      
      <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors duration-300 min-h-[400px]">
        <ResponsiveContainer width="99%" height={400}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
              <XAxis dataKey={xAxis} stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => typeof val === 'string' && val.length > 15 ? val.slice(0, 15) + '...' : val} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} width={60} tickFormatter={(val) => typeof val === 'number' && val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toString()} />
              <Tooltip contentStyle={{ backgroundColor: 'rgb(30, 41, 59)', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey={yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} />
            </BarChart>
        ) : (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
              <XAxis dataKey={xAxis} stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => typeof val === 'string' && val.length > 15 ? val.slice(0, 15) + '...' : val} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} width={60} tickFormatter={(val) => typeof val === 'number' && val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toString()} />
              <Tooltip contentStyle={{ backgroundColor: 'rgb(30, 41, 59)', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey={yAxis} stroke="#3b82f6" activeDot={{ r: 8, fill: '#60a5fa' }} animationDuration={1000} />
            </LineChart>
        )}
          </ResponsiveContainer>
      </div>
    </div>
  );
}
