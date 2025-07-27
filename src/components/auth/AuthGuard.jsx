import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();

  // 로딩 중일 때 로딩 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지로 리디렉션
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 인증되었으면 자식 컴포넌트 렌더링
  return children;
};

export default AuthGuard;