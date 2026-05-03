import { create } from 'zustand';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

export interface Dataset {
  id: string;
  name: string;
  data: any[];
  columns: string[];
  createdAt: number;
}

export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

interface AppState {
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;
  
  datasets: Omit<Dataset, 'data'>[]; // Only metadata in memory immediately
  activeDatasetId: string | null;
  activeDataset: Dataset | null; // Full loaded dataset
  
  loadDatasetsMeta: () => Promise<void>;
  loadActiveDataset: (id: string) => Promise<void>;
  addDataset: (name: string, data: any[]) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  setActiveDatasetId: (id: string | null) => void;
}

localforage.config({
  name: 'DataSight',
  storeName: 'datasets', // Should be alphanumeric, with underscores.
});

// A helper to derive columns easily
const deriveColumns = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  const colSet = new Set<string>();
  // check first 100 rows to find all keys
  const maxRows = Math.min(100, data.length);
  for (let i = 0; i < maxRows; i++) {
    if (data[i] && typeof data[i] === 'object') {
      Object.keys(data[i]).forEach(k => colSet.add(k));
    }
  }
  return Array.from(colSet);
}

export const useAppStore = create<AppState>((set, get) => ({
  aiConfig: {
    apiKey: '',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama3-8b-8192',
  },
  setAIConfig: (config) => {
    set((state) => {
      const newConfig = { ...state.aiConfig, ...config };
      localStorage.setItem('dataSight_aiConfig', JSON.stringify(newConfig));
      return { aiConfig: newConfig };
    });
  },

  datasets: [],
  activeDatasetId: null,
  activeDataset: null,

  loadDatasetsMeta: async () => {
    try {
      const meta = localStorage.getItem('dataSight_datasetsMeta');
      if (meta) {
        set({ datasets: JSON.parse(meta) });
      }
      
      const config = localStorage.getItem('dataSight_aiConfig');
      if (config) {
        set({ aiConfig: JSON.parse(config) });
      }
    } catch(e) {
      console.error("Failed to load meta", e);
    }
  },

  loadActiveDataset: async (id) => {
    try {
      const data = await localforage.getItem<Dataset>(`dataset_${id}`);
      if (data) {
        set({ activeDataset: data, activeDatasetId: id });
      } else {
        set({ activeDataset: null, activeDatasetId: null });
      }
    } catch (e) {
      console.error('Error loading dataset', e);
    }
  },

  addDataset: async (name, data) => {
    try {
        const id = uuidv4(); // We'll just define uuid simple or use crypto.randomUUID
        const columns = deriveColumns(data);
        const dataset: Dataset = { id, name, data, columns, createdAt: Date.now() };
        
        await localforage.setItem(`dataset_${id}`, dataset);
        
        const metaInfo = { id, name, columns, createdAt: dataset.createdAt };
        const newDatasets = [metaInfo, ...get().datasets];
        
        localStorage.setItem('dataSight_datasetsMeta', JSON.stringify(newDatasets));
        
        set({ datasets: newDatasets, activeDataset: dataset, activeDatasetId: id });
    } catch (e) {
        console.error('Error saving dataset', e);
    }
  },

  deleteDataset: async (id) => {
    try {
      await localforage.removeItem(`dataset_${id}`);
      const newDatasets = get().datasets.filter(d => d.id !== id);
      localStorage.setItem('dataSight_datasetsMeta', JSON.stringify(newDatasets));
      
      set((state) => ({
        datasets: newDatasets,
        activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId,
        activeDataset: state.activeDatasetId === id ? null : state.activeDataset,
      }));
    } catch(e) {
      console.error("Error deleting dataset", e);
    }
  },

  setActiveDatasetId: async (id) => {
    if (id) {
        await get().loadActiveDataset(id);
    } else {
        set({ activeDatasetId: null, activeDataset: null });
    }
  }
}));
