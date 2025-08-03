# 로컬 Supabase 연동 테스트 가이드

## 🚀 빠른 시작

### 1. 환경변수 설정
`.env.local` 파일이 프로젝트 루트에 생성되어 있는지 확인하세요.

```bash
# .env.local 파일 확인
cat .env.local
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

로컬 서버가 http://localhost:5173 에서 실행됩니다.

## 🧪 테스트 방법

### 1. 독립 테스트 스크립트 실행
```bash
node test-supabase-local.js
```

이 스크립트는 다음을 테스트합니다:
- ✅ Supabase 연결
- ✅ 데이터 읽기 (Read)
- ✅ 데이터 생성 (Create)
- ✅ 데이터 수정 (Update)
- ✅ 데이터 삭제 (Delete)
- ✅ 실시간 구독

### 2. 브라우저에서 양방향 동기화 테스트

#### 테스트 시나리오 1: 로컬 → Supabase
1. 로컬 앱에서 새 매물 등록
2. Supabase 대시보드(https://supabase.com/dashboard)에서 확인
3. `properties` 테이블에 새 데이터가 추가되었는지 확인

#### 테스트 시나리오 2: Supabase → 로컬
1. Supabase 대시보드에서 직접 데이터 수정
2. 로컬 앱 새로고침
3. 변경사항이 반영되었는지 확인

#### 테스트 시나리오 3: 실시간 동기화
1. 로컬 앱을 2개의 브라우저 탭에서 열기
2. 탭 A에서 매물 상태 변경
3. 탭 B에서 실시간으로 변경사항 확인

## 📊 Supabase 대시보드 활용

### 1. 테이블 뷰어
- URL: https://supabase.com/dashboard/project/aekgsysvipnwxhwixglg/editor
- 실시간으로 데이터 확인 및 수정 가능

### 2. SQL 에디터
- URL: https://supabase.com/dashboard/project/aekgsysvipnwxhwixglg/sql
- 직접 SQL 쿼리 실행 가능

### 3. 실시간 로그
- URL: https://supabase.com/dashboard/project/aekgsysvipnwxhwixglg/logs/explorer
- API 요청 및 에러 로그 확인

## 🔍 데이터 확인 체크리스트

### 매물 등록 테스트
- [ ] 필수 필드 모두 입력
- [ ] 저장 후 목록에 표시 확인
- [ ] Supabase 대시보드에서 확인
- [ ] 생성일시 자동 기록 확인

### 매물 수정 테스트
- [ ] 상태 변경
- [ ] 가격 정보 수정
- [ ] 담당자 변경
- [ ] 수정일시 자동 업데이트 확인

### 고객 정보 테스트
- [ ] 고객 등록
- [ ] 고객-매물 매칭
- [ ] 연락 이력 기록

## ⚠️ 주의사항

1. **환경변수**: `.env.local` 파일은 절대 git에 커밋하지 마세요
2. **데이터 정리**: 테스트 후 불필요한 데이터는 삭제하세요
3. **RLS 정책**: 로컬에서도 Supabase의 Row Level Security가 적용됩니다

## 🛠️ 문제 해결

### 연결 실패
```bash
# 환경변수 확인
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 네트워크 연결 확인
ping aekgsysvipnwxhwixglg.supabase.co
```

### 권한 오류
- Supabase 대시보드에서 RLS 정책 확인
- anon key의 권한 확인

### 실시간 동기화 안됨
- 브라우저 콘솔에서 WebSocket 연결 확인
- Supabase Realtime 설정 확인

## 📝 유용한 명령어

```bash
# 로그 확인
npm run dev -- --debug

# 환경변수 확인
npm run env:check

# 데이터베이스 상태 확인
node scripts/check_connection.js
```