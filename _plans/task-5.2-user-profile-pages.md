# Task 5.2: User Profile Pages

## Mục tiêu

Tạo trang profile chi tiết cho users với thông tin cá nhân, submission history, problem statistics, rating graph và achievement system.

## Thời gian ước tính

**3 ngày**

## Dependencies

- Task 2.2: Table Components (cho submission history)
- Task 8.2: Analytics & Charts (cho rating graphs)
- Task 1.2: Base Layout Components

## Technical Requirements

### User Profile Interface

```typescript
interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    avatar?: string;
    bio?: string;
    website?: string;
    location?: string;
    timezone: string;
    joinDate: Date;
    lastLogin?: Date;

    // Statistics
    rating: number;
    maxRating: number;
    ratingHistory: RatingPoint[];
    problemsSolved: number;
    submissionCount: number;
    contestsParticipated: number;

    // Achievements
    badges: Badge[];
    achievements: Achievement[];

    // Organizations
    organizations: Organization[];
    classes: Class[];

    // Permissions
    isStaff: boolean;
    isSuperuser: boolean;
    canEdit: boolean;
}

interface RatingPoint {
    date: Date;
    rating: number;
    contest?: {
        id: string;
        name: string;
        key: string;
    };
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earnedDate: Date;
}
```

## Implementation Details

### 1. Main Profile Component

**File**: `src/pages/Users/UserProfile.tsx`

- Tabbed interface layout
- Responsive design
- Loading states
- Error handling
- Edit mode toggle

### 2. Profile Header Component

**File**: `src/components/Users/ProfileHeader.tsx`

- Avatar display
- Basic user information
- Rating display với color coding
- Action buttons (Edit, Message, etc.)

### 3. Profile Tabs System

**File**: `src/components/Users/ProfileTabs.tsx`

- **About**: Bio, personal info, organizations
- **Problems**: Solved problems list với statistics
- **Submissions**: Submission history table
- **Contests**: Contest participation history
- **Rating**: Rating graph và contest performance
- **Achievements**: Badges và achievements display

### 4. Rating Graph Component

**File**: `src/components/Users/RatingGraph.tsx`

- Interactive line chart
- Contest markers
- Rating color zones
- Zoom và pan functionality
- Tooltip với contest details

## Profile Tab Details

### About Tab

```typescript
interface AboutTabProps {
    profile: UserProfile;
    isEditing: boolean;
    onSave: (data: Partial<UserProfile>) => void;
}
```

- Personal information display/edit
- Bio với markdown support
- Organization memberships
- Social links
- Join date và activity stats

### Problems Tab

```typescript
interface ProblemsTabData {
    solvedProblems: Problem[];
    attemptedProblems: Problem[];
    statistics: {
        totalSolved: number;
        byDifficulty: Record<string, number>;
        byCategory: Record<string, number>;
        recentActivity: ProblemActivity[];
    };
}
```

- Solved problems grid
- Problem difficulty breakdown
- Category statistics
- Recent problem activity
- Problem solving streak

### Submissions Tab

```typescript
interface SubmissionsTabData {
    submissions: Submission[];
    totalCount: number;
    statistics: {
        acceptedCount: number;
        acceptanceRate: number;
        languageBreakdown: Record<string, number>;
        recentSubmissions: Submission[];
    };
}
```

- Paginated submission table
- Language filter
- Result filter (AC, WA, TLE, etc.)
- Submission statistics
- Code viewing modal

### Contests Tab

```typescript
interface ContestsTabData {
    participations: ContestParticipation[];
    statistics: {
        totalContests: number;
        bestRank: number;
        averageRank: number;
        ratingChange: number;
        recentContests: ContestParticipation[];
    };
}
```

- Contest participation history
- Performance statistics
- Rating changes per contest
- Best performances highlight
- Virtual participation indicator

### Rating Tab

- Interactive rating graph
- Contest performance table
- Rating statistics
- Rank progression
- Performance predictions

### Achievements Tab

- Badge collection display
- Achievement progress bars
- Unlock conditions
- Rarity indicators
- Achievement categories

## Rating System Integration

### Rating Color Coding

```typescript
const getRatingColor = (rating: number): string => {
    if (rating >= 3000) return "text-red-600"; // Legendary Grandmaster
    if (rating >= 2600) return "text-red-500"; // International Grandmaster
    if (rating >= 2400) return "text-orange-500"; // Grandmaster
    if (rating >= 2100) return "text-yellow-500"; // International Master
    if (rating >= 1900) return "text-purple-500"; // Master
    if (rating >= 1600) return "text-blue-500"; // Expert
    if (rating >= 1400) return "text-cyan-500"; // Specialist
    if (rating >= 1200) return "text-green-500"; // Apprentice
    return "text-gray-500"; // Newbie
};

const getRatingTitle = (rating: number): string => {
    // Similar logic for rating titles
};
```

### Rating Graph Features

- Time range selection (1M, 3M, 6M, 1Y, All)
- Contest markers với hover details
- Rating prediction line
- Performance comparison
- Export functionality

## Statistics Dashboard

### Problem Statistics

```typescript
interface ProblemStats {
    totalSolved: number;
    difficultyBreakdown: {
        easy: number;
        medium: number;
        hard: number;
    };
    categoryBreakdown: Record<string, number>;
    recentActivity: {
        date: Date;
        problemsSolved: number;
    }[];
    solvingStreak: {
        current: number;
        longest: number;
    };
}
```

### Contest Statistics

```typescript
interface ContestStats {
    totalParticipated: number;
    virtualParticipated: number;
    bestRank: number;
    averageRank: number;
    ratingChange: number;
    contestsWon: number;
    topPercentage: number;
}
```

## Edit Profile Functionality

### Editable Fields

- Display name
- Bio (markdown editor)
- Website URL
- Location
- Timezone selection
- Avatar upload
- Social media links

### Validation Rules

- Display name: 3-30 characters
- Bio: Max 1000 characters
- Website: Valid URL format
- Avatar: Max 2MB, image formats only

### Save Process

1. Client-side validation
2. Optimistic update
3. API call
4. Error handling với rollback
5. Success notification

## Privacy & Permissions

### Visibility Settings

- Public profile (default)
- Organization members only
- Private profile
- Custom field visibility

### Edit Permissions

- Own profile: Full edit access
- Staff users: Limited admin fields
- Regular users: View only
- Anonymous: Public info only

## Mobile Optimization

### Responsive Layout

- Collapsible sidebar navigation
- Touch-friendly tab switching
- Optimized chart interactions
- Compressed information display

### Performance Considerations

- Lazy load tab content
- Virtual scrolling for large lists
- Image optimization
- Chart rendering optimization

## Accessibility Features

### Screen Reader Support

- Proper heading hierarchy
- Tab navigation labels
- Chart data tables
- Image alt texts

### Keyboard Navigation

- Tab through profile sections
- Arrow keys for chart navigation
- Enter to activate buttons
- Escape to close modals

## API Integration

### Profile Data Fetching

```typescript
const useUserProfile = (username: string) => {
    return useQuery({
        queryKey: ["user-profile", username],
        queryFn: () => usersAPI.getProfile(username),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersAPI.updateProfile,
        onSuccess: (data) => {
            queryClient.setQueryData(["user-profile", data.username], data);
            queryClient.invalidateQueries(["user-profile"]);
        },
    });
};
```

### Data Loading Strategy

- Profile header: Immediate load
- Tab content: Lazy load on tab switch
- Charts: Load on tab activation
- Large lists: Paginated loading

## Testing Strategy

### Unit Tests

- Profile component rendering
- Tab switching logic
- Edit form validation
- Statistics calculations

### Integration Tests

- API integration
- Profile update flow
- Chart interactions
- Permission handling

### E2E Tests

- Complete profile viewing
- Profile editing flow
- Tab navigation
- Mobile responsiveness

## Migration Considerations

### Django Template Mapping

- `user/user-base.html` → `UserProfile.tsx`
- `user/user-about.html` → `AboutTab.tsx`
- `user/user-problems.html` → `ProblemsTab.tsx`
- Rating charts → Chart.js components

### Data Transformation

- Convert Django user model
- Transform rating history
- Map achievement data
- Handle timezone conversions

## Deliverables

### Components

- [ ] UserProfile main component
- [ ] ProfileHeader component
- [ ] ProfileTabs system
- [ ] RatingGraph component
- [ ] StatisticsCards
- [ ] EditProfileModal

### Tabs

- [ ] AboutTab component
- [ ] ProblemsTab component
- [ ] SubmissionsTab component
- [ ] ContestsTab component
- [ ] RatingTab component
- [ ] AchievementsTab component

### Hooks

- [ ] useUserProfile data fetching
- [ ] useUpdateProfile mutation
- [ ] useProfileTabs navigation
- [ ] useRatingChart

### Utils

- [ ] Rating color helpers
- [ ] Statistics calculations
- [ ] Date formatting
- [ ] Permission checking

### Tests

- [ ] Component unit tests
- [ ] Hook tests
- [ ] Integration tests
- [ ] E2E scenarios

## Success Criteria

### Functionality

- ✅ Complete profile information display
- ✅ Working edit functionality
- ✅ Interactive rating graphs
- ✅ Accurate statistics

### Performance

- ✅ Fast initial load
- ✅ Smooth tab switching
- ✅ Responsive chart interactions
- ✅ Efficient data loading

### UX

- ✅ Intuitive navigation
- ✅ Clear information hierarchy
- ✅ Mobile-friendly design
- ✅ Accessible interactions

### Data Accuracy

- ✅ Correct user statistics
- ✅ Accurate rating calculations
- ✅ Real-time data updates
- ✅ Proper permission handling
