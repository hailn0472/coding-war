import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
import type { User as UserType } from '@/stores/authStore';

interface UserMenuProps {
  user: UserType;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const getGravatarUrl = (email: string, size: number = 32) => {
    // Simple hash function for demo - in real app use proper MD5
    const hash = btoa(email.toLowerCase()).substring(0, 32);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
        <img
          src={user.avatar || getGravatarUrl(user.email)}
          alt={user.displayName}
          className="h-8 w-8 rounded-full"
        />
        <span className="hidden font-medium md:block">
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
        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to={`/user/${user.username}`}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm',
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <User className="mr-3 h-4 w-4" />
                  View Profile
                </Link>
              )}
            </Menu.Item>

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

            <div className="border-t border-gray-100 dark:border-gray-700"></div>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onLogout}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-left text-sm',
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
  );
};
