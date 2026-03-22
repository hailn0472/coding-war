import React from 'react';
import type { UserProfile } from '@/types';
import { Award, Lock, CheckCircle, Clock } from 'lucide-react';

interface AchievementsTabProps {
  profile: UserProfile;
}

const AchievementsTab: React.FC<AchievementsTabProps> = ({ profile }) => {
  return (
    <div className="space-y-6">
      {/* Badges Section */}
      <div>
        <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
          <Award className="mr-2 h-5 w-5" />
          Earned Badges ({profile.badges.length})
        </h3>

        {profile.badges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.badges.map(badge => (
              <div
                key={badge.id}
                className="bg-accent rounded-lg border-l-4 p-4"
                style={{ borderLeftColor: badge.color }}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-foreground font-medium">
                      {badge.name}
                    </h4>
                    <p className="text-muted-foreground mb-2 text-sm">
                      {badge.description}
                    </p>
                    <div className="text-muted-foreground flex items-center space-x-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span>
                        Earned {badge.earnedDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No badges earned yet</p>
          </div>
        )}
      </div>

      {/* Achievements Progress */}
      <div>
        <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
          <Clock className="mr-2 h-5 w-5" />
          Achievement Progress
        </h3>

        <div className="space-y-4">
          {profile.achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`bg-accent rounded-lg p-4 ${
                achievement.unlocked ? 'border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <span
                    className={`text-2xl ${
                      achievement.unlocked ? '' : 'opacity-50 grayscale'
                    }`}
                  >
                    {achievement.icon}
                  </span>
                  {!achievement.unlocked && (
                    <Lock className="absolute -right-1 -top-1 h-3 w-3 text-gray-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h4
                      className={`font-medium ${
                        achievement.unlocked
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {achievement.name}
                    </h4>
                    {achievement.unlocked && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Unlocked</span>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-3 text-sm">
                    {achievement.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-medium">
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked
                            ? 'bg-green-500'
                            : 'bg-primary-600'
                        }`}
                        style={{
                          width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {achievement.unlocked && achievement.unlockedDate && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Unlocked on{' '}
                      {achievement.unlockedDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsTab;
