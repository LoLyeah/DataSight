'use client';

import React, { useState } from 'react';
import { OpenAI } from 'openai';
import { useAppStore, Dataset } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, FileText, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DatasetAI({ dataset, mode = 'summary' }: { dataset: Dataset, mode?: 'summary' | 'report' }) {
  const { aiConfig, setAIConfig } = useAppStore();
  const [prompt, setPrompt] = useState(mode === 'report' ? 'Generate a comprehensive summary.' : 'What are the main trends?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [configOpen, setConfigOpen] = useState(false);

  const generateInsights = async (type: 'summary' | 'report') => {
    if (!aiConfig.apiKey) {
      alert("Please configure your AI API Key first.");
      setConfigOpen(true);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const openai = new OpenAI({
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseURL,
        dangerouslyAllowBrowser: true
      });

      // Prepare context: metadata + 10 sample rows
      const columnsContext = dataset.columns.join(", ");
      const sampleData = dataset.data.slice(0, 10);
      
      const systemMessage = type === 'report' 
        ? "You are an expert data analyst. Generate a comprehensive, professional markdown report based on the provided dataset context. Include an executive summary, key findings, and data trends."
        : "You are a helpful data assistant. Provide a concise summary and observations based on the data context provided.";

      const userMessage = `
Dataset Name: ${dataset.name}
Columns: ${columnsContext}
Total Rows: ${dataset.data.length}
Sample Data (JSON):
${JSON.stringify(sampleData, null, 2)}

User Prompt: ${prompt}
      `;

      const response = await openai.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ]
      });

      const text = response.choices[0]?.message?.content || "No response generated.";
      
      if (type === 'report') {
        // Save to local storage and open new tab
        localStorage.setItem('dataSight_currentReport', JSON.stringify({
            title: `Report: ${dataset.name}`,
            content: text,
            date: new Date().toISOString()
        }));
        window.open('/report', '_blank');
      } else {
        setResult(text);
      }
      
    } catch (err: any) {
      console.error(err);
      alert('Error generating insight: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'report') {
     return (
        <>
          <button 
            className="mt-auto w-full py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg font-semibold text-sm shadow-sm transition-colors flex justify-center items-center relative z-20"
            onClick={() => generateInsights('report')}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {loading ? "Generating..." : "Generate Full Report"}
          </button>
        </>
     );
  }

  return (
    <div className="flex flex-col h-full text-slate-800 dark:text-slate-200 text-sm transition-colors duration-300">
      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 shrink-0 transition-colors duration-300">
         <span className="text-xs text-slate-500 dark:text-slate-400">Ask about your data</span>
         <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200" onClick={() => setConfigOpen(!configOpen)}>
            <Settings className="w-3 h-3" />
         </Button>
      </div>

      <AnimatePresence>
        {configOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4 shrink-0"
          >
            <div className="space-y-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
              <div className="space-y-1">
                 <Label className="text-[10px] text-slate-500 uppercase">API Key</Label>
                 <Input 
                    type="password" 
                    placeholder="sk-..." 
                    className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    value={aiConfig.apiKey} 
                    onChange={e => setAIConfig({ apiKey: e.target.value })}
                 />
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] text-slate-500 uppercase">Base URL / Model</Label>
                 <div className="flex gap-2">
                     <Input 
                        type="url" 
                        className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        value={aiConfig.baseURL} 
                        onChange={e => setAIConfig({ baseURL: e.target.value })}
                     />
                     <Input 
                        type="text" 
                        className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-24"
                        value={aiConfig.model} 
                        onChange={e => setAIConfig({ model: e.target.value })}
                     />
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 shrink-0">
        <Input 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. What are the main trends in this dataset?"
          className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-sm transition-colors duration-300"
        />
        
        <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-300" onClick={() => generateInsights('summary')} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Get Summary
        </Button>
      </div>

      <div className="flex-1 mt-4 overflow-auto rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 relative transition-colors duration-300">
         {!result ? (
            <p className="text-xs text-slate-500 absolute inset-0 flex items-center justify-center p-4 text-center">
               Analysis results will appear here. Powered by AI.
            </p>
         ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-300">
              {result}
            </motion.div>
         )}
      </div>
    </div>
  );
}
