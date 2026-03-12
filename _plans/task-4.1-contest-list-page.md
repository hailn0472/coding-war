# Task 4.1: Contest List Page

## Mục tiêu

Chuyển đổi trang danh sách contests từ Django template sang React với các section khác nhau (active, ongoing, upcoming, past) và functionality đầy đủ.

## Thời gian ước tính

**2 ngày**

## Dependencies

- Task 2.2: Table Components
- Task 2.3: Modal & Dialog System (cho join confirmations)
- Task 1.2: Base Layout Components

## Technical Requirements

### Contest Interface

```typescript
interface Contest {
    id: string;
    key: string;
    name: string;
    description?: string;
    startTime: Date;
    endTime?: Date;
    timeLimit?: number; // in seconds
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
    participationStatus?: "active" | "spectating" | "finished" | null;
    timeRemaining?: number;
    timeBeforeStart?: number;
    timeBeforeEnd?: number;
}

interface ContestTag {
    id: string;
    name: string;
    color: string;
    textColor: string;
    description?: string;
}
```

### Contest Status Types

```typescript
type ContestStatus =
    | "active" // User đang participate
    | "ongoing" // Contest đang diễn ra nhưng user chưa join
    | "upcoming" // Contest chưa bắt đầu
    | "past"; // Contest đã kết thúc
```

## Implementation Details

### 1. Main Contest List Component

**File**: `src/pages/Contests/ContestList.tsx`

- Multiple sections layout
- Real-time countdown updates
- Join/spectate functionality
- Responsive design

### 2. Contest Card Component

**File**: `src/components/Contests/ContestCard.tsx`

- Contest information display
- Tag system
- Time display và countdown
- Action buttons (Join/Spectate/View)

### 3. Contest Sections

**File**: `src/components/Contests/ContestSections.tsx`

- Active Contests section
- Ongoing Contests section
- Upcoming Contests section
- Past Contests section với pagination

### 4. Contest Tags Component

**File**: `src/components/Contests/ContestTags.tsx`

- Colored tag display
- Tag tooltips với descriptions
- Organization và class tags
- Special tags (private, rated, hidden)

## DMOJ-Specific Features

### Contest Status Indicators

- **Hidden**: Black tag với eye-slash icon
- **Private**: Gray tag với lock icon
- **Organization Private**: Light gray tag với org name
- **Rated**: Orange tag với bar-chart icon
- **Custom Tags**: User-defined colored tags

### Time Display System

- **Active**: "Window ends in X time"
- **Ongoing**: "Ends in X time"
- **Upcoming**: "Starting in X time"
- **Past**: Static start/end times
- **Time Limit**: "X hour window" vs "X hours long"

### Join/Spectate Logic

```typescript
const getContestActions = (contest: Contest, user: User) => {
    if (!user.isAuthenticated) return { canJoin: false, canSpectate: false };

    if (contest.participationStatus === "active") {
        return {
            canJoin: false,
            canSpectate: false,
            currentAction: "participating",
        };
    }

    if (contest.isLiveJoinableBy(user)) {
        return { canJoin: true, canSpectate: false };
    }

    if (contest.isSpectatableBy(user)) {
        return { canJoin: false, canSpectate: true };
    }

    return { canJoin: false, canSpectate: false };
};
```

## UI Layout Structure

### Section Layout

```
Active Contests (if any)
├── Contest Card 1 (with countdown)
├── Contest Card 2
└── ...

Ongoing Contests (if any)
├── Contest Card 1
├── Contest Card 2
└── ...

Upcoming Contests
├── Contest Card 1 (with start countdown)
├── Contest Card 2
└── ...

Past Contests (with pagination)
├── Contest Card 1
├── Contest Card 2
├── ...
└── Pagination Controls
```

### Contest Card Layout

```
┌─────────────────────────────────────────────────────┐
│ Contest Name                              [Join Btn] │
│ [Hidden] [Private] [Rated] [Custom Tags]            │
│                                                     │
│ Start: Mar 15, 2024, 14:00 - Mar 15, 2024, 18:00  │
│ Duration: 4 hours long                              │
│ Ends in: 2h 30m 15s                               │
│                                                     │
│ Users: 1,234                                        │
└─────────────────────────────────────────────────────┘
```

## Real-time Features

### Countdown Timers

```typescript
const useContestCountdown = (contest: Contest) => {
    const [timeRemaining, setTimeRemaining] = useState(
        contest.timeRemaining ||
            contest.timeBeforeStart ||
            contest.timeBeforeEnd,
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return timeRemaining;
};
```

### Auto-refresh Logic

- Refresh contest list every 5 minutes
- Update countdown timers every second
- Handle contest status transitions
- Invalidate cache when contests change status

## State Management

### Contest List State

```typescript
interface ContestListState {
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
```

### API Integration

```typescript
const useContests = () => {
    return useQuery({
        queryKey: ["contests"],
        queryFn: contestsAPI.getContests,
        refetchInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

const useJoinContest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: contestsAPI.joinContest,
        onSuccess: () => {
            queryClient.invalidateQueries(["contests"]);
            queryClient.invalidateQueries(["user-profile"]);
        },
    });
};
```

## User Interactions

### Join Contest Flow

1. User clicks "Join" button
2. Show confirmation modal với warning
3. Call join API
4. Update contest list
5. Redirect to contest page (optional)

### Spectate Contest Flow

1. User clicks "Spectate" button
2. Call spectate API
3. Update contest list
4. Redirect to contest page

### Virtual Join (Past Contests)

1. User clicks "Virtual Join" button
2. Show virtual participation modal
3. Call virtual join API
4. Redirect to contest page

## Responsive Design

### Desktop Layout

- Full width contest cards
- Side-by-side action buttons
- Complete tag display
- Detailed time information

### Tablet Layout

- Slightly narrower cards
- Stacked action buttons
- Abbreviated tag display
- Condensed time format

### Mobile Layout

- Full-width cards
- Vertical button layout
- Essential tags only
- Compact time display

## Accessibility Features

### Keyboard Navigation

- Tab through contest cards
- Enter to join/spectate
- Arrow keys for navigation
- Escape to close modals

### Screen Reader Support

- Contest status announcements
- Time remaining announcements
- Action button descriptions
- Tag descriptions

### Visual Indicators

- High contrast tag colors
- Clear button states
- Loading indicators
- Error messages

## Testing Strategy

### Unit Tests

- Contest card rendering
- Time calculation logic
- Join/spectate permissions
- Tag display logic

### Integration Tests

- API integration
- Real-time updates
- User interaction flows
- Error handling

### E2E Tests

- Complete join contest flow
- Spectate functionality
- Virtual join process
- Mobile responsiveness

## Performance Considerations

### Optimization Strategies

- Virtualize past contests list
- Memoize countdown calculations
- Debounce API calls
- Lazy load contest details

### Caching Strategy

- Cache contest list data
- Invalidate on user actions
- Background refresh
- Optimistic updates

## Migration Notes

### Django Template Mapping

- `contest/list.html` → `ContestList.tsx`
- Contest macros → React components
- jQuery countdown → React hooks
- Django pagination → React pagination

### Data Transformation

- Convert Django datetime objects
- Map contest permissions
- Transform tag data
- Handle user participation status

## Deliverables

### Components

- [ ] ContestList main page
- [ ] ContestCard component
- [ ] ContestTags component
- [ ] ContestSections layout
- [ ] JoinContestModal
- [ ] CountdownTimer component

### Hooks

- [ ] useContests data fetching
- [ ] useContestCountdown timer
- [ ] useJoinContest mutation
- [ ] useContestPermissions

### Utils

- [ ] Contest time calculations
- [ ] Permission checking helpers
- [ ] Tag color utilities
- [ ] Time formatting functions

### Tests

- [ ] Component unit tests
- [ ] Hook tests
- [ ] Integration tests
- [ ] E2E scenarios

## Success Criteria

### Functionality

- ✅ All contest sections displaying correctly
- ✅ Real-time countdown updates
- ✅ Join/spectate functionality working
- ✅ Proper permission handling

### Performance

- ✅ Page load < 2s
- ✅ Smooth countdown animations
- ✅ Responsive interactions
- ✅ Efficient re-renders

### UX

- ✅ Clear contest status indicators
- ✅ Intuitive join process
- ✅ Mobile-friendly design
- ✅ Accessible navigation

### Real-time

- ✅ Accurate countdown timers
- ✅ Auto-refresh functionality
- ✅ Status transition handling
- ✅ Live user count updates
