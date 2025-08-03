import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn()
  }
};

vi.mock('../../src/services/supabase', () => ({
  supabase: mockSupabase
}));

// Mock ENV_CONFIG
vi.mock('../../src/config/env', () => ({
  default: {
    ADMIN_EMAILS: 'admin@test.com,manager@test.com'
  }
}));

// 테스트용 컴포넌트
const TestComponent = () => {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={signInWithGoogle} data-testid="signin-button">
        Sign In
      </button>
      <button onClick={signOut} data-testid="signout-button">
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // localStorage 모킹
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock 함수 초기화
    vi.clearAllMocks();
    
    // 기본 모킹 설정
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('초기 상태', () => {
    it('초기 로딩 상태여야 한다', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('Supabase 세션 확인 후 로딩 완료', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(mockSupabase.auth.getSession).toHaveBeenCalledOnce();
    });
  });

  describe('바이패스 로그인', () => {
    beforeEach(() => {
      // QA 모드 활성화
      vi.stubEnv('VITE_ENABLE_BYPASS', 'true');
    });

    it('localStorage에 바이패스 사용자가 있으면 자동 로그인', async () => {
      const bypassUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      window.localStorage.getItem.mockReturnValue(JSON.stringify(bypassUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
    });

    it('바이패스 모드가 비활성화되면 바이패스 사용자 무시', async () => {
      vi.stubEnv('VITE_ENABLE_BYPASS', 'false');
      
      const bypassUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      window.localStorage.getItem.mockReturnValue(JSON.stringify(bypassUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('Supabase 인증', () => {
    it('유효한 세션이 있으면 사용자 설정', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          user_metadata: {
            full_name: 'John Doe'
          }
        }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user@example.com');
      });
    });

    it('관리자 이메일인 경우 admin 역할 부여', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'admin@test.com',
          user_metadata: {
            full_name: 'Admin User'
          }
        }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      let capturedUser;
      const TestCapture = () => {
        const { user } = useAuth();
        capturedUser = user;
        return <div />;
      };

      render(
        <AuthProvider>
          <TestCapture />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedUser).toBeTruthy();
        expect(capturedUser.role).toBe('admin');
        expect(capturedUser.isAdmin).toBe(true);
      });
    });

    it('일반 이메일인 경우 user 역할 부여', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          user_metadata: {
            full_name: 'Regular User'
          }
        }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      let capturedUser;
      const TestCapture = () => {
        const { user } = useAuth();
        capturedUser = user;
        return <div />;
      };

      render(
        <AuthProvider>
          <TestCapture />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedUser).toBeTruthy();
        expect(capturedUser.role).toBe('user');
        expect(capturedUser.isAdmin).toBe(false);
      });
    });
  });

  describe('Google 로그인', () => {
    it('성공적으로 Google OAuth 시작', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      const signInButton = screen.getByTestId('signin-button');
      
      await act(async () => {
        signInButton.click();
      });

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        })
      });
    });

    it('Supabase가 없으면 에러 발생', async () => {
      // Supabase를 null로 모킹
      vi.doMock('../../src/services/supabase', () => ({
        supabase: null
      }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      const signInButton = screen.getByTestId('signin-button');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toContain('Supabase 클라이언트가 초기화되지 않았습니다');
      });
    });
  });

  describe('로그아웃', () => {
    it('성공적으로 로그아웃', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });

      // 먼저 로그인 상태로 설정
      window.localStorage.getItem.mockReturnValue(JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      const signOutButton = screen.getByTestId('signout-button');
      
      await act(async () => {
        signOutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('temp-bypass-user');
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('Supabase 세션 에러를 조용히 처리', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Network error')
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('Google 로그인 에러 표시', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: new Error('OAuth error')
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      const signInButton = screen.getByTestId('signin-button');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toContain('OAuth error');
      });
    });
  });

  describe('인증 상태 변경 리스너', () => {
    it('SIGNED_OUT 이벤트 시 사용자 초기화', async () => {
      let authCallback;
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // SIGNED_OUT 이벤트 시뮬레이션
      await act(async () => {
        authCallback('SIGNED_OUT', null);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('SIGNED_IN 이벤트 시 사용자 정보 갱신', async () => {
      let authCallback;
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const mockSession = {
        user: {
          id: '123',
          email: 'newuser@example.com',
          user_metadata: {
            full_name: 'New User'
          }
        }
      };

      // checkUser 함수가 호출될 때의 세션 정보
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: null }, error: null }) // 초기 호출
        .mockResolvedValueOnce({ data: { session: mockSession }, error: null }); // SIGNED_IN 이벤트 후 호출

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // SIGNED_IN 이벤트 시뮬레이션
      await act(async () => {
        authCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('newuser@example.com');
      });
    });
  });
});