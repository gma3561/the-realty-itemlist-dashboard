import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ErrorState = ({ 
  title = '오류가 발생했습니다',
  message = '요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
  showHomeButton = true,
  type = 'error' // error, warning, info
}) => {
  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-red-50';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className={`rounded-full ${getBgColor()} p-4 mb-4`}>
        <AlertCircle className={`w-12 h-12 ${getIconColor()}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </button>
        )}
        
        {showHomeButton && (
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Home className="w-4 h-4 mr-2" />
            홈으로 가기
          </Link>
        )}
      </div>
    </div>
  );
};

// 빈 상태 컴포넌트
export const EmptyState = ({ 
  title = '데이터가 없습니다',
  message = '아직 등록된 항목이 없습니다.',
  actionLabel,
  onAction,
  icon: Icon = AlertCircle
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// 접근 거부 상태
export const AccessDeniedState = () => {
  return (
    <ErrorState
      title="접근 권한이 없습니다"
      message="이 페이지를 볼 수 있는 권한이 없습니다. 관리자에게 문의하세요."
      type="warning"
      showHomeButton={true}
    />
  );
};

// 404 Not Found 상태
export const NotFoundState = () => {
  return (
    <ErrorState
      title="페이지를 찾을 수 없습니다"
      message="요청하신 페이지가 존재하지 않거나 이동되었습니다."
      type="info"
      showHomeButton={true}
    />
  );
};

export default ErrorState;