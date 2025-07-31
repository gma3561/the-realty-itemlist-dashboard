import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import { isHardcodedAdmin, getHardcodedAdmin } from '../data/hardcodedAdmins';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 현재 세션 확인
    const checkUser = async () => {
      try {
        setLoading(true);
        
        // 하드코딩된 관리자 계정 확인
        try {
          const hardcodedAdmin = localStorage.getItem('hardcoded-admin');
          if (hardcodedAdmin) {
            const adminUser = JSON.parse(hardcodedAdmin);
            setUser(adminUser);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (localStorageError) {
          console.warn('localStorage 접근 실패:', localStorageError);
          // localStorage 접근 실패 시 무시하고 계속 진행
        }
        
        // Supabase 연결 시도 (타임아웃 포함)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('연결 시간 초과')), 10000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);
        
        if (session?.user) {
          // MVP 버전에서는 도메인 확인 제거
          setUser(session.user);
          setError(null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setError(null); // 오류를 표시하지 않고 조용히 처리
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // 인증 상태 변경 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // MVP 버전에서는 도메인 확인 제거
          setUser(session.user);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        }
      }
    );
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // 구글 로그인
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      
      // 하드코딩된 관리자 계정 로그아웃
      localStorage.removeItem('hardcoded-admin');
      
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 패스워드 로그인
  const signInWithEmail = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // 하드코딩된 관리자 확인
      if (isHardcodedAdmin(email)) {
        // 간단한 비밀번호 검증 (실제 환경에서는 더 강력한 인증 필요)
        if (password === 'admin123!') {
          const adminUser = getHardcodedAdmin(email);
          if (adminUser) {
            // 로컬 스토리지에 관리자 정보 저장
            localStorage.setItem('hardcoded-admin', JSON.stringify({
              ...adminUser,
              id: `hardcoded-${adminUser.email}`,
              aud: 'authenticated',
              created_at: new Date().toISOString()
            }));
            
            setUser({
              ...adminUser,
              id: `hardcoded-${adminUser.email}`,
              aud: 'authenticated',
              created_at: new Date().toISOString()
            });
            setLoading(false);
            return;
          }
        } else {
          throw new Error('잘못된 비밀번호입니다.');
        }
      }
      
      // 일반 Supabase 인증
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with email:', error);
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