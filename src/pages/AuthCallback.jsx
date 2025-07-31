import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Hash에서 토큰 가져오기 (Implicit Flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
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

        // 세션이 성공적으로 설정되면 대시보드로 이동
        console.log('Auth successful, redirecting to dashboard...');
        navigate('/', { replace: true });
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