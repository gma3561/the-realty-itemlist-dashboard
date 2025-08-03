import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import OAuthHandler from './components/auth/OAuthHandler';

// 페이지 컴포넌트
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthProcess from './pages/AuthProcess';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import MyProperties from './pages/MyProperties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import UserManagement from './pages/UserManagement';
import StaffPerformance from './pages/StaffPerformance';
import CSVImport from './pages/CSVImport';
import Settings from './pages/Settings';
import UpdateHistory from './pages/UpdateHistory';
import DataCollection from './pages/DataCollection';
import MainLayout from './components/layout/MainLayout';

// 고객 관리 페이지
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';

// 스타일
import './styles/tailwind.css';
import './styles/design-system.css';

// React Query 클라이언트 생성 (안전한 설정)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 네트워크 오류나 서버 오류의 경우만 재시도
        if (error?.status >= 500 || error?.message?.includes('fetch')) {
          return failureCount < 2;
        }
        return false;
      },
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <OAuthHandler>
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/process" element={<AuthProcess />} />
            
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/my-properties" element={<MyProperties />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/properties/:id/edit" element={<PropertyForm />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/users/:userId/performance" element={<StaffPerformance />} />
              <Route path="/csv-import" element={<CSVImport />} />
              <Route path="/data-collection" element={<DataCollection />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/updates" element={<UpdateHistory />} />
              
              {/* 고객 관리 라우트 */}
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/customers/:id/edit" element={<CustomerForm />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </OAuthHandler>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;