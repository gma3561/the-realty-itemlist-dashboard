import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const GoogleLoginButton = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={loading}
      className="flex items-center justify-center w-full"
      variant="outline"
    >
      <svg
        className="w-5 h-5 mr-2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
          fill="currentColor"
        />
      </svg>
      {loading ? '로그인 중...' : 'Google 계정으로 로그인'}
    </Button>
  );
};

export default GoogleLoginButton;