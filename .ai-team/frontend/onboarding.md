# 🎨 Frontend Developer 온보딩 가이드

## 환영합니다! 👋
팀 매물장 프로젝트의 Frontend Developer로 오신 것을 환영합니다. 이 가이드를 통해 React 기반 프론트엔드를 빠르게 파악하고 기여할 수 있습니다.

## 🎯 역할 개요

### 주요 책임
- **React 컴포넌트** 개발 및 유지보수
- **사용자 인터페이스** 구현 및 개선
- **상태 관리** (React Query, Context)
- **성능 최적화** (렌더링, 번들 크기)
- **반응형 디자인** 및 모바일 최적화

### 현재 진행 중인 주요 작업
1. 고객 관리 UI 완성 (우선순위 1)
2. 페이지네이션 구현 (우선순위 2)
3. 성능 최적화 및 사용자 경험 개선

## 🏗️ 프론트엔드 아키텍처

### 기술 스택
```
React 18 + Vite
├── TailwindCSS (스타일링)
├── React Router (라우팅)
├── React Query (서버 상태 관리)
├── React Context (클라이언트 상태)
├── Formik + Yup (폼 관리)
├── Recharts (데이터 시각화)
└── Lucide React (아이콘)
```

### 프로젝트 구조
```
src/
├── components/          # React 컴포넌트
│   ├── auth/           # 인증 관련 (로그인, 권한 체크)
│   ├── common/         # 재사용 가능한 공통 컴포넌트
│   ├── dashboard/      # 대시보드 차트 및 위젯
│   ├── layout/         # 헤더, 사이드바, 레이아웃
│   ├── property/       # 매물 관련 컴포넌트
│   ├── customer/       # 고객 관리 컴포넌트 (개발 중)
│   └── matching/       # 매칭 시스템 컴포넌트
├── pages/              # 페이지 컴포넌트 (라우트별)
├── hooks/              # Custom Hooks
├── context/            # React Context (AuthContext 등)
├── utils/              # 유틸리티 함수
├── services/           # API 호출 서비스
└── styles/             # 글로벌 스타일
```

## 🔧 개발 환경 설정

### 1. 개발 서버 실행
```bash
# 프로젝트 루트에서
npm run dev

# 브라우저에서 확인
# http://localhost:5173/the-realty-itemlist-dashboard/
```

### 2. 개발 도구 설정
```bash
# VS Code 확장 설치 권장
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

# React DevTools (브라우저)
# Chrome/Firefox 확장 프로그램 설치
```

### 3. 환경변수 확인
```javascript
// src/config/ 디렉토리에서 환경 설정 확인
import { ENV_CONFIG } from './src/config/env';
console.log('환경 설정:', ENV_CONFIG);
```

## 📋 현재 작업 상황

### ✅ 완료된 컴포넌트

#### 인증 시스템
- `LoginPage.jsx` - Google OAuth 로그인
- `AuthContext.jsx` - 인증 상태 관리
- `ProtectedRoute.jsx` - 라우트 보호

#### 매물 관리
- `PropertyList.jsx` - 매물 목록 (테이블/카드 뷰)
- `PropertyForm.jsx` - 매물 등록/수정 폼
- `PropertyDetail.jsx` - 매물 상세 정보
- `PropertyCard.jsx` - 매물 카드 컴포넌트

#### 대시보드
- `Dashboard.jsx` - 메인 대시보드
- `StatsCard.jsx` - 통계 카드 위젯
- `PropertyChart.jsx` - 매물 현황 차트

#### 공통 컴포넌트
- `Header.jsx`, `Sidebar.jsx` - 레이아웃
- `Button.jsx`, `Modal.jsx` - 기본 UI 컴포넌트
- `LoadingSpinner.jsx` - 로딩 인디케이터

### 🔄 진행 중인 작업

#### 1. 고객 관리 UI 완성 (우선순위 1)
```javascript
// src/components/customer/ 디렉토리
// 현재 상태: 기본 구조만 완성

// 완성 필요한 컴포넌트:
- [ ] CustomerList.jsx      # 고객 목록 페이지
- [ ] CustomerForm.jsx      # 고객 등록/수정 폼  
- [ ] CustomerDetail.jsx    # 고객 상세 정보
- [ ] CustomerCard.jsx      # 고객 카드 컴포넌트
- [ ] CustomerSearch.jsx    # 고객 검색/필터
```

#### 2. 페이지네이션 구현 (우선순위 2)
```javascript
// 현재 상태: 백엔드 API는 준비됨, 프론트엔드 UI 미구현

// 구현 필요:
- [ ] Pagination.jsx        # 페이지네이션 컴포넌트
- [ ] PropertyList.jsx 수정 # 페이지네이션 연동
- [ ] CustomerList.jsx 수정 # 페이지네이션 연동
- [ ] usePagination.js      # 페이지네이션 커스텀 훅
```

### 🚧 개선이 필요한 영역

#### 1. 성능 최적화
```javascript
// React.memo, useMemo, useCallback 적용 필요
// 대상 컴포넌트:
- PropertyList.jsx (대량 데이터 렌더링)
- PropertyCard.jsx (반복 렌더링)
- Dashboard.jsx (차트 리렌더링)
```

#### 2. 사용자 경험 개선
```javascript
// 추가 필요한 기능:
- [ ] Toast 알림 시스템
- [ ] 로딩 스켈레톤 UI
- [ ] 에러 바운더리
- [ ] 더 나은 에러 메시지
```

## 🛠️ 개발 가이드

### 1. 새 컴포넌트 생성 패턴

#### 기본 컴포넌트 구조
```jsx
// CustomerForm.jsx 예시
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { customerService } from '../../services/customerService';

const CustomerForm = ({ customer, onSuccess, onCancel }) => {
  // 1. 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    // ...
  });
  const [errors, setErrors] = useState({});

  // 2. React Query 훅
  const queryClient = useQueryClient();
  const mutation = useMutation(
    customer ? customerService.updateCustomer : customerService.createCustomer,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('customers');
        onSuccess?.(data);
      },
      onError: (error) => {
        setErrors({ submit: error.message });
      }
    }
  );

  // 3. 이펙트
  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  // 4. 이벤트 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // 유효성 검사
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 5. 렌더링
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          고객명
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* 추가 필드들... */}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {mutation.isLoading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
```

### 2. 페이지네이션 구현

#### 커스텀 훅 생성
```javascript
// src/hooks/usePagination.js
import { useState, useMemo } from 'react';

export const usePagination = (totalItems, itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      currentPage,
      totalPages,
      itemsPerPage,
      startIndex,
      endIndex,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }, [totalItems, itemsPerPage, currentPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  return {
    ...pagination,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
  };
};
```

#### 페이지네이션 컴포넌트
```jsx
// src/components/common/Pagination.jsx
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center space-x-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        이전
      </button>

      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`px-3 py-2 rounded ${
            page === currentPage
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          } ${page === '...' ? 'cursor-default' : ''}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        다음
      </button>
    </div>
  );
};
```

### 3. 성능 최적화

#### React.memo 사용
```jsx
// PropertyCard.jsx 최적화
import { memo } from 'react';

const PropertyCard = memo(({ property, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* 카드 내용 */}
    </div>
  );
});

// props 비교 함수 (선택적)
PropertyCard.displayName = 'PropertyCard';
export default PropertyCard;
```

#### useMemo와 useCallback 적용
```jsx
// PropertyList.jsx 최적화
import { useMemo, useCallback } from 'react';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});

  // 필터링된 데이터 메모이제이션
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (filters.status && property.status !== filters.status) return false;
      if (filters.search && !property.name.includes(filters.search)) return false;
      return true;
    });
  }, [properties, filters]);

  // 이벤트 핸들러 메모이제이션
  const handleEdit = useCallback((property) => {
    // 편집 로직
  }, []);

  const handleDelete = useCallback((id) => {
    // 삭제 로직
  }, []);

  return (
    <div className="space-y-4">
      {filteredProperties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

## 🎨 UI/UX 가이드라인

### 1. TailwindCSS 사용 패턴

#### 컴포넌트 스타일링
```jsx
// 표준 버튼 스타일
<button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
  버튼
</button>

// 폼 입력 필드
<input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />

// 카드 레이아웃
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  카드 내용
</div>
```

#### 반응형 디자인
```jsx
// 모바일 우선 접근법
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 그리드 아이템들 */}
</div>

// 조건부 표시
<div className="hidden md:block">데스크톱에서만 표시</div>
<div className="block md:hidden">모바일에서만 표시</div>
```

### 2. 일관된 UI 패턴

#### 로딩 상태
```jsx
// 로딩 스피너
{isLoading && <LoadingSpinner />}

// 스켈레톤 UI (구현 예정)
{isLoading ? <PropertyCardSkeleton /> : <PropertyCard />}
```

#### 에러 처리
```jsx
// 에러 메시지 표시
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <p className="text-red-700">{error.message}</p>
  </div>
)}
```

## 🧪 테스트 가이드

### 1. 컴포넌트 테스트
```javascript
// PropertyCard.test.jsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import PropertyCard from './PropertyCard';

const mockProperty = {
  id: '1',
  name: '테스트 매물',
  price: 100000000,
  // ...
};

const renderWithQueryClient = (component) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

test('매물 카드가 올바르게 렌더링된다', () => {
  renderWithQueryClient(<PropertyCard property={mockProperty} />);
  
  expect(screen.getByText('테스트 매물')).toBeInTheDocument();
  expect(screen.getByText('1억원')).toBeInTheDocument();
});
```

### 2. E2E 테스트 시나리오
```javascript
// tests/customer-management.spec.js
import { test, expect } from '@playwright/test';

test('고객 등록 플로우', async ({ page }) => {
  await page.goto('/customers');
  
  // 고객 등록 버튼 클릭
  await page.click('text=고객 등록');
  
  // 폼 작성
  await page.fill('[name="name"]', '홍길동');
  await page.fill('[name="phone"]', '010-1234-5678');
  await page.fill('[name="email"]', 'hong@example.com');
  
  // 저장
  await page.click('button[type="submit"]');
  
  // 성공 메시지 확인
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 📚 참고 문서

### 필수 읽기
- [ ] `docs/COMPONENT_USAGE_GUIDE.md` - 컴포넌트 사용법
- [ ] `.ai-team/shared/conventions.md` - 코딩 컨벤션
- [ ] `src/components/` - 기존 컴포넌트 구조 파악

### 외부 문서
- [React 18 공식 문서](https://react.dev/)
- [TailwindCSS 가이드](https://tailwindcss.com/docs)
- [React Query 문서](https://tanstack.com/query/latest)

## 🎯 이번 스프린트 목표

### Week 1 (8/3-8/9)
- [ ] 고객 등록/수정 폼 완성
- [ ] 고객 목록 페이지 구현
- [ ] 고객-매물 연결 UI

### Week 2 (8/10-8/17)
- [ ] 매물 목록 페이지네이션 구현
- [ ] React 성능 최적화 적용
- [ ] Toast 알림 시스템 구현

## 🚨 현재 알려진 이슈

### 긴급 수정 필요
1. **ManagerAssignment.jsx** - 필드 매핑 불일치 (백엔드와 협력)
2. **PropertyList.jsx** - 대량 데이터 렌더링 성능 이슈

### 개선 필요
1. **에러 바운더리** 부재 - 예상치 못한 에러 처리
2. **접근성** - 키보드 네비게이션, 스크린 리더 지원
3. **다국어 지원** - 현재는 한글만 지원

## 💡 개발 팁

### 1. React DevTools 활용
```javascript
// 컴포넌트 성능 프로파일링
// React DevTools > Profiler 탭 사용

// 개발 환경에서 리렌더링 원인 파악
useEffect(() => {
  console.log('PropertyCard 리렌더링:', { property, timestamp: Date.now() });
});
```

### 2. VS Code 스니펫 활용
```javascript
// rfc (React Function Component)
// useState
// useEffect
// 등의 스니펫 활용으로 개발 속도 향상
```

### 3. Hot Reload 최적화
```javascript
// Vite의 HMR 기능 활용
// 컴포넌트 수정 시 상태 유지하며 빠른 리로드
```

---

**지원 채널**: `.ai-team/frontend/` 디렉토리의 추가 문서들  
**Live Demo**: https://gma3561.github.io/the-realty-itemlist-dashboard/  
**다음 체크인**: 매주 수요일 오후 