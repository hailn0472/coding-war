import { apiClient } from '../client';
import type { 
  Problem, 
  ProblemListResponse, 
  ProblemFilters 
} from '../../types/api';

export const problemsAPI = {
  list: (filters: ProblemFilters = {}) =>
    apiClient.get<ProblemListResponse>('/api/problems', { params: filters }),

  getById: (id: string) =>
    apiClient.get<Problem>(`/api/problems/${id}`),

  create: (data: Partial<Problem>) =>
    apiClient.post<{ problemId: string }>('/api/problems', data),

  update: (id: string, data: Partial<Problem>) =>
    apiClient.put<{ message: string }>(`/api/problems/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/problems/${id}`),

  uploadTestCases: (id: string, file: File, sampleCount: number = 0) => {
    const formData = new FormData();
    formData.append('testCases', file);
    formData.append('sampleCount', String(sampleCount));
    return apiClient.post<{ message: string; testCasesCount: number }>(
      `/api/problems/${id}/test-cases`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
