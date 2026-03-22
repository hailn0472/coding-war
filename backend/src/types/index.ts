// Common type definitions

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  requestId: string;
  timestamp: string;
}

// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

// Submission status
export enum SubmissionStatus {
  QUEUED = 'QUEUED',
  COMPILING = 'COMPILING',
  RUNNING = 'RUNNING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
}

// Programming languages
export enum Language {
  C = 'C',
  CPP = 'CPP',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
}

// Problem difficulty
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Contest scoring rules
export enum ScoringRule {
  IOI = 'IOI',
  ACM = 'ACM',
}
