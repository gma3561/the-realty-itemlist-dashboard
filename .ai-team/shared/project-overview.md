# 팀 매물장 프로젝트 개요

## 🏢 프로젝트 소개
부동산 중개사무소를 위한 현대적인 매물 관리 시스템으로, 팀원 간 원활한 정보 공유와 효율적인 업무 처리를 지원합니다.

## 🎯 비즈니스 목표
- 매물 정보의 체계적 관리로 업무 효율성 향상
- 팀원 간 실시간 정보 공유로 협업 강화  
- 고객 정보 보안을 위한 권한 기반 접근 제어
- 모바일 환경에서도 동일한 기능 사용 가능

## 📊 현재 시스템 상태

### ✅ 완료된 핵심 기능
- **사용자 인증**: Google OAuth 2.0, 역할 기반 권한
- **매물 관리**: 등록, 수정, 삭제, 검색, 필터링
- **이미지 관리**: Supabase Storage 활용 업로드/관리
- **대시보드**: 통계, 성과 분석, 차트
- **모바일 지원**: PWA, 반응형 디자인
- **배포**: GitHub Pages 자동 배포

### 🚧 개발 중/계획 기능
- **고객 관리**: 기본 구조 완료, 세부 기능 개발 중
- **Google Drive 연동**: 설계 완료, 구현 예정
- **수수료 계산**: 요구사항 분석 완료
- **공동중개 관리**: 향후 구현 예정

## 🏗️ 기술 아키텍처

### Frontend
```
React 18 + Vite
├── TailwindCSS (스타일링)
├── React Router (라우팅) 
├── React Query (상태 관리)
├── Recharts (데이터 시각화)
└── PWA (모바일 지원)
```

### Backend & Infrastructure  
```
Supabase (BaaS)
├── PostgreSQL (데이터베이스)
├── Row Level Security (보안)
├── Storage (파일 관리)
├── Auth (인증)
└── Realtime (실시간 동기화)
```

### DevOps
```
GitHub
├── Actions (CI/CD)
├── Pages (배포)
└── Issues (작업 관리)
```

## 👥 AI 팀 역할 분담

| 역할 | 담당 영역 | 주요 책임 |
|------|----------|----------|
| **Product Owner** | 제품 기획, 요구사항 | PRD 관리, 우선순위 결정 |
| **Backend Developer** | API, 데이터베이스 | Supabase 설정, 스키마 관리 |
| **Frontend Developer** | UI/UX 구현 | React 컴포넌트, 상태 관리 |
| **Service Planner** | 아키텍처 설계 | 시스템 설계, API 명세 |
| **UI/UX Designer** | 디자인 시스템 | 사용자 경험, 디자인 가이드 |
| **QA Manager** | 품질 관리 | 테스트, 배포, 모니터링 |

## 📁 코드 구조

```
src/
├── components/          # React 컴포넌트
│   ├── auth/           # 인증 관련
│   ├── common/         # 공통 컴포넌트  
│   ├── dashboard/      # 대시보드
│   ├── layout/         # 레이아웃
│   └── property/       # 매물 관련
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── hooks/              # Custom Hooks
├── context/            # React Context
├── utils/              # 유틸리티
└── config/             # 설정 파일
```

## 🔐 보안 정책
- Google OAuth 2.0 인증 필수
- Row Level Security (RLS) 적용
- 환경별 권한 분리 (개발/프로덕션)
- 고객 정보 접근 제한 (담당자만)

## 🚀 배포 환경
- **개발**: `npm run dev` (로컬 개발서버)
- **테스트**: Playwright E2E 테스트
- **프로덕션**: GitHub Pages 자동 배포
- **Live Demo**: https://gma3561.github.io/the-realty-itemlist-dashboard/

## 📈 성공 지표
- 일일 활성 사용자 90% 이상
- 매물 등록 시간 50% 단축  
- 시스템 가동률 99% 이상
- 사용자 만족도 향상

---

**문서 버전**: 1.0  
**최종 수정**: 2025-08-03  
**관리자**: AI Team Migrator 