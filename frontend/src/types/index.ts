// Global type definitions for Coding War

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  rating: number;
  maxRating: number;
  isStaff: boolean;
  isSuperuser: boolean;
  joinDate: Date;
  lastLogin?: Date;
  problemsSolved?: number;
  submissionCount?: number;
  contestsParticipated?: number;
  organizations?: Organization[];
}

export interface UserProfile extends User {
  bio?: string;
  website?: string;
  location?: string;
  timezone: string;

  // Statistics
  ratingHistory: RatingPoint[];
  problemsSolved: number;
  submissionCount: number;
  contestsParticipated: number;

  // Achievements
  badges: Badge[];
  achievements: Achievement[];

  // Organizations
  organizations: Organization[];
  classes: ContestClass[];

  // Permissions
  canEdit: boolean;
}

export interface RatingPoint {
  date: Date;
  rating: number;
  contest?: {
    id: string;
    name: string;
    key: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedDate: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedDate?: Date;
}

export interface ProblemActivity {
  date: Date;
  problemsSolved: number;
}

export interface ContestParticipation {
  id: string;
  contest: Contest;
  rank: number;
  score: number;
  ratingChange: number;
  participationDate: Date;
  isVirtual: boolean;
}

export interface Problem {
  id: string;
  code: string;
  name: string;
  i18nName?: string;
  description?: string;
  points: number;
  partial: boolean;
  acRate: number;
  userCount: number;
  timeLimit?: number;
  memoryLimit?: number;
  isPublic: boolean;
  hasPublicEditorial: boolean;
  group: ProblemGroup;
  types: string[];
  languages?: Language[];
  solvedStatus?: 'solved' | 'attempted' | 'unsolved';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
  updatedAt: string;
}

export interface ProblemGroup {
  id: string;
  name: string;
  fullName: string;
}

export interface ProblemType {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  fullName: string;
  problemCount: number;
}

export interface ProblemFilters {
  search?: string;
  category?: string;
  types?: string[];
  pointRange?: [number, number];
  showSolved?: boolean;
  hideSolved?: boolean;
  hasEditorial?: boolean;
  fullTextSearch?: boolean;
  difficulty?: string;
}

export interface ProblemListState {
  problems: Problem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  filters: ProblemFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ProblemsResponse {
  problems: Problem[];
  totalCount: number;
  hotProblems: Problem[];
  categories: Category[];
  types: ProblemType[];
  pointRange: [number, number];
}

export interface SearchResponse {
  problems: Problem[];
  suggestions: string[];
  totalCount: number;
}

export interface Language {
  id: string;
  name: string;
  shortName: string;
  extension: string;
  aceMode: string;
}

export interface Contest {
  id: string;
  key: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  timeLimit?: number;
  isVisible: boolean;
  isPrivate: boolean;
  isOrganizationPrivate: boolean;
  isRated: boolean;
  userCount: number;
  tags: ContestTag[];
  organizations: Organization[];
  classes: ContestClass[];
  canJoin: boolean;
  canSpectate: boolean;
  participationStatus?: 'active' | 'spectating' | 'finished' | null;
  timeRemaining?: number;
  timeBeforeStart?: number;
  timeBeforeEnd?: number;
  problems?: Problem[];
}

export interface ContestClass {
  id: string;
  name: string;
  description?: string;
}

export type ContestStatus = 'active' | 'ongoing' | 'upcoming' | 'past';

export interface ContestListState {
  activeContests: Contest[];
  ongoingContests: Contest[];
  upcomingContests: Contest[];
  pastContests: Contest[];
  pastContestsPage: number;
  pastContestsTotalPages: number;
  loading: boolean;
  error?: string;
  lastUpdated: Date;
}

export interface ContestsResponse {
  activeContests: Contest[];
  ongoingContests: Contest[];
  upcomingContests: Contest[];
  pastContests: Contest[];
  pastContestsTotalPages: number;
}

export interface ContestTag {
  id: string;
  name: string;
  color: string;
  textColor: string;
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  isOpen: boolean;
  memberCount: number;
}

export interface Submission {
  id: string;
  problem: Problem;
  user: User;
  language: Language;
  code: string;
  result: SubmissionResult;
  score: number;
  maxScore: number;
  time: number;
  memory: number;
  submitTime: Date;
  judgeTime?: Date;
}

export type SubmissionResult =
  | 'AC' // Accepted
  | 'WA' // Wrong Answer
  | 'TLE' // Time Limit Exceeded
  | 'MLE' // Memory Limit Exceeded
  | 'RE' // Runtime Error
  | 'CE' // Compilation Error
  | 'IE' // Internal Error
  | 'QU' // Queued
  | 'G'; // Grading

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  types?: string[];
  pointRange?: [number, number];
  showSolved?: boolean;
  hideSolved?: boolean;
  hasEditorial?: boolean;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Real-time WebSocket types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
  contestId?: string;
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  lastPing: Date;
  messageQueue: WebSocketMessage[];
  subscriptions: Set<string>;
}

export type RealTimeEvent =
  | 'submission_update'
  | 'contest_update'
  | 'user_notification'
  | 'judge_status'
  | 'leaderboard_update'
  | 'chat_message'
  | 'system_announcement'
  | 'problem_update'
  | 'user_activity';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface ActivityItem {
  id: string;
  type: 'submission' | 'contest_join' | 'problem_solve' | 'achievement';
  userId: string;
  username: string;
  avatar?: string;
  timestamp: Date;
  data: {
    problemCode?: string;
    problemName?: string;
    contestKey?: string;
    contestName?: string;
    result?: string;
    achievement?: string;
  };
}

export interface JudgeStatus {
  id: string;
  name: string;
  online: boolean;
  load: number;
  ping: number;
  languages: string[];
  problems: string[];
  lastSeen: Date;
}

export interface JudgeQueue {
  total: number;
  processing: number;
  waiting: number;
  byLanguage: Record<string, number>;
  estimatedWaitTime: number;
}

export interface SubmissionUpdate {
  submissionId: string;
  status: {
    result: string;
    isFinal: boolean;
    score?: number;
    time?: number;
    memory?: number;
  };
  problemCode: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  problems: Record<string, { score: number; time: number }>;
}

export interface LeaderboardUpdate {
  contestId: string;
  changes: Partial<LeaderboardEntry>[];
}
