import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/properties/:id/edit" element={<PropertyForm />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/csv-import" element={<CSVImport />} />
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
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;