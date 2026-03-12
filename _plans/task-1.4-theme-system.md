# Task 1.4: Theme System & Styling Foundation

## Mô tả

Thiết lập hệ thống theme và styling foundation với dark/light mode support

## 1. Theme Provider

### src/components/theme/ThemeProvider.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system'
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || defaultTheme
  })

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    const updateTheme = () => {
      let resolvedTheme: 'light' | 'dark'

      if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      } else {
        resolvedTheme = theme
      }

      setActualTheme(resolvedTheme)

      root.classList.remove('light', 'dark')
      root.classList.add(resolvedTheme)

      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
        )
      }
    }

    updateTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

## 2. Theme Toggle Component

### src/components/theme/ThemeToggle.tsx

```typescript
import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@utils/cn'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false
}) => {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'p-2 rounded-md transition-colors',
            theme === value
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
          {showLabel && <span className="ml-2 text-sm">{label}</span>}
        </button>
      ))}
    </div>
  )
}
```

## 3. Global Styles

### src/styles/globals.css

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* CSS Variables for dynamic theming */
:root {
    --color-primary: 249 115 22; /* orange-500 */
    --color-primary-foreground: 255 255 255;
    --color-secondary: 244 244 245; /* zinc-100 */
    --color-secondary-foreground: 39 39 42; /* zinc-800 */
    --color-muted: 244 244 245; /* zinc-100 */
    --color-muted-foreground: 113 113 122; /* zinc-500 */
    --color-accent: 244 244 245; /* zinc-100 */
    --color-accent-foreground: 39 39 42; /* zinc-800 */
    --color-destructive: 239 68 68; /* red-500 */
    --color-destructive-foreground: 248 250 252; /* slate-50 */
    --color-border: 228 228 231; /* zinc-200 */
    --color-input: 228 228 231; /* zinc-200 */
    --color-ring: 249 115 22; /* orange-500 */
    --radius: 0.5rem;
}

.dark {
    --color-primary: 249 115 22; /* orange-500 */
    --color-primary-foreground: 255 255 255;
    --color-secondary: 39 39 42; /* zinc-800 */
    --color-secondary-foreground: 244 244 245; /* zinc-100 */
    --color-muted: 39 39 42; /* zinc-800 */
    --color-muted-foreground: 161 161 170; /* zinc-400 */
    --color-accent: 39 39 42; /* zinc-800 */
    --color-accent-foreground: 244 244 245; /* zinc-100 */
    --color-destructive: 127 29 29; /* red-900 */
    --color-destructive-foreground: 248 250 252; /* slate-50 */
    --color-border: 39 39 42; /* zinc-800 */
    --color-input: 39 39 42; /* zinc-800 */
    --color-ring: 212 212 216; /* zinc-300 */
}

/* Base styles */
* {
    border-color: rgb(var(--color-border));
}

body {
    background-color: rgb(var(--color-background));
    color: rgb(var(--color-foreground));
    font-feature-settings:
        "rlig" 1,
        "calt" 1;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgb(203 213 225); /* slate-300 */
    border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb {
    background: rgb(71 85 105); /* slate-600 */
}

::-webkit-scrollbar-thumb:hover {
    background: rgb(148 163 184); /* slate-400 */
}

.dark ::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139); /* slate-500 */
}

/* Focus styles */
.focus-visible {
    outline: 2px solid rgb(var(--color-ring));
    outline-offset: 2px;
}

/* Animation utilities */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(10px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideDown {
    from {
        transform: translateY(-10px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideLeft {
    from {
        transform: translateX(10px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideRight {
    from {
        transform: translateX(-10px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    50% {
        opacity: 0.5;
    }
}

@keyframes bounce {
    0%,
    100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
}

/* Utility classes */
.animate-fade-in {
    animation: fadeIn 0.2s ease-in-out;
}

.animate-slide-up {
    animation: slideUp 0.3s ease-out;
}

.animate-slide-down {
    animation: slideDown 0.3s ease-out;
}

.animate-slide-left {
    animation: slideLeft 0.3s ease-out;
}

.animate-slide-right {
    animation: slideRight 0.3s ease-out;
}

/* Typography improvements */
.prose {
    max-width: none;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
    font-weight: 600;
    line-height: 1.25;
}

.prose code {
    background-color: rgb(var(--color-muted));
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
}

.prose pre {
    background-color: rgb(var(--color-muted));
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
}

.prose pre code {
    background-color: transparent;
    padding: 0;
}

/* Table improvements */
.table-auto {
    table-layout: auto;
}

.table-fixed {
    table-layout: fixed;
}

/* Form improvements */
.form-input,
.form-select,
.form-textarea {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400;
}

.form-checkbox,
.form-radio {
    @apply rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-primary-400 dark:focus:ring-primary-400;
}

/* Button improvements */
.btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background;
}

.btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700;
}

.btn-secondary {
    @apply bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700;
}

.btn-outline {
    @apply border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800;
}

.btn-ghost {
    @apply hover:bg-gray-100 dark:hover:bg-gray-800;
}

.btn-sm {
    @apply h-8 px-3 text-xs;
}

.btn-md {
    @apply h-10 px-4 py-2;
}

.btn-lg {
    @apply h-12 px-8 text-base;
}

/* Loading states */
.loading {
    @apply opacity-50 pointer-events-none;
}

.skeleton {
    @apply animate-pulse bg-gray-200 dark:bg-gray-700 rounded;
}

/* Responsive utilities */
.container {
    @apply mx-auto px-4 sm:px-6 lg:px-8;
}

@media (min-width: 640px) {
    .container {
        max-width: 640px;
    }
}

@media (min-width: 768px) {
    .container {
        max-width: 768px;
    }
}

@media (min-width: 1024px) {
    .container {
        max-width: 1024px;
    }
}

@media (min-width: 1280px) {
    .container {
        max-width: 1280px;
    }
}

@media (min-width: 1536px) {
    .container {
        max-width: 1536px;
    }
}

/* Print styles */
@media print {
    .no-print {
        display: none !important;
    }

    .print-break-before {
        page-break-before: always;
    }

    .print-break-after {
        page-break-after: always;
    }

    .print-break-inside-avoid {
        page-break-inside: avoid;
    }
}
```

## 4. Typography System

### src/components/ui/Typography.tsx

```typescript
import React from 'react'
import { cn } from '@utils/cn'

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export const H1: React.FC<TypographyProps> = ({ children, className }) => (
  <h1 className={cn(
    'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
    className
  )}>
    {children}
  </h1>
)

export const H2: React.FC<TypographyProps> = ({ children, className }) => (
  <h2 className={cn(
    'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
    className
  )}>
    {children}
  </h2>
)

export const H3: React.FC<TypographyProps> = ({ children, className }) => (
  <h3 className={cn(
    'scroll-m-20 text-2xl font-semibold tracking-tight',
    className
  )}>
    {children}
  </h3>
)

export const H4: React.FC<TypographyProps> = ({ children, className }) => (
  <h4 className={cn(
    'scroll-m-20 text-xl font-semibold tracking-tight',
    className
  )}>
    {children}
  </h4>
)

export const P: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}>
    {children}
  </p>
)

export const Lead: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-xl text-muted-foreground', className)}>
    {children}
  </p>
)

export const Large: React.FC<TypographyProps> = ({ children, className }) => (
  <div className={cn('text-lg font-semibold', className)}>
    {children}
  </div>
)

export const Small: React.FC<TypographyProps> = ({ children, className }) => (
  <small className={cn('text-sm font-medium leading-none', className)}>
    {children}
  </small>
)

export const Muted: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
)

export const Code: React.FC<TypographyProps> = ({ children, className }) => (
  <code className={cn(
    'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
    className
  )}>
    {children}
  </code>
)
```

## 5. Color Utilities

### src/utils/colors.ts

```typescript
export const colors = {
    // Status colors
    success: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
    },
    warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
    },
    error: {
        50: "#fef2f2",
        100: "#fee2e2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
    },
    info: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
    },

    // Problem difficulty colors
    difficulty: {
        trivial: "#4ade80", // green-400
        easy: "#22c55e", // green-500
        medium: "#f59e0b", // amber-500
        hard: "#f97316", // orange-500
        veryHard: "#ef4444", // red-500
        extreme: "#8b5cf6", // violet-500
    },

    // Contest colors
    contest: {
        active: "#22c55e", // green-500
        upcoming: "#3b82f6", // blue-500
        past: "#6b7280", // gray-500
        rated: "#e11d48", // rose-600
        unrated: "#64748b", // slate-500
    },

    // Submission status colors
    submission: {
        accepted: "#22c55e", // green-500
        wrongAnswer: "#ef4444", // red-500
        timeLimitExceeded: "#f59e0b", // amber-500
        memoryLimitExceeded: "#f97316", // orange-500
        runtimeError: "#8b5cf6", // violet-500
        compilationError: "#6b7280", // gray-500
        pending: "#3b82f6", // blue-500
        judging: "#06b6d4", // cyan-500
    },
} as const;

export type StatusColor = keyof typeof colors.submission;
export type DifficultyColor = keyof typeof colors.difficulty;
export type ContestColor = keyof typeof colors.contest;

export const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
        AC: colors.submission.accepted,
        WA: colors.submission.wrongAnswer,
        TLE: colors.submission.timeLimitExceeded,
        MLE: colors.submission.memoryLimitExceeded,
        RTE: colors.submission.runtimeError,
        CE: colors.submission.compilationError,
        PD: colors.submission.pending,
        JU: colors.submission.judging,
    };

    return statusMap[status] || colors.submission.pending;
};

export const getDifficultyColor = (points: number): string => {
    if (points <= 3) return colors.difficulty.trivial;
    if (points <= 5) return colors.difficulty.easy;
    if (points <= 10) return colors.difficulty.medium;
    if (points <= 20) return colors.difficulty.hard;
    if (points <= 30) return colors.difficulty.veryHard;
    return colors.difficulty.extreme;
};
```

## 6. Theme Hook

### src/hooks/useThemeColors.ts

```typescript
import { useTheme } from "@components/theme/ThemeProvider";
import { colors } from "@utils/colors";

export const useThemeColors = () => {
    const { actualTheme } = useTheme();

    const getColor = (lightColor: string, darkColor?: string) => {
        return actualTheme === "dark" ? darkColor || lightColor : lightColor;
    };

    const statusColors = {
        success: getColor(colors.success[500], colors.success[400]),
        warning: getColor(colors.warning[500], colors.warning[400]),
        error: getColor(colors.error[500], colors.error[400]),
        info: getColor(colors.info[500], colors.info[400]),
    };

    const backgroundColors = {
        primary: getColor("#ffffff", "#1f2937"),
        secondary: getColor("#f9fafb", "#111827"),
        muted: getColor("#f3f4f6", "#374151"),
    };

    const textColors = {
        primary: getColor("#111827", "#f9fafb"),
        secondary: getColor("#6b7280", "#9ca3af"),
        muted: getColor("#9ca3af", "#6b7280"),
    };

    return {
        getColor,
        statusColors,
        backgroundColors,
        textColors,
        isDark: actualTheme === "dark",
    };
};
```

## 7. CSS Custom Properties

### src/styles/variables.css

```css
:root {
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;

    /* Border radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md:
        0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg:
        0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl:
        0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

    /* Transitions */
    --transition-fast: 150ms ease-in-out;
    --transition-normal: 200ms ease-in-out;
    --transition-slow: 300ms ease-in-out;

    /* Z-index scale */
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
    --z-toast: 1080;
}
```

## Checklist

- [ ] Create ThemeProvider with system theme detection
- [ ] Implement ThemeToggle component
- [ ] Setup global CSS with custom properties
- [ ] Create Typography component system
- [ ] Add color utilities and theme colors
- [ ] Implement theme hooks
- [ ] Add CSS variables for consistent spacing
- [ ] Setup responsive container classes
- [ ] Add print styles
- [ ] Test theme switching functionality
- [ ] Verify dark mode compatibility
- [ ] Check accessibility contrast ratios
