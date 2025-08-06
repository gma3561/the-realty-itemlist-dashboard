import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러를 상태에 저장합니다
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 에러 로깅 (프로덕션에서는 로깅 서비스로 전송)
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // 폴백 UI를 커스텀해서 렌더링할 수 있습니다
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-pink-100">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">앱 로딩 오류</h3>
                <p className="mt-1 text-sm text-gray-500">
                  페이지를 로드하는 중 오류가 발생했습니다.
                </p>
                
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    페이지 새로고침
                  </button>
                </div>

                {/* 개발 모드에서만 상세 에러 정보 표시 */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-600">기술적 세부사항 (개발용)</summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                      <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack || 'No component stack available'}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;