import React from 'react';
import { Code2 } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600">
        <Code2 className="h-5 w-5 text-white" />
      </div>
      <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
        Coding War
      </span>
    </div>
  );
};
