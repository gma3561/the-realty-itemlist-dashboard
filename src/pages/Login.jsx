import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRealtorByEmail } from '../data/realtorList';
import { getBypassStatus } from '../config/bypass';

const Login = () => {
  const { 
    user, 
    loading, 
    signInWithGoogle, 
    signInWithBypass,
    isBypassEnabled,
    error: authError 
  } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBypassOptions, setShowBypassOptions] = useState(false);

  // 바이패스 상태 정보
  const bypassStatus = getBypassStatus();

  // 이미 로그인한 경우 대시보드로 리디렉션
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      // 구글 로그인은 리디렉션 방식이므로 여기서는 추가 처리 불필요
    } catch (err) {
      console.error('구글 로그인 오류:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleBypassLogin = async (userType) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const success = await signInWithBypass(userType);
      if (success) {
        // 로그인 성공 시 자동으로 대시보드로 이동
      } else {
        setError('QA 바이패스 로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('바이패스 로그인 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          더부동산 통합 관리 시스템
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          매물 관리 및 직원 성과 분석 플랫폼
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {(error || authError) && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">로그인 오류</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error || authError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading || loading}
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-3"></div>
                    로그인 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 로그인
                  </>
                )}
              </button>
            </div>

            {/* QA 바이패스 로그인 섹션 */}
            {isBypassEnabled && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-orange-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-orange-600 font-medium">QA 테스트 로그인</span>
                  </div>
                </div>

                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">개발/QA 환경 전용</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBypassOptions(!showBypassOptions)}
                    className="text-sm text-orange-700 hover:text-orange-900 underline"
                  >
                    {showBypassOptions ? '바이패스 옵션 숨기기' : 'QA 바이패스 로그인 옵션 보기'}
                  </button>

                  {showBypassOptions && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-orange-700 mb-3">
                        환경: {bypassStatus.isProduction ? '프로덕션' : '개발/QA'} | 
                        호스트: {bypassStatus.environment?.hostname}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          onClick={() => handleBypassLogin('admin')}
                          disabled={isLoading}
                          className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          관리자로 로그인
                          <div className="text-xs opacity-75">(모든 권한)</div>
                        </button>
                        
                        <button
                          onClick={() => handleBypassLogin('user')}
                          disabled={isLoading}
                          className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          일반사용자로 로그인
                          <div className="text-xs opacity-75">(제한된 권한)</div>
                        </button>
                        
                        <button
                          onClick={() => handleBypassLogin('manager')}
                          disabled={isLoading}
                          className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          매니저로 로그인
                          <div className="text-xs opacity-75">(매니저 권한)</div>
                        </button>
                      </div>
                      
                      <div className="mt-3 text-xs text-orange-600">
                        <p>• QA 바이패스는 테스트 목적으로만 사용됩니다</p>
                        <p>• 프로덕션 환경에서는 자동으로 비활성화됩니다</p>
                        <p>• 모든 QA 활동은 로깅됩니다</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">안내사항</span>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600 space-y-2">
                <p>• Google 계정으로만 로그인이 가능합니다</p>
                <p>• 처음 로그인 시 자동으로 계정이 생성됩니다</p>
                <p>• 관리자 권한은 별도로 부여됩니다</p>
                <p>• 빠르고 안전한 Google OAuth 로그인을 사용합니다</p>
                {isBypassEnabled && (
                  <p className="text-orange-600 font-medium">• QA 환경: 바이패스 로그인 사용 가능</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;