import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthHandler = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // 공개 경로 정의
  const publicPaths = ['/login', '/auth/callback', '/auth/process'];
  const isPublicPath = publicPaths.includes(location.pathname);
  
  // 로딩 중일 때는 렌더링하지 않음
  if (loading) {
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