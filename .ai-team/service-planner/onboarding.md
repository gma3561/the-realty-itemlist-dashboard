# 🏗️ Service Planner 온보딩 가이드

## 환영합니다! 👋
팀 매물장 프로젝트의 Service Planner로 오신 것을 환영합니다. 이 가이드를 통해 시스템 아키텍처를 이해하고 서비스 설계에 기여할 수 있습니다.

## 🎯 역할 개요

### 주요 책임
- **시스템 아키텍처** 설계 및 개선
- **API 명세서** 작성 및 관리
- **데이터 모델링** 및 스키마 설계
- **서비스 통합** 전략 수립
- **성능 및 확장성** 계획

### 현재 진행 중인 주요 작업
1. Google Drive API 통합 설계 (우선순위 1)
2. 페이지네이션 아키텍처 설계 (우선순위 2)
3. 마이크로서비스 전환 계획 수립

## 🏗️ 현재 시스템 아키텍처

### 전체 구조 개요
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Tier                              │
├─────────────────────────────────────────────────────────────┤
│  React SPA (Vite)                                          │
│  ├── Components (UI Layer)                                 │
│  ├── Services (API Layer)                                  │
│  ├── Context (State Management)                            │
│  └── Hooks (Business Logic)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTPS/REST
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Backend-as-a-Service                        │
├─────────────────────────────────────────────────────────────┤
│  Supabase                                                   │
│  ├── Auth (Google OAuth 2.0)                              │
│  ├── Database (PostgreSQL + RLS)                          │
│  ├── Storage (File Management)                            │
│  ├── Realtime (WebSocket)                                 │
│  └── Edge Functions (Serverless)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                         External APIs
                              │
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
├─────────────────────────────────────────────────────────────┤
│  ├── Google Drive API (계획 중)                            │
│  ├── 공공데이터포털 API (부동산 데이터)                      │
│  └── Google Maps API (향후 계획)                           │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 아키텍처
```sql
-- 핵심 도메인 모델
Properties (매물)
├── Basic Info (기본 정보)
├── Location (위치 정보)
├── Financial (금융 정보)
├── Physical (물리적 특성)
└── Management (관리 정보)

Users (사용자)
├── Profile (프로필)
├── Permissions (권한)
└── Activity (활동 이력)

Customers (고객) -- 개발 중
├── Contact Info (연락처)
├── Preferences (선호도)
└── History (상담 이력)

-- 지원 테이블
Lookup Tables
├── property_types
├── transaction_types
├── property_status
└── regions

Media & Files
├── property_images
├── property_documents
└── shared_files
```

## 📋 현재 서비스 현황

### ✅ 완료된 서비스

#### 1. 인증 서비스
```javascript
// 구현 완료된 기능
- Google OAuth 2.0 통합
- JWT 토큰 관리
- 세션 유지 (8시간)
- 권한 기반 접근 제어
- QA 바이패스 시스템

// 아키텍처 특징
- Stateless 인증
- Frontend에서 권한 체크
- Supabase Auth 활용
```

#### 2. 매물 관리 서비스
```javascript
// API 엔드포인트 (REST-like)
GET    /properties           # 목록 조회
GET    /properties/:id       # 상세 조회  
POST   /properties           # 등록
PUT    /properties/:id       # 수정
DELETE /properties/:id       # 삭제

// 비즈니스 로직
- CRUD 작업 완료
- 이미지 업로드/관리
- 검색 및 필터링
- 상태 관리 워크플로우
- 권한 기반 접근 제어
```

#### 3. 파일 관리 서비스
```javascript
// Supabase Storage 활용
- 이미지 업로드/다운로드
- 썸네일 자동 생성
- 파일 메타데이터 관리
- 권한 기반 접근 제어

// 스토리지 구조
/property-images/
├── originals/
├── thumbnails/
└── shared/
```

### 🔄 진행 중인 서비스 설계

#### 1. Google Drive 통합 (우선순위 1)
```javascript
// 설계 목표
- 매물 이미지 자동 백업
- 팀 공유 폴더 생성
- 오프라인 동기화
- 버전 관리

// API 설계 (계획)
class GoogleDriveIntegration {
  // 초기화
  async initialize(credentials)
  
  // 폴더 관리
  async createPropertyFolder(propertyId)
  async shareFolder(folderId, permissions)
  
  // 파일 동기화
  async uploadToBackup(files)
  async syncFromDrive()
  
  // 권한 관리
  async setFolderPermissions(folderId, users)
}
```

#### 2. 페이지네이션 서비스 (우선순위 2)
```javascript
// 아키텍처 설계
interface PaginationService {
  // 서버 사이드 페이지네이션
  async getPaginatedData(
    table: string,
    page: number,
    limit: number,
    filters?: object,
    sort?: SortConfig
  ): Promise<PaginatedResponse>
  
  // 무한 스크롤 지원
  async getInfiniteData(
    cursor: string,
    limit: number
  ): Promise<CursorResponse>
}

// 성능 최적화
- 데이터베이스 인덱싱
- 쿼리 최적화
- 캐싱 전략
- 프리로딩
```

## 🛠️ 시스템 설계 가이드

### 1. API 설계 원칙

#### RESTful 설계
```javascript
// URL 패턴
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}

// HTTP 메서드 매핑
GET    - 조회 (Safe, Idempotent)
POST   - 생성 (Non-idempotent)
PUT    - 전체 수정 (Idempotent)
PATCH  - 부분 수정 (Non-idempotent)
DELETE - 삭제 (Idempotent)

// 응답 형식 표준화
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  },
  "meta": {
    "timestamp": string,
    "version": string
  }
}
```

#### 에러 처리 설계
```javascript
// 에러 응답 구조
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다",
    "details": [
      {
        "field": "email",
        "message": "올바른 이메일 형식이 아닙니다"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-03T...",
    "requestId": "uuid"
  }
}

// HTTP 상태 코드 가이드
200 OK           - 성공
201 Created      - 생성 성공
400 Bad Request  - 클라이언트 오류
401 Unauthorized - 인증 필요
403 Forbidden    - 권한 없음
404 Not Found    - 리소스 없음
422 Unprocessable Entity - 유효성 검사 실패
500 Internal Server Error - 서버 오류
```

### 2. 데이터베이스 설계

#### 스키마 설계 원칙
```sql
-- 명명 규칙
테이블명: 소문자, 복수형 (properties, users)
컬럼명: snake_case (created_at, property_type_id)
인덱스명: idx_{table}_{column(s)}
외래키명: fk_{table}_{referenced_table}

-- 공통 필드
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
updated_by UUID REFERENCES users(id)

-- 소프트 삭제
deleted_at TIMESTAMPTZ NULL
is_deleted BOOLEAN DEFAULT FALSE
```

#### 성능 최적화
```sql
-- 인덱스 전략
-- 1. 자주 조회되는 컬럼
CREATE INDEX idx_properties_status ON properties(property_status_id);
CREATE INDEX idx_properties_manager ON properties(manager_id);

-- 2. 복합 인덱스 (조건 순서 중요)
CREATE INDEX idx_properties_status_created 
ON properties(property_status_id, created_at DESC);

-- 3. 부분 인덱스
CREATE INDEX idx_properties_active 
ON properties(created_at) WHERE deleted_at IS NULL;

-- 쿼리 최적화
-- 1. JOIN 최소화
-- 2. 필요한 컬럼만 SELECT
-- 3. WHERE 절 인덱스 활용
-- 4. LIMIT 사용으로 대량 데이터 제한
```

### 3. 보안 아키텍처

#### Row Level Security (RLS)
```sql
-- 현재 정책 (간소화 예정)
CREATE POLICY "로그인 사용자 접근" ON properties
FOR ALL USING (auth.uid() IS NOT NULL);

-- 향후 세밀한 정책 (계획)
CREATE POLICY "담당자 수정 권한" ON properties
FOR UPDATE USING (
  auth.uid()::text = manager_id OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

#### API 보안
```javascript
// 인증 미들웨어
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization;
  
  try {
    const { data: user } = await supabase.auth.getUser(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// 권한 체크
const requireAdmin = (req, res, next) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

## 🔄 서비스 통합 설계

### 1. Google Drive API 통합

#### 아키텍처 설계
```javascript
// 서비스 레이어 구조
class GoogleDriveService {
  constructor(credentials) {
    this.drive = google.drive({ version: 'v3', auth: credentials });
  }
  
  // 폴더 관리
  async createPropertyFolder(propertyId, propertyName) {
    const folderMetadata = {
      name: `[${propertyId}] ${propertyName}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PROPERTIES_FOLDER_ID]
    };
    
    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });
    
    return folder.data.id;
  }
  
  // 파일 동기화
  async syncPropertyImages(propertyId, localImages) {
    const folderId = await this.getPropertyFolderId(propertyId);
    
    for (const image of localImages) {
      await this.uploadFile(folderId, image);
    }
  }
}
```

#### 데이터 플로우
```
1. 매물 등록/수정 시
   ├── Local Storage 저장
   ├── Supabase Storage 업로드
   └── Google Drive 백업 (비동기)

2. 이미지 조회 시
   ├── Local Cache 확인
   ├── Supabase Storage 조회
   └── Google Drive 폴백 (옵션)

3. 공유 링크 생성 시
   ├── Google Drive 공유 설정
   ├── 권한 설정 (읽기 전용)
   └── 공유 링크 반환
```

### 2. 실시간 동기화 설계

#### WebSocket 활용
```javascript
// Supabase Realtime 구독
const subscribeToProperties = () => {
  return supabase
    .channel('properties')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'properties' },
      (payload) => {
        handlePropertyChange(payload);
      }
    )
    .subscribe();
};

// 실시간 업데이트 처리
const handlePropertyChange = (payload) => {
  switch (payload.eventType) {
    case 'INSERT':
      addPropertyToList(payload.new);
      break;
    case 'UPDATE':
      updatePropertyInList(payload.new);
      break;
    case 'DELETE':
      removePropertyFromList(payload.old.id);
      break;
  }
};
```

## 📊 성능 및 확장성

### 1. 캐싱 전략
```javascript
// 다층 캐싱 구조
Client Cache (React Query)
├── 메모리 캐싱 (5분)
├── 로컬 스토리지 (1시간)
└── 무효화 정책

Server Cache (Supabase)
├── 쿼리 결과 캐싱
├── 연결 풀링
└── 인덱스 캐싱

CDN Cache (GitHub Pages)
├── 정적 파일 캐싱
├── 이미지 캐싱
└── 글로벌 분산
```

### 2. 부하 분산 계획
```javascript
// 마이크로서비스 전환 계획 (장기)
┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │ Property Service│
└─────────────────┘    └─────────────────┘
         │                       │
    ┌─────────────────────────────────────┐
    │        API Gateway                  │
    └─────────────────────────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│Customer Service │    │  File Service   │
└─────────────────┘    └─────────────────┘
```

### 3. 모니터링 및 관찰성
```javascript
// 메트릭 수집
const performanceMetrics = {
  // API 성능
  responseTime: 'API 응답 시간',
  throughput: '초당 요청 수',
  errorRate: '에러율',
  
  // 사용자 경험
  pageLoadTime: '페이지 로딩 시간',
  interactionTime: '사용자 상호작용 시간',
  
  // 시스템 리소스
  memoryUsage: '메모리 사용률',
  cpuUsage: 'CPU 사용률',
  storageUsage: '스토리지 사용률'
};

// 알림 규칙
const alertRules = {
  responseTime: '> 2초',
  errorRate: '> 5%',
  systemDown: '3회 연속 실패'
};
```

## 📚 참고 문서

### 필수 읽기
- [ ] `docs/API_SERVICE_REFERENCE.md` - 현재 API 명세
- [ ] `docs/DATABASE_SCHEMA_REFERENCE.md` - DB 스키마
- [ ] `docs/AUTH_SYSTEM_REFERENCE.md` - 인증 시스템
- [ ] `간단한_해결책.md` - 현재 아키텍처 이슈

### 외부 문서
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

## 🎯 이번 스프린트 목표

### Week 1 (8/3-8/9)
- [ ] Google Drive API 통합 설계 완성
- [ ] 페이지네이션 아키텍처 설계
- [ ] API 명세서 업데이트

### Week 2 (8/10-8/17)
- [ ] 성능 최적화 계획 수립
- [ ] 마이크로서비스 전환 로드맵
- [ ] 모니터링 시스템 설계

## 🚨 현재 아키텍처 이슈

### 긴급 해결 필요
1. **RLS 정책 복잡성** - 간소화 필요
2. **페이지네이션 부재** - 성능 이슈 야기
3. **API 표준화 부족** - 일관성 있는 응답 형식 필요

### 중장기 개선 계획
1. **마이크로서비스 전환** - 서비스별 독립 배포
2. **GraphQL 도입** - 유연한 데이터 페칭
3. **Event-Driven Architecture** - 느슨한 결합

## 💡 아키텍처 팁

### 1. 설계 원칙
```javascript
// SOLID 원칙 적용
Single Responsibility: 하나의 책임만
Open/Closed: 확장에 열려있고 수정에 닫힘
Liskov Substitution: 서브타입은 기본 타입으로 교체 가능
Interface Segregation: 인터페이스 분리
Dependency Inversion: 추상화에 의존
```

### 2. 설계 패턴
```javascript
// 자주 사용하는 패턴
Repository Pattern: 데이터 접근 추상화
Service Layer Pattern: 비즈니스 로직 분리
Factory Pattern: 객체 생성 추상화
Observer Pattern: 이벤트 기반 통신
```

### 3. 성능 고려사항
```javascript
// 최적화 체크리스트
- [ ] N+1 쿼리 방지
- [ ] 적절한 인덱싱
- [ ] 캐싱 전략
- [ ] 페이지네이션
- [ ] 지연 로딩
- [ ] 압축 및 최적화
```

---

**지원 채널**: `.ai-team/service-planner/` 디렉토리의 추가 문서들  
**아키텍처 다이어그램**: `docs/` 디렉토리 참조  
**API 문서**: `docs/API_SERVICE_REFERENCE.md`  
**다음 체크인**: 매주 화요일 오후 (아키텍처 리뷰) 