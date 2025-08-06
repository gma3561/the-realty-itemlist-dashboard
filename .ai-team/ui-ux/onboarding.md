# 🎨 UI/UX Designer 온보딩 가이드

## 환영합니다! 👋
팀 매물장 프로젝트의 UI/UX Designer로 오신 것을 환영합니다. 이 가이드를 통해 디자인 시스템을 이해하고 사용자 경험을 개선할 수 있습니다.

## 🎯 역할 개요

### 주요 책임
- **디자인 시스템** 구축 및 유지보수
- **사용자 경험(UX)** 분석 및 개선
- **인터페이스 디자인** 및 프로토타이핑
- **접근성(Accessibility)** 및 사용성 향상
- **모바일/반응형** 디자인 최적화

### 현재 진행 중인 주요 작업
1. 고객 관리 화면 디자인 (우선순위 1)
2. 페이지네이션 UI 디자인 (우선순위 2)
3. 모바일 UX 개선 및 접근성 향상

## 🏗️ 현재 디자인 시스템

### 기술 스택
```
Design & Styling
├── TailwindCSS (유틸리티 기반 CSS)
├── Lucide React (아이콘 시스템)
├── 반응형 그리드 시스템
├── 커스텀 컴포넌트 라이브러리
└── PWA 디자인 패턴
```

### 색상 팔레트
```css
/* Primary Colors */
--blue-500: #3B82F6;    /* 주 액션 색상 */
--blue-600: #2563EB;    /* 호버 상태 */
--blue-700: #1D4ED8;    /* 활성 상태 */

/* Secondary Colors */
--gray-50: #F9FAFB;     /* 배경색 */
--gray-100: #F3F4F6;    /* 카드 배경 */
--gray-500: #6B7280;    /* 보조 텍스트 */
--gray-700: #374151;    /* 메인 텍스트 */
--gray-900: #111827;    /* 제목 */

/* Status Colors */
--green-500: #10B981;   /* 성공 */
--red-500: #EF4444;     /* 에러 */
--yellow-500: #F59E0B;  /* 경고 */
--indigo-500: #6366F1;  /* 정보 */
```

### 타이포그래피
```css
/* Font Scale */
text-xs: 12px      /* 캡션, 라벨 */
text-sm: 14px      /* 보조 정보 */
text-base: 16px    /* 본문 텍스트 */
text-lg: 18px      /* 중요 정보 */
text-xl: 20px      /* 소제목 */
text-2xl: 24px     /* 제목 */
text-3xl: 30px     /* 대제목 */

/* Font Weight */
font-normal: 400   /* 본문 */
font-medium: 500   /* 강조 */
font-semibold: 600 /* 제목 */
font-bold: 700     /* 대제목 */
```

## 📋 현재 디자인 현황

### ✅ 완료된 디자인 영역

#### 레이아웃 시스템
- **헤더 네비게이션**: 로고, 메뉴, 사용자 프로필
- **사이드바**: 주요 기능별 메뉴 구성
- **메인 콘텐츠**: 그리드 기반 반응형 레이아웃
- **모바일 네비게이션**: 햄버거 메뉴, 하단 탭바

#### 매물 관리 UI
- **매물 카드**: 이미지, 정보, 액션 버튼
- **매물 폼**: 단계별 입력 폼, 유효성 검사 UI
- **매물 상세**: 갤러리, 정보 탭, 액션 패널
- **검색/필터**: 드롭다운, 체크박스, 범위 슬라이더

#### 대시보드 UI
- **통계 카드**: 숫자, 증감률, 아이콘
- **차트**: 막대, 도넛, 선형 차트 (Recharts)
- **최근 활동**: 타임라인, 아바타, 상태 배지

### 🔄 진행 중인 디자인 작업

#### 1. 고객 관리 UI 디자인 (우선순위 1)
```
고객 관리 화면 컴포넌트:
📋 CustomerList.jsx      # 고객 목록 테이블/카드 뷰
📋 CustomerForm.jsx      # 고객 등록/수정 폼
📋 CustomerDetail.jsx    # 고객 상세 정보 패널
📋 CustomerCard.jsx      # 고객 정보 카드
📋 CustomerSearch.jsx    # 고객 검색/필터 UI

현재 상태: 와이어프레임 완성, 상세 디자인 진행 중
```

#### 2. 페이지네이션 UI (우선순위 2)
```
페이지네이션 컴포넌트:
📋 Pagination.jsx        # 페이지 번호, 이전/다음 버튼
📋 PageSize.jsx          # 페이지당 항목 수 선택
📋 PageInfo.jsx          # 현재 위치 정보 표시

디자인 요구사항:
- 모바일 친화적 버튼 크기
- 현재 페이지 명확한 시각적 표시
- 많은 페이지 수에 대한 축약 표시 (...)
```

### 🚧 개선이 필요한 영역

#### 1. 접근성 (Accessibility)
```css
/* 현재 이슈 */
- 키보드 네비게이션 개선 필요
- 스크린 리더 지원 향상
- 색상 대비비 일부 미달
- Focus indicator 일관성 부족

/* 개선 계획 */
- WCAG 2.1 AA 수준 준수
- aria-label, role 속성 추가
- 키보드 전용 사용자 테스트
```

#### 2. 모바일 사용성
```css
/* 현재 이슈 */
- 터치 타겟 크기 일부 부족 (44px 미만)
- 스와이프 제스처 미지원
- 모바일 키보드 대응 부족

/* 개선 계획 */
- 터치 우선 디자인 적용
- 네이티브 앱 같은 경험
- 오프라인 상태 UI
```

## 🛠️ 디자인 가이드

### 1. 컴포넌트 디자인 패턴

#### 카드 컴포넌트
```jsx
// 기본 카드 스타일
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        카드 제목
      </h3>
      <p className="text-gray-600 text-sm">
        카드 설명 텍스트
      </p>
    </div>
    <div className="flex space-x-2">
      <button className="btn-secondary">편집</button>
      <button className="btn-primary">보기</button>
    </div>
  </div>
</div>
```

#### 폼 컴포넌트
```jsx
// 표준 입력 필드
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    라벨 텍스트
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               disabled:bg-gray-50 disabled:text-gray-500"
    placeholder="플레이스홀더 텍스트"
  />
  <p className="mt-1 text-sm text-red-600">에러 메시지</p>
</div>
```

#### 버튼 시스템
```jsx
// 버튼 variants
<button className="btn-primary">   // 주 액션
<button className="btn-secondary"> // 보조 액션  
<button className="btn-danger">    // 위험한 액션
<button className="btn-ghost">     // 최소한의 액션

// 버튼 크기
<button className="btn-sm">        // 작은 버튼
<button className="btn-md">        // 기본 버튼
<button className="btn-lg">        // 큰 버튼

// 상태별 스타일
.btn-primary {
  @apply px-4 py-2 bg-blue-500 text-white rounded-md 
         hover:bg-blue-600 focus:outline-none focus:ring-2 
         focus:ring-blue-500 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### 2. 반응형 디자인 가이드

#### 브레이크포인트
```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px    /* 모바일 (세로) */
md: 768px    /* 태블릿 */
lg: 1024px   /* 작은 데스크톱 */
xl: 1280px   /* 큰 데스크톱 */
2xl: 1536px  /* 초대형 화면 */
```

#### 그리드 시스템
```jsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id} className="col-span-1">
      <ItemCard item={item} />
    </div>
  ))}
</div>

// 반응형 여백
<div className="p-4 md:p-6 lg:p-8">
  <div className="max-w-7xl mx-auto">
    {/* 콘텐츠 */}
  </div>
</div>
```

### 3. 모바일 우선 디자인

#### 터치 최적화
```jsx
// 터치 타겟 크기 (최소 44px)
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  모바일 버튼
</button>

// 스와이프 제스처 고려
<div className="overflow-x-auto">
  <div className="flex space-x-4 pb-4">
    {/* 가로 스크롤 콘텐츠 */}
  </div>
</div>
```

#### 모바일 네비게이션
```jsx
// 하단 탭바 (모바일)
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
  <div className="grid grid-cols-4 h-16">
    <TabItem icon="home" label="홈" active />
    <TabItem icon="search" label="검색" />
    <TabItem icon="plus" label="등록" />
    <TabItem icon="user" label="내정보" />
  </div>
</nav>
```

## 🎨 디자인 시스템 개발

### 1. 신규 고객 관리 UI 디자인

#### 고객 목록 화면
```jsx
// CustomerList 컴포넌트 디자인 명세
const CustomerListDesign = {
  layout: {
    header: "검색바 + 필터 + 정렬 + 뷰 전환 (테이블/카드)",
    content: "고객 카드/테이블 그리드",
    footer: "페이지네이션"
  },
  
  features: {
    search: "실시간 검색, 자동완성",
    filter: "상태, 등록일, 담당자별 필터",
    sort: "이름, 등록일, 최근 연락일 정렬",
    view: "카드뷰/테이블뷰 토글"
  },
  
  responsive: {
    mobile: "카드뷰 우선, 단일 컬럼",
    tablet: "2-3 컬럼 그리드",
    desktop: "4-5 컬럼 그리드 또는 테이블"
  }
};
```

#### 고객 정보 폼
```jsx
// CustomerForm 디자인 명세
const CustomerFormDesign = {
  structure: {
    sections: [
      "기본 정보 (이름, 연락처)",
      "추가 정보 (관심 매물, 예산)",
      "메모 및 특이사항"
    ]
  },
  
  validation: {
    realtime: "입력 중 실시간 검증",
    visual: "성공/에러 상태 시각적 표시",
    messages: "명확하고 도움이 되는 에러 메시지"
  },
  
  interaction: {
    save: "저장 중 로딩 상태",
    autosave: "임시 저장 기능 (선택적)",
    cancel: "변경사항 손실 경고"
  }
};
```

### 2. 페이지네이션 UI 디자인

#### 데스크톱 페이지네이션
```jsx
// 데스크톱용 페이지네이션 디자인
const DesktopPagination = {
  elements: [
    "이전 페이지 버튼",
    "페이지 번호 (1, 2, 3 ... 8, 9, 10)",
    "다음 페이지 버튼",
    "페이지 정보 (총 100개 중 1-20)",
    "페이지 크기 선택 (20, 50, 100)"
  ],
  
  states: {
    current: "강조 색상, 볼드",
    disabled: "회색, 비활성화",
    hover: "배경색 변경"
  }
};
```

#### 모바일 페이지네이션
```jsx
// 모바일용 간소화된 페이지네이션
const MobilePagination = {
  layout: "이전/다음 버튼 + 현재 페이지 정보",
  gestures: "스와이프로 페이지 이동 (선택적)",
  compact: "최소한의 공간 사용",
  touch: "44px 이상 터치 타겟"
};
```

## 📱 모바일 UX 개선

### 1. 터치 인터랙션
```css
/* 터치 피드백 */
.touch-feedback {
  @apply transition-transform active:scale-95;
}

/* 스와이프 가능 영역 표시 */
.swipeable {
  @apply relative;
}
.swipeable::after {
  content: '';
  @apply absolute right-2 top-1/2 transform -translate-y-1/2;
  @apply w-1 h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent;
}
```

### 2. 모바일 전용 기능
```jsx
// 모바일 액션 시트
const MobileActionSheet = () => (
  <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-lg shadow-lg md:hidden">
    <div className="p-4 space-y-2">
      <button className="w-full btn-primary">편집</button>
      <button className="w-full btn-secondary">공유</button>
      <button className="w-full btn-danger">삭제</button>
    </div>
  </div>
);

// 풀업 새로고침
const PullToRefresh = ({ onRefresh }) => (
  <div className="pull-to-refresh">
    <div className="refresh-indicator">
      {/* 당겨서 새로고침 UI */}
    </div>
  </div>
);
```

## ♿ 접근성 가이드

### 1. 키보드 네비게이션
```css
/* 포커스 표시자 */
.focus-visible:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* 스킵 링크 */
.skip-link {
  @apply absolute left-0 top-0 z-50 px-4 py-2 bg-blue-600 text-white
         transform -translate-y-full focus:translate-y-0;
}
```

### 2. 스크린 리더 지원
```jsx
// ARIA 라벨과 역할
<button 
  aria-label="매물 삭제"
  aria-describedby="delete-help"
  onClick={handleDelete}
>
  <TrashIcon />
</button>
<div id="delete-help" className="sr-only">
  이 작업은 되돌릴 수 없습니다
</div>

// 시각적으로 숨겨진 텍스트
<span className="sr-only">현재 페이지: </span>
<span aria-current="page">3</span>
```

### 3. 색상 및 대비
```css
/* 색상 대비 확인 (WCAG AA 기준) */
.text-contrast-aa {
  /* 최소 4.5:1 대비비 */
  color: #374151; /* gray-700 on white */
}

.text-contrast-aaa {
  /* 최소 7:1 대비비 */
  color: #111827; /* gray-900 on white */
}
```

## 📊 디자인 성과 측정

### 1. 사용성 메트릭
```javascript
// 측정 항목
const UsabilityMetrics = {
  taskCompletion: "작업 완료율",
  timeOnTask: "작업 소요 시간",
  errorRate: "사용자 오류율",
  satisfaction: "사용자 만족도",
  learnability: "학습 용이성"
};

// 목표 수치
const TargetMetrics = {
  taskCompletion: "95% 이상",
  timeOnTask: "기존 대비 50% 단축",
  errorRate: "5% 이하",
  satisfaction: "4.5/5.0 이상"
};
```

### 2. 디자인 시스템 일관성
```javascript
// 일관성 체크리스트
const ConsistencyChecklist = {
  colors: "정의된 색상 팔레트만 사용",
  typography: "정의된 폰트 크기/무게만 사용",
  spacing: "8px 배수 간격 시스템 준수",
  components: "재사용 가능한 컴포넌트 사용",
  patterns: "기존 UI 패턴과 일관성"
};
```

## 📚 참고 문서

### 필수 읽기
- [ ] `docs/COMPONENT_USAGE_GUIDE.md` - 컴포넌트 사용법
- [ ] `tailwind.config.js` - 디자인 토큰 설정
- [ ] `src/styles/` - 커스텀 스타일
- [ ] `.ai-team/shared/conventions.md` - 코딩 컨벤션

### 디자인 참고 자료
- [Tailwind UI Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## 🎯 이번 스프린트 목표

### Week 1 (8/3-8/9)
- [ ] 고객 관리 화면 와이어프레임 완성
- [ ] 고객 카드 컴포넌트 디자인
- [ ] 고객 폼 UI 디자인

### Week 2 (8/10-8/17)
- [ ] 페이지네이션 컴포넌트 디자인
- [ ] 모바일 UX 개선 사항 적용
- [ ] 접근성 가이드라인 수립

## 🚨 현재 디자인 이슈

### 긴급 개선 필요
1. **터치 타겟 크기** - 일부 버튼이 44px 미만
2. **색상 대비** - 일부 텍스트의 대비비 부족
3. **포커스 표시** - 키보드 사용자를 위한 포커스 링 개선

### 중장기 개선 계획
1. **다크 모드** - 사용자 선호도에 따른 테마 전환
2. **개인화** - 사용자별 대시보드 커스터마이징
3. **애니메이션** - 마이크로 인터랙션으로 사용자 경험 향상

## 💡 디자인 팁

### 1. TailwindCSS 활용법
```css
/* 커스텀 유틸리티 클래스 */
@layer utilities {
  .btn-base {
    @apply inline-flex items-center justify-center px-4 py-2 
           rounded-md font-medium transition-colors
           focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
}
```

### 2. 디자인 토큰 관리
```javascript
// tailwind.config.js에서 디자인 토큰 정의
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  }
}
```

### 3. 컴포넌트 문서화
```jsx
// 컴포넌트 사용 예시 문서화
/**
 * CustomerCard Component
 * 
 * @param {Object} customer - 고객 정보 객체
 * @param {boolean} compact - 축약 모드 여부
 * @param {Function} onEdit - 편집 버튼 클릭 핸들러
 * 
 * @example
 * <CustomerCard 
 *   customer={customerData}
 *   compact={false}
 *   onEdit={handleEdit}
 * />
 */
```

---

**지원 채널**: `.ai-team/ui-ux/` 디렉토리의 추가 문서들  
**디자인 시스템**: `src/components/common/` 참조  
**Live 확인**: https://gma3561.github.io/the-realty-itemlist-dashboard/  
**다음 체크인**: 매주 목요일 오후 (디자인 리뷰) 