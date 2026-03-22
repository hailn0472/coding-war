import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/types';
import {
  getRatingColor,
  getRatingTitle,
  getAvatarUrl,
  formatLastLogin,
} from '@/utils/userUtils';
import { Pagination } from '@/components/ui/Pagination';
import { Shield, Crown } from 'lucide-react';
import { cn } from '@/utils';

interface UserTableProps {
  users: User[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showRanking?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  showRanking = false,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-card overflow-hidden rounded-lg border">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                {showRanking && (
                  <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Rank
                  </th>
                )}
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  User
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Rating
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Problems Solved
                </th>
                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {showRanking && (
                    <td className="text-muted-foreground whitespace-nowrap px-6 py-4 text-sm">
                      #{(currentPage - 1) * pageSize + index + 1}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getAvatarUrl(user, 40)}
                        alt={`${user.displayName}'s avatar`}
                        className="border-border h-10 w-10 rounded-full border"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/users/${user.username}`}
                            className="text-foreground font-medium hover:text-primary-600"
                          >
                            {user.displayName}
                          </Link>
                          {user.isStaff && (
                            <Shield className="h-4 w-4 text-blue-500" />
                          )}
                          {user.isSuperuser && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={cn(
                          'text-lg font-bold',
                          getRatingColor(user.rating)
                        )}
                      >
                        {user.rating}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {getRatingTitle(user.rating)}
                      </span>
                    </div>
                  </td>
                  <td className="text-foreground whitespace-nowrap px-6 py-4 text-sm">
                    {user.problemsSolved || 0}
                  </td>
                  <td className="text-muted-foreground whitespace-nowrap px-6 py-4 text-sm">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {users.map((user, index) => (
          <div key={user.id} className="bg-card rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <img
                src={getAvatarUrl(user, 48)}
                alt={`${user.displayName}'s avatar`}
                className="border-border h-12 w-12 rounded-full border"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/users/${user.username}`}
                        className="text-foreground font-medium hover:text-primary-600"
                      >
                        {user.displayName}
                      </Link>
                      {user.isStaff && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                      {user.isSuperuser && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      @{user.username}
                    </p>
                  </div>
                  {showRanking && (
                    <span className="text-muted-foreground text-sm font-medium">
                      #{(currentPage - 1) * pageSize + index + 1}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Rating</div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={cn('font-bold', getRatingColor(user.rating))}
                      >
                        {user.rating}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {getRatingTitle(user.rating)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Problems</div>
                    <div className="text-foreground font-medium">
                      {user.problemsSolved || 0}
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground mt-2 text-xs">
                  Last active: {formatLastLogin(user.lastLogin)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default UserTable;
