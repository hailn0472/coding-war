import type {
  Problem,
  ProblemFilters,
  ProblemsResponse,
  Category,
  ProblemType,
} from '@/types';

// Mock data for development
const mockCategories: Category[] = [
  {
    id: 'all',
    name: 'All Categories',
    fullName: 'All Categories',
    problemCount: 150,
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    fullName: 'Algorithms',
    problemCount: 45,
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    fullName: 'Data Structures',
    problemCount: 32,
  },
  {
    id: 'math',
    name: 'Mathematics',
    fullName: 'Mathematics',
    problemCount: 28,
  },
  {
    id: 'graph-theory',
    name: 'Graph Theory',
    fullName: 'Graph Theory',
    problemCount: 25,
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    fullName: 'Dynamic Programming',
    problemCount: 20,
  },
];

const mockTypes: ProblemType[] = [
  { id: 'implementation', name: 'Implementation', color: 'blue' },
  { id: 'greedy', name: 'Greedy', color: 'green' },
  { id: 'dp', name: 'Dynamic Programming', color: 'purple' },
  { id: 'graph', name: 'Graph', color: 'red' },
  { id: 'math', name: 'Mathematics', color: 'yellow' },
  { id: 'string', name: 'String', color: 'pink' },
  { id: 'sorting', name: 'Sorting', color: 'indigo' },
  { id: 'binary-search', name: 'Binary Search', color: 'cyan' },
];

const mockProblems: Problem[] = [
  {
    id: '1',
    code: 'A001',
    name: 'Two Sum',
    group: { id: 'algorithms', name: 'Algorithms', fullName: 'Algorithms' },
    points: 100,
    partial: false,
    acRate: 45.2,
    userCount: 1234,
    types: ['implementation', 'math'],
    hasPublicEditorial: true,
    isPublic: true,
    solvedStatus: 'solved',
    difficulty: 'Easy',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    code: 'B002',
    name: 'Binary Search Tree Validation',
    group: {
      id: 'data-structures',
      name: 'Data Structures',
      fullName: 'Data Structures',
    },
    points: 200,
    partial: true,
    acRate: 32.8,
    userCount: 856,
    types: ['graph', 'dp'],
    hasPublicEditorial: false,
    isPublic: true,
    solvedStatus: 'attempted',
    difficulty: 'Medium',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    code: 'C003',
    name: 'Maximum Flow Problem',
    group: {
      id: 'graph-theory',
      name: 'Graph Theory',
      fullName: 'Graph Theory',
    },
    points: 350,
    partial: false,
    acRate: 18.5,
    userCount: 234,
    types: ['graph', 'greedy'],
    hasPublicEditorial: true,
    isPublic: true,
    solvedStatus: 'unsolved',
    difficulty: 'Hard',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
  },
  {
    id: '4',
    code: 'D004',
    name: 'String Pattern Matching',
    group: { id: 'algorithms', name: 'Algorithms', fullName: 'Algorithms' },
    points: 150,
    partial: true,
    acRate: 58.9,
    userCount: 2341,
    types: ['string', 'implementation'],
    hasPublicEditorial: true,
    isPublic: true,
    solvedStatus: 'solved',
    difficulty: 'Easy',
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-12T14:20:00Z',
  },
  {
    id: '5',
    code: 'E005',
    name: 'Advanced Dynamic Programming',
    group: {
      id: 'dynamic-programming',
      name: 'Dynamic Programming',
      fullName: 'Dynamic Programming',
    },
    points: 300,
    partial: false,
    acRate: 22.3,
    userCount: 156,
    types: ['dp', 'math'],
    hasPublicEditorial: false,
    isPublic: true,
    solvedStatus: 'unsolved',
    difficulty: 'Hard',
    createdAt: '2024-01-11T11:45:00Z',
    updatedAt: '2024-01-11T11:45:00Z',
  },
  {
    id: '6',
    code: 'F006',
    name: 'Sorting Algorithms Comparison',
    group: { id: 'algorithms', name: 'Algorithms', fullName: 'Algorithms' },
    points: 120,
    partial: false,
    acRate: 67.4,
    userCount: 1876,
    types: ['sorting', 'implementation'],
    hasPublicEditorial: true,
    isPublic: true,
    solvedStatus: 'attempted',
    difficulty: 'Easy',
    createdAt: '2024-01-10T16:30:00Z',
    updatedAt: '2024-01-10T16:30:00Z',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const problemsAPI = {
  async getProblems(
    filters: ProblemFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<ProblemsResponse> {
    await delay(300); // Simulate network delay

    let filteredProblems = [...mockProblems];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProblems = filteredProblems.filter(
        problem =>
          problem.name.toLowerCase().includes(searchLower) ||
          problem.code.toLowerCase().includes(searchLower) ||
          problem.types.some(type => type.toLowerCase().includes(searchLower))
      );
    }

    if (filters.category && filters.category !== 'all') {
      filteredProblems = filteredProblems.filter(
        problem => problem.group.id === filters.category
      );
    }

    if (filters.types && filters.types.length > 0) {
      filteredProblems = filteredProblems.filter(problem =>
        filters.types!.some(type => problem.types.includes(type))
      );
    }

    if (filters.difficulty) {
      filteredProblems = filteredProblems.filter(
        problem => problem.difficulty === filters.difficulty
      );
    }

    if (filters.pointRange) {
      const [min, max] = filters.pointRange;
      filteredProblems = filteredProblems.filter(
        problem => problem.points >= min && problem.points <= max
      );
    }

    if (filters.showSolved) {
      filteredProblems = filteredProblems.filter(
        problem => problem.solvedStatus === 'solved'
      );
    }

    if (filters.hideSolved) {
      filteredProblems = filteredProblems.filter(
        problem => problem.solvedStatus !== 'solved'
      );
    }

    if (filters.hasEditorial) {
      filteredProblems = filteredProblems.filter(
        problem => problem.hasPublicEditorial
      );
    }

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProblems = filteredProblems.slice(startIndex, endIndex);

    // Hot problems (most popular)
    const hotProblems = [...mockProblems]
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 5);

    return {
      problems: paginatedProblems,
      totalCount: filteredProblems.length,
      hotProblems,
      categories: mockCategories,
      types: mockTypes,
      pointRange: [50, 500],
    };
  },

  async searchProblems(query: string): Promise<Problem[]> {
    await delay(200);

    const searchLower = query.toLowerCase();
    return mockProblems.filter(
      problem =>
        problem.name.toLowerCase().includes(searchLower) ||
        problem.code.toLowerCase().includes(searchLower)
    );
  },
};
