# 📋 Frontend Developer 업무 지시서

**Task ID**: FRONTEND-UI-IMPL-001  
**담당자**: Frontend Developer  
**작업일**: 2025-08-06  
**우선순위**: 높음  
**예상 소요시간**: 4-5시간  
**연관 작업**: UI-REDESIGN-001 (UI/UX Designer)

---

## 🎯 작업 목표

UI/UX Designer가 설계한 핑크 테마 기반의 새로운 매물 리스트 디자인을 React 컴포넌트로 구현

## 📋 작업 상세 내용

### 1. 메인 컴포넌트 개편

#### 🔹 PropertyList.jsx 전면 개편
**파일 위치**: `/src/pages/PropertyList.jsx`

**구현 요구사항**:

##### A. 헤더 섹션
```jsx
// 헤더 구조
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    <h1 className="text-2xl font-bold">매물장</h1>
    <span className="text-gray-500">*매물장의 정보를 간편하게 관리하세요.</span>
  </div>
  <button className="bg-primary hover:bg-pink-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
    <span>✓</span> 매물 등록
  </button>
</div>
```

##### B. 검색 섹션 (기존 PropertyFilter 통합)
```jsx
// 검색 컨테이너
<div className="bg-gray-50 p-6 rounded-lg mb-6">
  <p className="text-gray-600 mb-4">매물 종류를 선택하시면 상세 검색이 가능합니다.</p>
  
  {/* 지역조회 - 4개 필드 그리드 */}
  <div className="mb-4">
    <label className="text-sm text-gray-600 mb-2 block font-medium">지역조회</label>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* 매물종류, 시/도, 구/군, 읍/면/동 */}
    </div>
  </div>

  {/* 조건조회 - 6개 필드 그리드 */}
  <div className="mb-6">
    <label className="text-sm text-gray-600 mb-2 block font-medium">조건조회</label>
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
      {/* 거래유형, 상태, 가격범위, 매물번호 */}
    </div>
  </div>

  {/* 검색/초기화 버튼 */}
  <div className="flex justify-center gap-4">
    <button className="border border-gray-300 px-8 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      초기화
    </button>
    <button className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-pink-600 flex items-center gap-2 transition-colors">
      <SearchIcon className="w-4 h-4" />
      검색
    </button>
  </div>
</div>
```

##### C. 테이블 헤더 개선
```jsx
// 리스트 헤더
<div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-bold">매물 리스트</h2>
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">최신순</span>
      <select className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
        <option value="50items">50개씩 보기</option>
        <option value="100items">100개씩 보기</option>
      </select>
    </div>
  </div>
</div>
```

##### D. 테이블 구조 개편
```jsx
// 테이블 컬럼 구성
const columns = [
  { key: 'checkbox', label: '', width: 'w-12' },
  { key: 'favorite', label: '', width: 'w-12' },
  { key: 'property_number', label: '매물번호' },
  { key: 'property_type', label: '매물종류' },
  { key: 'location', label: '지역명/상세주소' },
  { key: 'area', label: '면적', align: 'center' },
  { key: 'price', label: '가격유형/가격(만원)', align: 'center' },
  { key: 'manager', label: '담당자', align: 'center' },
  { key: 'status', label: '상태', align: 'center' },
  { key: 'created_date', label: '등록일', align: 'center' },
  { key: 'actions', label: '작업', align: 'center' }
];
```

### 2. 컴포넌트별 세부 구현

#### 🔹 PropertyTableRow 컴포넌트 (새로 생성)
**파일 위치**: `/src/components/property/PropertyTableRow.jsx`

```jsx
// 각 필드별 렌더링 함수
const renderPropertyNumber = (property) => (
  <span className="bg-primary text-white px-3 py-1 rounded text-sm font-medium">
    {property.property_number || property.id}
  </span>
);

const renderLocation = (property) => (
  <div>
    <div className="text-sm text-gray-800 font-medium">{property.name}</div>
    <div className="text-xs text-gray-500 flex items-center mt-1">
      <MapPinIcon className="w-3 h-3 mr-1" />
      {property.address}
    </div>
  </div>
);

const renderArea = (property) => (
  <div className="text-center text-sm text-gray-600">
    {property.area_supply}㎡ ({(property.area_supply * 0.3025).toFixed(1)}평)
  </div>
);

const renderPrice = (property) => {
  const transactionTypeColors = {
    '매매': 'bg-yellow-100 text-yellow-700',
    '전세': 'bg-blue-100 text-blue-700', 
    '월세': 'bg-purple-100 text-purple-700'
  };
  
  return (
    <div className="text-center">
      <div className={`${transactionTypeColors[property.transaction_type] || 'bg-gray-100 text-gray-700'} px-3 py-1 rounded inline-block font-medium text-sm mb-1`}>
        {property.transaction_type}
      </div>
      <div className="text-sm font-medium">{formatPrice(property.price)}</div>
    </div>
  );
};

const renderStatus = (property) => {
  const statusColors = {
    '거래가능': 'bg-green-100 text-green-800',
    '거래완료': 'bg-blue-100 text-blue-800',
    '거래보류': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[property.status] || 'bg-gray-100 text-gray-800'}`}>
      {property.status}
    </span>
  );
};
```

#### 🔹 PropertyFilter.jsx 개선
**파일 위치**: `/src/components/property/PropertyFilter.jsx`

**변경사항**:
- PropertyList.jsx 내부로 통합
- 기존 파일은 deprecated 처리
- 검색 로직은 유지하되 UI만 새로운 디자인 적용

### 3. 스타일링 시스템

#### 🔹 TailwindCSS 커스텀 색상 적용
**파일 위치**: `tailwind.config.js`

```js
// primary 색상 추가 확인
theme: {
  extend: {
    colors: {
      primary: '#FF66B2',
      'primary-hover': '#E055A0',
      'primary-light': '#FFE8F5'
    }
  }
}
```

#### 🔹 공통 스타일 클래스 정의
**파일 위치**: `/src/styles/design-system.css` (추가)

```css
/* 매물 리스트 전용 스타일 */
.property-input {
  @apply border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary;
}

.property-select {
  @apply border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary;
}

.property-button-primary {
  @apply bg-primary text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors;
}

.property-button-secondary {
  @apply border border-gray-300 px-6 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors;
}
```

### 4. 상태 관리 및 데이터 처리

#### 🔹 기존 데이터 구조 유지
```jsx
// 절대 변경하지 말 것!
const [properties, setProperties] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  // 기존 필터 구조 유지
});

// API 호출도 기존과 동일하게 유지
const fetchProperties = async () => {
  // 기존 로직 유지
};
```

#### 🔹 새로운 UI 상태 추가
```jsx
// UI 전용 상태 (데이터와 무관)
const [viewMode, setViewMode] = useState('table'); // table | card
const [itemsPerPage, setItemsPerPage] = useState(50);
const [sortOrder, setSortOrder] = useState('latest');
```

### 5. 유틸리티 함수

#### 🔹 formatPrice 함수 개선
**파일 위치**: `/src/utils/formatters.js`

```js
export const formatPrice = (price, transactionType) => {
  if (!price) return '-';
  
  const numPrice = parseInt(price);
  
  if (transactionType === '월세') {
    // "1000만 / 80만" 형태로 표시
    return `${Math.floor(numPrice / 10000)}만 / ${numPrice % 10000}만`;
  }
  
  if (numPrice >= 10000) {
    return `${Math.floor(numPrice / 10000)}억${numPrice % 10000 > 0 ? ` ${numPrice % 10000}만` : ''}`;
  }
  
  return `${numPrice}만`;
};

export const formatArea = (area) => {
  if (!area) return '-';
  const pyeong = (area * 0.3025).toFixed(1);
  return `${area}㎡ (${pyeong}평)`;
};
```

## ⚠️ 중요 제약사항 및 주의사항

### 🚨 절대 금지사항
1. **데이터베이스 스키마 변경**: Supabase 테이블 구조 절대 변경 금지
2. **API 엔드포인트 수정**: 기존 API 호출 로직 변경 금지  
3. **상태값 임의 생성**: 없는 status나 transaction_type 추가 금지
4. **필드명 변경**: 데이터베이스 필드명 매핑 변경 금지

### ✅ 허용되는 작업
- React 컴포넌트 구조 변경
- TailwindCSS 스타일링 적용
- UI 로직 추가 (데이터 로직과 분리)
- 새로운 컴포넌트 생성
- 유틸리티 함수 추가

### 🔍 기존 데이터 확인 방법
```jsx
// 개발 시 데이터 구조 확인
console.log('Property fields:', Object.keys(properties[0] || {}));
console.log('Available statuses:', [...new Set(properties.map(p => p.status))]);
console.log('Transaction types:', [...new Set(properties.map(p => p.transaction_type))]);
```

## 📁 작업 대상 파일

### 필수 수정 파일
```
✅ /src/pages/PropertyList.jsx                    # 메인 페이지 전면 개편
✅ /src/components/property/PropertyTableRow.jsx  # 새로 생성 (테이블 행)
✅ /src/utils/formatters.js                       # 유틸리티 함수 추가
✅ /src/styles/design-system.css                  # 공통 스타일 추가
```

### 참고 파일
```
📖 /src/components/property/PropertyCard.jsx      # 기존 스타일 참고
📖 /src/components/property/PropertyFilter.jsx    # 기존 필터 로직 참고
📖 /src/services/propertyService.js              # 데이터 구조 확인
📖 /src/pages/PropertyListNew.jsx                # 참고 (있는 경우)
```

## 🔧 개발 환경 설정

### 로컬 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

### 브라우저 테스트 URL
```
http://localhost:5173/properties
```

### 디버깅 도구
- React DevTools
- Chrome/Firefox 개발자 도구
- TailwindCSS IntelliSense

## 📋 단계별 체크리스트

### Phase 1: 환경 준비 및 분석 (1시간)
- [ ] 현재 PropertyList.jsx 코드 분석
- [ ] 데이터 구조 및 API 확인
- [ ] 기존 컴포넌트 의존성 파악
- [ ] TailwindCSS 설정 확인

### Phase 2: 헤더 및 검색 섹션 구현 (2시간)
- [ ] 새로운 헤더 섹션 구현
- [ ] 검색 섹션 UI 구현
- [ ] 지역조회 4개 필드 배치
- [ ] 조건조회 6개 필드 배치
- [ ] 검색/초기화 버튼 구현

### Phase 3: 테이블 시스템 구현 (1.5시간)
- [ ] PropertyTableRow 컴포넌트 생성
- [ ] 매물번호 핑크 라벨 구현
- [ ] 지역/주소 분리 표시
- [ ] 가격유형 컬러 라벨
- [ ] 상태 배지 시스템
- [ ] 즐겨찾기 별표 기능

### Phase 4: 스타일링 및 최적화 (30분)
- [ ] 반응형 디자인 적용
- [ ] 호버 효과 구현
- [ ] 트랜지션 효과 추가
- [ ] 아이콘 시스템 적용

### Phase 5: 테스트 및 검증 (1시간)
- [ ] 기능 테스트 (검색, 필터링, 정렬)
- [ ] 반응형 테스트 (모바일/태블릿)
- [ ] 성능 테스트 (렌더링 속도)
- [ ] 브라우저 호환성 테스트

## 🎯 완료 기준

1. **시각적 완성도**: UI/UX 디자인 시안과 95% 이상 일치
2. **기능 유지**: 기존 모든 CRUD 기능 정상 작동
3. **성능**: 렌더링 시간 기존 대비 유지 또는 개선
4. **반응형**: 모든 디바이스에서 정상 표시
5. **접근성**: 키보드 네비게이션 및 스크린 리더 지원
6. **코드 품질**: ESLint 규칙 준수, 주석 작성

## 🐛 예상되는 이슈 및 해결방안

### 이슈 1: 데이터 필드 매핑
```jsx
// 해결방안: 안전한 필드 접근
const safePropertyData = {
  number: property.property_number || property.id || '-',
  name: property.name || property.title || '매물명 없음',
  address: property.address || property.location || '-',
  // ...
};
```

### 이슈 2: 상태값 불일치
```jsx
// 해결방안: 기본값 처리
const getStatusColor = (status) => {
  const statusMap = {
    '거래가능': 'bg-green-100 text-green-800',
    '거래완료': 'bg-blue-100 text-blue-800'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};
```

### 이슈 3: 반응형 레이아웃
```jsx
// 해결방안: 모바일 우선 설계
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
```

## 📞 지원 및 문의

### 기술적 이슈
- **PO에게 보고**: 요구사항 변경이나 제약사항 문의
- **UI/UX Designer 협업**: 디자인 세부사항 확인
- **Backend Developer 문의**: 데이터 구조 관련 질문

### 응급 상황
- 빌드 실패 시 즉시 PO에게 보고
- 데이터 손실 위험 시 작업 중단 후 보고
- API 오류 발생 시 Backend Developer와 협의

---

**승인자**: Product Owner  
**검토자**: UI/UX Designer  
**최종 확인**: QA Manager  

**⚠️ 작업 시작 전 PO에게 확인 받고 진행하세요!**