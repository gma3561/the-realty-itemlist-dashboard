import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Building2, 
  Users, 
  BarChart3, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: Home },
    { name: '매물 관리', href: '/properties', icon: Building2 },
    { name: '직원 관리', href: '/users', icon: Users, adminOnly: true },
    { name: '성과 분석', href: '/analytics', icon: BarChart3 },
    { name: '보고서', href: '/reports', icon: FileText },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-gray-700 border border-gray-200"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Logo/Brand */}
        <div className="sidebar-header">
          <div className="flex items-center justify-center">
            <img 
              src="/logo_white.svg" 
              alt="Logo" 
              className="h-10 w-auto"
            />
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500">{user?.role === 'admin' ? '관리자' : '직원'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            // 관리자 전용 메뉴 체크
            if (item.adminOnly && user?.role !== 'admin') {
              return null;
            }
            
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className="sidebar-nav-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className="sidebar-nav-item mb-2"
            onClick={() => setIsMobileOpen(false)}
          >
            <Settings className="sidebar-nav-icon" />
            <span>설정</span>
          </Link>
          
          <button
            onClick={signOut}
            className="sidebar-nav-item w-full text-left hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="sidebar-nav-icon" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;