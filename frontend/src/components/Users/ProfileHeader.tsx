import React from 'react';
import type { UserProfile } from '@/types';
import {
  getRatingColor,
  getRatingTitle,
  getRatingBadgeColor,
  formatJoinDate,
  formatLastLogin,
  getAvatarUrl,
} from '@/utils/userUtils';
import { useAuthStore } from '@/stores/authStore';
import {
  Edit,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Shield,
  Crown,
} from 'lucide-react';
import { cn } from '@/utils';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditClick?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditClick,
}) => {
  const { user: currentUser } = useAuthStore();
  const canEdit = currentUser?.id === profile.id || currentUser?.isStaff;

  return (
    <div className="bg-card mb-6 rounded-lg border p-6">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
        {/* Avatar */}
        <div className="mb-4 flex-shrink-0 md:mb-0">
          <img
            src={getAvatarUrl(profile, 150)}
            alt={`${profile.displayName}'s avatar`}
            className="border-border h-24 w-24 rounded-full border-4 md:h-32 md:w-32"
          />
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="mb-4 sm:mb-0">
              {/* Name and Username */}
              <div className="mb-2 flex items-center space-x-2">
                <h1 className="text-foreground text-2xl font-bold">
                  {profile.displayName}
                </h1>
                {profile.isStaff && (
                  <Shield
                    className="h-5 w-5 text-blue-500"
                    aria-label="Staff Member"
                  />
                )}
                {profile.isSuperuser && (
                  <Crown
                    className="h-5 w-5 text-yellow-500"
                    aria-label="Administrator"
                  />
                )}
              </div>

              <p className="text-muted-foreground mb-3">@{profile.username}</p>

              {/* Rating */}
              <div className="mb-3 flex items-center space-x-3">
                <span
                  className={cn(
                    'text-2xl font-bold',
                    getRatingColor(profile.rating)
                  )}
                >
                  {profile.rating}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    getRatingBadgeColor(profile.rating)
                  )}
                >
                  {getRatingTitle(profile.rating)}
                </span>
                {profile.maxRating > profile.rating && (
                  <span className="text-muted-foreground text-sm">
                    (max: {profile.maxRating})
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Edit Button */}
            {canEdit && onEditClick && (
              <button onClick={onEditClick} className="btn btn-outline btn-sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profile.location && (
              <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {profile.website && (
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="text-muted-foreground h-4 w-4" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Website
                </a>
              </div>
            )}

            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatJoinDate(profile.joinDate)}</span>
            </div>

            <div className="text-muted-foreground flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Last seen {formatLastLogin(profile.lastLogin)}</span>
            </div>
          </div>

          {/* Organizations */}
          {profile.organizations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-foreground mb-2 text-sm font-medium">
                Organizations
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.organizations.map(org => (
                  <span
                    key={org.id}
                    className="bg-accent text-accent-foreground rounded px-2 py-1 text-xs"
                  >
                    {org.shortName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
