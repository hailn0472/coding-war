import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RouteGuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const useRouteGuard = (options: RouteGuardOptions = {}) => {
  const {
    requireAuth = false,
    requireAdmin = false,
    redirectTo = '/login',
  } = options;
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      navigate(`${redirectTo}?next=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (requireAdmin && user && !user.isStaff && !user.isSuperuser) {
      navigate('/');
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

/**
 * Hook for checking if user has permission to access a route
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuthStore();

  return {
    isAuthenticated,
    isAdmin: user?.isStaff || user?.isSuperuser || false,
    isStaff: user?.isStaff || false,
    isSuperuser: user?.isSuperuser || false,
    canEditProfile: isAuthenticated,
    canSubmitProblem: isAuthenticated,
    canCreateContest: user?.isStaff || user?.isSuperuser || false,
    canModerateComments: user?.isStaff || user?.isSuperuser || false,
  };
};
