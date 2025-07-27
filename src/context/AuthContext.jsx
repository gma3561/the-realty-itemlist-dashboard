import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

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
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // 도메인 확인 (@the-realty.co.kr)
          if (!session.user.email.endsWith('@the-realty.co.kr')) {
            await supabase.auth.signOut();
            setError('허용된 회사 이메일(@the-realty.co.kr)로만 로그인할 수 있습니다.');
            setUser(null);
            return;
          }
          
          setUser(session.user);
          setError(null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // 인증 상태 변경 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // 도메인 확인 (@the-realty.co.kr)
          if (!session.user.email.endsWith('@the-realty.co.kr')) {
            await supabase.auth.signOut();
            setError('허용된 회사 이메일(@the-realty.co.kr)로만 로그인할 수 있습니다.');
            setUser(null);
            return;
          }
          
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
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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