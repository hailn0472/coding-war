import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils';

interface NavItem {
  key: string;
  label: string;
  path: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'problems', label: 'Problems', path: '/problems' },
  { key: 'contests', label: 'Contests', path: '/contests' },
  { key: 'users', label: 'Users', path: '/users' },
  { key: 'submissions', label: 'Submissions', path: '/submissions' },
  { key: 'about', label: 'About', path: '/about' },
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex space-x-8">
      {navigationItems.map(item => (
        <Link
          key={item.key}
          to={item.path}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive(item.path)
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};
