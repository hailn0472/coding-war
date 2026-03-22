import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from '../theme/ThemeToggle';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import ConnectionStatus from '@/components/WebSocket/ConnectionStatus';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white md:hidden"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link to="/" className="ml-2 flex items-center md:ml-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            {isAuthenticated && <ConnectionStatus />}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to={`/login?next=${encodeURIComponent(location.pathname)}`}
                  className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Log in
                </Link>
                <span className="text-gray-400">or</span>
                <Link
                  to="/register"
                  className="rounded-md bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
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
  );
};
