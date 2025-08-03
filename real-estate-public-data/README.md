# 부동산 공공데이터 수집 시스템

국토교통부 공공데이터포털 API를 활용한 부동산 실거래가 데이터 자동 수집 시스템

## 📁 파일 구성

### 핵심 파일
- `realEstateDataCollector.js` - 부동산 데이터 자동 수집 서비스 (3시간 간격)
- `RealEstateCollector.jsx` - 데이터 수집 관리 UI 컴포넌트
- `RealTimePropertyData.jsx` - 실시간 부동산 데이터 조회 컴포넌트
- `useRealEstateCollector.js` - React Hook (상태 관리)
- `supabase_realestatedata_setup.sql` - 데이터베이스 테이블 설정

### 설정 및 테스트
- `setup-public-data-api.js` - API 키를 macOS 키체인에 저장
- `test-public-data-api.js` - 공공데이터포털 API 연결 테스트
- `test-api-first.js` - 단독/다가구 매매 API 테스트
- `test-api-collection.js` - 한국부동산원 API 테스트
- `test-api-quick.js` - 빠른 API 연결 테스트

## 🔑 API 키 정보

### 공공데이터포털 API 키 (이미 키체인에 저장됨)
```
키 이름: PUBLIC_DATA_API_KEY
서비스: the-realty-dashboard
```

### API 키 값 (보안상 키체인에서 관리)
- 키체인에서 확인: `security find-generic-password -a "PUBLIC_DATA_API_KEY" -s "the-realty-dashboard" -w`

## 📊 수집 데이터

### 대상 지역 (서울시 주요 8개 지역)
1. 강남구 역삼동 (11680)
2. 강남구 삼성동 (11680)  
3. 서초구 서초동 (11650)
4. 송파구 잠실동 (11710)
5. 영등포구 여의도동 (11560)
6. 마포구 상암동 (11440)
7. 용산구 한남동 (11170)
8. 종로구 청운동 (11110)

### 수집 데이터 항목
- 아파트명
- 거래금액
- 건축년도
- 거래일자 (년/월/일)
- 전용면적
- 법정동, 지번
- 층수

## 🚀 사용 방법

### 1. 데이터베이스 설정
```sql
-- Supabase에서 실행
-- supabase_realestatedata_setup.sql 파일 내용 실행
```

### 2. API 키 설정 (이미 완료)
```bash
# API 키가 이미 키체인에 저장되어 있음
# 재설정이 필요한 경우:
node setup-public-data-api.js
```

### 3. React 프로젝트에 통합
```javascript
// 페이지 컴포넌트
import RealEstateCollector from './RealEstateCollector';
import RealTimePropertyData from './RealTimePropertyData';

// 데이터 수집 페이지에 추가
<RealTimePropertyData />
<RealEstateCollector />
```

### 4. 자동 수집 시작
- 웹 UI에서 "자동 수집 시작" 버튼 클릭
- 3시간마다 자동으로 데이터 수집
- 수동 수집도 가능

## 🧪 테스트

### API 연결 테스트
```bash
node test-api-quick.js
```

### 전체 API 테스트
```bash
node test-public-data-api.js
```

## 📌 주의사항

1. **API 호출 제한**: 초당 10회 제한 준수
2. **데이터 중복 방지**: upsert로 자동 처리
3. **키체인 보안**: API 키는 macOS 키체인에 안전하게 보관
4. **수집 주기**: 3시간 간격 (변경 가능)

## 🔗 관련 API

### 국토교통부 공공데이터포털
- [아파트매매 실거래 상세 자료](https://www.data.go.kr/data/15057511/openapi.do)
- 서비스키 필요 (키체인에 저장됨)

### 한국부동산원 (추가 예정)
- 부동산 통계 정보
- 시세 정보