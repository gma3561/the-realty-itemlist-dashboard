# Authentication System Reference

부동산 매물 관리 시스템의 인증 및 권한 관리 시스템에 대한 완전한 참조 문서입니다.

## 🏗️ System Architecture

### Authentication Layer Stack
```
┌─────────────────────────────────────┐
│         UI Components               │
│  (Login, AuthGuard, Protected)      │
├─────────────────────────────────────┤
│        AuthContext                  │
│   (State Management & Hooks)        │
├─────────────────────────────────────┤
│       QA Bypass System              │
│    (Development/Testing)             │
├─────────────────────────────────────┤
│      Permission System              │
│   (Role-based Access Control)       │
├─────────────────────────────────────┤
│       Supabase Auth                 │
│   (Google OAuth + Session)          │
└─────────────────────────────────────┘
```

### Core Components
- **AuthContext**: 중앙 인증 상태 관리
- **Supabase Integration**: Google OAuth 및 세션 관리
- **QA Bypass System**: 개발/테스트 환경 지원
- **Permission System**: 역할 기반 접근 제어
- **Row Level Security**: 데이터베이스 수준 보안

---

## 🔐 AuthContext System

### State Management
```javascript
// src/context/AuthContext.jsx
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
```

### User Object Structure
```javascript
user = {
  id: string,                    // Supabase 사용자 ID
  email: string,                 // 구글 계정 이메일
  name: string,                  // 표시 이름
  role: 'admin' | 'user',        // 역할
  isAdmin: boolean,              // 관리자 여부
  avatar_url?: string,           // 프로필 이미지
  created_at: string,            // 계정 생성일
  last_sign_in_at: string,       // 마지막 로그인
  
  // QA 테스트용 (개발 환경)
  isQAUser?: boolean,            // QA 사용자 식별
  testUserType?: string          // 테스트 사용자 타입
}
```

### Authentication Flow
```javascript
const checkUser = async (skipLoading = false) => {
  try {
    // 1. QA 바이패스 사용자 확인 (개발 환경)
    if (isBypassEnabled()) {
      const bypassUser = getBypassUser();
      if (bypassUser) {
        setUser(bypassUser);
        return;
      }
    }
    
    // 2. Supabase 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    // 3. 사용자 정보 설정
    if (session?.user) {
      const googleUser = session.user;
      const adminEmails = ENV_CONFIG.ADMIN_EMAILS.split(',');
      const isAdmin = adminEmails.includes(googleUser.email);
      
      setUser({
        ...googleUser,
        role: isAdmin ? 'admin' : 'user',
        isAdmin,
        name: googleUser.user_metadata?.full_name || googleUser.email
      });
    }
  } catch (error) {
    // 인증 오류는 조용히 처리 (보안상)
    setUser(null);
  }
};
```

### Provider API
```javascript
const { 
  user,                    // 현재 사용자 정보
  loading,                 // 로딩 상태
  error,                   // 에러 정보
  signInWithGoogle,        // Google OAuth 로그인
  signInWithBypass,        // QA 바이패스 로그인
  signOut,                 // 로그아웃
  isBypassEnabled,         // 바이패스 활성화 여부
  isQAUser                 // QA 사용자 여부
} = useAuth();
```

---

## 🔑 Google OAuth Integration

### Supabase Configuration
```javascript
// src/services/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,         // 세션 지속
    autoRefreshToken: true,       // 자동 토큰 갱신
    sessionRefreshMargin: 60,     // 60초 전 갱신
  },
  global: {
    headers: {
      'X-Client-Info': 'the-realty-dashboard/2.0.0',
    }
  }
});
```

### OAuth Flow Implementation
```javascript
const signInWithGoogle = async () => {
  try {
    // 환경별 리디렉션 URL 설정
    const isDevelopment = window.location.hostname === 'localhost';
    const redirectUrl = isDevelopment
      ? `${window.location.origin}/auth/callback`
      : 'https://gma3561.github.io/the-realty-itemlist-dashboard/auth/callback';
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: redirectUrl,
      },
    });
    
    if (error) throw error;
  } catch (error) {
    setError(error.message);
  }
};
```

### Session Management
```javascript
// 인증 상태 변경 리스너
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkUser();
      }
    }
  );
  
  return () => authListener?.subscription?.unsubscribe();
}, []);
```

---

## 🧪 QA Bypass System

### Security-First Design
```javascript
// src/config/bypass.js

// 프로덕션 환경 감지
export const isProductionEnvironment = () => {
  // GitHub Pages 프로덕션 환경
  if (window.location.hostname === 'gma3561.github.io') return true;
  
  // NODE_ENV 체크
  if (import.meta.env.PROD) return true;
  
  // 환경변수 체크
  if (import.meta.env.VITE_ENVIRONMENT === 'production') return true;
  
  return false;
};

// 바이패스 활성화 조건
export const isBypassEnabled = () => {
  // GitHub Pages 데모를 위해 임시 활성화
  if (window.location.hostname === 'gma3561.github.io') return true;
  
  // 프로덕션에서는 절대 비활성화
  if (isProductionEnvironment()) return false;
  
  // 환경변수에서 명시적 활성화
  return import.meta.env.VITE_ENABLE_BYPASS === 'true';
};
```

### QA Test Users
```javascript
export const QA_TEST_USERS = {
  admin: {
    id: 'qa-admin-user-001',
    email: 'qa-admin@test.local',
    name: 'QA 관리자',
    role: 'admin',
    isAdmin: true,
    isQAUser: true,
    testUserType: 'admin'
  },
  
  user: {
    id: 'qa-user-001',
    email: 'qa-user@test.local', 
    name: 'QA 일반사용자',
    role: 'user',
    isAdmin: false,
    isQAUser: true,
    testUserType: 'user'
  },

  manager: {
    id: 'qa-manager-001',
    email: 'qa-manager@test.local',
    name: 'QA 매니저',
    role: 'user',
    isAdmin: false,
    isQAUser: true,
    testUserType: 'manager'
  }
};
```

### Browser Console API
개발 환경에서 `window.QABypass` 객체를 통해 제어:

```javascript
// 관리자로 로그인
window.QABypass.setUser('admin');

// 일반사용자로 로그인
window.QABypass.setUser('user');

// 바이패스 상태 확인
window.QABypass.getStatus();

// 로그아웃
window.QABypass.clearUser();
```

---

## 🛡️ Permission System

### Role-Based Access Control
```javascript
// src/utils/permissions.js

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const PERMISSIONS = {
  // 매물 관련
  VIEW_ALL_PROPERTIES: 'view_all_properties',
  VIEW_OWN_PROPERTIES: 'view_own_properties',
  VIEW_CUSTOMER_INFO: 'view_customer_info',
  CREATE_PROPERTY: 'create_property',
  EDIT_ALL_PROPERTIES: 'edit_all_properties',
  EDIT_OWN_PROPERTIES: 'edit_own_properties',
  DELETE_ALL_PROPERTIES: 'delete_all_properties',
  DELETE_OWN_PROPERTIES: 'delete_own_properties',
  COMMENT_ON_PROPERTIES: 'comment_on_properties',
  
  // 사용자 관리
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  
  // 성과 분석
  VIEW_ALL_PERFORMANCE: 'view_all_performance',
  VIEW_OWN_PERFORMANCE: 'view_own_performance',
  
  // 데이터 관리
  BULK_UPLOAD: 'bulk_upload'
};
```

### Permission Check Functions
```javascript
// 권한 확인
export const hasPermission = (user, permission) => {
  if (!user?.role) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

// 매물별 권한 확인
export const hasPropertyPermission = (user, property, action) => {
  if (!user) return false;
  
  // 관리자는 모든 권한
  if (isAdmin(user)) return true;
  
  // 일반 사용자는 본인 매물만
  if (isRegularUser(user)) {
    if (!property) return action === 'create';
    
    const isOwner = 
      property.user_id === user.id ||
      property.manager_id === user.id ||
      property.manager_id === user.email;
    
    if (action === 'view' || action === 'comment') return true;
    return isOwner; // edit, delete
  }
  
  return false;
};
```

### Customer Information Masking
```javascript
export const maskCustomerInfo = (info, user, property) => {
  if (!info) return '';
  
  // 권한이 있으면 원본 표시
  if (canViewCustomerInfo(user, property)) {
    return info;
  }
  
  // 전화번호 마스킹: 010-****-1234
  if (info.includes('-') && info.length >= 10) {
    return info.replace(/(\d{3})-(\d{3,4})-(\d{4})/, '$1-****-$3');
  }
  
  // 이메일 마스킹: ab**@domain.com
  if (info.includes('@')) {
    const [local, domain] = info.split('@');
    const maskedLocal = local.substring(0, 2) + '*'.repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  }
  
  return '***';
};
```

---

## 🔒 Row Level Security (RLS)

### Database Security Policies
Supabase에서 테이블별 RLS 정책이 적용됩니다:

#### Properties Table
```sql
-- 사용자는 본인 매물만 조회/수정 가능
CREATE POLICY "Users can view own properties" ON properties
FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = manager_id);

CREATE POLICY "Users can insert own properties" ON properties  
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own properties" ON properties
FOR UPDATE USING (auth.uid()::text = user_id OR auth.uid()::text = manager_id);
```

#### User Mappings Table
```sql
-- 관리자만 사용자 매핑 관리 가능
CREATE POLICY "Admin can manage user mappings" ON user_mappings
FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

---

## 🎛️ Component Integration

### AuthGuard Component
```javascript
// src/components/auth/AuthGuard.jsx
export const AuthGuard = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <UnauthorizedPage />;
  }
  
  return children;
};
```

### Usage in Routes
```javascript
// Protected route with permission check
<Route path="/admin" element={
  <AuthGuard requiredPermission={PERMISSIONS.MANAGE_USERS}>
    <AdminDashboard />
  </AuthGuard>
} />
```

### Menu Item Filtering
```javascript
export const getAuthorizedMenuItems = (user) => {
  const menuItems = [
    { name: '대시보드', path: '/', permission: PERMISSIONS.VIEW_OWN_PROPERTIES },
    { name: '내 매물', path: '/my-properties', permission: PERMISSIONS.VIEW_OWN_PROPERTIES },
    { name: '매물 목록', path: '/properties', permission: PERMISSIONS.VIEW_OWN_PROPERTIES }
  ];
  
  // 관리자 전용 메뉴 추가
  if (isAdmin(user)) {
    menuItems.push(
      { name: '직원 관리', permission: PERMISSIONS.MANAGE_USERS },
      { name: '직원 성과', permission: PERMISSIONS.VIEW_ALL_PERFORMANCE }
    );
  }
  
  return menuItems.filter(item => 
    !item.permission || hasPermission(user, item.permission)
  );
};
```

---

## ⚙️ Environment Configuration

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_EMAILS=admin1@company.com,admin2@company.com
VITE_ENABLE_BYPASS=true  # 개발 환경에서만
VITE_ENVIRONMENT=development
```

### Admin Email Configuration
```javascript
// src/config/env.js
export default {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  ADMIN_EMAILS: import.meta.env.VITE_ADMIN_EMAILS || '',
  ENABLE_BYPASS: import.meta.env.VITE_ENABLE_BYPASS === 'true'
};
```

---

## 🧪 Testing Strategy

### Unit Testing
```javascript
// src/test/auth/AuthContext.test.jsx
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

describe('AuthContext', () => {
  test('provides authentication state', () => {
    const TestComponent = () => {
      const { user, loading } = useAuth();
      return <div>{loading ? 'Loading' : user?.name || 'No user'}</div>;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
```

### Permission Testing
```javascript
import { hasPropertyPermission, isAdmin } from '../../utils/permissions';

describe('Permission System', () => {
  const adminUser = { role: 'admin', isAdmin: true };
  const regularUser = { role: 'user', id: 'user-123' };
  const property = { user_id: 'user-123' };
  
  test('admin has all permissions', () => {
    expect(hasPropertyPermission(adminUser, property, 'delete')).toBe(true);
  });
  
  test('user can only edit own property', () => {
    expect(hasPropertyPermission(regularUser, property, 'edit')).toBe(true);
    expect(hasPropertyPermission(regularUser, { user_id: 'other' }, 'edit')).toBe(false);
  });
});
```

---

## 🚨 Security Considerations

### Production Security
1. **환경 분리**: 프로덕션에서 QA 바이패스 완전 비활성화
2. **토큰 보안**: Supabase JWT 토큰 자동 갱신
3. **세션 관리**: 8시간 세션 타임아웃
4. **RLS 적용**: 모든 테이블에 Row Level Security 정책

### Error Handling
```javascript
// 인증 오류는 보안상 로깅하지 않음
try {
  const { data: { session } } = await supabase.auth.getSession();
} catch (error) {
  // 조용히 처리, 상세 오류 노출 방지
  setUser(null);
}
```

### Development Safety
```javascript
// 개발 환경에서만 디버그 정보 출력
if (IS_DEVELOPMENT) {
  console.log('🔗 Supabase 설정:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}
```

---

## 📚 Best Practices

### 1. 권한 확인 패턴
```javascript
// 컴포넌트에서 권한 확인
const { user } = useAuth();

if (!hasPropertyPermission(user, property, 'edit')) {
  return <AccessDenied />;
}
```

### 2. 로딩 상태 처리
```javascript
const { user, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) return <LoginPrompt />;
```

### 3. 에러 경계 설정
```javascript
<ErrorBoundary fallback={<AuthErrorPage />}>
  <AuthProvider>
    <App />
  </AuthProvider>
</ErrorBoundary>
```

### 4. 세션 복구
```javascript
// 페이지 새로고침 시 세션 자동 복구
useEffect(() => {
  checkUser();
  
  // 안전장치: 10초 후 강제 로딩 완료
  const timeout = setTimeout(() => setLoading(false), 10000);
  return () => clearTimeout(timeout);
}, []);
```

---

## 🔗 Related Documentation

- [API Service Layer Reference](./API_SERVICE_REFERENCE.md)
- [Component Usage Guide](./COMPONENT_USAGE_GUIDE.md) 
- [Database Schema Reference](./DATABASE_SCHEMA.md)
- [QA Testing Guide](./QA_TESTING_GUIDE.md)