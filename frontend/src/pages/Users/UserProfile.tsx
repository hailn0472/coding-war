import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileHeader from '@/components/Users/ProfileHeader';
import ProfileTabs from '@/components/Users/ProfileTabs';
import AboutTab from '@/components/Users/AboutTab';
import ProblemsTab from '@/components/Users/ProblemsTab';
import AchievementsTab from '@/components/Users/AchievementsTab';
import { AlertCircle, Loader2 } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState('about');

  const { data: profile, isLoading, error } = useUserProfile(username || '');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">
            Profile not found
          </h2>
          <p className="text-muted-foreground">
            The user profile you're looking for doesn't exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutTab profile={profile} />;
      case 'problems':
        return <ProblemsTab profile={profile} />;
      case 'submissions':
        return (
          <div className="text-muted-foreground py-8 text-center">
            Submissions tab coming soon...
          </div>
        );
      case 'contests':
        return (
          <div className="text-muted-foreground py-8 text-center">
            Contests tab coming soon...
          </div>
        );
      case 'rating':
        return (
          <div className="text-muted-foreground py-8 text-center">
            Rating tab coming soon...
          </div>
        );
      case 'achievements':
        return <AchievementsTab profile={profile} />;
      default:
        return <AboutTab profile={profile} />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader
        profile={profile}
        onEditClick={() => {
          // TODO: Implement edit profile modal
          console.log('Edit profile clicked');
        }}
      />

      <ProfileTabs
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-card rounded-lg border p-6">{renderTabContent()}</div>
    </div>
  );
};

export default UserProfile;
