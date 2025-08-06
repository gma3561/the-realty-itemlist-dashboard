import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, Home, FileText, Settings, Users, Upload, UserCheck, Clock, TestTube } from 'lucide-react';
import GlobalSearchBar from '../common/GlobalSearchBar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isQAUser } = useAuth();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: Home, label: '대시보드', shortLabel: '홈' },
    { path: '/properties', icon: FileText, label: '매물목록', shortLabel: '매물' },
    { path: '/customers', icon: UserCheck, label: '고객관리', shortLabel: '고객' },
    { path: '/users', icon: Users, label: '사용자관리', shortLabel: '사용자' },
    { path: '/updates', icon: Clock, label: '업데이트', shortLabel: '업데이트' },
    // 관리자만 설정 메뉴 표시
    ...(user && (user.email === 'admin@the-realty.co.kr' || user.role === 'admin') ? [
      { path: '/settings', icon: Settings, label: '설정', shortLabel: '설정' }
    ] : [])
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-lg sm:text-xl font-bold text-slate-800">The Realty</span>
            </Link>
            
            {/* 데스크톱 메뉴 */}
            <nav className="hidden md:ml-4 md:flex md:space-x-2 lg:space-x-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 rounded-md ${
                    isActive(item.path)
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.shortLabel}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* 중앙 검색 바 */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:max-w-md lg:mx-4">
            <GlobalSearchBar />
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="hidden md:ml-4 md:flex md:items-center md:space-x-3">
                <div className="flex items-center space-x-2">
                  {isQAUser && (
                    <div className="flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md border border-amber-200">
                      <TestTube className="w-3 h-3 mr-1" />
                      QA
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium text-slate-700 truncate max-w-32">
                    {user.name || user.email}
                  </span>
                  {user.role === 'admin' && (
                    <div className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-200">
                      관리자
                    </div>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors duration-200"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="ml-1 hidden lg:inline">로그아웃</span>
                </button>
              </div>
            )}
            
            {/* 모바일 메뉴 버튼 */}
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
              >
                <span className="sr-only">메뉴 열기</span>
                {isMenuOpen ? (
                  <X className="block h-5 w-5" />
                ) : (
                  <Menu className="block h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden">
          {/* 모바일 검색 바 */}
          <div className="px-4 pt-2 pb-3 border-b border-gray-200">
            <GlobalSearchBar />
          </div>
          
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-pink-50 border-pink-500 text-pink-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
          
          {user && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex items-center space-x-2">
                  {isQAUser && (
                    <div className="flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full border border-orange-200">
                      <TestTube className="w-3 h-3 mr-1" />
                      QA
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <div className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                      관리자
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.name || user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 w-full text-left"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-2" />
                    로그아웃
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;