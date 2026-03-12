import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if items not provided
  const breadcrumbItems =
    items || generateBreadcrumbsFromPath(location.pathname);

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
          {item.path && index < breadcrumbItems.length - 1 ? (
            <Link
              to={item.path}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="font-medium text-gray-900 dark:text-white"
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Capitalize and format segment
    const label = formatSegmentLabel(segment);

    breadcrumbs.push({
      label,
      path: index < segments.length - 1 ? currentPath : undefined,
    });
  });

  return breadcrumbs;
}

function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    problems: 'Problems',
    contests: 'Contests',
    users: 'Users',
    submissions: 'Submissions',
    admin: 'Admin',
    profile: 'Profile',
    edit: 'Edit',
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  // Default formatting: capitalize first letter and replace hyphens with spaces
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}
