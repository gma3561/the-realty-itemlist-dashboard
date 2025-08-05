# Database Schema Reference

부동산 매물 관리 시스템의 Supabase 데이터베이스 스키마에 대한 완전한 참조 문서입니다.

## 🏗️ Database Architecture

### Technology Stack
- **Database**: PostgreSQL 15+ (Supabase)
- **Authentication**: Supabase Auth (Google OAuth)
- **Real-time**: Supabase Realtime Subscriptions
- **Security**: Row Level Security (RLS)
- **Extensions**: uuid-ossp

### Schema Overview
```
┌─────────────────────────────────────┐
│            Core Tables              │
├─────────────────────────────────────┤
│  users           # 사용자 관리       │
│  properties      # 매물 정보         │
│  owners          # 소유주 정보       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│          Lookup Tables              │
├─────────────────────────────────────┤
│  property_types     # 매물 종류     │
│  property_statuses  # 매물 상태     │
│  transaction_types  # 거래 유형     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Relation Tables             │
├─────────────────────────────────────┤
│  co_brokers         # 공동중개      │
│  manager_history    # 담당자 이력   │
│  property_media     # 매물 미디어   │
│  statistics         # 통계 데이터   │
│  user_login_history # 로그인 이력   │
└─────────────────────────────────────┘
```

---

## 👤 User Management Tables

### users
사용자 계정 정보를 관리합니다.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL CHECK (email LIKE '%@the-realty.co.kr'),
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);
```

**Key Features:**
- Supabase Auth 연동 (`auth.users` 테이블 참조)
- 이메일 도메인 제한 (`@the-realty.co.kr`)
- 역할 기반 접근 제어 (admin/user)
- Google OAuth 연동 지원

**Business Rules:**
- 모든 사용자는 회사 이메일 필수
- 기본 역할은 'user'
- 관리자는 환경변수로 지정

### user_login_history
사용자 로그인 이력을 추적합니다.

```sql
CREATE TABLE public.user_login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);
```

**Usage:**
- 보안 감사
- 사용자 활동 분석
- 이상 로그인 탐지

---

## 🏠 Core Property Tables

### properties
매물 정보의 핵심 테이블입니다.

```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
  
  -- 광고 관리
  ad_status TEXT DEFAULT 'inactive' CHECK (ad_status IN ('active', 'inactive', 'pending')),
  ad_period DATERANGE,
  
  -- 매물 기본 정보
  temp_property_number TEXT,
  registered_number TEXT,
  registration_date DATE,
  property_status_id UUID REFERENCES public.property_statuses(id) ON DELETE SET NULL,
  transaction_completed_date DATE,
  
  -- 위치 정보
  location TEXT NOT NULL,
  property_name TEXT NOT NULL,
  building TEXT,
  unit TEXT,
  
  -- 매물 분류
  property_type_id UUID REFERENCES public.property_types(id) ON DELETE SET NULL,
  is_commercial BOOLEAN DEFAULT FALSE,
  transaction_type_id UUID REFERENCES public.transaction_types(id) ON DELETE SET NULL,
  
  -- 가격 정보
  price NUMERIC,                    -- 매매가 또는 월세
  lease_price NUMERIC,              -- 전세 보증금 또는 월세 보증금
  
  -- 면적 정보
  supply_area_sqm NUMERIC,          -- 공급면적 (㎡)
  private_area_sqm NUMERIC,         -- 전용면적 (㎡)
  supply_area_pyeong NUMERIC,       -- 공급면적 (평)
  private_area_pyeong NUMERIC,      -- 전용면적 (평)
  
  -- 매물 상세
  floor_info TEXT,                  -- 층 정보
  rooms_bathrooms TEXT,             -- 방/욕실 수
  direction TEXT,                   -- 방향
  maintenance_fee TEXT,             -- 관리비
  parking TEXT,                     -- 주차
  move_in_date TEXT,                -- 입주가능일
  approval_date TEXT,               -- 사용승인일
  
  -- 메모 및 특이사항
  special_notes TEXT,               -- 특이사항
  manager_memo TEXT,                -- 담당자 메모
  resident TEXT,                    -- 고객정보 (JSON)
  
  -- 임대 정보
  lease_type TEXT,
  contract_period DATERANGE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key Features:**
- UUID 기본키로 보안 강화
- 외래키 제약으로 데이터 무결성 보장
- 가격 정보 분리 (매매/전세/월세 대응)
- JSON 형태 고객정보 저장
- 자동 타임스탬프 관리

**Price Structure:**
```javascript
// 가격 필드 사용 패턴
{
  // 매매
  sale: { price: 250000000 },
  
  // 전세  
  lease: { lease_price: 200000000 },
  
  // 월세
  rent: { lease_price: 50000000, price: 500000 },
  
  // 단기임대
  short: { price: 150000 } // 일일요금
}
```

**Customer Info JSON Structure:**
```javascript
// resident 필드 JSON 구조
{
  "name": "홍길동",
  "phone": "010-1234-5678", 
  "email": "customer@example.com",
  "address": "서울시 강남구...",
  "notes": "고객 요청사항"
}
```

### owners
매물 소유주 정보를 관리합니다.

```sql
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  id_number TEXT,                   -- 주민등록번호 (암호화 저장)
  phone TEXT,
  contact_relation TEXT,            -- 연락처 관계
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Security Notes:**
- 개인정보는 암호화 저장 권장
- RLS 정책으로 접근 제한
- GDPR/개인정보보호법 준수

---

## 📋 Lookup Tables

### property_types
매물 종류 코드 테이블입니다.

```sql
CREATE TABLE public.property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Default Values:**
```sql
INSERT INTO property_types (id, name, display_order) VALUES
  ('apt', '아파트', 1),
  ('officetel', '오피스텔', 2), 
  ('villa', '빌라/연립', 3),
  ('house', '단독주택', 4),
  ('commercial', '상가', 5);
```

### property_statuses
매물 진행 상태 코드 테이블입니다.

```sql
CREATE TABLE public.property_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Default Values:**
```sql
INSERT INTO property_statuses (id, name, display_order) VALUES
  ('available', '거래가능', 1),
  ('completed', '거래완료', 2),
  ('hold', '거래보류', 3),
  ('cancelled', '거래철회', 4),
  ('inspection_available', '임장가능', 5);
```

### transaction_types
거래 유형 코드 테이블입니다.

```sql
CREATE TABLE public.transaction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Default Values:**
```sql
INSERT INTO transaction_types (id, name, display_order) VALUES
  ('presale', '분양', 1),
  ('developer', '시행사매물', 2),
  ('sale', '매매', 3),
  ('lease', '전세', 4),
  ('rent', '월세/렌트', 5),
  ('short', '단기', 6);
```

---

## 🔗 Relation Tables

### co_brokers
공동중개사 정보를 관리합니다.

```sql
CREATE TABLE public.co_brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  broker_name TEXT NOT NULL,
  broker_contact TEXT,
  share_percentage NUMERIC,         -- 수수료 분배 비율
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### manager_history
담당자 변경 이력을 추적합니다.

```sql
CREATE TABLE public.manager_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  previous_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  new_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### property_media
매물 이미지 및 동영상을 관리합니다.

```sql
CREATE TABLE public.property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Integration:**
- Google Drive 연동 지원
- Supabase Storage 호환
- CDN 최적화 URL 지원

### statistics
사용자별 성과 통계를 관리합니다.

```sql
CREATE TABLE public.statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  registered_properties INTEGER DEFAULT 0,
  completed_transactions INTEGER DEFAULT 0,
  period DATERANGE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 🔍 Database Indexes

### Performance Optimization
```sql
-- 매물 검색 최적화
CREATE INDEX idx_properties_manager_id ON properties(manager_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_property_type_id ON properties(property_type_id);
CREATE INDEX idx_properties_property_status_id ON properties(property_status_id);
CREATE INDEX idx_properties_transaction_type_id ON properties(transaction_type_id);
CREATE INDEX idx_properties_location ON properties(location);

-- 날짜 기반 검색
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_updated_at ON properties(updated_at);

-- 복합 인덱스
CREATE INDEX idx_properties_status_type ON properties(property_status_id, transaction_type_id);
CREATE INDEX idx_properties_manager_status ON properties(manager_id, property_status_id);
```

### Query Performance
- **Single Property**: ~1ms (Primary Key)
- **Manager Properties**: ~10ms (Indexed)
- **Filtered Search**: ~50ms (Composite Index)
- **Full Text Search**: ~100ms (Location LIKE)

---

## 🛡️ Row Level Security (RLS)

### Security Policies

#### Properties Table
```sql
-- 매물 조회 정책
CREATE POLICY "사용자는 본인 매물만 조회 가능" 
ON properties FOR SELECT 
USING (
  auth.uid()::text = manager_id OR 
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- 매물 삽입 정책
CREATE POLICY "사용자는 본인 매물만 등록 가능"
ON properties FOR INSERT
WITH CHECK (auth.uid()::text = manager_id);

-- 매물 수정 정책  
CREATE POLICY "사용자는 본인 매물만 수정 가능"
ON properties FOR UPDATE
USING (
  auth.uid()::text = manager_id OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- 매물 삭제 정책
CREATE POLICY "사용자는 본인 매물만 삭제 가능"
ON properties FOR DELETE
USING (
  auth.uid()::text = manager_id OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
```

#### Lookup Tables
```sql
-- 룩업 테이블은 모든 인증 사용자 읽기 가능
CREATE POLICY "인증된 사용자만 접근 가능" 
ON property_types FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "인증된 사용자만 접근 가능"
ON property_statuses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "인증된 사용자만 접근 가능"
ON transaction_types FOR SELECT
TO authenticated
USING (true);
```

#### Users Table
```sql
-- 사용자는 본인 정보만 조회/수정 가능
CREATE POLICY "사용자 본인 정보만 접근"
ON users FOR ALL
USING (auth.uid() = id);

-- 관리자는 모든 사용자 정보 접근 가능
CREATE POLICY "관리자 전체 접근"
ON users FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
```

---

## 📊 Database Triggers

### Automatic Timestamps
```sql
-- properties 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_properties_timestamp
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Manager Change Tracking
```sql
-- 담당자 변경 시 이력 자동 생성
CREATE OR REPLACE FUNCTION track_manager_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    INSERT INTO manager_history (
      property_id,
      previous_manager_id,
      new_manager_id,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.manager_id,
      NEW.manager_id,
      auth.uid(),
      '시스템 자동 기록'
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_manager_change
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION track_manager_change();
```

---

## 🔄 Real-time Subscriptions

### Supabase Realtime Setup
```javascript
// 매물 변경사항 실시간 구독
const subscription = supabase
  .channel('properties-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'properties'
    },
    (payload) => {
      // 실시간 UI 업데이트
      queryClient.invalidateQueries(['properties']);
    }
  )
  .subscribe();
```

### Real-time Use Cases
- 매물 등록/수정 즉시 반영
- 다중 사용자 동시 작업 지원
- 상태 변경 실시간 알림
- 대시보드 통계 실시간 업데이트

---

## 🚀 Migration Strategy

### Migration Files Structure
```
supabase/migrations/
├── 20250727000000_initial_schema.sql      # 초기 스키마
├── 20250730000001_lookup_data.sql         # 룩업 데이터
├── 20250804000000_google_drive_hybrid.sql # 이미지 관리
└── 20250804000001_performance_indexes.sql # 성능 최적화
```

### Version Control
```sql
-- 마이그레이션 버전 관리
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 버전 기록
INSERT INTO schema_migrations (version) 
VALUES ('20250727000000_initial_schema');
```

### Rollback Strategy
```sql
-- 각 마이그레이션은 롤백 스크립트 포함
-- rollback_20250727000000_initial_schema.sql
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
-- ... 역순으로 제거
```

---

## 🧪 Data Seeding

### Development Data
```sql
-- 개발용 룩업 데이터
INSERT INTO property_types (id, name, display_order) VALUES
  (uuid_generate_v4(), '아파트', 1),
  (uuid_generate_v4(), '오피스텔', 2);

-- 테스트 매물 데이터
INSERT INTO properties (
  property_name,
  location,
  property_type_id,
  transaction_type_id, 
  property_status_id,
  manager_id
) VALUES (
  '테스트 아파트',
  '서울시 강남구',
  (SELECT id FROM property_types WHERE name = '아파트'),
  (SELECT id FROM transaction_types WHERE name = '매매'),
  (SELECT id FROM property_statuses WHERE name = '거래가능'),
  '00000000-0000-0000-0000-000000000000'
);
```

### Production Data Validation
```sql
-- 데이터 무결성 검증
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN manager_id IS NULL THEN 1 END) as orphaned_properties,
  COUNT(CASE WHEN property_type_id IS NULL THEN 1 END) as untyped_properties
FROM properties;
```

---

## 📈 Performance Monitoring

### Query Analytics
```sql
-- 느린 쿼리 모니터링
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%properties%'
ORDER BY total_time DESC;
```

### Index Usage
```sql
-- 인덱스 사용률 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'properties'
ORDER BY idx_scan DESC;
```

### Connection Monitoring
```sql
-- 활성 연결 모니터링
SELECT 
  count(*) as active_connections,
  state,
  query
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state, query;
```

---

## 🔧 Maintenance Tasks

### Regular Maintenance
```sql
-- 통계 정보 업데이트
ANALYZE properties;
ANALYZE property_types;

-- 인덱스 리빌드 (필요시)
REINDEX TABLE properties;

-- 오래된 로그 데이터 정리
DELETE FROM user_login_history 
WHERE login_timestamp < now() - INTERVAL '90 days';
```

### Backup Strategy
```bash
# 일일 백업
pg_dump -h localhost -U postgres realty_db > backup_$(date +%Y%m%d).sql

# 스키마만 백업
pg_dump -h localhost -U postgres --schema-only realty_db > schema_backup.sql
```

---

## 🔗 Related Documentation

- [API Service Layer Reference](./API_SERVICE_REFERENCE.md)
- [Authentication System Reference](./AUTH_SYSTEM_REFERENCE.md)
- [Component Usage Guide](./COMPONENT_USAGE_GUIDE.md)
- [Development Setup Guide](./GETTING_STARTED.md)