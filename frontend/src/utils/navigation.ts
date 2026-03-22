/**
 * Navigation utilities for the application
 */

export const getActiveTab = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return 'home';

  const firstSegment = segments[0];

  // Map paths to tab keys
  const tabMap: Record<string, string> = {
    problems: 'problems',
    problem: 'problems',
    contests: 'contests',
    contest: 'contests',
    users: 'users',
    user: 'users',
    submissions: 'submissions',
    submission: 'submissions',
    admin: 'admin',
  };

  return tabMap[firstSegment] || firstSegment;
};

export const buildUrl = (
  path: string,
  params?: Record<string, string | number>
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

export const isActivePath = (
  currentPath: string,
  targetPath: string
): boolean => {
  if (targetPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(targetPath);
};

export const getPageTitle = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return 'Coding War';

  const pageTitles: Record<string, string> = {
    problems: 'Problems',
    contests: 'Contests',
    users: 'Users',
    submissions: 'Submissions',
    login: 'Login',
    register: 'Register',
    admin: 'Admin',
    profile: 'Profile',
  };

  const firstSegment = segments[0];
  const title =
    pageTitles[firstSegment] ||
    firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);

  return `${title} - Coding War`;
};

export const formatUsername = (username: string): string => {
  return username.startsWith('@') ? username : `@${username}`;
};

export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};
