import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ENV_CONFIG from '../../config/env.js';

const DemoAdminBanner = () => {
  const { user } = useAuth();
  
  // 환경변수로 데모 배너 활성화 여부 확인
  const isDemoBannerEnabled = ENV_CONFIG.ENABLE_DEMO_BANNER;
  
  // 하드코딩된 관리자인지 확인
  const isHardcodedAdmin = user && user.id && user.id.toString().startsWith('hardcoded-');
  
  if (!isDemoBannerEnabled || !isHardcodedAdmin) {
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