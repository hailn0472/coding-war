import type {
  UserProfile,
  User,
  RatingPoint,
  Badge,
  Achievement,
  Submission,
  ContestParticipation,
  ProblemActivity,
} from '@/types';

// Mock data for development
const mockRatingHistory: RatingPoint[] = [
  {
    date: new Date('2024-01-15'),
    rating: 1200,
    contest: { id: '1', name: 'Weekly Contest #1', key: 'weekly-1' },
  },
  {
    date: new Date('2024-01-22'),
    rating: 1250,
    contest: { id: '2', name: 'Algorithm Sprint', key: 'sprint-1' },
  },
  {
    date: new Date('2024-02-05'),
    rating: 1180,
    contest: { id: '3', name: 'Monthly Challenge', key: 'monthly-1' },
  },
  {
    date: new Date('2024-02-12'),
    rating: 1320,
    contest: { id: '4', name: 'ICPC Practice', key: 'icpc-1' },
  },
  {
    date: new Date('2024-02-26'),
    rating: 1380,
    contest: { id: '5', name: 'Weekly Contest #5', key: 'weekly-5' },
  },
  {
    date: new Date('2024-03-05'),
    rating: 1420,
    contest: { id: '6', name: 'Beginner Round', key: 'beginner-3' },
  },
  {
    date: new Date('2024-03-12'),
    rating: 1450,
    contest: { id: '7', name: 'Advanced Contest', key: 'advanced-1' },
  },
];

const mockBadges: Badge[] = [
  {
    id: 'first-solve',
    name: 'First Solve',
    description: 'Solved your first problem',
    icon: '🎯',
    color: '#10b981',
    earnedDate: new Date('2024-01-10'),
  },
  {
    id: 'contest-participant',
    name: 'Contest Participant',
    description: 'Participated in your first contest',
    icon: '🏆',
    color: '#f59e0b',
    earnedDate: new Date('2024-01-15'),
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Solved 50 problems',
    icon: '🧩',
    color: '#3b82f6',
    earnedDate: new Date('2024-02-20'),
  },
  {
    id: 'rating-climber',
    name: 'Rating Climber',
    description: 'Reached 1400+ rating',
    icon: '📈',
    color: '#8b5cf6',
    earnedDate: new Date('2024-03-05'),
  },
];

const mockAchievements: Achievement[] = [
  {
    id: 'problem-count',
    name: 'Problem Master',
    description: 'Solve 100 problems',
    icon: '🎯',
    progress: 67,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: 'contest-count',
    name: 'Contest Veteran',
    description: 'Participate in 20 contests',
    icon: '🏆',
    progress: 12,
    maxProgress: 20,
    unlocked: false,
  },
  {
    id: 'rating-milestone',
    name: 'Expert Level',
    description: 'Reach 1600 rating',
    icon: '⭐',
    progress: 1450,
    maxProgress: 1600,
    unlocked: false,
  },
  {
    id: 'streak-solver',
    name: 'Streak Master',
    description: 'Solve problems for 30 consecutive days',
    icon: '🔥',
    progress: 15,
    maxProgress: 30,
    unlocked: false,
  },
];

const mockUserProfile: UserProfile = {
  id: '1',
  username: 'johndoe',
  displayName: 'John Doe',
  email: 'john@example.com',
  avatar:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: 'Passionate competitive programmer and algorithm enthusiast. Love solving complex problems and participating in contests.',
  website: 'https://johndoe.dev',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  rating: 1450,
  maxRating: 1520,
  isStaff: false,
  isSuperuser: false,
  joinDate: new Date('2024-01-01'),
  lastLogin: new Date('2024-03-12'),

  // Statistics
  ratingHistory: mockRatingHistory,
  problemsSolved: 67,
  submissionCount: 234,
  contestsParticipated: 12,

  // Achievements
  badges: mockBadges,
  achievements: mockAchievements,

  // Organizations
  organizations: [
    {
      id: 'dmoj',
      name: 'DMOJ',
      shortName: 'DMOJ',
      isOpen: true,
      memberCount: 5000,
    },
    {
      id: 'university',
      name: 'University of Technology',
      shortName: 'UoT',
      isOpen: false,
      memberCount: 1200,
    },
  ],
  classes: [
    {
      id: 'div2',
      name: 'Division 2',
      description: 'Intermediate participants',
    },
  ],

  // Permissions
  canEdit: true,
};

// Mock users data for user list
const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Eve Wilson',
    'Frank Miller',
    'Grace Lee',
    'Henry Davis',
    'Ivy Chen',
    'Jack Taylor',
    'Kate Anderson',
    "Liam O'Connor",
    'Maya Patel',
    'Noah Kim',
    'Olivia Garcia',
    'Paul Martinez',
    'Quinn Roberts',
    'Ruby Thompson',
    'Sam Williams',
    'Tara Singh',
  ];

  const organizations = [
    'DMOJ',
    'University of Technology',
    'MIT',
    'Stanford',
    'Harvard',
  ];

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const username =
      name.toLowerCase().replace(/[^a-z]/g, '') + (i > 19 ? i : '');
    const rating = Math.floor(Math.random() * 2500) + 500;
    const problemsSolved = Math.floor(Math.random() * 200) + 10;

    users.push({
      id: `user-${i + 1}`,
      username,
      displayName: name,
      email: `${username}@example.com`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=random`,
      rating,
      maxRating: rating + Math.floor(Math.random() * 100),
      isStaff: Math.random() < 0.05, // 5% staff
      isSuperuser: Math.random() < 0.01, // 1% superuser
      joinDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ),
      lastLogin: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
      problemsSolved,
      submissionCount: problemsSolved * (Math.floor(Math.random() * 5) + 2),
      contestsParticipated: Math.floor(Math.random() * 20) + 1,
      organizations:
        Math.random() < 0.7
          ? [
              {
                id: `org-${i}`,
                name: organizations[
                  Math.floor(Math.random() * organizations.length)
                ],
                shortName:
                  organizations[
                    Math.floor(Math.random() * organizations.length)
                  ],
                isOpen: Math.random() < 0.8,
                memberCount: Math.floor(Math.random() * 1000) + 100,
              },
            ]
          : [],
    });
  }

  return users;
};

const mockUsersList = generateMockUsers(500);

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const usersAPI = {
  async getUsers(
    params: {
      search?: string;
      organization?: string;
      ratingMin?: number;
      ratingMax?: number;
      page?: number;
      pageSize?: number;
      sortBy?: 'rating' | 'username' | 'problems_solved' | 'last_login';
      sortOrder?: 'asc' | 'desc';
      tab?: 'all' | 'top';
    } = {}
  ): Promise<{
    users: User[];
    totalCount: number;
  }> {
    await delay(300);

    let filteredUsers = [...mockUsersList];

    // Apply search filter
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        user =>
          user.displayName.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm)
      );
    }

    // Apply organization filter
    if (params.organization) {
      filteredUsers = filteredUsers.filter(user =>
        user.organizations?.some(org =>
          org.shortName
            .toLowerCase()
            .includes(params.organization!.toLowerCase())
        )
      );
    }

    // Apply rating range filters
    if (params.ratingMin !== undefined) {
      filteredUsers = filteredUsers.filter(
        user => user.rating >= params.ratingMin!
      );
    }
    if (params.ratingMax !== undefined) {
      filteredUsers = filteredUsers.filter(
        user => user.rating <= params.ratingMax!
      );
    }

    // Apply tab filter
    if (params.tab === 'top') {
      filteredUsers = filteredUsers.filter(user => user.rating >= 1600);
    }

    // Apply sorting
    const sortBy = params.sortBy || 'rating';
    const sortOrder = params.sortOrder || 'desc';

    filteredUsers.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'problems_solved':
          aValue = a.problemsSolved || 0;
          bValue = b.problemsSolved || 0;
          break;
        case 'last_login':
          aValue = a.lastLogin?.getTime() || 0;
          bValue = b.lastLogin?.getTime() || 0;
          break;
        default:
          aValue = a.rating;
          bValue = b.rating;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      totalCount: filteredUsers.length,
    };
  },

  async getProfile(username: string): Promise<UserProfile> {
    await delay(300);

    // Return mock data for now
    return { ...mockUserProfile, username };
  },

  async updateProfile(
    _username: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    await delay(500);

    // Simulate update
    const updatedProfile = { ...mockUserProfile, ...updates };
    return updatedProfile;
  },

  async getSubmissions(
    _username: string,
    _page = 1,
    _pageSize = 20
  ): Promise<{
    submissions: Submission[];
    totalCount: number;
  }> {
    await delay(200);

    // Mock submissions data would go here
    return {
      submissions: [],
      totalCount: 0,
    };
  },

  async getContestParticipations(
    _username: string
  ): Promise<ContestParticipation[]> {
    await delay(200);

    return [];
  },

  async getProblemActivity(_username: string): Promise<ProblemActivity[]> {
    await delay(200);

    // Generate mock activity data for the last 30 days
    const activity: ProblemActivity[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      activity.push({
        date,
        problemsSolved: Math.floor(Math.random() * 5), // 0-4 problems per day
      });
    }

    return activity;
  },
};
