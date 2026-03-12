import { useState, useCallback } from 'react';
import type { ProblemFilters } from '@/types';

export const useProblemFilters = (initialFilters: ProblemFilters = {}) => {
  const [filters, setFilters] = useState<ProblemFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof ProblemFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ProblemFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearFilter = useCallback((key: keyof ProblemFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
  };
};
