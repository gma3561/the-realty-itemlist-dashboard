import React from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import AuthGuard from '../auth/AuthGuard';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Outlet />
          </div>
        </main>
      </AuthGuard>
    </div>
  );
};

export default MainLayout;