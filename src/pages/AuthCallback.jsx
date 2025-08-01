import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 디버깅을 위한 URL 로그
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Hash에서 토큰 가져오기 (Implicit Flow)
        // HashRouter 사용 시 #/auth/callback#access_token=... 형태가 됨
        const fullHash = window.location.hash;
        const tokenIndex = fullHash.lastIndexOf('#access_token');
        
        if (tokenIndex === -1) {
          console.error('No access token in URL');
          navigate('/login');
          return;
        }
        
        const tokenPart = fullHash.substring(tokenIndex + 1);
        const hashParams = new URLSearchParams(tokenPart);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('Access Token found:', !!accessToken);
        console.log('Refresh Token found:', !!refreshToken);
        
        if (!accessToken) {
          console.error('No access token found in URL');
          navigate('/login');
          return;
        }

        // 세션 설정
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (error) {
          console.error('Session error:', error);
          navigate('/login');
          return;
        }

        console.log('Session set successfully:', data);

        // 세션이 설정된 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 세션이 성공적으로 설정되면 대시보드로 이동
        console.log('Auth successful, redirecting to dashboard...');
        
        // 강제로 페이지 새로고침하여 대시보드로 이동
        window.location.href = '/the-realty-itemlist-dashboard/#/';
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600">로그인 처리 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;