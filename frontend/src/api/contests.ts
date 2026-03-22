import type {
  Contest,
  ContestsResponse,
  ContestTag,
  Organization,
  ContestClass,
} from '@/types';

// Mock data for development
const mockTags: ContestTag[] = [
  {
    id: 'rated',
    name: 'Rated',
    color: '#f97316',
    textColor: '#ffffff',
    description: 'This contest affects your rating',
  },
  {
    id: 'private',
    name: 'Private',
    color: '#6b7280',
    textColor: '#ffffff',
    description: 'Private contest',
  },
  {
    id: 'hidden',
    name: 'Hidden',
    color: '#1f2937',
    textColor: '#ffffff',
    description: 'Hidden contest',
  },
  {
    id: 'beginner',
    name: 'Beginner',
    color: '#10b981',
    textColor: '#ffffff',
    description: 'Beginner-friendly contest',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    color: '#dc2626',
    textColor: '#ffffff',
    description: 'Advanced contest',
  },
  {
    id: 'icpc',
    name: 'ICPC Style',
    color: '#3b82f6',
    textColor: '#ffffff',
    description: 'ICPC format contest',
  },
];

const mockOrganizations: Organization[] = [
  {
    id: 'dmoj',
    name: 'DMOJ',
    shortName: 'DMOJ',
    isOpen: true,
    memberCount: 5000,
  },
  {
    id: 'school1',
    name: 'University of Technology',
    shortName: 'UoT',
    isOpen: false,
    memberCount: 1200,
  },
  {
    id: 'school2',
    name: 'Programming Club',
    shortName: 'PC',
    isOpen: true,
    memberCount: 300,
  },
];

const mockClasses: ContestClass[] = [
  { id: 'div1', name: 'Division 1', description: 'Advanced participants' },
  { id: 'div2', name: 'Division 2', description: 'Intermediate participants' },
  { id: 'div3', name: 'Division 3', description: 'Beginner participants' },
];

const now = new Date();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

const mockContests: Contest[] = [
  // Active contests (user is participating)
  {
    id: '1',
    key: 'weekly-1',
    name: 'Weekly Contest #1',
    description: 'A weekly programming contest for all skill levels',
    startTime: new Date(now.getTime() - 2 * oneHour),
    endTime: new Date(now.getTime() + 2 * oneHour),
    timeLimit: 4 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: true,
    userCount: 1234,
    tags: [mockTags[0], mockTags[3]], // rated, beginner
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[1]],
    canJoin: false,
    canSpectate: false,
    participationStatus: 'active',
    timeRemaining: 2 * oneHour,
  },

  // Ongoing contests (not participating)
  {
    id: '2',
    key: 'icpc-practice',
    name: 'ICPC Practice Round',
    description: 'Practice contest in ICPC format',
    startTime: new Date(now.getTime() - oneHour),
    endTime: new Date(now.getTime() + 4 * oneHour),
    timeLimit: 5 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: false,
    userCount: 856,
    tags: [mockTags[5]], // icpc
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[0]],
    canJoin: true,
    canSpectate: true,
    participationStatus: null,
    timeRemaining: 4 * oneHour,
  },

  {
    id: '3',
    key: 'school-contest',
    name: 'University Programming Contest',
    description: 'Internal university contest',
    startTime: new Date(now.getTime() - 30 * 60 * 1000),
    endTime: new Date(now.getTime() + 2.5 * oneHour),
    timeLimit: 3 * oneHour,
    isVisible: true,
    isPrivate: true,
    isOrganizationPrivate: true,
    isRated: true,
    userCount: 234,
    tags: [mockTags[0], mockTags[1]], // rated, private
    organizations: [mockOrganizations[1]],
    classes: [mockClasses[1]],
    canJoin: false,
    canSpectate: true,
    participationStatus: null,
    timeRemaining: 2.5 * oneHour,
  },

  // Upcoming contests
  {
    id: '4',
    key: 'monthly-challenge',
    name: 'Monthly Challenge',
    description: 'Monthly algorithmic challenge',
    startTime: new Date(now.getTime() + 2 * oneDay),
    endTime: new Date(now.getTime() + 2 * oneDay + 6 * oneHour),
    timeLimit: 6 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: true,
    userCount: 0,
    tags: [mockTags[0], mockTags[4]], // rated, advanced
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[0]],
    canJoin: true,
    canSpectate: false,
    participationStatus: null,
    timeBeforeStart: 2 * oneDay,
  },

  {
    id: '5',
    key: 'beginner-round',
    name: 'Beginner Round #5',
    description: 'Contest designed for programming beginners',
    startTime: new Date(now.getTime() + oneDay),
    endTime: new Date(now.getTime() + oneDay + 3 * oneHour),
    timeLimit: 3 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: false,
    userCount: 0,
    tags: [mockTags[3]], // beginner
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[2]],
    canJoin: true,
    canSpectate: false,
    participationStatus: null,
    timeBeforeStart: oneDay,
  },

  // Past contests
  {
    id: '6',
    key: 'past-contest-1',
    name: 'Algorithm Sprint #10',
    description: 'Fast-paced algorithmic contest',
    startTime: new Date(now.getTime() - 3 * oneDay),
    endTime: new Date(now.getTime() - 3 * oneDay + 2 * oneHour),
    timeLimit: 2 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: true,
    userCount: 1876,
    tags: [mockTags[0], mockTags[4]], // rated, advanced
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[0]],
    canJoin: false,
    canSpectate: true,
    participationStatus: 'finished',
  },

  {
    id: '7',
    key: 'past-contest-2',
    name: 'Weekly Contest #50',
    description: 'Milestone weekly contest',
    startTime: new Date(now.getTime() - 7 * oneDay),
    endTime: new Date(now.getTime() - 7 * oneDay + 4 * oneHour),
    timeLimit: 4 * oneHour,
    isVisible: true,
    isPrivate: false,
    isOrganizationPrivate: false,
    isRated: true,
    userCount: 2341,
    tags: [mockTags[0]], // rated
    organizations: [mockOrganizations[0]],
    classes: [mockClasses[1]],
    canJoin: false,
    canSpectate: true,
    participationStatus: null,
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const contestsAPI = {
  async getContests(page = 1, pageSize = 10): Promise<ContestsResponse> {
    await delay(300); // Simulate network delay

    const now = new Date();

    // Categorize contests
    const activeContests = mockContests.filter(
      contest => contest.participationStatus === 'active'
    );

    const ongoingContests = mockContests.filter(
      contest =>
        contest.participationStatus !== 'active' &&
        contest.startTime <= now &&
        (contest.endTime ? contest.endTime > now : true)
    );

    const upcomingContests = mockContests.filter(
      contest => contest.startTime > now
    );

    const allPastContests = mockContests.filter(
      contest =>
        contest.participationStatus !== 'active' &&
        contest.endTime &&
        contest.endTime <= now
    );

    // Paginate past contests
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pastContests = allPastContests.slice(startIndex, endIndex);
    const pastContestsTotalPages = Math.ceil(allPastContests.length / pageSize);

    return {
      activeContests,
      ongoingContests,
      upcomingContests,
      pastContests,
      pastContestsTotalPages,
    };
  },

  async joinContest(
    contestId: string
  ): Promise<{ success: boolean; message: string }> {
    await delay(500);

    // Simulate join logic
    const contest = mockContests.find(c => c.id === contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    if (!contest.canJoin) {
      throw new Error('Cannot join this contest');
    }

    // Update mock data
    contest.participationStatus = 'active';
    contest.canJoin = false;
    contest.userCount += 1;

    return {
      success: true,
      message: 'Successfully joined the contest!',
    };
  },

  async spectateContest(
    contestId: string
  ): Promise<{ success: boolean; message: string }> {
    await delay(300);

    const contest = mockContests.find(c => c.id === contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    if (!contest.canSpectate) {
      throw new Error('Cannot spectate this contest');
    }

    return {
      success: true,
      message: 'Now spectating the contest!',
    };
  },
};
