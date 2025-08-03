# 🔍 Supabase 전체 QA 체크리스트

## 1️⃣ 데이터베이스 구조 확인

### 테이블 존재 여부 확인
```sql
-- 모든 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 필수 테이블 체크
- [ ] properties
- [ ] users
- [ ] property_types
- [ ] transaction_types
- [ ] property_statuses
- [ ] property_comments
- [ ] manager_history

---

## 2️⃣ 스키마 타입 확인

### properties 테이블 컬럼 타입 확인
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('property_type', 'transaction_type', 'property_status');
```

**예상 결과**: 모두 `text` 타입이어야 함

---

## 3️⃣ 룩업 테이블 데이터 확인

### property_types 데이터
```sql
SELECT * FROM property_types ORDER BY display_order;
```

### transaction_types 데이터  
```sql
SELECT * FROM transaction_types ORDER BY display_order;
```

### property_statuses 데이터
```sql
SELECT * FROM property_statuses ORDER BY display_order;
```

---

## 4️⃣ 외래키 제약조건 확인

### CASCADE DELETE 확인 (없어야 정상)
```sql
SELECT 
    tc.table_name, 
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND rc.delete_rule = 'CASCADE'
AND tc.table_schema = 'public';
```

**예상 결과**: 0 rows (CASCADE가 없어야 함)

---

## 5️⃣ RLS (Row Level Security) 확인

### RLS 활성화 상태 확인
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'users', 'property_comments');
```

### property_comments RLS 정책 확인
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'property_comments';
```

---

## 6️⃣ 데이터 무결성 확인

### 매물 총 개수
```sql
SELECT COUNT(*) as total_properties FROM properties;
```

### 상태별 매물 분포
```sql
SELECT property_status, COUNT(*) as count 
FROM properties 
GROUP BY property_status 
ORDER BY count DESC;
```

### 거래유형별 분포
```sql
SELECT transaction_type, COUNT(*) as count 
FROM properties 
GROUP BY transaction_type 
ORDER BY count DESC;
```

---

## 7️⃣ 코멘트 시스템 테스트

### 코멘트 테이블 확인
```sql
SELECT COUNT(*) as total_comments FROM property_comments;
```

### 최근 코멘트 확인
```sql
SELECT 
    pc.id,
    pc.comment_text,
    pc.user_name,
    pc.created_at,
    p.property_name
FROM property_comments pc
JOIN properties p ON pc.property_id = p.id
ORDER BY pc.created_at DESC
LIMIT 5;
```

---

## 8️⃣ 성능 관련 확인

### 인덱스 목록
```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 테이블 크기 확인
```sql
SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## 9️⃣ 데이터 품질 확인

### NULL 값 체크
```sql
SELECT 
    COUNT(*) as total,
    COUNT(property_type) as has_type,
    COUNT(transaction_type) as has_transaction,
    COUNT(property_status) as has_status,
    COUNT(manager_id) as has_manager
FROM properties;
```

### 중복 데이터 확인
```sql
SELECT property_name, location, COUNT(*) 
FROM properties 
GROUP BY property_name, location 
HAVING COUNT(*) > 1;
```

---

## 🔟 실시간 기능 테스트

### Realtime 활성화 테이블 확인
```sql
SELECT 
    schemaname,
    tablename,
    publication
FROM pg_publication_tables
WHERE publication = 'supabase_realtime';
```

---

## ✅ QA 체크리스트 요약

| 항목 | 확인 | 비고 |
|------|------|------|
| 테이블 생성 | □ | 7개 필수 테이블 |
| 스키마 타입 | □ | TEXT 타입 확인 |
| 룩업 데이터 | □ | 상태값 5개, 거래유형 6개 |
| CASCADE 제거 | □ | 0개여야 함 |
| RLS 정책 | □ | 주요 테이블 활성화 |
| 데이터 무결성 | □ | NULL, 중복 체크 |
| 코멘트 시스템 | □ | 정상 작동 |
| 인덱스 | □ | 성능 최적화 |
| Realtime | □ | 구독 기능 |

---

## 🚨 문제 발견 시 조치

### CASCADE DELETE 발견 시
```sql
-- critical-security-fixes-all.sql 실행
```

### 스키마 타입 불일치 시
```sql
-- urgent-fixes.sql 실행
```

### 인덱스 누락 시
```sql
CREATE INDEX idx_properties_status ON properties(property_status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_transaction ON properties(transaction_type);
```

---

**마지막 업데이트**: 2025-08-03