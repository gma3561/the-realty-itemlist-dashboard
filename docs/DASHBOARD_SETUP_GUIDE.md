# 대시보드 설정 가이드

## 1. 현재 상태

새로운 대시보드가 구현되어 다음 기능들이 준비되었습니다:
- ✅ 상태값 기반 매물 현황 표시
- ✅ 주간 활동 통계
- ✅ 실시간 활동 피드 UI
- ✅ 팀 성과 추적 UI

## 2. 데이터베이스 설정 필요

대시보드가 완전히 작동하려면 `property_status_history` 테이블을 생성해야 합니다.

### 방법 1: Supabase 대시보드에서 직접 실행

1. Supabase 대시보드 접속:
   ```
   https://app.supabase.com/project/qwxghpwasmvottahchky/editor
   ```

2. SQL Editor로 이동

3. 다음 파일의 내용을 복사하여 실행:
   ```
   supabase/migrations/20250805_property_status_history.sql
   ```

### 방법 2: CLI를 통한 실행 (개발자용)

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref qwxghpwasmvottahchky

# 마이그레이션 실행
supabase db push
```

## 3. 마이그레이션 내용

이 마이그레이션은 다음을 생성합니다:

### property_status_history 테이블
- 매물 상태 변경 이력을 자동으로 추적
- 누가, 언제, 어떤 상태로 변경했는지 기록

### recent_activities 뷰
- 최근 24시간 내 활동을 보기 쉽게 정리
- 대시보드의 "최근 활동" 섹션에서 사용

### weekly_status_changes 뷰  
- 주간 통계를 효율적으로 계산
- 대시보드의 "이번 주 활동 현황"에서 사용

### 자동 트리거
- properties 테이블의 상태가 변경될 때마다 자동으로 이력 생성

## 4. 검증 방법

마이그레이션 실행 후:

```bash
# 테이블 확인 스크립트 실행
node check-status-history-table.js
```

성공 메시지:
```
✅ property_status_history 테이블이 존재합니다.
✅ recent_activities 뷰가 존재합니다.
```

## 5. 사용 방법

마이그레이션이 완료되면:

1. 매물 상태를 변경할 때마다 자동으로 이력이 기록됩니다
2. 대시보드에서 실시간으로 다음을 확인할 수 있습니다:
   - 누가 어떤 매물의 상태를 변경했는지
   - 이번 주 상태별 변경 건수
   - 담당자별 활동 통계

## 6. 주의사항

- 기존 매물의 현재 상태도 초기 데이터로 마이그레이션됩니다
- RLS 정책이 적용되어 모든 사용자가 이력을 볼 수 있지만, 인증된 사용자만 생성 가능합니다
- 트리거가 자동으로 작동하므로 별도의 코드 수정은 필요하지 않습니다

## 7. 문제 해결

### "relation does not exist" 오류가 발생하는 경우
- 마이그레이션이 실행되지 않았습니다. 위의 설정 단계를 수행하세요.

### 활동이 표시되지 않는 경우
- 마이그레이션 실행 후 새로운 상태 변경이 있어야 표시됩니다.
- 테스트: 매물 목록에서 임의의 매물 상태를 변경해보세요.

### 주간 통계가 0으로 표시되는 경우
- 이번 주(월요일 시작)에 변경된 내역이 없는 경우입니다.
- 정상적인 상태일 수 있습니다.