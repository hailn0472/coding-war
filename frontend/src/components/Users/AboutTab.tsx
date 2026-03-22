import React from 'react';
import type { UserProfile } from '@/types';
import {
  calculateAcceptanceRate,
  formatJoinDate,
  formatLastLogin,
} from '@/utils/userUtils';
import {
  Target,
  Code,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Award,
} from 'lucide-react';

interface AboutTabProps {
  profile: UserProfile;
}

const AboutTab: React.FC<AboutTabProps> = ({ profile }) => {
  const acceptanceRate = calculateAcceptanceRate(profile);

  const stats = [
    {
      label: 'Problems Solved',
      value: profile.problemsSolved,
      icon: Target,
      color: 'text-green-600',
    },
    {
      label: 'Total Submissions',
      value: profile.submissionCount,
      icon: Code,
      color: 'text-blue-600',
    },
    {
      label: 'Contests Participated',
      value: profile.contestsParticipated,
      icon: Trophy,
      color: 'text-yellow-600',
    },
    {
      label: 'Acceptance Rate',
      value: `${acceptanceRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <Icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-foreground text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Personal Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div>
                <span className="text-muted-foreground text-sm">Joined: </span>
                <span className="text-foreground text-sm">
                  {formatJoinDate(profile.joinDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="text-muted-foreground h-4 w-4" />
              <div>
                <span className="text-muted-foreground text-sm">
                  Last seen:{' '}
                </span>
                <span className="text-foreground text-sm">
                  {formatLastLogin(profile.lastLogin)}
                </span>
              </div>
            </div>

            {profile.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <div>
                  <span className="text-muted-foreground text-sm">
                    Location:{' '}
                  </span>
                  <span className="text-foreground text-sm">
                    {profile.location}
                  </span>
                </div>
              </div>
            )}

            {profile.website && (
              <div className="flex items-center space-x-3">
                <Globe className="text-muted-foreground h-4 w-4" />
                <div>
                  <span className="text-muted-foreground text-sm">
                    Website:{' '}
                  </span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {profile.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Organizations & Achievements */}
        <div className="space-y-6">
          {/* Organizations */}
          {profile.organizations.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <Users className="mr-2 h-5 w-5" />
                Organizations
              </h3>

              <div className="space-y-2">
                {profile.organizations.map(org => (
                  <div
                    key={org.id}
                    className="bg-accent flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="text-foreground font-medium">{org.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {org.memberCount.toLocaleString()} members
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        org.isOpen
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {org.isOpen ? 'Open' : 'Private'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Badges */}
          {profile.badges.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <Award className="mr-2 h-5 w-5" />
                Recent Badges
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {profile.badges.slice(0, 4).map(badge => (
                  <div
                    key={badge.id}
                    className="bg-accent flex items-center space-x-2 rounded-lg p-2"
                    title={badge.description}
                  >
                    <span className="text-lg">{badge.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">
                        {badge.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {badge.earnedDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio Section */}
      {profile.bio && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">About</h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {profile.bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default AboutTab;
