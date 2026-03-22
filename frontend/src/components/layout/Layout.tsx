import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ContestTimer } from './ContestTimer';
import { useAuthStore } from '@/stores/authStore';
import { useContestStore } from '@/stores/contestStore';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuthStore();
  const { activeContest } = useContestStore();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* SVG Definitions */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <clipPath id="rating-clip">
            <circle cx="8" cy="8" r="7" />
          </clipPath>
        </defs>
      </svg>

      <Header />

      {/* Contest Timer */}
      {activeContest && user && <ContestTimer contest={activeContest} />}

      {/* Main Content */}
      <div id="page-container" className="relative flex flex-1 flex-col">
        <noscript>
          <div className="border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700">
            This site works best with JavaScript enabled.
          </div>
        </noscript>

        <main id="content" className="flex-1">
          {children || <Outlet />}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
