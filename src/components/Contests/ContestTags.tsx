import React from 'react';
import type { Contest, ContestTag } from '@/types';
import { Lock, EyeOff, BarChart3, Users } from 'lucide-react';
import { cn } from '@/utils';

interface ContestTagsProps {
  contest: Contest;
  className?: string;
  maxTags?: number;
}

const ContestTags: React.FC<ContestTagsProps> = ({
  contest,
  className,
  maxTags = 4,
}) => {
  const systemTags: Array<{
    tag: ContestTag;
    icon?: React.ReactNode;
    condition: boolean;
  }> = [
    {
      tag: {
        id: 'hidden',
        name: 'Hidden',
        color: '#1f2937',
        textColor: '#ffffff',
      },
      icon: <EyeOff className="h-3 w-3" />,
      condition: !contest.isVisible,
    },
    {
      tag: {
        id: 'private',
        name: 'Private',
        color: '#6b7280',
        textColor: '#ffffff',
      },
      icon: <Lock className="h-3 w-3" />,
      condition: contest.isPrivate,
    },
    {
      tag: {
        id: 'org-private',
        name: 'Organization',
        color: '#9ca3af',
        textColor: '#1f2937',
      },
      icon: <Users className="h-3 w-3" />,
      condition: contest.isOrganizationPrivate,
    },
    {
      tag: {
        id: 'rated',
        name: 'Rated',
        color: '#f97316',
        textColor: '#ffffff',
      },
      icon: <BarChart3 className="h-3 w-3" />,
      condition: contest.isRated,
    },
  ];

  const visibleSystemTags = systemTags.filter(({ condition }) => condition);
  const customTags = contest.tags || [];

  // Combine system and custom tags
  const allTags = [
    ...visibleSystemTags.map(({ tag, icon }) => ({ ...tag, icon })),
    ...customTags.map(tag => ({ ...tag, icon: undefined })),
  ];

  // Limit number of tags displayed
  const displayedTags = allTags.slice(0, maxTags);
  const remainingCount = allTags.length - displayedTags.length;

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayedTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: tag.color,
            color: tag.textColor,
          }}
          title={tag.description}
        >
          {tag.icon}
          <span>{tag.name}</span>
        </span>
      ))}

      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default ContestTags;
