import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// 페이지 컴포넌트
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import UserManagement from './pages/UserManagement';
import CSVImport from './pages/CSVImport';
import Settings from './pages/Settings';
import UpdateHistory from './pages/UpdateHistory';
import MainLayout from './components/layout/MainLayout';

// 고객 관리 페이지
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';

// 스타일
import './styles/tailwind.css';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // 디버깅용 간단한 렌더링 테스트
  console.log('🚀 App 컴포넌트 렌더링 시작');
  
  try {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: '#0284c7' }}>🏠 팀 매물장 시스템</h1>
        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
          <p><strong>✅ React 앱이 정상적으로 로드되었습니다!</strong></p>
          <p>현재 시간: {new Date().toLocaleString('ko-KR')}</p>
          <p>현재 URL: {window.location.href}</p>
        </div>
        
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
          <p><strong>🔧 디버깅 모드:</strong> 기본 렌더링 테스트</p>
          <p>이 메시지가 보인다면 JavaScript가 정상적으로 실행되고 있습니다.</p>
        </div>

        <button 
          onClick={() => alert('버튼 클릭 테스트 성공!')}
          style={{ 
            background: '#0284c7', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔘 상호작용 테스트
        </button>
      </div>
    );
  } catch (error) {
    console.error('❌ App 렌더링 오류:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>앱 로딩 오류</h1>
        <p>오류: {error.message}</p>
      </div>
    );
  }
}

export default App;