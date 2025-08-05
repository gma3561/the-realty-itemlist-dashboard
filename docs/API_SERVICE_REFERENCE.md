# API Service Layer Reference

부동산 매물 관리 시스템의 API 서비스 계층에 대한 완전한 참조 문서입니다.

## 🏗️ Architecture Overview

### Service Layer Structure
```
services/
├── supabase.js           # Supabase 클라이언트 초기화
├── propertyService.js    # 매물 관리 핵심 서비스  
├── userService.js        # 사용자 관리 서비스
├── fileService.js        # 파일 업로드/관리 서비스
├── shareService.js       # 데이터 공유 서비스
└── googleDriveService.js # Google Drive 통합
```

### Design Principles
- **Permission-based access**: 모든 작업에 사용자 권한 검증
- **Error resilience**: 포괄적인 에러 핸들링
- **Batch operations**: 대용량 데이터 처리 최적화
- **Real-time sync**: Supabase 실시간 업데이트 지원

---

## 📊 Property Service API

### Core Functions

#### `getProperties(filters, user)`
매물 목록을 권한 기반으로 조회합니다.

**Parameters:**
```javascript
filters = {
  property_type_id?: string,    // 매물 종류 필터
  transaction_type_id?: string, // 거래 유형 필터  
  property_status_id?: string,  // 매물 상태 필터
  search?: string              // 검색 키워드
}
user = {
  id: string,
  role: 'admin' | 'user' | 'manager',
  email: string
}
```

**Returns:**
```javascript
{
  data: Property[],
  error: string | null
}
```

**Usage Example:**
```javascript
import { getProperties } from '../services/propertyService';

const fetchData = async () => {
  const { data, error } = await getProperties(
    { property_type_id: 'apt', search: '서울' },
    currentUser
  );
  
  if (error) {
    console.error('조회 실패:', error);
    return;
  }
  
  setProperties(data);
};
```

#### `createProperty(propertyData, user)`
새 매물을 등록합니다.

**Parameters:**
```javascript
propertyData = {
  property_name: string,        // 필수: 매물명
  location: string,            // 필수: 소재지
  property_type_id: string,    // 필수: 매물 종류
  transaction_type_id: string, // 필수: 거래 유형
  property_status_id: string,  // 필수: 진행 상태
  sale_price?: number,         // 매매가 (매매시 필수)
  lease_price?: number,        // 보증금 (전세시 필수)
  rent_price?: number,         // 월세 (월세시 필수)
  description?: string,        // 상세 설명
  images?: string[]           // 이미지 URL 배열
}
```

**Validation Rules:**
- 매매 거래시: `sale_price` 필수 (> 0)
- 전세 거래시: `lease_price` 필수 (> 0)  
- 월세 거래시: `rent_price` 필수 (> 0)

#### `updateProperty(id, updates, user)`
기존 매물을 수정합니다.

**Permission Check:**
- 소유자: 본인이 등록한 매물만 수정 가능
- 관리자: 모든 매물 수정 가능

#### `deleteProperty(id, user)`
매물을 삭제합니다.

**Permission Check:**
- 소유자: 본인이 등록한 매물만 삭제 가능
- 관리자: 모든 매물 삭제 가능

#### `bulkUploadProperties(properties, userId)`
대량 매물 데이터를 일괄 업로드합니다.

**Features:**
- **배치 처리**: 50개씩 나누어 처리
- **검증**: 각 매물 데이터 유효성 검사
- **에러 복구**: 실패한 배치 추적 및 보고
- **성능 최적화**: 배치 간 100ms 대기로 API 제한 방지

**Returns:**
```javascript
{
  success: boolean,
  totalCount: number,
  uploadedCount: number,
  failedCount: number,
  errors: string[]
}
```

---

## 🔒 Authentication Integration

### Supabase Configuration

#### Client Setup
```javascript
// src/services/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    sessionRefreshMargin: 60, // 60초 전 갱신
  },
  global: {
    headers: {
      'X-Client-Info': 'the-realty-dashboard/2.0.0',
    }
  },
  db: {
    schema: 'public'
  }
});
```

#### Environment Detection
```javascript
const IS_DEVELOPMENT = typeof window !== 'undefined' && 
                      window.location.hostname === 'localhost';
```

### Row Level Security (RLS)
모든 데이터베이스 테이블에 RLS 정책이 적용되어 있습니다:

- **properties**: 사용자별 매물 접근 제어
- **user_mappings**: 사용자 권한 매핑
- **lookup tables**: 읽기 전용 공통 데이터

---

## 📋 Lookup Tables Management

### Initialization
시스템 시작시 룩업 테이블을 자동 초기화합니다:

```javascript
export const initializeLookupTables = async () => {
  const propertyTypes = [
    { id: 'apt', name: '아파트', display_order: 1 },
    { id: 'officetel', name: '오피스텔', display_order: 2 },
    // ...
  ];
  
  // UPSERT로 중복 방지
  await supabase.from('property_types')
    .upsert(propertyTypes, { onConflict: 'id' });
};
```

### Data Retrieval
```javascript
export const getLookupTables = async () => {
  const [propertyTypes, transactionTypes, propertyStatuses] = 
    await Promise.all([
      supabase.from('property_types').select('*').order('display_order'),
      supabase.from('transaction_types').select('*').order('display_order'),
      supabase.from('property_statuses').select('*').order('display_order')
    ]);
    
  return { propertyTypes, transactionTypes, propertyStatuses };
};
```

---

## ⚡ Performance Optimizations

### Batch Processing
대용량 데이터 처리를 위한 배치 전략:

```javascript
const BATCH_SIZE = 50;
for (let i = 0; i < properties.length; i += BATCH_SIZE) {
  const batch = properties.slice(i, i + BATCH_SIZE);
  
  // 배치 처리
  await supabase.from('properties').insert(batch);
  
  // API 제한 방지를 위한 대기
  if (i + BATCH_SIZE < properties.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Query Optimization
- **Limit 설정**: 기본 1000개 제한으로 성능 보장
- **인덱스 활용**: created_at 기준 정렬로 인덱스 최적화
- **Select 최소화**: 필요한 필드만 조회

---

## 🛠️ Error Handling Patterns

### Service Layer Error Handling
```javascript
export const getProperties = async (filters = {}, user = null) => {
  try {
    // 서비스 로직
    const { data, error } = await query;
    
    if (error) throw error;
    return { data: data || [], error: null };
    
  } catch (error) {
    console.error('매물 목록 조회 실패:', error);
    return { data: [], error: error.message };
  }
};
```

### Permission Error Handling
```javascript
// 권한 체크
if (user && !hasPropertyPermission(user, property, 'edit')) {
  return { 
    data: null, 
    error: '이 매물을 수정할 권한이 없습니다.' 
  };
}
```

---

## 🧪 Testing Integration

### Service Testing
```javascript
// src/test/propertyService.test.js
import { getProperties, createProperty } from '../services/propertyService';

test('매물 조회 - 성공', async () => {
  const { data, error } = await getProperties({}, mockUser);
  
  expect(error).toBeNull();
  expect(Array.isArray(data)).toBe(true);
});
```

### Mock Data Support
개발 환경에서 Supabase가 없을 경우 더미 데이터로 fallback:

```javascript
if (!supabase) {
  console.warn('Supabase 클라이언트가 초기화되지 않았습니다.');
  return { data: [], error: 'Supabase not initialized' };
}
```

---

## 🔧 Configuration

### Environment Variables
```javascript
// src/config/env.js
export default {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  ADMIN_EMAILS: process.env.VITE_ADMIN_EMAILS || ''
};
```

### Development vs Production
- **Development**: 로깅 활성화, 연결 상태 확인
- **Production**: 민감한 정보 로깅 방지, 성능 최적화

---

## 📚 Best Practices

### 1. Permission Checks
모든 데이터 조작 전에 권한 확인:
```javascript
if (!hasPropertyPermission(user, property, 'delete')) {
  return { error: '권한이 없습니다.' };
}
```

### 2. Data Validation
클라이언트와 서버 양쪽에서 검증:
```javascript
const errors = validatePropertyData(propertyData);
if (errors.length > 0) {
  throw new Error(`검증 실패: ${errors.join(', ')}`);
}
```

### 3. Error Consistency
일관된 에러 응답 형식:
```javascript
return { data: null, error: error.message };
```

### 4. Async/Await Pattern
Promise 체이닝 대신 async/await 사용으로 가독성 향상

---

## 🔗 Related Documentation

- [Authentication System Architecture](./AUTH_SYSTEM_REFERENCE.md)
- [Database Schema Reference](./DATABASE_SCHEMA.md)
- [Component Usage Guide](./COMPONENT_USAGE_GUIDE.md)
- [Development Setup](./GETTING_STARTED.md)