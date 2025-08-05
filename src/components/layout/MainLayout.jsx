import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import AuthGuard from '../auth/AuthGuard';
import DemoAdminBanner from '../common/DemoAdminBanner';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DemoAdminBanner />
        <Sidebar />
        
        {/* Main Layout with Sidebar */}
        <div className="main-layout">
          {/* Top Header */}
          <header className="main-header">
            {/* Desktop Search */}
            <div className="hidden lg:flex items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Mobile Search Toggle */}
            <div className="lg:hidden flex items-center flex-1">
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center">
                <span className="hidden sm:inline text-sm font-medium text-gray-700 mr-2">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>
          
          {/* Mobile Search Bar */}
          {isMobileSearchOpen && (
            <div className="lg:hidden px-4 py-2 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="검색..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default MainLayout;