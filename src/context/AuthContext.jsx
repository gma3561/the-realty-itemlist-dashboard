import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import ENV_CONFIG from '../config/env';
import { 
  isBypassEnabled, 
  getBypassUser, 
  clearBypassUser,
  setBypassUser
} from '../config/bypass';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태를 true로 설정
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // checkUser를 useEffect 밖으로 이동하여 재사용 가능하게 함
  const checkUser = async (skipLoading = false) => {
      try {
        if (!skipLoading) setLoading(true);
        
        // QA 바이패스 사용자 확인 (조건부 활성화)
        if (isBypassEnabled()) {
          const bypassUser = getBypassUser();
          if (bypassUser) {
            setUser(bypassUser);
            setError(null);
            setLoading(false);
            return;
          }
        }
        
        // Supabase가 초기화되지 않은 경우 더미 데이터 모드로 전환
        if (!supabase) {
          // console.warn('Supabase 클라이언트가 초기화되지 않았습니다. 더미 데이터 모드로 전환됩니다.');
          setUser(null);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Supabase 세션 가져오기
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // 세션 오류는 로깅하지 않음 (보안상)
          setUser(null);
          setError(null);
          setLoading(false);
          return;
        }
        
        // console.log('AuthContext: Session check result:', !!session);
        
        if (session?.user) {
          // 구글 로그인 사용자 정보 처리
          const googleUser = session.user;
          // console.log('AuthContext: User found:', googleUser.email);
          
          // user_mappings 확인을 일단 스킵하고 기본 사용자로 진행
          // (필요시 나중에 권한 체크)
          
          // 관리자 이메일 확인 (환경변수에서 가져오기)
          const adminEmails = ENV_CONFIG.ADMIN_EMAILS ? ENV_CONFIG.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];
          const isAdmin = adminEmails.includes(googleUser.email);
          
          // 사용자 정보 즉시 설정 (프로필 조회 제거로 성능 개선)
          setUser({
            ...googleUser,
            role: isAdmin ? 'admin' : 'user',
            isAdmin: isAdmin,
            name: googleUser.user_metadata?.full_name || googleUser.email,
            email: googleUser.email
          });
          setError(null);
        } else {
          setUser(null);
        }
      } catch (error) {
        // 인증 오류는 로깅하지 않음 (보안상)
        setError(null); // 오류를 표시하지 않고 조용히 처리
        setUser(null);
      } finally {
        if (!skipLoading) {
          setLoading(false);
          // 추가 안전장치: 다음 틱에서도 확실히 로딩 완료
          setTimeout(() => setLoading(false), 0);
        }
      }
    };
    
  useEffect(() => {
    checkUser();
    
    // 안전장치: 3초 후에도 로딩 중이면 강제로 로딩 완료
    const loadingTimeout = setTimeout(() => {
      console.warn('AuthContext: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 3000);
    
    // Supabase가 초기화되지 않은 경우 리스너 설정 안함
    if (!supabase) {
      clearTimeout(loadingTimeout);
      return;
    }
    
    // 인증 상태 변경 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('AuthContext: Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          clearTimeout(loadingTimeout);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // checkUser 함수를 재사용하여 중복 제거
          await checkUser();
          clearTimeout(loadingTimeout);
        }
      }
    );
    
    return () => {
      authListener?.subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // 구글 로그인
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      }
      
      // 환경에 따른 리디렉션 URL 설정
      const isDevelopment = window.location.hostname === 'localhost';
      const redirectUrl = isDevelopment
        ? `${window.location.origin}/the-realty-itemlist-dashboard/auth/callback`
        : 'https://gma3561.github.io/the-realty-itemlist-dashboard/auth/callback';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: redirectUrl,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      // 로그인 오류는 로깅하지 않음 (보안상)
      setError(error.message);
      setLoading(false);
    }
  };

  // QA 바이패스 로그인 함수들
  const signInWithBypass = async (userType = 'admin') => {
    if (!isBypassEnabled()) {
      setError('QA 바이패스 기능이 비활성화되어 있습니다.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const success = setBypassUser(userType);
      if (success) {
        // 사용자 정보 즉시 업데이트
        await checkUser(true);
        return true;
      } else {
        setError('바이패스 로그인에 실패했습니다.');
        return false;
      }
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      
      // QA 바이패스 사용자 제거 (조건부)
      if (isBypassEnabled()) {
        clearBypassUser();
      }
      
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      // 로그아웃 오류는 로깅하지 않음 (보안상)
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithBypass,
    signOut,
    // QA 관련 헬퍼 함수들
    isBypassEnabled: isBypassEnabled(),
    isQAUser: user?.isQAUser || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;