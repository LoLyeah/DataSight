'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function ReportPage() {
  const [report, setReport] = useState<{title: string, content: string, date: string} | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('dataSight_currentReport');
    if (data) {
      setReport(JSON.parse(data));
    }
  }, []);

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
         <p className="text-muted-foreground text-lg">No report found. Generate one from the DataSight app.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
       <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl p-8 lg:p-12">
          <div className="flex justify-between items-start mb-8 pb-8 border-b">
             <div>
                <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
                <p className="text-gray-500 mt-2">Generated on {format(new Date(report.date), 'PPP p')}</p>
             </div>
             <Button variant="outline" onClick={() => window.print()} className="print:hidden">
                <Printer className="w-4 h-4 mr-2" />
                Print PDF
             </Button>
          </div>
          
          <div className="prose prose-blue max-w-none prose-headings:font-semibold">
             <ReactMarkdown>{report.content}</ReactMarkdown>
          </div>
       </div>
    </div>
  );
}
