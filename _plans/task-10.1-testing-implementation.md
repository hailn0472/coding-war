# Task 10.1: Testing Implementation

## Mục tiêu

Implement comprehensive testing strategy cho DMOJ React application bao gồm unit tests, integration tests, E2E testing và performance testing.

## Thời gian ước tính

**3 ngày**

## Dependencies

- Tất cả các components đã được implement
- Task 8.1: Real-time Features (cho WebSocket testing)
- Task 2.3: Modal & Dialog System (cho UI testing)

## Testing Strategy Overview

### Testing Pyramid

```
    E2E Tests (10%)
   ┌─────────────────┐
   │ User Journeys   │
   │ Critical Flows  │
   └─────────────────┘

  Integration Tests (20%)
 ┌───────────────────────┐
 │ API Integration       │
 │ Component Integration │
 │ Hook Integration      │
 └───────────────────────┘

Unit Tests (70%)
┌─────────────────────────────┐
│ Components                  │
│ Hooks                       │
│ Utils                       │
│ Business Logic              │
└─────────────────────────────┘
```

## Testing Tools & Setup

### Core Testing Libraries

```json
{
    "devDependencies": {
        "@testing-library/react": "^13.4.0",
        "@testing-library/jest-dom": "^5.16.5",
        "@testing-library/user-event": "^14.4.3",
        "vitest": "^0.34.0",
        "jsdom": "^22.1.0",
        "msw": "^1.3.0",
        "playwright": "^1.37.0"
    }
}
```

### Test Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        coverage: {
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "src/test/",
                "**/*.d.ts",
                "**/*.config.*",
            ],
        },
    },
});
```

## Unit Testing Implementation

### 1. Component Testing

**File**: `src/test/components/ProblemList.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProblemList } from '@/pages/Problems/ProblemList';
import { mockProblems } from '@/test/mocks/problems';

describe('ProblemList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders problem list correctly', async () => {
    renderWithProviders(<ProblemList />);

    await waitFor(() => {
      expect(screen.getByText('Problems')).toBeInTheDocument();
    });

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search problems...')).toBeInTheDocument();
  });

  it('filters problems by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProblemList />);

    const searchInput = screen.getByPlaceholderText('Search problems...');
    await user.type(searchInput, 'graph');

    await waitFor(() => {
      expect(screen.getByDisplayValue('graph')).toBeInTheDocument();
    });
  });
});
```

### 2. Hook Testing

**File**: `src/test/hooks/useProblems.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProblems } from '@/hooks/useProblems';
import { server } from '@/test/mocks/server';

describe('useProblems', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches problems successfully', async () => {
    const { result } = renderHook(() => useProblems({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.problems).toHaveLength(10);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/problems', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useProblems({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### 3. Utility Function Testing

**File**: `src/test/utils/problemHelpers.test.ts`

```typescript
import {
    formatPoints,
    getProblemStatusColor,
    calculateAcRate,
} from "@/utils/problemHelpers";

describe("problemHelpers", () => {
    describe("formatPoints", () => {
        it("formats integer points correctly", () => {
            expect(formatPoints(100, false)).toBe("100");
        });

        it("formats partial points correctly", () => {
            expect(formatPoints(100, true)).toBe("100p");
        });

        it("handles decimal points", () => {
            expect(formatPoints(99.5, false)).toBe("99.5");
        });
    });

    describe("getProblemStatusColor", () => {
        it("returns correct color for solved problems", () => {
            expect(getProblemStatusColor("solved")).toBe("text-green-600");
        });

        it("returns correct color for attempted problems", () => {
            expect(getProblemStatusColor("attempted")).toBe("text-yellow-600");
        });
    });
});
```

## Integration Testing

### 1. API Integration Tests

**File**: `src/test/integration/problemsAPI.test.ts`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useProblems } from '@/hooks/useProblems';
import { server } from '@/test/mocks/server';

describe('Problems API Integration', () => {
  it('integrates with problems endpoint correctly', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useProblems({
      search: 'graph',
      category: 'algorithms'
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.problems).toBeDefined();
    expect(result.current.data?.totalCount).toBeGreaterThan(0);
  });
});
```

### 2. Component Integration Tests

**File**: `src/test/integration/ProblemSubmission.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemDetail } from '@/pages/Problems/ProblemDetail';
import { TestProviders } from '@/test/TestProviders';

describe('Problem Submission Integration', () => {
  it('submits solution successfully', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <ProblemDetail problemCode="test-problem" />
      </TestProviders>
    );

    // Wait for problem to load
    await waitFor(() => {
      expect(screen.getByText('Submit Solution')).toBeInTheDocument();
    });

    // Select language
    const languageSelect = screen.getByLabelText('Language');
    await user.selectOptions(languageSelect, 'python3');

    // Enter code
    const codeEditor = screen.getByRole('textbox', { name: /code editor/i });
    await user.type(codeEditor, 'print("Hello World")');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify submission
    await waitFor(() => {
      expect(screen.getByText('Submission successful')).toBeInTheDocument();
    });
  });
});
```

## E2E Testing với Playwright

### 1. Setup Playwright

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
        {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
    },
});
```

### 2. E2E Test Examples

**File**: `e2e/problem-solving-flow.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Problem Solving Flow", () => {
    test("user can solve a problem end-to-end", async ({ page }) => {
        // Login
        await page.goto("/login");
        await page.fill("[data-testid=username]", "testuser");
        await page.fill("[data-testid=password]", "password");
        await page.click("[data-testid=login-button]");

        // Navigate to problems
        await page.goto("/problems");
        await expect(page.locator("h1")).toContainText("Problems");

        // Search for a problem
        await page.fill("[data-testid=search-input]", "hello world");
        await page.waitForLoadState("networkidle");

        // Click on first problem
        await page.click("[data-testid=problem-link]:first-child");

        // Verify problem page loaded
        await expect(page.locator("[data-testid=problem-title]")).toBeVisible();

        // Submit solution
        await page.selectOption("[data-testid=language-select]", "python3");
        await page.fill("[data-testid=code-editor]", 'print("Hello, World!")');
        await page.click("[data-testid=submit-button]");

        // Verify submission
        await expect(
            page.locator("[data-testid=submission-status]"),
        ).toContainText("Accepted");
    });

    test("contest participation flow", async ({ page }) => {
        await page.goto("/contests");

        // Join a contest
        await page.click("[data-testid=join-contest]:first-child");
        await page.click("[data-testid=confirm-join]");

        // Verify contest page
        await expect(page.locator("[data-testid=contest-timer]")).toBeVisible();

        // Solve a problem in contest
        await page.click("[data-testid=contest-problem]:first-child");
        await page.selectOption("[data-testid=language-select]", "cpp17");
        await page.fill(
            "[data-testid=code-editor]",
            '#include<iostream>\nint main(){std::cout<<"Hello";return 0;}',
        );
        await page.click("[data-testid=submit-button]");

        // Check leaderboard update
        await page.goto("/contest/test-contest/ranking");
        await expect(page.locator("[data-testid=user-rank]")).toBeVisible();
    });
});
```

## Performance Testing

### 1. Component Performance Tests

**File**: `src/test/performance/ProblemList.perf.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { ProblemList } from '@/pages/Problems/ProblemList';
import { TestProviders } from '@/test/TestProviders';

describe('ProblemList Performance', () => {
  it('renders large problem list within performance budget', async () => {
    const startTime = performance.now();

    render(
      <TestProviders>
        <ProblemList />
      </TestProviders>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid filter changes efficiently', async () => {
    // Test rapid filter updates don't cause performance issues
  });
});
```

### 2. Memory Leak Tests

**File**: `src/test/performance/memoryLeaks.test.ts`

```typescript
describe("Memory Leak Tests", () => {
    it("cleans up WebSocket connections properly", () => {
        // Test WebSocket cleanup
    });

    it("removes event listeners on unmount", () => {
        // Test event listener cleanup
    });
});
```

## Mock Data & Test Utilities

### 1. MSW API Mocking

**File**: `src/test/mocks/handlers.ts`

```typescript
import { rest } from "msw";
import { mockProblems, mockContests, mockUsers } from "./data";

export const handlers = [
    rest.get("/api/problems", (req, res, ctx) => {
        const search = req.url.searchParams.get("search");
        const category = req.url.searchParams.get("category");

        let filteredProblems = mockProblems;

        if (search) {
            filteredProblems = filteredProblems.filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()),
            );
        }

        if (category) {
            filteredProblems = filteredProblems.filter(
                (p) => p.category === category,
            );
        }

        return res(
            ctx.json({
                problems: filteredProblems,
                totalCount: filteredProblems.length,
            }),
        );
    }),

    rest.post("/api/problems/:code/submit", (req, res, ctx) => {
        return res(
            ctx.json({
                submissionId: "test-submission-123",
                status: "queued",
            }),
        );
    }),
];
```

### 2. Test Providers

**File**: `src/test/TestProviders.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';

export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
```

## Accessibility Testing

### 1. Automated A11y Tests

**File**: `src/test/accessibility/a11y.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProblemList } from '@/pages/Problems/ProblemList';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('ProblemList has no accessibility violations', async () => {
    const { container } = render(<ProblemList />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Test Coverage & Quality

### Coverage Requirements

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user journeys
- **Performance Tests**: Key components benchmarked

### Quality Gates

```typescript
// vitest.config.ts coverage thresholds
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests
on: [push, pull_request]

jobs:
    unit-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - run: npm ci
            - run: npm run test:unit
            - run: npm run test:coverage

    e2e-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
            - run: npm ci
            - run: npx playwright install
            - run: npm run test:e2e
```

## Deliverables

### Test Infrastructure

- [ ] Vitest configuration
- [ ] Playwright setup
- [ ] MSW mock server
- [ ] Test utilities và providers
- [ ] CI/CD integration

### Unit Tests

- [ ] Component tests (90%+ coverage)
- [ ] Hook tests
- [ ] Utility function tests
- [ ] Business logic tests

### Integration Tests

- [ ] API integration tests
- [ ] Component integration tests
- [ ] State management tests
- [ ] WebSocket integration tests

### E2E Tests

- [ ] Problem solving flow
- [ ] Contest participation
- [ ] User authentication
- [ ] Admin functionality

### Performance Tests

- [ ] Component render performance
- [ ] Memory leak detection
- [ ] Bundle size monitoring
- [ ] API response time tests

### Accessibility Tests

- [ ] Automated a11y testing
- [ ] Keyboard navigation tests
- [ ] Screen reader compatibility
- [ ] Color contrast validation

## Success Criteria

### Coverage Metrics

- ✅ 90%+ unit test coverage
- ✅ All critical paths tested
- ✅ Zero accessibility violations
- ✅ Performance budgets met

### Quality Metrics

- ✅ All tests passing in CI
- ✅ No flaky tests
- ✅ Fast test execution (<5min)
- ✅ Comprehensive error scenarios

### Developer Experience

- ✅ Easy test writing
- ✅ Good test documentation
- ✅ Helpful error messages
- ✅ Efficient debugging tools
