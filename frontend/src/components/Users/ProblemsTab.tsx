import React from 'react';
import type { UserProfile } from '@/types';
import { Target, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface ProblemsTabProps {
  profile: UserProfile;
}

const ProblemsTab: React.FC<ProblemsTabProps> = ({ profile }) => {
  // Mock data for demonstration
  const problemStats = {
    totalSolved: profile.problemsSolved,
    byDifficulty: {
      Easy: 25,
      Medium: 30,
      Hard: 12,
    },
    byCategory: {
      Algorithms: 20,
      'Data Structures': 15,
      Mathematics: 12,
      'Graph Theory': 10,
      'Dynamic Programming': 8,
      String: 2,
    },
    recentActivity: [
      { date: new Date('2024-03-12'), problemsSolved: 3 },
      { date: new Date('2024-03-11'), problemsSolved: 1 },
      { date: new Date('2024-03-10'), problemsSolved: 2 },
      { date: new Date('2024-03-09'), problemsSolved: 0 },
      { date: new Date('2024-03-08'), problemsSolved: 1 },
    ],
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-foreground text-2xl font-bold">
                {problemStats.totalSolved}
              </p>
              <p className="text-muted-foreground text-sm">Problems Solved</p>
            </div>
          </div>
        </div>

        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-foreground text-2xl font-bold">
                {Math.round((problemStats.totalSolved / 100) * 100)}%
              </p>
              <p className="text-muted-foreground text-sm">Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-foreground text-2xl font-bold">15</p>
              <p className="text-muted-foreground text-sm">Current Streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Difficulty Breakdown */}
        <div className="bg-accent rounded-lg p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Problems by Difficulty
          </h3>

          <div className="space-y-3">
            {Object.entries(problemStats.byDifficulty).map(
              ([difficulty, count]) => (
                <div
                  key={difficulty}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        difficultyColors[
                          difficulty as keyof typeof difficultyColors
                        ]
                      }`}
                    >
                      {difficulty}
                    </span>
                    <span className="text-foreground text-sm">
                      {count} problems
                    </span>
                  </div>
                  <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-primary-600"
                      style={{
                        width: `${(count / problemStats.totalSolved) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-accent rounded-lg p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Problems by Category
          </h3>

          <div className="space-y-2">
            {Object.entries(problemStats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="text-foreground text-sm">{category}</span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-accent rounded-lg p-6">
        <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
          <Clock className="mr-2 h-5 w-5" />
          Recent Activity
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {problemStats.recentActivity.map((activity, index) => (
            <div
              key={index}
              className="text-center"
              title={`${activity.date.toLocaleDateString()}: ${activity.problemsSolved} problems`}
            >
              <div className="text-muted-foreground mb-1 text-xs">
                {activity.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                })}
              </div>
              <div
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                  activity.problemsSolved > 0
                    ? 'bg-green-500 text-white'
                    : 'text-muted-foreground bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {activity.problemsSolved}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemsTab;
