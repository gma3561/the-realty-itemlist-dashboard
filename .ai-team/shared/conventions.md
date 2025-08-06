# 📋 AI 팀 작업 규칙 및 컨벤션

## 🤝 협업 규칙

### Git 워크플로우
```bash
# 새 기능 개발 시
git checkout -b feature/기능명-역할
git commit -m "feat(역할): 기능 설명"
git push origin feature/기능명-역할
```

### 커밋 메시지 규칙
```
타입(범위): 설명

타입:
- feat: 새 기능
- fix: 버그 수정  
- docs: 문서 수정
- style: 코드 스타일 (기능 변경 없음)
- refactor: 리팩토링
- test: 테스트 추가/수정
- chore: 기타 변경사항

범위:
- backend: 백엔드 관련
- frontend: 프론트엔드 관련
- ui: UI/UX 관련
- qa: 테스트 관련
- docs: 문서 관련
```

### 예시
```
feat(backend): Supabase RLS 정책 추가
fix(frontend): 매물 목록 페이지네이션 오류 수정
docs(shared): API 문서 업데이트
test(qa): E2E 테스트 시나리오 추가
```

## 💻 코딩 컨벤션

### JavaScript/React 규칙

#### 1. 파일명 규칙
```
컴포넌트: PascalCase (PropertyList.jsx)
서비스: camelCase (propertyService.js)  
유틸리티: camelCase (dateUtils.js)
훅: camelCase (useProperty.js)
상수: UPPER_CASE (API_ENDPOINTS.js)
```

#### 2. 컴포넌트 구조
```jsx
// PropertyList.jsx
import { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';

const PropertyList = () => {
  // 1. 상태 선언
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. 효과
  useEffect(() => {
    loadProperties();
  }, []);
  
  // 3. 핸들러 함수
  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('매물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. 렌더링
  return (
    <div className="property-list">
      {/* JSX 내용 */}
    </div>
  );
};

export default PropertyList;
```

#### 3. 서비스 구조
```javascript
// propertyService.js
import { supabase } from './supabase';

export const propertyService = {
  // CRUD 메서드들
  async getProperties() {
    // 구현
  },
  
  async createProperty(data) {
    // 구현  
  }
};
```

### CSS/Styling 규칙

#### Tailwind CSS 사용
```jsx
// 좋은 예
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-800">제목</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    버튼
  </button>
</div>

// 피해야 할 예 - 인라인 스타일
<div style={{display: 'flex', padding: '16px'}}>
```

#### 반응형 디자인
```jsx
// 모바일 우선 접근
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 내용 */}
</div>
```

## 🔒 보안 규칙

### 1. 환경변수 관리
```javascript
// ✅ 올바른 방법
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ 잘못된 방법  
const apiKey = "실제_키_값_하드코딩";
```

### 2. 에러 처리
```javascript
// ✅ 보안 친화적 에러 처리
try {
  // 코드
} catch (error) {
  console.error('작업 실패'); // 구체적 정보 숨김
  return { success: false, message: '요청 처리 중 오류가 발생했습니다.' };
}

// ❌ 보안에 취약한 에러 처리
catch (error) {
  console.error(error); // 민감한 정보 노출 가능
  alert(error.message); // 사용자에게 내부 오류 노출
}
```

### 3. 권한 체크
```javascript
// 프론트엔드에서 권한 확인
import { isAdmin, canEditProperty } from '../utils/permissions';

const PropertyEdit = ({ property }) => {
  const { user } = useAuth();
  
  if (!canEditProperty(user, property)) {
    return <AccessDenied />;
  }
  
  // 편집 UI
};
```

## 🧪 테스트 규칙

### 1. 유닛 테스트
```javascript
// PropertyService.test.js
import { describe, it, expect } from 'vitest';
import { propertyService } from '../propertyService';

describe('PropertyService', () => {
  it('매물 목록을 정상적으로 가져온다', async () => {
    const properties = await propertyService.getProperties();
    expect(Array.isArray(properties)).toBe(true);
  });
});
```

### 2. E2E 테스트
```javascript
// property.spec.js  
import { test, expect } from '@playwright/test';

test('매물 등록 플로우', async ({ page }) => {
  await page.goto('/properties/new');
  await page.fill('[name="name"]', '테스트 매물');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 📁 파일 구조 규칙

### 컴포넌트 조직
```
src/components/
├── common/           # 재사용 가능한 공통 컴포넌트
│   ├── Button.jsx
│   ├── Modal.jsx  
│   └── LoadingSpinner.jsx
├── property/         # 매물 관련 특화 컴포넌트
│   ├── PropertyCard.jsx
│   ├── PropertyForm.jsx
│   └── PropertyList.jsx
└── layout/          # 레이아웃 컴포넌트
    ├── Header.jsx
    ├── Sidebar.jsx
    └── Layout.jsx
```

### 서비스 조직
```
src/services/
├── supabase.js       # Supabase 설정
├── propertyService.js # 매물 관련 API
├── userService.js    # 사용자 관련 API
└── authService.js    # 인증 관련 API
```

## 📝 문서화 규칙

### 1. 컴포넌트 문서화
```jsx
/**
 * 매물 카드 컴포넌트
 * @param {Object} property - 매물 정보 객체
 * @param {Function} onEdit - 편집 버튼 클릭 핸들러
 * @param {Function} onDelete - 삭제 버튼 클릭 핸들러
 */
const PropertyCard = ({ property, onEdit, onDelete }) => {
  // 구현
};
```

### 2. API 문서화
```javascript
/**
 * 매물 목록 조회
 * @param {Object} filters - 필터 조건
 * @param {number} page - 페이지 번호
 * @param {number} limit - 페이지당 항목 수
 * @returns {Promise<Array>} 매물 목록
 */
async function getProperties(filters = {}, page = 1, limit = 20) {
  // 구현
}
```

## 🚀 성능 규칙

### 1. React 최적화
```jsx
// useMemo 사용
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// useCallback 사용
const handleClick = useCallback(() => {
  // 핸들러 로직
}, [dependency]);
```

### 2. 이미지 최적화
```jsx
// 이미지 지연 로딩
<img 
  src={property.image} 
  alt={property.name}
  loading="lazy"
  className="w-full h-48 object-cover"
/>
```

## ⚡ 개발 효율성 팁

### 1. 개발 도구 활용
```bash
# React DevTools 사용
# Redux DevTools 사용 (상태 관리 시)
# VS Code 확장: ES7+ React/Redux/React-Native snippets
```

### 2. 디버깅
```javascript
// 개발 환경에서만 디버그 로그
if (import.meta.env.DEV) {
  console.log('디버그 정보:', data);
}
```

---

**규칙 버전**: 1.0  
**최종 수정**: 2025-08-03  
**적용 범위**: 전체 AI 팀 