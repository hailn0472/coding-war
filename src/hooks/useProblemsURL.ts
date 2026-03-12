import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProblemFilters } from '@/types';

export const useProblemsURL = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const filters: ProblemFilters = {};

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const category = searchParams.get('category');
    if (category) filters.category = category;

    const types = searchParams.get('types');
    if (types) filters.types = types.split(',');

    const difficulty = searchParams.get('difficulty');
    if (difficulty) filters.difficulty = difficulty;

    const pointMin = searchParams.get('pointMin');
    const pointMax = searchParams.get('pointMax');
    if (pointMin && pointMax) {
      filters.pointRange = [parseInt(pointMin), parseInt(pointMax)];
    }

    const showSolved = searchParams.get('showSolved');
    if (showSolved === 'true') filters.showSolved = true;

    const hideSolved = searchParams.get('hideSolved');
    if (hideSolved === 'true') filters.hideSolved = true;

    const hasEditorial = searchParams.get('hasEditorial');
    if (hasEditorial === 'true') filters.hasEditorial = true;

    return filters;
  }, [searchParams]);

  const page = useMemo(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam) : 1;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const pageSizeParam = searchParams.get('pageSize');
    return pageSizeParam ? parseInt(pageSizeParam) : 10;
  }, [searchParams]);

  const updateFilters = (
    newFilters: ProblemFilters,
    newPage = 1,
    newPageSize = pageSize
  ) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.types?.length)
      params.set('types', newFilters.types.join(','));
    if (newFilters.difficulty) params.set('difficulty', newFilters.difficulty);
    if (newFilters.pointRange) {
      params.set('pointMin', newFilters.pointRange[0].toString());
      params.set('pointMax', newFilters.pointRange[1].toString());
    }
    if (newFilters.showSolved) params.set('showSolved', 'true');
    if (newFilters.hideSolved) params.set('hideSolved', 'true');
    if (newFilters.hasEditorial) params.set('hasEditorial', 'true');

    if (newPage > 1) params.set('page', newPage.toString());
    if (newPageSize !== 10) params.set('pageSize', newPageSize.toString());

    setSearchParams(params);
  };

  return {
    filters,
    page,
    pageSize,
    updateFilters,
  };
};
