# Component Usage Guide

부동산 매물 관리 시스템의 React 컴포넌트 사용법에 대한 완전한 가이드입니다.

## 🧩 Component Architecture

### Folder Structure
```
src/components/
├── auth/              # 인증 관련 컴포넌트
│   ├── AuthGuard.jsx     # 라우트 보호
│   ├── GoogleLoginButton.jsx
│   └── OAuthHandler.jsx
├── common/            # 공통 컴포넌트
│   ├── Button.jsx        # 기본 버튼 컴포넌트
│   ├── Input.jsx         # 폼 입력 필드
│   ├── ErrorState.jsx    # 에러 표시
│   ├── SkeletonLoader.jsx # 로딩 스켈레톤
│   └── Toast.jsx         # 알림 메시지
├── layout/            # 레이아웃 컴포넌트
│   ├── Header.jsx        # 앱 헤더
│   ├── Sidebar.jsx       # 네비게이션 사이드바
│   └── MainLayout.jsx    # 메인 레이아웃
├── property/          # 매물 관련 컴포넌트
│   ├── PropertyCard.jsx     # 매물 카드
│   ├── PropertyForm.jsx     # 매물 등록/수정 폼
│   ├── PropertyFilter.jsx   # 매물 필터링
│   ├── PropertyComments.jsx # 매물 코멘트
│   └── PropertyImageUpload.jsx
└── dashboard/         # 대시보드 컴포넌트
    └── PropertyStatsChart.jsx
```

### Design System Principles
- **Consistent Styling**: Tailwind CSS 기반 일관된 디자인
- **Responsive Design**: 모바일 우선 반응형
- **Accessibility**: WCAG 지침 준수
- **Permission-Based**: 사용자 권한 기반 UI 제어
- **Error Handling**: 포괄적인 에러 상태 처리

---

## 🔘 Button Component

### Basic Usage
```javascript
import Button from '../components/common/Button';

// 기본 버튼
<Button onClick={handleClick}>클릭하세요</Button>

// variant별 버튼
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="outline">Outline</Button>
```

### Props Interface
```javascript
interface ButtonProps {
  children: React.ReactNode;     // 버튼 내용
  type?: 'button' | 'submit';    // 버튼 타입
  variant?: string;              // 스타일 변형
  size?: 'sm' | 'md' | 'lg';     // 크기
  className?: string;            // 추가 CSS 클래스
  disabled?: boolean;            // 비활성화 상태
  onClick?: () => void;          // 클릭 핸들러
}
```

### Style Variants
```javascript
const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  outline: 'bg-transparent border border-current hover:bg-gray-50'
};

const sizes = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};
```

### Examples
```javascript
// 폼 제출 버튼
<Button type="submit" variant="primary" size="lg">
  등록하기
</Button>

// 위험한 작업 버튼
<Button 
  variant="danger" 
  onClick={handleDelete}
  disabled={isDeleting}
>
  {isDeleting ? '삭제 중...' : '삭제'}
</Button>

// 아웃라인 버튼
<Button variant="outline" size="sm">
  취소
</Button>
```

---

## 🏠 PropertyCard Component

### Overview
매물 정보를 카드 형태로 표시하는 핵심 컴포넌트입니다. 권한 기반 액션 버튼과 고객정보 마스킹 기능을 지원합니다.

### Props Interface
```javascript
interface PropertyCardProps {
  property: Property;           // 매물 데이터 객체
  onEdit?: (property) => void;  // 수정 핸들러
  onDelete?: (property) => void; // 삭제 핸들러
  onView?: (property) => void;  // 상세보기 핸들러
  showCustomerInfo?: boolean;   // 고객정보 표시 여부
}
```

### Basic Usage
```javascript
import PropertyCard from '../components/property/PropertyCard';
import { useAuth } from '../context/AuthContext';

const PropertyList = () => {
  const { user } = useAuth();
  
  const handleEdit = (property) => {
    navigate(`/properties/edit/${property.id}`);
  };
  
  const handleDelete = async (property) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteProperty(property.id);
    }
  };
  
  const handleView = (property) => {
    navigate(`/properties/${property.id}`);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          showCustomerInfo={user?.isAdmin} // 관리자만 고객정보 표시
        />
      ))}
    </div>
  );
};
```

### Property Data Structure
```javascript
interface Property {
  id: string;
  property_name: string;        // 매물명
  location: string;             // 소재지
  property_type: string;        // 매물 종류
  transaction_type: string;     // 거래 유형
  property_status: string;      // 매물 상태
  sale_price?: number;          // 매매가
  lease_price?: number;         // 보증금
  price?: number;               // 월세
  supply_area_sqm?: number;     // 공급면적
  floor_info?: string;          // 층 정보
  direction?: string;           // 방향
  rooms_bathrooms?: string;     // 방/욕실
  special_notes?: string;       // 특이사항
  resident?: string;            // 고객정보 (JSON)
  created_at: string;          // 등록일
  manager_id: string;          // 담당자 ID
}
```

### Permission-Based Actions
```javascript
// 컴포넌트 내부에서 권한 체크
import { hasPropertyPermission } from '../../utils/permissions';

const { user } = useAuth();

// 수정 버튼 - 권한 확인
{hasPropertyPermission(user, property, 'edit') && (
  <button onClick={() => onEdit(property)}>
    수정
  </button>
)}

// 삭제 버튼 - 권한 확인
{hasPropertyPermission(user, property, 'delete') && (
  <button onClick={() => onDelete(property)}>
    삭제
  </button>
)}
```

### Price Formatting
```javascript
// 가격 포맷팅 로직
const formatPrice = (price) => {
  if (!price || price === 0) return '-';
  
  if (price >= 100000000) {
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  } else if (price >= 10000) {
    return `${(price / 10000).toLocaleString()}만원`;
  }
  return `${price.toLocaleString()}원`;
};

// 거래유형별 가격 표시
const getDisplayPrice = () => {
  switch (property.transaction_type) {
    case 'sale':
      return formatPrice(property.sale_price);
    case 'lease':
      return formatPrice(property.lease_price);
    case 'rent':
      const deposit = formatPrice(property.lease_price);
      const monthly = formatPrice(property.price);
      return `${deposit} / ${monthly}`;
    default:
      return '-';
  }
};
```

### Customer Info Display
```javascript
// 고객정보 파싱 및 표시
const parseResidentInfo = (residentStr) => {
  if (!residentStr) return null;
  try {
    return JSON.parse(residentStr);
  } catch {
    return null;
  }
};

// 고객정보 섹션
{showCustomerInfo && (
  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
    <div className="flex items-center mb-2">
      <Phone className="w-4 h-4 mr-2 text-blue-600" />
      <span className="text-sm font-medium text-blue-800">고객정보</span>
    </div>
    {(() => {
      const residentInfo = parseResidentInfo(property.resident);
      return residentInfo ? (
        <div className="text-sm text-blue-700">
          <div>이름: {residentInfo.name || '-'}</div>
          <div>연락처: {residentInfo.phone || '-'}</div>
          {residentInfo.notes && (
            <div>메모: {residentInfo.notes}</div>
          )}
        </div>
      ) : (
        <div className="text-sm text-blue-600">고객정보가 없습니다.</div>
      );
    })()}
  </div>
)}
```

---

## 📝 PropertyForm Component

### Overview
매물 등록 및 수정을 위한 포괄적인 폼 컴포넌트입니다. Formik과 Yup을 사용한 폼 검증, React Query를 통한 데이터 관리를 포함합니다.

### Props Interface
```javascript
interface PropertyFormProps {
  isEditing?: boolean;  // 수정 모드 여부 (URL params에서 ID 추출)
}
```

### Basic Usage
```javascript
import PropertyForm from '../components/property/PropertyForm';

// 새 매물 등록
<Route path="/properties/new" element={<PropertyForm />} />

// 매물 수정
<Route path="/properties/edit/:id" element={<PropertyForm isEditing />} />
```

### Form Architecture
```javascript
// Formik 설정
const formik = useFormik({
  initialValues: {
    property_type_id: '',
    property_status_id: '',
    transaction_type_id: '',
    property_name: '',
    location: '',
    // ... 더 많은 필드
  },
  validationSchema: Yup.object({
    property_name: Yup.string().required('매물명은 필수입니다'),
    location: Yup.string().required('소재지는 필수입니다'),
    property_type_id: Yup.string().required('매물종류는 필수입니다'),
    customer_name: Yup.string().required('고객 이름은 필수입니다'),
    customer_phone: Yup.string()
      .matches(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식입니다')
      .required('고객 전화번호는 필수입니다')
  }),
  onSubmit: handleSubmit,
  enableReinitialize: true
});
```

### Dynamic Price Fields
거래유형에 따라 가격 입력 필드가 동적으로 변경됩니다:

```javascript
// 거래유형별 가격 필드 표시
{getTransactionTypeName(formik.values.transaction_type_id) === '매매' && (
  <div>
    <label>매매가 <span className="text-red-500">*</span></label>
    <input
      type="number"
      name="price"
      value={formik.values.price}
      onChange={formik.handleChange}
      placeholder="예: 2500000000"
    />
  </div>
)}

{getTransactionTypeName(formik.values.transaction_type_id) === '전세' && (
  <div>
    <label>전세 보증금 <span className="text-red-500">*</span></label>
    <input
      type="number"
      name="lease_price"
      value={formik.values.lease_price}
      onChange={formik.handleChange}
      placeholder="예: 200000000"
    />
  </div>
)}

{getTransactionTypeName(formik.values.transaction_type_id) === '월세' && (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>보증금 <span className="text-red-500">*</span></label>
      <input
        type="number"
        name="lease_price"
        value={formik.values.lease_price}
        onChange={formik.handleChange}
      />
    </div>
    <div>
      <label>월세 <span className="text-red-500">*</span></label>
      <input
        type="number" 
        name="price"
        value={formik.values.price}
        onChange={formik.handleChange}
      />
    </div>
  </div>
)}
```

### Area Calculation
제곱미터를 평으로 자동 변환합니다:

```javascript
// 면적 계산 함수
const calculatePyeong = (sqm) => {
  if (!sqm) return '';
  return (sqm * 0.3025).toFixed(2);
};

// 면적 입력 필드
<div>
  <label>공급면적(㎡)</label>
  <input
    type="number"
    name="supply_area_sqm"
    value={formik.values.supply_area_sqm}
    onChange={formik.handleChange}
    placeholder="예: 84.56"
  />
  <div className="text-sm text-gray-500 mt-1">
    {formik.values.supply_area_sqm ? 
      `${calculatePyeong(formik.values.supply_area_sqm)}평` : ''}
  </div>
</div>
```

### Data Processing
폼 제출 시 데이터 처리:

```javascript
// 숫자 필드 처리
const processNumericFields = (values) => {
  const numericFields = [
    'price', 'lease_price', 'supply_area_sqm', 'private_area_sqm',
    'maintenance_fee'
  ];
  
  const processedValues = { ...values };
  
  numericFields.forEach(field => {
    if (processedValues[field] === '' || processedValues[field] === undefined) {
      processedValues[field] = null;
    } else if (processedValues[field] !== null) {
      const numValue = parseFloat(processedValues[field]);
      processedValues[field] = isNaN(numValue) ? null : numValue;
    }
  });
  
  return processedValues;
};

// 데이터베이스 컬럼 매핑
const finalValues = {
  property_name: processedValues.property_name,
  location: processedValues.location,
  property_type: processedValues.property_type_id,
  transaction_type: processedValues.transaction_type_id,
  property_status: processedValues.property_status_id,
  price: processedValues.price,
  lease_price: processedValues.lease_price,
  area_m2: processedValues.supply_area_sqm,
  area_pyeong: processedValues.supply_area_sqm ? 
    Math.round(processedValues.supply_area_sqm * 0.3025 * 10) / 10 : null,
  // ... 더 많은 매핑
};
```

### React Query Integration
```javascript
// 룩업 테이블 데이터 조회
const { data: lookupData, isLoading: isLookupLoading } = useQuery(
  ['lookupTables'],
  getLookupTables,
  {
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    onError: (err) => {
      console.error('룩업 테이블 조회 실패:', err);
    }
  }
);

// 매물 등록/수정 Mutation
const mutation = useMutation(
  async (values) => {
    const processedValues = processNumericFields(values);
    // ... 처리 로직
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      setSuccess(true);
      setTimeout(() => navigate('/properties'), 2000);
    },
    onError: (err) => {
      setError(`매물 ${isEditing ? '수정' : '등록'}에 실패했습니다: ${err.message}`);
    }
  }
);
```

---

## 🔐 AuthGuard Component

### Overview
라우트 보호를 위한 HOC 컴포넌트로, 인증 및 권한 기반 접근 제어를 제공합니다.

### Props Interface
```javascript
interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string; // 필요한 권한
  fallback?: React.ReactNode;  // 권한 없을 때 표시할 컴포넌트
}
```

### Basic Usage
```javascript
import AuthGuard from '../components/auth/AuthGuard';
import { PERMISSIONS } from '../utils/permissions';

// 기본 인증 보호
<AuthGuard>
  <ProtectedComponent />
</AuthGuard>

// 특정 권한 필요
<AuthGuard requiredPermission={PERMISSIONS.MANAGE_USERS}>
  <AdminPanel />
</AuthGuard>

// 커스텀 fallback
<AuthGuard 
  requiredPermission={PERMISSIONS.VIEW_ALL_PROPERTIES}
  fallback={<AccessDeniedMessage />}
>
  <AllPropertiesView />
</AuthGuard>
```

### Implementation
```javascript
const AuthGuard = ({ children, requiredPermission, fallback }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return fallback || <UnauthorizedPage />;
  }
  
  return children;
};
```

### Route Protection Examples
```javascript
// 라우터 설정에서 사용
<Routes>
  {/* 공개 라우트 */}
  <Route path="/login" element={<Login />} />
  
  {/* 인증 필요 */}
  <Route path="/dashboard" element={
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  } />
  
  {/* 관리자 전용 */}
  <Route path="/admin/*" element={
    <AuthGuard requiredPermission={PERMISSIONS.MANAGE_USERS}>
      <AdminRoutes />
    </AuthGuard>
  } />
  
  {/* 매물 관리 */}
  <Route path="/properties/create" element={
    <AuthGuard requiredPermission={PERMISSIONS.CREATE_PROPERTY}>
      <PropertyForm />
    </AuthGuard>
  } />
</Routes>
```

---

## 🎨 Common Components

### Input Component
```javascript
// 표준화된 입력 필드
<Input
  label="매물명"
  name="property_name"
  value={value}
  onChange={onChange}
  required
  placeholder="매물명을 입력하세요"
  error={error}
/>
```

### ErrorState Component
```javascript
// 에러 상태 표시
<ErrorState 
  message="데이터를 불러올 수 없습니다"
  onRetry={refetch}
  showRetry
/>
```

### SkeletonLoader Component
```javascript
// 로딩 스켈레톤
<SkeletonLoader 
  type="card"
  count={3}
  animate
/>
```

### Toast Component
```javascript
// 알림 메시지
import { useToast } from '../context/ToastContext';

const { showToast } = useToast();

showToast('성공적으로 저장되었습니다', 'success');
showToast('오류가 발생했습니다', 'error');
```

---

## 📱 Responsive Design Patterns

### Grid Layouts
```javascript
// 반응형 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// 폼 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input label="이름" />
  <Input label="전화번호" />
</div>
```

### Responsive Typography
```javascript
// 반응형 텍스트 크기
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
  제목
</h1>

<p className="text-sm sm:text-base text-gray-600">
  설명 텍스트
</p>
```

### Mobile-First Approach
```javascript
// 모바일 우선 클래스
<div className="p-4 sm:p-6 lg:p-8">
  <div className="space-y-4 sm:space-y-6">
    {/* 콘텐츠 */}
  </div>
</div>
```

---

## 🔧 Best Practices

### 1. Props Interface Definition
```javascript
// TypeScript 사용 권장
interface ComponentProps {
  required: string;
  optional?: boolean;
  callback: (data: any) => void;
}
```

### 2. Error Boundary Usage
```javascript
<ErrorBoundary fallback={<ErrorPage />}>
  <Component />
</ErrorBoundary>
```

### 3. Loading States
```javascript
const Component = () => {
  const { data, loading, error } = useQuery();
  
  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataComponent data={data} />;
};
```

### 4. Permission Checks
```javascript
// 컴포넌트 내에서 권한 확인
const { user } = useAuth();

return (
  <div>
    {hasPermission(user, PERMISSIONS.EDIT) && (
      <Button onClick={handleEdit}>수정</Button>
    )}
  </div>
);
```

### 5. Form Validation
```javascript
// Yup 스키마 사용
const validationSchema = Yup.object({
  required: Yup.string().required('필수 입력사항입니다'),
  email: Yup.string().email('올바른 이메일 형식입니다'),
  phone: Yup.string().matches(/^010-\d{4}-\d{4}$/, '전화번호 형식 오류')
});
```

---

## 🧪 Testing Components

### Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

test('버튼 클릭 이벤트', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>클릭</Button>);
  
  fireEvent.click(screen.getByText('클릭'));
  expect(handleClick).toHaveBeenCalled();
});
```

### Props Testing
```javascript
test('props 전달 확인', () => {
  const mockProperty = {
    id: '1',
    property_name: '테스트 매물',
    location: '서울시 강남구'
  };
  
  render(<PropertyCard property={mockProperty} />);
  
  expect(screen.getByText('테스트 매물')).toBeInTheDocument();
  expect(screen.getByText('서울시 강남구')).toBeInTheDocument();
});
```

---

## 🔗 Related Documentation

- [API Service Layer Reference](./API_SERVICE_REFERENCE.md)
- [Authentication System Reference](./AUTH_SYSTEM_REFERENCE.md)
- [Database Schema Reference](./DATABASE_SCHEMA.md)
- [Development Setup Guide](./GETTING_STARTED.md)