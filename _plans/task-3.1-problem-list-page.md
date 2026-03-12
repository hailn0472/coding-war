# Task 3.1: Problem List Page

## Mục tiêu

Chuyển đổi trang danh sách problems từ Django template sang React component với đầy đủ tính năng filtering, sorting và search.

## Thời gian ước tính

**3 ngày**

## Dependencies

- Task 2.1: Form Components (cho search và filters)
- Task 2.2: Table Components (cho problem table)
- Task 1.2: Base Layout Components

## Technical Requirements

### Problem List Interface

```typescript
interface Problem {
    id: string;
    code: string;
    name: string;
    i18nName?: string;
    group: {
        id: string;
        name: string;
        fullName: string;
    };
    points: number;
    partial: boolean;
    acRate: number;
    userCount: number;
    types: string[];
    hasPublicEditorial: boolean;
    isPublic: boolean;
    solvedStatus?: "solved" | "attempted" | "unsolved";
}

interface ProblemListState {
    problems: Problem[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    loading: boolean;
    filters: ProblemFilters;
    sortBy: string;
    sortOrder: "asc" | "desc";
}
```

### Filter System

```typescript
interface ProblemFilters {
    search?: string;
    category?: string;
    types?: string[];
    pointRange?: [number, number];
    showSolved?: boolean;
    hideSolved?: boolean;
    hasEditorial?: boolean;
    fullTextSearch?: boolean;
}
```

## Implementation Details

### 1. Main Problem List Component

**File**: `src/pages/Problems/ProblemList.tsx`

- Server-side pagination
- URL state synchronization
- Loading states
- Error handling
- Responsive layout

### 2. Problem Table Component

**File**: `src/components/Problems/ProblemTable.tsx`

- Sortable columns
- Status indicators (solved/attempted/unsolved)
- Responsive design
- Row hover effects
- Click to navigate to problem detail

### 3. Search & Filter Panel

**File**: `src/components/Problems/ProblemFilters.tsx`

- Text search với debouncing
- Category dropdown
- Type multi-select
- Point range slider
- Boolean filters (solved, editorial)
- Filter reset functionality

### 4. Hot Problems Sidebar

**File**: `src/components/Problems/HotProblems.tsx`

- Popular problems list
- Click tracking
- Responsive visibility
- Loading skeleton

## DMOJ-Specific Features

### Problem Status Indicators

- **Solved**: Green check circle
- **Attempted**: Yellow minus circle
- **Unsolved**: Gray minus circle
- **Private**: Lock icon overlay

### Point System Display

- Integer points: "100"
- Partial points: "100p"
- Point range filtering
- Visual point indicators

### Category System

- Hierarchical categories
- Category filtering
- Category breadcrumbs
- Category-specific styling

### Type Tags

- Multiple type support
- Type filtering
- Tag styling
- Type descriptions

## UI/UX Requirements

### Table Layout

```
| Status | Problem Name | Category | Types | Points | AC% | Editorial | Users |
|--------|--------------|----------|-------|--------|-----|-----------|-------|
| ✓      | Problem A    | Math     | DP    | 100    | 45% | ✓         | 1234  |
```

### Filter Panel Layout

- Search box at top
- Category dropdown
- Type multi-select
- Point range slider
- Checkbox filters
- Clear filters button

### Responsive Behavior

- **Desktop**: Full table với sidebar
- **Tablet**: Collapsed sidebar, scrollable table
- **Mobile**: Card layout thay vì table

## State Management

### URL State Sync

```typescript
// URL: /problems?search=graph&category=algorithms&page=2
const useProblemsURL = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters = useMemo(
        () => ({
            search: searchParams.get("search") || "",
            category: searchParams.get("category") || "",
            page: parseInt(searchParams.get("page") || "1"),
            // ... other filters
        }),
        [searchParams],
    );

    return { filters, updateFilters: setSearchParams };
};
```

### API Integration

```typescript
const useProblems = (filters: ProblemFilters) => {
    return useQuery({
        queryKey: ["problems", filters],
        queryFn: () => problemsAPI.getProblems(filters),
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
```

## Performance Optimizations

### Virtual Scrolling

- Implement cho large problem lists
- Smooth scrolling experience
- Memory efficient rendering

### Search Debouncing

- 300ms delay cho search input
- Cancel previous requests
- Loading indicators

### Caching Strategy

- Cache problem list data
- Invalidate on problem updates
- Background refetch

## Accessibility Features

### Keyboard Navigation

- Tab through filters
- Arrow keys trong table
- Enter to select problems
- Escape to clear search

### Screen Reader Support

- Table headers properly labeled
- Filter descriptions
- Status announcements
- Loading state announcements

## Testing Strategy

### Unit Tests

- Filter logic
- Sorting functionality
- URL state synchronization
- Component rendering

### Integration Tests

- API integration
- Filter combinations
- Pagination flow
- Search functionality

### E2E Tests

- Complete user journey
- Filter and search scenarios
- Performance testing
- Mobile responsiveness

## Migration Considerations

### Django Template Mapping

- `problem/list.html` → `ProblemList.tsx`
- `problem/search-form.html` → `ProblemFilters.tsx`
- jQuery table sorting → React table component
- Django pagination → React pagination

### Data Transformation

- Convert Django context data
- Map problem status logic
- Transform filter parameters
- Handle authentication state

## API Requirements

### Endpoints Needed

```typescript
// GET /api/problems
interface ProblemsResponse {
    problems: Problem[];
    totalCount: number;
    hotProblems: Problem[];
    categories: Category[];
    types: ProblemType[];
    pointRange: [number, number];
}

// GET /api/problems/search
interface SearchResponse {
    problems: Problem[];
    suggestions: string[];
    totalCount: number;
}
```

## Deliverables

### Components

- [ ] ProblemList main page component
- [ ] ProblemTable với sorting
- [ ] ProblemFilters panel
- [ ] HotProblems sidebar
- [ ] ProblemCard (mobile layout)
- [ ] Pagination component

### Hooks

- [ ] useProblems data fetching
- [ ] useProblemFilters state management
- [ ] useProblemsURL sync
- [ ] useProblemSearch với debouncing

### Utils

- [ ] Problem status helpers
- [ ] Filter validation
- [ ] URL parameter handling
- [ ] Point formatting utilities

### Tests

- [ ] Component unit tests
- [ ] Hook tests
- [ ] Integration tests
- [ ] E2E test scenarios

## Success Criteria

### Functionality

- ✅ All filters working correctly
- ✅ Sorting on all columns
- ✅ Search với relevant results
- ✅ Pagination functioning
- ✅ URL state persistence

### Performance

- ✅ Initial load < 2s
- ✅ Filter response < 500ms
- ✅ Smooth scrolling
- ✅ No memory leaks

### UX

- ✅ Intuitive filter interface
- ✅ Clear problem status indicators
- ✅ Responsive on all devices
- ✅ Accessible navigation

### Data Accuracy

- ✅ Correct problem information
- ✅ Accurate solve statistics
- ✅ Proper category mapping
- ✅ Real-time status updates
