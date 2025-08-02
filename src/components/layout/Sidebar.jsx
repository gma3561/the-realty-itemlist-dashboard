import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isHardcodedAdmin } from '../../data/hardcodedAdmins';
import { getAuthorizedMenuItems, getUserRoleLabel, getUserRoleBadgeClass } from '../../utils/permissions';
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
  Bell,
  User,
  Upload
} from 'lucide-react';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  // 아이콘 매핑
  const iconMap = {
    '📊': Home,
    '🏠': User,
    '🏢': Building2,
    '👥': Users,
    '📈': BarChart3,
    '📁': Upload,
    '⚙️': Settings
  };

  // 권한 기반 네비게이션 메뉴 생성
  const navigation = getAuthorizedMenuItems(user).map(item => ({
    ...item,
    icon: iconMap[item.icon] || Home
  }));

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
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email?.split('@')[0]}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUserRoleBadgeClass(user)}`}>
                  {getUserRoleLabel(user)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigation.filter(item => item.name !== 'Settings').map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
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