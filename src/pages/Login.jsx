import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRealtorByEmail } from '../data/realtorList';
import { getBypassStatus } from '../config/bypass';

const Login = () => {
  const { 
    user, 
    loading, 
    signInWithBypass,
    isBypassEnabled,
    error: authError 
  } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'bypass'

  // 바이패스 상태 정보
  const bypassStatus = getBypassStatus();

  // 이미 로그인한 경우 대시보드로 리디렉션
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      // 이메일을 통해 적절한 사용자 타입 결정
      const realtorInfo = getRealtorByEmail(email);
      let userType = 'user'; // 기본값
      
      if (email.includes('admin') || email === 'admin@thereal.co.kr') {
        userType = 'admin';
      } else if (realtorInfo) {
        userType = 'manager';
      }
      
      const success = await signInWithBypass(userType, email);
      if (!success) {
        setError('로그인에 실패했습니다. 이메일을 확인해주세요.');
      }
    } catch (err) {
      console.error('이메일 로그인 오류:', err);
      setError(err.message);
    } finally {
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

            {/* 이메일 로그인 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 주소
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FF66B2] focus:border-[#FF66B2] sm:text-sm"
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  등록된 이메일 주소를 입력하면 자동으로 권한이 부여됩니다
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF66B2] hover:bg-[#E6287F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF66B2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </button>
              </div>
            </form>

            {/* QA 바이패스 로그인 섹션 (개발 환경에서만) */}
            {isBypassEnabled && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">또는</span>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">빠른 테스트 로그인</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      onClick={() => handleBypassLogin('admin')}
                      disabled={isLoading}
                      className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      관리자
                    </button>
                    
                    <button
                      onClick={() => handleBypassLogin('manager')}
                      disabled={isLoading}
                      className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      매니저
                    </button>

                    <button
                      onClick={() => handleBypassLogin('user')}
                      disabled={isLoading}
                      className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      일반사용자
                    </button>
                  </div>
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
                <p>• 등록된 이메일 주소로 로그인하세요</p>
                <p>• 이메일에 따라 자동으로 권한이 부여됩니다</p>
                <p>• admin@thereal.co.kr: 관리자 권한</p>
                <p>• 등록된 부동산 중개사: 매니저 권한</p>
                <p>• 기타 이메일: 일반사용자 권한</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;