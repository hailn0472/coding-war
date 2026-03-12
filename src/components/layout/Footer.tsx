import React from 'react';
import { LanguageSelector } from './LanguageSelector';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-sm text-gray-600 dark:text-gray-400 md:flex-row md:space-x-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span>
              proudly powered by{' '}
              <a
                href="https://dmoj.ca"
                className="font-medium text-primary-600 hover:text-primary-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                DMOJ
              </a>
            </span>
            <span>|</span>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
};
