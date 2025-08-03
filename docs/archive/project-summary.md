# 부동산 매물장 대시보드 프로젝트 요약

## 프로젝트 개요
- **이름**: the-realty-itemlist-dashboard
- **목적**: 부동산 매물을 관리하고 시각화하는 대시보드
- **기술 스택**: React, TailwindCSS, Supabase
- **배포**: GitHub Pages (https://gma3561.github.io/the-realty-itemlist-dashboard/)

## 주요 기능
1. **인증 시스템**
   - 이메일/비밀번호 로그인
   - Google OAuth 로그인
   - 하드코딩된 관리자 계정 옵션

2. **매물 관리**
   - 매물 목록 조회 (테이블/카드 뷰)
   - 매물 상세 정보 보기
   - 매물 추가/수정/삭제
   - 필터링 및 검색 기능

3. **대시보드**
   - 주요 통계 (총 매물, 거래 완료, 진행 중, 평균 가격)
   - 차트 및 그래프 (매물 유형, 거래 유형, 상태별 분포)
   - 최근 등록 매물 요약
   - 월별 통계

4. **CSV 임포트**
   - 매물 데이터 일괄 업로드

## 데이터 구조
- **properties**: 매물 정보 (이름, 위치, 가격, 거래 유형 등)
- **lookup 테이블**: 매물 유형, 거래 유형, 상태 등의 참조 데이터

## Supabase 연동
- **URL**: https://qwxghpwasmvottahchky.supabase.co
- **테이블**:
  - properties: 매물 정보
  - property_types: 매물 유형 (아파트, 오피스텔 등)
  - transaction_types: 거래 유형 (매매, 전세, 월세)
  - property_statuses: 매물 상태 (거래가능, 거래보류, 거래완료)

## 주요 컴포넌트
1. **PropertyStatsChart**: 매물 통계 차트 및 그래프 표시
2. **PropertyList**: 매물 목록 및 필터링
3. **Dashboard**: 주요 통계 및 요약 정보
4. **MainLayout**: 공통 레이아웃 (사이드바, 헤더)
5. **AuthContext**: 인증 상태 및 로직 관리

## 수정 사항
1. **Supabase 연결 문제 해결**
   - 기존 URL (mtgicixejxtidvskoyqy.supabase.co)에서 새 URL로 변경
   - API 키 업데이트

2. **컬럼명 불일치 수정**
   - 코드: `lease_deposit`, `monthly_rent`
   - DB: `lease_price`, `price`
   - 코드를 DB 스키마에 맞게 수정

3. **RLS 정책 우회**
   - 서비스 롤 키를 사용하여 데이터 업로드

4. **데이터 마이그레이션**
   - 룩업 테이블 초기화
   - 실제 매물 데이터 업로드

## 진행 상황
- ✅ Supabase 연결 구성 완료
- ✅ 데이터 스키마 및 코드 불일치 해결
- ✅ 테스트 데이터 업로드 성공
- ✅ GitHub Pages 배포 완료
- ✅ 앱과 Supabase 연결 확인

## 다음 단계
1. 실제 매물 데이터 업로드 확인
2. 배포된 앱에서 데이터 표시 확인
3. 사용자 계정 및 권한 설정 검토