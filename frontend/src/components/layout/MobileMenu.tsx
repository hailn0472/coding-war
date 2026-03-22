import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  Home,
  Code,
  Trophy,
  Users,
  FileText,
  Info,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  { key: 'home', label: 'Home', path: '/', icon: Home },
  { key: 'problems', label: 'Problems', path: '/problems', icon: Code },
  { key: 'contests', label: 'Contests', path: '/contests', icon: Trophy },
  { key: 'users', label: 'Users', path: '/users', icon: Users },
  {
    key: 'submissions',
    label: 'Submissions',
    path: '/submissions',
    icon: FileText,
  },
  { key: 'about', label: 'About', path: '/about', icon: Info },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getGravatarUrl = (email: string, size: number = 40) => {
    // Simple hash function for demo - in real app use proper MD5
    const hash = btoa(email.toLowerCase()).substring(0, 32);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

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
              <Dialog.Panel className="w-full max-w-sm transform bg-white shadow-xl transition-all dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-4">
                  {/* User Info */}
                  {isAuthenticated && user && (
                    <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar || getGravatarUrl(user.email)}
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
                    {navigationItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.key}
                          to={item.path}
                          onClick={onClose}
                          className={cn(
                            'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive(item.path)
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Auth Actions */}
                  <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                    {isAuthenticated && user ? (
                      <div className="space-y-2">
                        <Link
                          to={`/user/${user.username}`}
                          onClick={onClose}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          <Users className="h-4 w-4" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          to="/profile/edit"
                          onClick={onClose}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Edit Profile</span>
                        </Link>
                        {(user.isStaff || user.isSuperuser) && (
                          <Link
                            to="/admin"
                            onClick={onClose}
                            className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            <Shield className="h-4 w-4" />
                            <span>Admin</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            onClose();
                          }}
                          className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to={`/login?next=${encodeURIComponent(location.pathname)}`}
                          onClick={onClose}
                          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          onClick={onClose}
                          className="block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
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
  );
};
