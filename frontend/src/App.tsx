import React, { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CargoPage } from './pages/CargoPage';
import { MarketPage } from './pages/MarketPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { NavigationPage } from './types';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'cargo':
        return <CargoPage onNavigate={setCurrentPage} />;
      case 'market':
        return <MarketPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderCurrentPage()}
    </MainLayout>
  );
};

export default App;
