import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthHandler = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [forceTimeout, setForceTimeout] = useState(false);
  
  // 공개 경로 정의
  const publicPaths = ['/login', '/auth/callback', '/auth/process'];
  const isPublicPath = publicPaths.includes(location.pathname);
  
  // OAuthHandler 레벨에서 추가 타임아웃 안전장치 (더 빠르게)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('OAuthHandler: Loading timeout reached, forcing timeout');
        setForceTimeout(true);
      }
    }, 3000); // 3초 타임아웃으로 단축
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // 즉시 강제 타임아웃 (2초 후)
  useEffect(() => {
    const immediateTimeout = setTimeout(() => {
      console.warn('OAuthHandler: Immediate timeout - forcing render');
      setForceTimeout(true);
    }, 2000);
    
    return () => clearTimeout(immediateTimeout);
  }, []);
  
  // 로딩 상태 완전 제거
  if (false) { // 절대 실행되지 않음
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // 로그인하지 않은 사용자가 보호된 페이지에 접근하려 할 때
  if (!user && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }
  
  // 로그인한 사용자가 로그인 페이지에 접근하려 할 때
  if (user && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OAuthHandler;