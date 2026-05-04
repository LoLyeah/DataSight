'use client';

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { useAppStore, Dataset } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DatasetAI({ dataset, mode = 'summary' }: { dataset: Dataset, mode?: 'summary' | 'report' }) {
  const { aiConfig, setAIConfig } = useAppStore();
  const [prompt, setPrompt] = useState(mode === 'report' ? 'Generate a comprehensive summary.' : 'What are the main trends?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const generateInsights = async (type: 'summary' | 'report') => {
    if (aiConfig.provider === 'custom' && !aiConfig.apiKey) {
      alert("Please configure your Custom API Key in settings.");
      setConfigOpen(true);
      return;
    }

    if (aiConfig.provider === 'gemini' && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert("Missing default Gemini API Key in environment variables. Please provide NEXT_PUBLIC_GEMINI_API_KEY or switch to a custom provider.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Prepare context: metadata + 10 sample rows
      const columnsContext = dataset.columns.join(", ");
      const sampleData = dataset.data.slice(0, 10);
      
      const systemInstruction = type === 'report' 
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

      let text = "No response generated.";

      if (aiConfig.provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        text = response.text || text;
      } else {
        const openai = new OpenAI({
          apiKey: aiConfig.apiKey,
          baseURL: aiConfig.baseURL,
          dangerouslyAllowBrowser: true
        });
        const response = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ]
        });
        text = response.choices[0]?.message?.content || text;
      }
      
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
          
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
              >
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-800">
                   <div className="relative w-16 h-16 mb-4">
                     <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                     <Sparkles className="absolute inset-0 m-auto text-blue-500 h-6 w-6 animate-pulse" />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Generating Report...</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Please wait while our AI analyzes your dataset and crafts a comprehensive report.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                 <Label className="text-[10px] text-slate-500 uppercase">Provider</Label>
                 <Select value={aiConfig.provider} onValueChange={(val: any) => setAIConfig({ provider: val })}>
                   <SelectTrigger className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                     <SelectValue placeholder="Select provider" />
                   </SelectTrigger>
                   <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                     <SelectItem value="gemini">Default Gemini</SelectItem>
                     <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              
              {aiConfig.provider === 'custom' && (
                <>
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
                </>
              )}
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
         {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs animate-pulse">Analyzing dataset...</span>
             </div>
         ) : !result ? (
            <p className="text-xs text-slate-500 absolute inset-0 flex items-center justify-center p-4 text-center">
               Analysis results will appear here. Powered by {aiConfig.provider === 'gemini' ? 'Gemini' : aiConfig.model}.
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
