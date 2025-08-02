// GitHub Pages용 하드코딩된 환경변수
// 배포 환경에서는 이 값들을 사용합니다.

export const PRODUCTION_ENV = {
  // Supabase 설정
  SUPABASE_URL: 'https://qwxghpwasmvottahchky.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8',

  // 애플리케이션 설정
  ENVIRONMENT: 'production',
  APP_NAME: '팀 매물장',
  APP_VERSION: '2.0.0',

  // 관리자 설정
  ADMIN_EMAILS: 'jenny@the-realty.co.kr,lucas@the-realty.co.kr,hmlee@the-realty.co.kr',

  // 기능 설정
  ENABLE_DEMO_BANNER: true,
  ENABLE_PWA: true,
  USE_DUMMY_DATA: false,
};