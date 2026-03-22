import React from 'react';
import type { UserProfile } from '@/types';
import { User, Target, Code, Trophy, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/utils';

interface ProfileTabsProps {
  profile: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  profile,
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'about',
      name: 'About',
      icon: User,
      count: null,
    },
    {
      id: 'problems',
      name: 'Problems',
      icon: Target,
      count: profile.problemsSolved,
    },
    {
      id: 'submissions',
      name: 'Submissions',
      icon: Code,
      count: profile.submissionCount,
    },
    {
      id: 'contests',
      name: 'Contests',
      icon: Trophy,
      count: profile.contestsParticipated,
    },
    {
      id: 'rating',
      name: 'Rating',
      icon: TrendingUp,
      count: null,
    },
    {
      id: 'achievements',
      name: 'Achievements',
      icon: Award,
      count: profile.badges.length,
    },
  ];

  return (
    <div className="bg-card mb-6 rounded-lg border">
      <div className="border-border border-b">
        <nav className="flex space-x-8 px-6" aria-label="Profile tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.count !== null && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      isActive
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ProfileTabs;
