# 🖥️ Backend Developer 온보딩 가이드

## 환영합니다! 👋
팀 매물장 프로젝트의 Backend Developer로 오신 것을 환영합니다. 이 가이드를 통해 백엔드 시스템을 빠르게 이해하고 기여할 수 있습니다.

## 🎯 역할 개요

### 주요 책임
- **Supabase 데이터베이스** 스키마 관리 및 최적화
- **API 서비스** 개발 및 유지보수
- **Row Level Security (RLS)** 정책 관리
- **성능 최적화** (쿼리 튜닝, 인덱싱)
- **외부 API 통합** (Google Drive, 공공데이터)

### 현재 진행 중인 주요 작업
1. 고객 관리 API 완성 (우선순위 1)
2. Google Drive API 통합 (우선순위 2)
3. 성능 최적화 및 스키마 개선

## 🏗️ 아키텍처 개요

### 백엔드 스택
```
Supabase (Backend-as-a-Service)
├── PostgreSQL Database
├── Authentication (Google OAuth)
├── Row Level Security (RLS)
├── Storage (파일 관리)
├── Realtime (실시간 구독)
└── Edge Functions (서버리스)
```

### 데이터베이스 구조
```sql
-- 주요 테이블들
properties          # 매물 정보
├── property_types   # 매물 유형 (룩업)
├── transaction_types # 거래 유형 (룩업)
└── property_status  # 매물 상태 (룩업)

users               # 사용자 정보
├── user_roles      # 사용자 역할
└── user_profiles   # 프로필 정보

customers           # 고객 정보 (개발 중)
├── customer_interests # 고객 관심 매물
└── customer_history   # 고객 이력

property_images     # 매물 이미지
property_comments   # 매물 코멘트
manager_history     # 담당자 변경 이력
```

## 🔧 개발 환경 설정

### 1. Supabase 프로젝트 접근
```bash
# 환경변수 확인
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Supabase CLI 설치 (옵션)
npm install -g supabase
supabase login
```

### 2. 데이터베이스 연결 테스트
```javascript
// test-connection.js 실행
node test-connection.js

// 또는 서비스에서 직접 테스트
import { supabase } from './src/services/supabase.js';
const { data, error } = await supabase.from('properties').select('count');
```

### 3. 주요 서비스 파일 위치
```
src/services/
├── supabase.js           # Supabase 클라이언트 설정
├── propertyService.js    # 매물 관련 API (409줄)
├── userService.js        # 사용자 관련 API (186줄)
├── customerService.js    # 고객 관련 API (181줄)
├── imageUploadService.js # 이미지 업로드 API
├── adminService.js       # 관리자 기능 API
└── commentService.js     # 코멘트 API
```

## 📋 현재 작업 상황

### ✅ 완료된 API
- **매물 관리**: CRUD, 검색, 필터링, 상태 관리
- **사용자 관리**: 인증, 프로필, 권한 관리
- **이미지 관리**: 업로드, 썸네일, 갤러리
- **대시보드**: 통계, 성과 분석

### 🔄 진행 중인 작업

#### 1. 고객 관리 API 완성 (우선순위 1)
```javascript
// src/services/customerService.js
// 현재 상태: 80% 완료

// 남은 작업:
- [ ] 고객 중복 체크 API (전화번호 기반)
- [ ] 고객 이력 관리 API 
- [ ] 매물-고객 관심 연결 API
- [ ] 퍼널 이벤트 추적 API
```

#### 2. 스키마 불일치 수정 (긴급)
```sql
-- PO_분석_상태_점검.md에서 확인된 이슈
-- manager_history 테이블 필드 매핑 문제

-- 현재 컴포넌트에서 사용하는 필드명:
assigned_at, manager_id, assigned_by, history.changed_at

-- 실제 테이블 필드명:
changed_at, previous_manager_id, new_manager_id, changed_by

-- 수정 필요: ManagerAssignment.jsx의 쿼리 부분
```

### 🚧 기술 부채

#### 1. RLS 정책 간소화 (높은 우선순위)
```sql
-- 현재: 복잡한 UUID 매핑으로 인한 문제
-- 해결책: 간단한 auth.uid() 기반 정책

-- 추천 정책 (간단한_해결책.md 참조):
CREATE POLICY "로그인 사용자 전체 권한" ON properties
FOR ALL USING (auth.uid() IS NOT NULL);
```

#### 2. 콘솔 로그 정리
```javascript
// 현재: 257개의 console.log/error 존재
// 우선 정리 대상:
- propertyService.js: 10개 console.error
- customerService.js: 8개 console.error  
- imageUploadService.js: 8개 console.error

// 보안 친화적 에러 처리로 교체 필요
```

## 🛠️ 주요 작업 가이드

### 1. 새 API 엔드포인트 추가

#### 기본 패턴
```javascript
// customerService.js 예시
export const customerService = {
  async createCustomer(customerData) {
    try {
      // 1. 데이터 검증
      const validationErrors = validateCustomerData(customerData);
      if (validationErrors.length > 0) {
        throw new Error(`데이터 검증 실패: ${validationErrors.join(', ')}`);
      }

      // 2. 중복 체크 (필요한 경우)
      const existingCustomer = await this.getCustomerByPhone(customerData.phone);
      if (existingCustomer) {
        throw new Error('이미 등록된 전화번호입니다');
      }

      // 3. 데이터 삽입
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('고객 생성 실패:', error);
      return handleError(error, { action: 'createCustomer' });
    }
  }
};
```

### 2. RLS 정책 업데이트

#### 현재 정책 확인
```sql
-- Supabase 대시보드에서 확인
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

#### 간단한 정책 적용
```sql
-- 기존 복잡한 정책 제거
DROP POLICY IF EXISTS "기존정책명" ON properties;

-- 새로운 간단한 정책 적용
CREATE POLICY "로그인 사용자 전체 권한" ON properties
FOR ALL USING (auth.uid() IS NOT NULL);
```

### 3. 성능 최적화

#### 데이터베이스 인덱스 추가
```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_properties_manager_id 
ON properties(manager_id);

CREATE INDEX IF NOT EXISTS idx_properties_status 
ON properties(property_status_id);

CREATE INDEX IF NOT EXISTS idx_properties_created_at 
ON properties(created_at DESC);
```

#### 쿼리 최적화
```javascript
// 페이지네이션 구현
async getPropertiesWithPagination(page = 1, limit = 20, filters = {}) {
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_types(name),
      transaction_types(name),
      property_status(name)
    `)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  // 필터 적용
  if (filters.status) {
    query = query.eq('property_status_id', filters.status);
  }

  const { data, error, count } = await query;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
}
```

## 🔍 디버깅 및 모니터링

### 1. Supabase 대시보드 활용
```
Supabase Dashboard > Logs
├── API Logs (요청/응답 확인)
├── Database Logs (쿼리 성능)
├── Auth Logs (인증 이슈)
└── Storage Logs (파일 업로드)
```

### 2. 로컬 디버깅
```javascript
// 개발 환경에서만 디버그 로그
if (import.meta.env.DEV) {
  console.log('디버그:', { query, filters, result });
}

// 에러 로깅
import { secureLogger } from '../utils/errorHandler';
secureLogger.error('API 에러', error, { action: 'getProperties' });
```

### 3. 성능 모니터링
```javascript
// API 응답 시간 측정
const startTime = performance.now();
const result = await supabase.from('properties').select();
const duration = performance.now() - startTime;

if (duration > 1000) {
  console.warn(`느린 쿼리 감지: ${duration}ms`);
}
```

## 📚 참고 문서

### 필수 읽기
- [ ] `docs/DATABASE_SCHEMA_REFERENCE.md` - 전체 스키마 구조
- [ ] `docs/API_SERVICE_REFERENCE.md` - API 명세서
- [ ] `간단한_해결책.md` - 현재 해결 방법
- [ ] `PO_분석_상태_점검.md` - 수정 필요 사항

### Supabase 공식 문서
- [PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API](https://supabase.com/docs/reference/javascript/storage-api)

## 🎯 이번 스프린트 목표

### Week 1 (8/3-8/9)
- [ ] 고객 중복 체크 API 구현
- [ ] 고객 이력 관리 API 완성
- [ ] manager_history 필드 매핑 수정

### Week 2 (8/10-8/17)  
- [ ] 데이터베이스 인덱싱 최적화
- [ ] Google Drive API 통합 시작
- [ ] RLS 정책 간소화

## 🚨 현재 알려진 이슈

### 긴급 (즉시 수정 필요)
1. **manager_history 필드 불일치** - ManagerAssignment.jsx 수정
2. **Storage 버킷 확인** - 'property-images' 버킷 생성 여부

### 중요 (이번 주 해결)
1. **콘솔 로그 정리** - 보안 친화적 에러 처리로 교체
2. **RLS 정책 간소화** - 복잡한 UUID 매핑 문제 해결

## 💡 개발 팁

### 1. Supabase SQL 에디터 활용
```sql
-- 실시간 데이터 확인
SELECT COUNT(*) FROM properties WHERE created_at > NOW() - INTERVAL '24 hours';

-- 성능 확인  
EXPLAIN ANALYZE SELECT * FROM properties WHERE manager_id = 'uuid';
```

### 2. 에러 처리 패턴
```javascript
// 표준 에러 처리
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error('작업 실패'); // 구체적 정보 숨김
  return { success: false, message: '요청 처리 중 오류가 발생했습니다.' };
}
```

### 3. 코드 품질 유지
```javascript
// JSDoc 주석 활용
/**
 * 매물 목록 조회
 * @param {Object} filters - 필터 조건
 * @param {number} page - 페이지 번호  
 * @param {number} limit - 페이지당 항목 수
 * @returns {Promise<Object>} 매물 목록과 페이지네이션 정보
 */
async getProperties(filters = {}, page = 1, limit = 20) {
  // 구현
}
```

---

**지원 채널**: `.ai-team/backend/` 디렉토리의 추가 문서들  
**긴급 연락**: GitHub Issues 또는 AI Team Workspace  
**다음 체크인**: 매주 수요일 오후 