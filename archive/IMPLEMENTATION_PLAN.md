# 더부동산 통합 관리 시스템 구현 계획

## 1. 기존 코드 분석 및 통합 방안

현재 프로젝트(`the-realty-itemlist-dashboard`)는 부동산 매물 관리 대시보드의 기본 기능을 구현한 상태입니다. 새로운 요구사항을 반영하여 시스템을 확장하는 방식으로 진행할 예정입니다.

### 1.1. 현재 구현된 기능
- 기본적인 매물 관리 기능 (등록, 조회, 수정)
- 간단한 대시보드 통계 (매물 수, 거래 완료, 진행 중 등)
- Supabase 기반 인증 시스템
- 반응형 UI (모바일 지원)

### 1.2. 통합 방식
기존 코드베이스를 최대한 활용하면서 확장하는 방식으로 진행:
1. 기존 데이터베이스 스키마 확장
2. 권한 시스템 개선
3. 새로운 기능 추가 (퍼널 분석, 직원 성과 등)
4. UI/UX 업데이트

## 2. 단계별 구현 계획

### 2.1. 1단계: 데이터베이스 스키마 확장 (2주)

#### 2.1.1. 테이블 구조 업데이트
- `users` 테이블 생성 및 `roles` 관계 설정
- `properties` 테이블 확장 (user_id, customer_id 등 추가)
- `property_history` 테이블 생성
- `customers` 및 `customer_interests` 테이블 생성
- `funnel_stages` 및 `funnel_events` 테이블 생성
- `performance_metrics` 및 `performance_goals` 테이블 생성

#### 2.1.2. 데이터 마이그레이션
- 기존 매물 데이터 유지
- 새로운 테이블에 초기 데이터 설정
- 참조 무결성 검증

### 2.2. 2단계: 인증 및 권한 시스템 개선 (1주)

#### 2.2.1. 사용자 관리 시스템
- 관리자 페이지에서 직원 추가 기능
- 이메일 도메인 제한 (`@the-realty.co.kr`)
- 직원 계정 관리 UI

#### 2.2.2. 권한 관리
- 역할 기반 접근 제어 (RBAC)
- 연락처 정보 보호 (관리자/소유자만 접근)
- Row-Level Security 정책 설정

#### 2.2.3. 비밀번호 관리
- 비밀번호 변경 기능
- 보안 정책 적용 (복잡성, 만료 등)

### 2.3. 3단계: UI 구성 및 화면 개발 (3주)

#### 2.3.1. 공통 컴포넌트 및 레이아웃 개선
- 메인 레이아웃 업데이트
- 반응형 디자인 개선
- 테마 및 스타일 시스템

#### 2.3.2. 페이지 개발
- **대시보드**
  - 관리자용 대시보드 확장
  - 직원용 개인 대시보드 추가
  - 데이터 시각화 향상

- **매물 관리**
  - 전체 매물 목록 (연락처 숨김)
  - 개인 매물 목록 (연락처 표시)
  - 매물 등록/수정 폼 개선
  - 상태 변경 히스토리 표시

- **퍼널 분석**
  - 전환율 분석 차트
  - 채널별 효율성 비교
  - 시계열 추이 분석

- **직원 성과**
  - 개인 성과 지표
  - 비교 분석 차트
  - 목표 대비 달성률

- **관리자 설정**
  - 직원 관리 인터페이스
  - 시스템 설정 페이지

### 2.4. 4단계: 기능 구현 (3주)

#### 2.4.1. 코어 기능
- 매물 관리 고급 기능 (상태 변경, 히스토리 추적)
- 고객 정보 관리 (연락처 보호)
- 매물-직원 연결 시스템

#### 2.4.2. 분석 기능
- 퍼널 분석 로직 구현
- 성과 지표 계산 및 집계
- 비교 분석 알고리즘

#### 2.4.3. 데이터 시각화
- 차트 및 그래프 구현
- 인터랙티브 필터링
- 데이터 내보내기 기능

### 2.5. 5단계: 테스트 및 배포 (2주)

#### 2.5.1. 테스트
- 단위 테스트 작성
- 통합 테스트
- 사용자 테스트 (직원 피드백)

#### 2.5.2. 최적화
- 성능 개선
- 코드 리팩토링
- 버그 수정

#### 2.5.3. 배포
- GitHub Pages 배포 설정
- 환경 변수 관리
- 문서화

## 3. 기술 스택 및 라이브러리

### 3.1. 기존 기술 스택 유지
- **프론트엔드**: React, TailwindCSS, React Query
- **백엔드**: Supabase
- **인증**: Supabase Auth
- **데이터베이스**: PostgreSQL (Supabase)
- **빌드 도구**: Vite

### 3.2. 추가 라이브러리
- **상태 관리**: React Context API (기존), Zustand (복잡한 상태용)
- **차트**: Recharts (확장)
- **폼 관리**: Formik, Yup (기존)
- **날짜 처리**: date-fns (기존)
- **아이콘**: Lucide React (기존)
- **테이블**: TanStack Table (새로 추가)
- **모달/다이얼로그**: Headless UI (새로 추가)
- **알림**: React-Toastify (새로 추가)

## 4. 파일 구조 및 아키텍처

현재 프로젝트 구조를 확장하여 다음과 같이 구성:

```
the-realty-itemlist-dashboard/
├── public/                     # 정적 파일
├── src/                        # 소스 코드
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── common/             # 공통 UI 컴포넌트
│   │   ├── dashboard/          # 대시보드 관련 컴포넌트
│   │   ├── property/           # 매물 관련 컴포넌트
│   │   ├── funnel/             # 퍼널 분석 컴포넌트
│   │   ├── performance/        # 성과 관련 컴포넌트
│   │   ├── user/               # 사용자 관리 컴포넌트
│   │   └── layout/             # 레이아웃 컴포넌트
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── admin/              # 관리자 페이지
│   │   ├── employee/           # 직원 전용 페이지
│   │   └── shared/             # 공통 페이지
│   ├── context/                # Context API
│   │   ├── AuthContext.jsx     # 인증 컨텍스트 (기존)
│   │   ├── RoleContext.jsx     # 역할 및 권한 컨텍스트 (새로 추가)
│   │   └── UIContext.jsx       # UI 상태 컨텍스트 (새로 추가)
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useProperties.js    # 매물 관련 훅
│   │   ├── useUsers.js         # 사용자 관련 훅
│   │   ├── useFunnel.js        # 퍼널 분석 훅
│   │   └── usePerformance.js   # 성과 관련 훅
│   ├── services/               # API 및 서비스
│   │   ├── supabase.js         # Supabase 클라이언트 (기존)
│   │   ├── propertyService.js  # 매물 관련 서비스 (기존/확장)
│   │   ├── userService.js      # 사용자 관련 서비스 (새로 추가)
│   │   ├── funnelService.js    # 퍼널 분석 서비스 (새로 추가)
│   │   └── performanceService.js # 성과 관련 서비스 (새로 추가)
│   ├── utils/                  # 유틸리티 함수
│   ├── styles/                 # 스타일 관련 파일
│   ├── constants/              # 상수 정의 (새로 추가)
│   ├── types/                  # 타입 정의 (새로 추가)
│   ├── App.jsx                 # 앱 컴포넌트
│   └── index.jsx               # 진입점
└── docs/                       # 문서
```

## 5. API 설계

### 5.1. Supabase 테이블 API

#### 5.1.1. 사용자 및 권한
- `GET /users`: 모든 사용자 조회 (관리자만)
- `POST /users`: 새 사용자 등록 (관리자만)
- `PUT /users/{id}`: 사용자 정보 업데이트
- `GET /roles`: 역할 목록 조회

#### 5.1.2. 매물 관리
- `GET /properties`: 모든 매물 조회 (기존)
- `GET /properties/user/{userId}`: 특정 사용자의 매물 조회 (새로 추가)
- `POST /properties`: 새 매물 등록 (기존)
- `PUT /properties/{id}`: 매물 정보 업데이트 (기존)
- `GET /property_history/{propertyId}`: 매물 상태 변경 히스토리 조회 (새로 추가)

#### 5.1.3. 고객 관리
- `GET /customers`: 고객 목록 조회 (권한에 따라 필터링)
- `POST /customers`: 새 고객 등록
- `GET /customer_interests/{customerId}`: 고객 관심사 조회

#### 5.1.4. 퍼널 분석
- `GET /funnel_stages`: 퍼널 단계 목록 조회
- `GET /funnel_events/{propertyId}`: 특정 매물의 퍼널 이벤트 조회
- `POST /funnel_events`: 새 퍼널 이벤트 등록

#### 5.1.5. 성과 분석
- `GET /performance_metrics/{userId}`: 특정 사용자의 성과 지표 조회
- `GET /performance_goals`: 성과 목표 조회

### 5.2. 서비스 계층

각 API 엔드포인트에 대응하는 서비스 함수를 구현하여 컴포넌트에서 재사용:

```javascript
// userService.js 예시
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createUser = async (userData) => {
  // 이메일 도메인 검증
  if (!userData.email.endsWith('@the-realty.co.kr')) {
    throw new Error('이메일은 @the-realty.co.kr 도메인만 사용 가능합니다.');
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select();
  
  if (error) throw error;
  return data[0];
};
```

## 6. 권한 관리 및 데이터 보안

### 6.1. 역할 정의
- **관리자(admin)**: 모든 기능과 데이터에 접근 가능
- **직원(employee)**: 제한된 접근 권한, 자신의 매물에만 완전한 접근 가능

### 6.2. RLS(Row-Level Security) 정책
Supabase의 RLS를 활용하여 데이터 접근 제어:

```sql
-- 매물 접근 정책 예시
-- 모든 사용자는 매물 목록을 볼 수 있음
CREATE POLICY "모든 사용자는 매물을 볼 수 있음" ON properties FOR SELECT USING (true);

-- 직원은 자신이 등록한 매물만 수정 가능
CREATE POLICY "직원은 자신의 매물만 수정 가능" ON properties FOR UPDATE
USING (auth.uid() = user_id);

-- 관리자는 모든 매물 수정 가능
CREATE POLICY "관리자는 모든 매물 수정 가능" ON properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role_id = 'admin'
  )
);
```

### 6.3. 연락처 보호 메커니즘
고객 연락처 정보는 기본적으로 숨김 처리되며, 다음 조건에서만 접근 가능:
1. 매물을 등록한 직원 (user_id가 일치)
2. 관리자 권한을 가진 사용자

```javascript
// 연락처 표시 여부 확인 함수 예시
const shouldShowContact = (property, currentUser) => {
  if (!property || !currentUser) return false;
  
  // 관리자이거나 매물 담당자인 경우에만 연락처 표시
  return currentUser.role === 'admin' || property.user_id === currentUser.id;
};
```

## 7. 사용자 인터페이스 구현

### 7.1. 공통 컴포넌트

#### 7.1.1. 레이아웃
- `MainLayout`: 헤더, 사이드바, 메인 콘텐츠 영역
- `AdminLayout`: 관리자 전용 레이아웃
- `EmployeeLayout`: 직원 전용 레이아웃

#### 7.1.2. 인증 및 권한
- `PrivateRoute`: 인증된 사용자만 접근 가능한 라우트
- `RoleRoute`: 특정 역할을 가진 사용자만 접근 가능한 라우트

#### 7.1.3. 데이터 표시
- `DataTable`: 페이지네이션, 정렬, 필터링을 지원하는 테이블
- `StatCard`: 통계 수치를 표시하는 카드
- `ChartContainer`: 차트 컴포넌트 래퍼

### 7.2. 핵심 페이지

#### 7.2.1. 대시보드
- 관리자/직원에 따라 다른 데이터 표시
- 성과 지표 및 요약 정보
- 최근 활동 및 변경 사항

#### 7.2.2. 매물 관리
- 전체 매물 목록 (고객 연락처 숨김)
- 내 매물 목록 (고객 연락처 표시)
- 매물 상세 정보 및 히스토리
- 매물 등록/수정 폼

#### 7.2.3. 퍼널 분석
- 단계별 전환율 차트
- 채널별 성과 비교
- 시간에 따른 추이 분석

#### 7.2.4. 직원 성과
- 개인 성과 지표
- 회사 평균 비교
- 목표 달성 현황

#### 7.2.5. 관리자 설정
- 직원 관리 (추가, 수정, 비활성화)
- 시스템 설정
- 초기 데이터 관리

## 8. 개발 및 배포 프로세스

### 8.1. 개발 환경
- Node.js 및 npm
- Git 버전 관리
- 로컬 개발 서버 (Vite)

### 8.2. 테스트
- 단위 테스트: Vitest
- 컴포넌트 테스트: React Testing Library
- E2E 테스트: Cypress (선택적)

### 8.3. 배포
- GitHub Pages를 통한 정적 사이트 배포
- CI/CD: GitHub Actions (선택적)

### 8.4. 환경 변수 관리
- 개발/프로덕션 환경 구분
- Supabase 키 관리

## 9. 로드맵 및 타임라인

### 9.1. 개발 일정
- **1주차**: 데이터베이스 스키마 설계 및 마이그레이션
- **2-3주차**: 인증 및 권한 시스템 구현
- **4-6주차**: UI 구성 및 핵심 페이지 개발
- **7-9주차**: 기능 구현 및 통합
- **10-11주차**: 테스트 및 버그 수정
- **12주차**: 최종 배포 및 문서화

### 9.2. 우선순위
1. 데이터베이스 스키마 확장
2. 인증 및 권한 시스템
3. 매물 관리 기능 개선
4. 대시보드 및 기본 분석 기능
5. 퍼널 분석 및 성과 관리
6. UI/UX 개선 및 최적화

## 10. 확장 및 미래 계획

### 10.1. 추가 기능
- 계약 관리 시스템
- 문서 자동화 (계약서, 제안서 등)
- 모바일 앱 버전
- 실시간 알림 시스템
- 외부 서비스 연동 (부동산 포털, 마케팅 도구 등)

### 10.2. 성능 최적화
- 대량 데이터 처리 최적화
- 캐싱 전략
- 코드 스플리팅
- 이미지 최적화

### 10.3. 사용자 경험 개선
- 다크 모드 지원
- 접근성 개선
- 국제화 및 지역화 (i18n)