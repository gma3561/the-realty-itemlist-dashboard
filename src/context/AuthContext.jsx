import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import ENV_CONFIG from '../config/env';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // checkUser를 useEffect 밖으로 이동하여 재사용 가능하게 함
  const checkUser = async (skipLoading = false) => {
      try {
        if (!skipLoading) setLoading(true);
        
        // 개발용 임시 바이패스 확인
        const tempBypassUser = localStorage.getItem('temp-bypass-user');
        if (tempBypassUser) {
          const bypassUser = JSON.parse(tempBypassUser);
          setUser(bypassUser);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Supabase가 초기화되지 않은 경우 더미 데이터 모드로 전환
        if (!supabase) {
          console.warn('Supabase 클라이언트가 초기화되지 않았습니다. 더미 데이터 모드로 전환됩니다.');
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
        
        console.log('AuthContext: Session check result:', !!session);
        
        if (session?.user) {
          // 구글 로그인 사용자 정보 처리
          const googleUser = session.user;
          console.log('AuthContext: User found:', googleUser.email);
          
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
        if (!skipLoading) setLoading(false);
      }
    };
    
  useEffect(() => {
    checkUser();
    
    // Supabase가 초기화되지 않은 경우 리스너 설정 안함
    if (!supabase) {
      return;
    }
    
    // 인증 상태 변경 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // checkUser 함수를 재사용하여 중복 제거
          await checkUser();
        }
      }
    );
    
    return () => {
      authListener?.subscription?.unsubscribe();
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: 'https://gma3561.github.io/the-realty-itemlist-dashboard/oauth-callback.html',
        },
      });
      
      if (error) throw error;
    } catch (error) {
      // 로그인 오류는 로깅하지 않음 (보안상)
      setError(error.message);
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      
      // 임시 바이패스 사용자 제거
      localStorage.removeItem('temp-bypass-user');
      
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

  // 이메일 패스워드 로그인 (하드코딩된 관리자 기능 제거)
  const signInWithEmail = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signOut,
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