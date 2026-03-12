# Task 1.2: Base Layout Components

## Mô tả

Tạo các component layout cơ bản tương đương với Django templates

## 1. Layout Component (base.html equivalent)

### src/components/layout/Layout.tsx

```typescript
import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ContestTimer } from './ContestTimer'
import { useAuthStore } from '@store/authStore'
import { useContestStore } from '@store/contestStore'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuthStore()
  const { activeContest } = useContestStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* SVG Definitions */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <clipPath id="rating-clip">
            <circle cx="8" cy="8" r="7" />
          </clipPath>
        </defs>
      </svg>

      <Header />

      {/* Contest Timer */}
      {activeContest && user && (
        <ContestTimer contest={activeContest} />
      )}

      {/* Main Content */}
      <div id="page-container" className="relative">
        <noscript>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
            This site works best with JavaScript enabled.
          </div>
        </noscript>

        <main id="content" className="container mx-auto px-4 py-6">
          {children || <Outlet />}
        </main>

        <Footer />
      </div>
    </div>
  )
}
```

## 2. Header Component

### src/components/layout/Header.tsx

```typescript
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react'
import { useAuthStore } from '@store/authStore'
import { Logo } from './Logo'
import { Navigation } from './Navigation'
import { UserMenu } from './UserMenu'
import { MobileMenu } from './MobileMenu'

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link to="/" className="flex items-center ml-2 md:ml-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to={`/login?next=${encodeURIComponent(location.pathname)}`}
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium"
                >
                  Log in
                </Link>
                <span className="text-gray-400">or</span>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  )
}
```

### src/components/layout/Logo.tsx

```typescript
import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img
        src="/logo.svg"
        alt="DMOJ"
        className="h-8 w-auto"
      />
      <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
        DMOJ
      </span>
    </div>
  )
}
```

### src/components/layout/Navigation.tsx

```typescript
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@utils/cn'

interface NavItem {
  key: string
  label: string
  path: string
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'problems', label: 'Problems', path: '/problems' },
  { key: 'contests', label: 'Contests', path: '/contests' },
  { key: 'users', label: 'Users', path: '/users' },
  { key: 'submissions', label: 'Submissions', path: '/submissions' },
  { key: 'about', label: 'About', path: '/about' },
]

export const Navigation: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex space-x-8">
      {navigationItems.map((item) => (
        <Link
          key={item.key}
          to={item.path}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive(item.path)
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
```

### src/components/layout/UserMenu.tsx

```typescript
import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@utils/cn'

interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  isStaff: boolean
  isSuperuser: boolean
}

interface UserMenuProps {
  user: User
  onLogout: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
        <img
          src={user.avatar || `https://www.gravatar.com/avatar/${user.email}?s=32&d=identicon`}
          alt={user.displayName}
          className="h-8 w-8 rounded-full"
        />
        <span className="hidden md:block font-medium">
          Hello, <strong>{user.displayName}</strong>
        </span>
        <ChevronDown className="h-4 w-4" />
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
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {(user.isStaff || user.isSuperuser) && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/admin"
                    className={cn(
                      'flex items-center px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    Admin
                  </Link>
                )}
              </Menu.Item>
            )}

            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile/edit"
                  className={cn(
                    'flex items-center px-4 py-2 text-sm',
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Edit profile
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onLogout}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left',
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
```

## 3. Footer Component

### src/components/layout/Footer.tsx

```typescript
import React from 'react'
import { LanguageSelector } from './LanguageSelector'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              proudly powered by{' '}
              <a
                href="https://dmoj.ca"
                className="text-primary-600 hover:text-primary-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                DMOJ
              </a>
            </span>
            <span>|</span>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  )
}
```

## 4. Contest Timer Component

### src/components/layout/ContestTimer.tsx

```typescript
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

interface Contest {
  id: string
  name: string
  key: string
  endTime: string
  timeRemaining: number
  isSpectating: boolean
  isVirtual: boolean
}

interface ContestTimerProps {
  contest: Contest
}

export const ContestTimer: React.FC<ContestTimerProps> = ({ contest }) => {
  const [timeRemaining, setTimeRemaining] = useState(contest.timeRemaining)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Load saved position from localStorage
    const savedPosition = localStorage.getItem('contest_timer_pos')
    if (savedPosition) {
      const [x, y] = savedPosition.split(':').map(Number)
      setPosition({ x, y })
    }
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - 150)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - 25))
    }

    setPosition(newPosition)
    localStorage.setItem('contest_timer_pos', `${newPosition.x}:${newPosition.y}`)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  return (
    <div
      className="fixed z-50 bg-primary-600 text-white px-4 py-2 rounded-md shadow-lg cursor-move select-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <Link
        to={`/contest/${contest.key}`}
        className="flex items-center space-x-2 hover:text-primary-100"
      >
        <Clock className="h-4 w-4" />
        <span className="font-medium">{contest.name}</span>
        <span>-</span>
        {contest.isSpectating ? (
          <span>spectating</span>
        ) : contest.isVirtual ? (
          <span>virtual</span>
        ) : (
          <span className="font-mono">{formatTime(timeRemaining)}</span>
        )}
      </Link>
    </div>
  )
}
```

## 5. Utility Functions

### src/utils/cn.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

## 6. Type Definitions

### src/types/auth.ts

```typescript
export interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatar?: string;
    isStaff: boolean;
    isSuperuser: boolean;
    isAuthenticated: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}
```

## Checklist

- [ ] Create Layout component with proper structure
- [ ] Implement Header with navigation and user menu
- [ ] Create responsive Footer component
- [ ] Add Contest Timer with drag functionality
- [ ] Implement Logo component
- [ ] Create Navigation with active states
- [ ] Add UserMenu with dropdown
- [ ] Setup proper TypeScript types
- [ ] Add dark mode support
- [ ] Test responsive design
- [ ] Verify accessibility features
