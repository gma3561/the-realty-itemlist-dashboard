# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### OAuth 2.0 클라이언트 ID 설정
[Google Cloud Console](https://console.cloud.google.com/)에서 다음을 설정하세요:

#### 승인된 JavaScript 원본:
```
https://qwxghpwasmvottahchky.supabase.co
https://gma3561.github.io
http://localhost:5173
```

#### 승인된 리디렉션 URI:
```
https://qwxghpwasmvottahchky.supabase.co/auth/v1/callback
```

## 2. Supabase Dashboard 설정

1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. `qwxghpwasmvottahchky` 프로젝트 선택
3. **Authentication** > **Providers** > **Google** 활성화
4. 다음 정보 입력:
   - **Client ID**: (GOOGLE_OAUTH_CREDENTIALS.md 파일 참조)
   - **Client Secret**: (GOOGLE_OAUTH_CREDENTIALS.md 파일 참조)
5. **Save** 클릭

## 3. 데이터베이스 설정

### 방법 1: HTML 도구 사용 (권장)
1. 브라우저에서 `setup-new-database.html` 파일 열기
2. "전체 설정 실행" 버튼 클릭
3. 모든 단계가 완료될 때까지 대기

### 방법 2: Supabase SQL Editor 사용
1. Supabase Dashboard > SQL Editor
2. `setup-complete-database.sql` 내용 복사/붙여넣기
3. 실행
4. `insert-dummy-data.sql` 내용 복사/붙여넣기
5. 실행

## 4. 앱 테스트

1. 로컬에서 실행:
   ```bash
   npm run dev
   ```

2. 로그인 페이지에서 "Google로 로그인" 클릭
3. Google 계정으로 로그인
4. 대시보드 접근 확인

## 5. 배포

변경사항을 GitHub Pages에 배포:
```bash
npm run build
npm run deploy
```

## 주의사항

- Google OAuth 설정이 적용되는데 5분~몇 시간 걸릴 수 있습니다
- 처음 로그인하는 사용자는 자동으로 'user' 권한으로 생성됩니다
- 관리자 권한은 `user_mappings` 테이블에서 수동으로 설정해야 합니다

## 문제 해결

### "redirect_uri_mismatch" 오류
- Google Cloud Console에서 리디렉션 URI가 정확히 일치하는지 확인
- 끝에 슬래시(/)가 없어야 함

### 로그인 후 흰 화면
- 브라우저 개발자 도구 콘솔 확인
- Supabase URL이 올바른지 확인

### 권한 문제
- Supabase Dashboard에서 RLS 정책이 올바르게 설정되었는지 확인
- `user_profiles` 테이블에 사용자 정보가 생성되었는지 확인