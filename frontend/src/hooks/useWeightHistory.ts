'use client';

import { useState, useEffect } from 'react';

export interface WeightEntry {
  id: string;
  timestamp: Date;
  weight: number;
  condition: string;
  confidence: string;
  imageUrl?: string;
  deviceType?: string;
  originalWeight?: number;
  calibrationApplied?: boolean;
}

export const useWeightHistory = () => {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar historial desde localStorage al inicializar
  useEffect(() => {
    const savedHistory = localStorage.getItem('weightHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setEntries(parsedHistory);
      } catch (error) {
        console.error('Error loading weight history:', error);
        localStorage.removeItem('weightHistory');
      }
    }
  }, []);

  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('weightHistory', JSON.stringify(entries));
    }
  }, [entries]);

  const addEntry = (newEntry: Omit<WeightEntry, 'id' | 'timestamp'>) => {
    const entry: WeightEntry = {
      ...newEntry,
      id: `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setEntries(prev => [entry, ...prev]);
    return entry;
  };

  const clearHistory = () => {
    setEntries([]);
    localStorage.removeItem('weightHistory');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const getStats = () => {
    if (entries.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        range: 0
      };
    }

    const weights = entries.map(entry => entry.weight);
    const average = Math.round(weights.reduce((sum, weight) => sum + weight, 0) / weights.length);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min;

    return {
      total: entries.length,
      average,
      min,
      max,
      range
    };
  };

  const getRecentEntries = (count: number = 5) => {
    return entries.slice(0, count);
  };

  const getEntriesByCondition = (condition: string) => {
    return entries.filter(entry => 
      entry.condition.toLowerCase() === condition.toLowerCase()
    );
  };

  const getEntriesByDevice = (deviceType: string) => {
    return entries.filter(entry => 
      entry.deviceType?.toLowerCase() === deviceType.toLowerCase()
    );
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weight_history_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    entries,
    isLoading,
    setIsLoading,
    addEntry,
    clearHistory,
    removeEntry,
    getStats,
    getRecentEntries,
    getEntriesByCondition,
    getEntriesByDevice,
    exportHistory
  };
};
