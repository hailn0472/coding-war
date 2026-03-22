import { useState, useCallback } from 'react';
import type { UserFilters } from '@/components/Users/UserFilters';

const defaultFilters: UserFilters = {
  page: 1,
  pageSize: 50,
  sortBy: 'rating',
  sortOrder: 'desc',
};

export const useUserFilters = () => {
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
};
