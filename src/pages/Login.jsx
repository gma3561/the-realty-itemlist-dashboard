import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

const Login = () => {
  const { user, loading, error } = useAuth();

  // 이미 로그인한 경우 대시보드로 리디렉션
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          팀 매물장 관리 시스템
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The Realty 부동산 중개사무소
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                회사 Google 계정으로 로그인하세요 (@the-realty.co.kr)
              </p>
              <GoogleLoginButton />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      로그인 오류
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="px-4 py-3 bg-gray-50 -mx-4 -mb-8 mt-6 rounded-b-lg">
              <p className="text-xs text-center text-gray-500">
                회사 이메일 계정(@the-realty.co.kr)만 로그인이 가능합니다.<br />
                계정 관련 문의는 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;