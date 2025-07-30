import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DemoAdminBanner = () => {
  const { user } = useAuth();
  
  // 하드코딩된 관리자인지 확인
  const isHardcodedAdmin = user && user.id && user.id.toString().startsWith('hardcoded-');
  
  if (!isHardcodedAdmin) {
    return null;
  }
  
  return (
    <div className="bg-yellow-100 border-b border-yellow-200 p-2 text-center text-sm">
      <span className="font-medium text-yellow-800">데모 관리자 모드</span>
      <span className="mx-2 text-yellow-700">|</span>
      <span className="text-yellow-700">로그인 계정: {user.email || user.name}</span>
    </div>
  );
};

export default DemoAdminBanner;