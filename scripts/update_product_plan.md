# 기획서 업데이트 필요 사항

현재 프로젝트 `DATABASE_SCHEMA.md`와 마이그레이션 파일이 `PRODUCT_PLAN.md`와 일부 다른 점이 있습니다. 다음 사항을 기획서에 업데이트해야 합니다.

## 1. 테이블 구조 차이점

### 1.1. 데이터베이스 스키마 섹션 (4. 데이터베이스 스키마)

현재 기획서에서는 아래와 같이 테이블 구조가 정의되어 있습니다:

```
### 4.2. 추가 테이블
- **users**: 사용자 정보
  - id, email, name, role, password_hash, created_at, updated_at, last_login
  
- **roles**: 사용자 권한
  - id, name, permissions, description
  
- **property_history**: 매물 상태 변경 히스토리
  - id, property_id, user_id, previous_status, new_status, notes, created_at
  
- **customer_contacts**: 고객 연락처 정보
  - id, property_id, name, phone, email, notes, created_at, updated_at
  
- **funnel_stages**: 퍼널 단계 정의
  - id, name, order, description
  
- **funnel_events**: 퍼널 이벤트 로그
  - id, property_id, customer_id, user_id, stage_id, previous_stage_id, notes, created_at
```

실제 구현된 스키마에서는 아래와 같은 차이점이 있습니다:

1. `customer_contacts` 대신 `customers` 테이블 사용
2. `customers` 테이블에 `source` 필드 추가
3. `customer_interests` 테이블 추가
4. `performance_metrics` 테이블 추가
5. `performance_goals` 테이블 추가
6. `system_settings` 테이블 추가
7. `activity_logs` 테이블 추가

## 2. 기능 구현 차이점

### 2.1. 퍼널 분석 (3.3. 퍼널 분석)

현재 기획서의 퍼널 분석은 아래와 같이 정의되어 있습니다:

```
### 3.3. 퍼널 분석
- **전환율 분석**
  - 문의 → 상담 → 임장 → 계약 단계별 전환율
  - 시계열 분석 (일간/주간/월간)
  - 채널별 효율성 비교

- **이탈 원인 분석**
  - 각 단계별 이탈 사유 분석
  - 개선 포인트 도출
```

실제 구현된 스키마에서는 협상 단계가 추가되었습니다:
- 문의 → 상담 → 임장 → **협상** → 계약

### 2.2. 성과 분석 (3.4. 직원 성과)

현재 기획서의 성과 분석은 아래와 같이 정의되어 있습니다:

```
### 3.4. 직원 성과
- **개인 성과 분석**
  - 개인별 KPI 달성률
  - 문의 응대, 상담, 계약 건수
  - 시간대별 활동 분석
  
- **비교 분석**
  - 회사 평균 대비 개인 성과
  - 직원 간 성과 비교 (옵션)
  - 시계열 추이 분석
```

실제 구현된 스키마에서는 다음과 같은 성과 지표가 추가되었습니다:
- `performance_metrics`: 다양한 성과 지표를 시간 단위로 기록
- `performance_goals`: 개인 및 회사 목표를 설정

## 3. 권한 관리 차이점

실제 구현된 스키마에서는 RLS(Row Level Security) 정책이 더 상세하게 정의되었습니다.

## 4. 업데이트 제안

기획서(PRODUCT_PLAN.md)에 다음 내용을 업데이트하는 것을 권장합니다:

1. 데이터베이스 스키마 섹션 전면 수정
2. 퍼널 단계에 '협상' 단계 추가
3. 성과 분석에 성과 목표 설정 기능 추가
4. 시스템 설정 섹션 추가
5. 액티비티 로그 관련 내용 추가

위 사항을 반영하여 기획서를 업데이트하면 실제 구현된 시스템과의 일관성을 유지할 수 있습니다.