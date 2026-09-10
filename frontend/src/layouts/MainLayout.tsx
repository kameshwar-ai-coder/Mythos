import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { NavigationPage } from '../types';

interface MainLayoutProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  headerTitleOverride?: string;
  headerSubTitleOverride?: string;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onNavigate,
  headerTitleOverride,
  headerSubTitleOverride,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#FAFBFD] flex">
      {/* Fixed Left Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header
          currentPage={currentPage}
          titleOverride={headerTitleOverride}
          subTitleOverride={headerSubTitleOverride}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
