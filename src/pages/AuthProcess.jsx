import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AuthProcess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // URL에서 토큰 가져오기
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        console.log('AuthProcess: Processing tokens...');
        console.log('Access Token:', !!accessToken);
        console.log('Refresh Token:', !!refreshToken);
        
        if (!accessToken) {
          console.error('No access token found');
          navigate('/login');
          return;
        }

        // 세션 설정
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Failed to set session:', error);
            navigate('/login');
            return;
          }

          console.log('Session set successfully!', data);
          
          // 세션 설정 완료 후 바로 리다이렉션
          console.log('Redirecting to dashboard...');
          
          // React Router를 사용하여 빠른 리다이렉션
          navigate('/', { replace: true });
        } catch (sessionError) {
          console.error('Session setup error:', sessionError);
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth processing error:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600">로그인 완료 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthProcess;