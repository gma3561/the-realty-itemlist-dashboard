# 보안 가이드

## 환경 설정

### 필수 환경변수

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development/Production Environment  
VITE_ENVIRONMENT=development # 또는 production

# Application Settings
VITE_APP_NAME=팀 매물장
VITE_APP_VERSION=1.0.0

# Admin Configuration (보안상 환경변수로 관리)
VITE_ADMIN_EMAILS=admin1@company.com,admin2@company.com,admin3@company.com

# Optional Features
VITE_ENABLE_DEMO_BANNER=true
VITE_ENABLE_PWA=true
```

### 보안 키 관리

⚠️ **중요**: 다음 파일들은 절대 Git에 커밋하면 안됩니다:
- `.env` 
- `.env.production`
- `.env.local`

✅ **안전**: 다음 파일들은 커밋해도 안전합니다:
- `.env.example` (템플릿 파일)

## 보안 정책

### 1. 인증 및 권한

- **Row Level Security (RLS)**: 모든 테이블에 RLS 정책 적용
- **역할 기반 접근 제어**: 관리자/일반 사용자 권한 분리
- **세션 관리**: 8시간 세션 타임아웃, 2시간 비활성 타임아웃

### 2. 데이터 보호

- **개인정보 마스킹**: 전화번호, 이메일 등 민감정보 마스킹 처리
- **입력 검증**: SQL 인젝션, XSS 방지를 위한 입력 검증
- **파일 업로드 제한**: 10MB 크기 제한, 허용된 파일 형식만 업로드

### 3. API 보안

- **Rate Limiting**: 분당 요청 수 제한
  - 일반 API: 100 RPM
  - 로그인: 10 RPM  
  - 파일 업로드: 20 RPM
- **CORS 정책**: 허용된 도메인에서만 API 접근
- **헤더 검증**: 클라이언트 정보 헤더 검증

### 4. 프론트엔드 보안

- **Content Security Policy (CSP)**: XSS 방지를 위한 CSP 헤더
- **환경별 설정**: 개발/운영 환경 분리
- **민감정보 로깅 방지**: 운영 환경에서 민감정보 로그 제한

## 배포 보안

### GitHub Pages 배포 시 주의사항

1. **환경변수 설정**: GitHub Actions에서 환경변수 설정
2. **Service Role Key 제외**: 클라이언트에서 Service Role Key 절대 사용 금지
3. **HTTPS 강제**: GitHub Pages에서 HTTPS 강제 설정

### 환경변수 설정 방법

GitHub Repository → Settings → Secrets and variables → Actions

```
VITE_SUPABASE_URL: https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_EMAILS: admin1@company.com,admin2@company.com
```

## 보안 모니터링

### 로그 수준

- **ERROR**: 보안 위반, 시스템 오류
- **WARN**: 의심스러운 활동, 정책 위반
- **INFO**: 일반적인 보안 이벤트
- **DEBUG**: 개발 모드에서만 상세 로그

### 보안 이벤트 모니터링

```javascript
import { securityLog, LOG_LEVELS } from './src/config/security.js';

// 보안 이벤트 로깅
securityLog(LOG_LEVELS.WARN, '의심스러운 로그인 시도', {
  userEmail: 'user@example.com',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});
```

## 취약점 대응

### 정기 점검 항목

1. **의존성 취약점**: `npm audit` 정기 실행
2. **Supabase 정책**: RLS 정책 정기 검토
3. **환경변수**: 만료된 키 교체
4. **접근 로그**: 비정상적인 접근 패턴 모니터링

### 보안 업데이트

- **Supabase 클라이언트**: 정기적으로 최신 버전 업데이트
- **React 및 의존성**: 보안 패치 정기 적용
- **브라우저 정책**: CSP, CORS 정책 정기 검토

## 문제 해결

### 일반적인 보안 문제

1. **환경변수 로드 실패**
   ```
   Error: Supabase 환경변수가 설정되지 않았습니다.
   ```
   → `.env` 파일 확인 및 환경변수 설정

2. **RLS 정책 오류**
   ```
   Error: permission denied for table properties
   ```
   → Supabase에서 RLS 정책 확인

3. **CORS 오류**
   ```
   Error: CORS policy blocked
   ```
   → Supabase 허용 도메인 설정 확인

## 담당자 연락처

보안 관련 문제나 취약점 발견 시:
- 이메일: security@the-realty.co.kr
- 긴급상황: 즉시 시스템 관리자에게 연락

---

**마지막 업데이트**: 2025-07-31  
**버전**: 1.0.0  
**담당자**: 개발팀