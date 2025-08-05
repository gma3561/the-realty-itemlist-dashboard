# 대시보드 요구사항 정의서

## 1. 대시보드 목적
부동산 매물의 **주간 상태 변화**를 실시간으로 모니터링하고, 팀원들의 활동을 추적하는 중앙 허브

## 2. 핵심 구성요소

### 2.1 매물 현황 카드 (상단)
- **거래가능 매물**: 현재 'available' 상태인 전체 매물 수
- **계약중**: 현재 'contract' 상태인 전체 매물 수  
- **임장가능**: 현재 'inspection_available' 상태인 전체 매물 수
- **보류**: 현재 'hold' 상태인 전체 매물 수

### 2.2 이번 주 활동 현황 (중단)
- **신규 등록**: 이번 주 새로 등록된 매물 수
- **계약 진행**: 이번 주 'available' → 'contract'로 변경된 수
- **거래 완료**: 이번 주 'completed'로 변경된 수
- **거래 철회**: 'cancelled'로 변경된 수
- **보류 처리**: 'hold'로 변경된 수

### 2.3 실시간 업데이트 피드 (좌측)
최근 24시간 내 상태 변경 이력:
- 시간
- 담당자명
- 매물명
- 이전 상태 → 새 상태
- 변경 사유 (선택사항)

### 2.4 팀 활동 현황 (우측)
이번 주 담당자별 활동:
- 담당자명
- 신규 등록 건수
- 상태 변경 건수
- 완료율

## 3. 데이터 요구사항

### 3.1 상태 변경 이력 테이블
```sql
CREATE TABLE property_status_history (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  old_status VARCHAR,
  new_status VARCHAR,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  reason TEXT
);
```

### 3.2 필요한 쿼리
1. 현재 상태별 매물 수
2. 이번 주 상태 변경 이력
3. 최근 24시간 업데이트
4. 담당자별 주간 활동

## 4. UI/UX 요구사항
- 자동 새로고침 (30초 간격)
- 새로운 업데이트 시 시각적 알림
- 모바일 반응형
- 다크모드 지원

## 5. 권한
- 모든 사용자가 동일한 대시보드 접근
- 관리자/직원 구분 없음