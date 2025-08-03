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
  
  // OAuthHandler 레벨에서 추가 타임아웃 안전장치
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('OAuthHandler: Loading timeout reached, forcing timeout');
        setForceTimeout(true);
      }
    }, 8000); // 8초 타임아웃
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // 로딩 중일 때는 렌더링하지 않음 (타임아웃되지 않은 경우에만)
  if (loading && !forceTimeout) {
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