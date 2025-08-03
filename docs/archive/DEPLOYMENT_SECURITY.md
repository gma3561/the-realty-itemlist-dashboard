# 배포 보안 설정 가이드

## GitHub Secrets 설정 방법

GitHub Pages 배포를 위해 다음 시크릿을 설정해야 합니다:

1. **GitHub 리포지토리 → Settings → Secrets and variables → Actions**로 이동

2. 다음 시크릿을 추가:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
   - `VITE_ADMIN_EMAILS`: 관리자 이메일 (쉼표로 구분)

## 로컬 개발 환경 설정

1. `.env.example` 파일을 복사하여 `.env` 파일 생성
2. 실제 값으로 환경변수 설정
3. `.env` 파일은 절대 커밋하지 않음 (이미 .gitignore에 포함됨)

## 보안 개선사항 완료

✅ 하드코딩된 관리자 비밀번호 제거
✅ Supabase API 키를 환경변수로 이동
✅ 관리자 이메일을 환경변수로 이동
✅ localStorage 보안 이슈 해결
✅ 민감한 정보를 노출할 수 있는 console.error 제거
✅ GitHub Actions에서 시크릿 사용하도록 설정

## 주의사항

- 환경변수가 설정되지 않으면 자동으로 더미 데이터 모드로 전환됩니다
- 프로덕션 환경에서는 반드시 모든 환경변수를 설정해야 합니다
- API 키나 민감한 정보는 절대 소스코드에 하드코딩하지 마세요