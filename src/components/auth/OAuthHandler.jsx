import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const OAuthHandler = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // URL에 OAuth 토큰이 있는지 확인
      // HashRouter 사용 시 #/경로#access_token=... 형태가 됨
      const fullHash = window.location.hash;
      const tokenIndex = fullHash.lastIndexOf('#access_token');
      
      if (tokenIndex === -1) {
        return; // OAuth 토큰이 없음
      }
      
      const tokenPart = fullHash.substring(tokenIndex + 1);
      const hashParams = new URLSearchParams(tokenPart);
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log('OAuth token detected, processing...');
        
        try {
          const refreshToken = hashParams.get('refresh_token');
          
          // 세션 설정
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Failed to set session:', error);
            navigate('/login');
            return;
          }

          console.log('OAuth session set successfully');
          
          // URL에서 토큰 제거
          window.history.replaceState(null, '', window.location.pathname);
          
          // 대시보드로 이동
          navigate('/', { replace: true });
        } catch (error) {
          console.error('OAuth processing error:', error);
          navigate('/login');
        }
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return children;
};

export default OAuthHandler;