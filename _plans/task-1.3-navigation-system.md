# Task 1.3: Navigation System

## Mô tả

Implement navigation và routing system với React Router v6

## 1. Router Setup

### src/App.tsx

```typescript
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@components/layout/Layout'
import { HomePage } from '@pages/HomePage'
import { ProblemsPage } from '@pages/problems/ProblemsPage'
import { ProblemDetailPage } from '@pages/problems/ProblemDetailPage'
import { ContestsPage } from '@pages/contests/ContestsPage'
import { ContestDetailPage } from '@pages/contests/ContestDetailPage'
import { UsersPage } from '@pages/users/UsersPage'
import { UserProfilePage } from '@pages/users/UserProfilePage'
import { SubmissionsPage } from '@pages/submissions/SubmissionsPage'
import { LoginPage } from '@pages/auth/LoginPage'
import { RegisterPage } from '@pages/auth/RegisterPage'
import { NotFoundPage } from '@pages/NotFoundPage'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'
import { ThemeProvider } from '@components/theme/ThemeProvider'
import '@styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Main app routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />

              {/* Problems */}
              <Route path="problems" element={<ProblemsPage />} />
              <Route path="problem/:code" element={<ProblemDetailPage />} />
              <Route path="problem/:code/submit" element={
                <ProtectedRoute>
                  <ProblemSubmitPage />
                </ProtectedRoute>
              } />

              {/* Contests */}
              <Route path="contests" element={<ContestsPage />} />
              <Route path="contest/:key" element={<ContestDetailPage />} />
              <Route path="contest/:key/ranking" element={<ContestRankingPage />} />

              {/* Users */}
              <Route path="users" element={<UsersPage />} />
              <Route path="user/:username" element={<UserProfilePage />} />
              <Route path="profile/edit" element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              } />

              {/* Submissions */}
              <Route path="submissions" element={<SubmissionsPage />} />
              <Route path="submission/:id" element={<SubmissionDetailPage />} />

              {/* Admin routes */}
              <Route path="admin/*" element={
                <ProtectedRoute requireAdmin>
                  <AdminRoutes />
                </ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
```

## 2. Mobile Navigation

### src/components/layout/MobileMenu.tsx

```typescript
import React, { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { X, Home, Code, Trophy, Users, FileText, Info } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { key: 'home', label: 'Home', path: '/', icon: Home },
  { key: 'problems', label: 'Problems', path: '/problems', icon: Code },
  { key: 'contests', label: 'Contests', path: '/contests', icon: Trophy },
  { key: 'users', label: 'Users', path: '/users', icon: Users },
  { key: 'submissions', label: 'Submissions', path: '/submissions', icon: FileText },
  { key: 'about', label: 'About', path: '/about', icon: Info },
]

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-start">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-sm transform bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-4">
                  {/* User Info */}
                  {isAuthenticated && user && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar || `https://www.gravatar.com/avatar/${user.email}?s=40&d=identicon`}
                          alt={user.displayName}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.displayName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <nav className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.key}
                          to={item.path}
                          onClick={onClose}
                          className={cn(
                            'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                            isActive(item.path)
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Auth Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link
                          to="/profile/edit"
                          onClick={onClose}
                          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                        >
                          <span>Edit Profile</span>
                        </Link>
                        {(user?.isStaff || user?.isSuperuser) && (
                          <Link
                            to="/admin"
                            onClick={onClose}
                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                          >
                            <span>Admin</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout()
                            onClose()
                          }}
                          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 w-full text-left"
                        >
                          <span>Log out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to={`/login?next=${encodeURIComponent(location.pathname)}`}
                          onClick={onClose}
                          className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          onClick={onClose}
                          className="block w-full text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium"
                        >
                          Sign up
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
```

## 3. Protected Route Component

### src/components/auth/ProtectedRoute.tsx

```typescript
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  if (requireAdmin && user && !user.isStaff && !user.isSuperuser) {
    return (
      <Navigate to="/" replace />
    )
  }

  return <>{children}</>
}
```

## 4. Language Selector

### src/components/layout/LanguageSelector.tsx

```typescript
import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguageStore } from '@store/languageStore'
import { cn } from '@utils/cn'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
]

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguageStore()

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0]

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <Globe className="h-4 w-4" />
        <span className="text-sm">{currentLang.nativeName}</span>
        <ChevronDown className="h-3 w-3" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => setLanguage(language.code)}
                    className={cn(
                      'flex items-center w-full px-4 py-2 text-sm text-left',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300',
                      currentLanguage === language.code && 'font-medium'
                    )}
                  >
                    <span className="flex-1">{language.nativeName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({language.code})
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
```

## 5. Breadcrumb Navigation

### src/components/layout/Breadcrumb.tsx

```typescript
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@utils/cn'

interface BreadcrumbItem {
  label: string
  path?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const location = useLocation()

  // Auto-generate breadcrumbs from URL if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname)

  if (breadcrumbItems.length === 0) return null

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link
        to="/"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.path && index < breadcrumbItems.length - 1 ? (
            <Link
              to={item.path}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Capitalize and format segment
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

    breadcrumbs.push({
      label,
      path: index < segments.length - 1 ? currentPath : undefined
    })
  })

  return breadcrumbs
}
```

## 6. Store Setup

### src/store/languageStore.ts

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageState {
    currentLanguage: string;
    setLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            currentLanguage: "en",
            setLanguage: (language: string) => {
                set({ currentLanguage: language });
                // Update document language
                document.documentElement.lang = language;
            },
        }),
        {
            name: "language-storage",
        },
    ),
);
```

## 7. Route Guards Hook

### src/hooks/useRouteGuard.ts

```typescript
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@store/authStore";

interface RouteGuardOptions {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
}

export const useRouteGuard = (options: RouteGuardOptions = {}) => {
    const {
        requireAuth = false,
        requireAdmin = false,
        redirectTo = "/login",
    } = options;
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isLoading) return;

        if (requireAuth && !isAuthenticated) {
            navigate(
                `${redirectTo}?next=${encodeURIComponent(location.pathname)}`,
            );
            return;
        }

        if (requireAdmin && user && !user.isStaff && !user.isSuperuser) {
            navigate("/");
            return;
        }
    }, [
        isAuthenticated,
        user,
        isLoading,
        requireAuth,
        requireAdmin,
        navigate,
        location.pathname,
        redirectTo,
    ]);

    return {
        canAccess:
            !requireAuth ||
            (isAuthenticated &&
                (!requireAdmin || user?.isStaff || user?.isSuperuser)),
        isLoading,
    };
};
```

## 8. Navigation Utilities

### src/utils/navigation.ts

```typescript
export const getActiveTab = (pathname: string): string => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) return "home";

    const firstSegment = segments[0];

    // Map paths to tab keys
    const tabMap: Record<string, string> = {
        problems: "problems",
        problem: "problems",
        contests: "contests",
        contest: "contests",
        users: "users",
        user: "users",
        submissions: "submissions",
        submission: "submissions",
        admin: "admin",
    };

    return tabMap[firstSegment] || firstSegment;
};

export const buildUrl = (
    path: string,
    params?: Record<string, string | number>,
): string => {
    let url = path;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, String(value));
        });

        const queryString = searchParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    return url;
};
```

## Checklist

- [ ] Setup React Router with nested routes
- [ ] Create MobileMenu component with slide animation
- [ ] Implement ProtectedRoute for auth guards
- [ ] Add LanguageSelector with persistence
- [ ] Create Breadcrumb navigation component
- [ ] Setup language store with Zustand
- [ ] Add route guard hook for auth checks
- [ ] Create navigation utilities
- [ ] Test all navigation flows
- [ ] Verify mobile responsiveness
- [ ] Check accessibility compliance
