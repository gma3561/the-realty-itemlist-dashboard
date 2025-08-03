# 부동산 매물장 데이터 업로드 안내서

이 문서는 CSV 데이터를 Supabase에 업로드하고 웹 서비스에 표시하는 방법을 안내합니다.

## 준비 사항

1. Node.js 설치 (최신 LTS 버전 권장)
2. 필요한 npm 패키지: csv-parser, fs, node-fetch

## 단계별 안내

### 1. 데이터베이스 초기화

먼저 Supabase에 테이블 구조를 초기화해야 합니다.

1. Supabase 대시보드(https://app.supabase.com)에 접속합니다.
2. 프로젝트를 선택하고 SQL 편집기를 엽니다.
3. `setup-database.sql` 파일의 내용을 복사하여 SQL 편집기에 붙여넣습니다.
4. SQL을 실행하여 테이블 구조와 초기 참조 데이터를 생성합니다.

### 2. CSV 파일 준비

1. CSV 파일을 `/tmp/sample.csv`에 복사하거나, `process-csv-data.js` 파일을 수정하여 올바른 파일 경로를 지정합니다.
2. CSV 파일은 다음 헤더를 포함해야 합니다:
   - 담당자, 소재지, 매물명, 동, 호, 매물종류, 거래유형, 금액, 공급/전용(㎡), 공급/전용(평), 해당층/총층, 룸/욕실, 방향, 관리비, 주차, 입주가능일, 사용승인, 특이사항, 담당자MEMO, 매물상태

### 3. Node.js 패키지 설치

```bash
npm install csv-parser fs node-fetch
```

### 4. 데이터 변환 및 업로드

1. 다음 명령어를 실행하여 CSV 데이터를 변환하고 Supabase에 업로드합니다:

```bash
node process-csv-data.js
```

2. 스크립트 실행 결과를 확인합니다. 성공적으로 업로드된 매물 수와 실패한 매물 수가 표시됩니다.
3. 변환된 데이터는 `converted-data.json` 파일로 저장됩니다.

### 5. 웹 서비스 확인

1. 웹 서비스에 접속하여 데이터가 올바르게 표시되는지 확인합니다.
   - URL: https://gma3561.github.io/the-realty-itemlist-dashboard/
2. 매물 목록 페이지와 대시보드 페이지에서 데이터가 표시되는지 확인합니다.

## 문제 해결

### 데이터가 표시되지 않는 경우

1. 컬럼명 불일치 문제가 발생할 수 있습니다. 이는 코드에서는 `property_status`와 같은 컬럼을 참조하지만, 데이터베이스에는 `property_status_id`와 같은 컬럼이 있기 때문입니다.

2. 이 문제를 해결하기 위해 `setup-database.sql` 파일은 다음과 같은 추가 컬럼을 포함합니다:
   - `property_type` (원래 컬럼: `property_type_id`)
   - `property_status` (원래 컬럼: `property_status_id`)
   - `transaction_type` (원래 컬럼: `transaction_type_id`)

3. 또한 트리거를 설정하여 `_id` 컬럼이 업데이트될 때 자동으로 텍스트 컬럼도 업데이트됩니다.

4. 여전히 문제가 발생하는 경우, 다음 파일을 참조하여 문제 해결 방법을 확인하세요:
   - `troubleshooting-guide.html`: 종합적인 문제 해결 가이드
   - `fix-property-form.html`: 컬럼명 불일치 해결 방법

## 참고 사항

- `process-csv-data.js` 스크립트는 기본적으로 `/tmp/sample.csv` 파일의 처음 100개 행만 처리합니다. 전체 데이터를 처리하려면 파일 경로를 원본 CSV 파일 경로로 변경하세요.
- 업로드 배치 크기는 20개로 설정되어 있습니다. 서버 부하나 속도에 따라 조정할 수 있습니다.
- 원본 CSV 파일의 인코딩이 UTF-8이 아닌 경우, `process-csv-data.js` 파일을 수정하여 올바른 인코딩을 지정해야 합니다.

## 추가 도구

이 프로젝트에는 데이터 업로드 및 문제 해결을 돕는 다음과 같은 HTML 도구가 포함되어 있습니다:

- `initialize-database.html`: 데이터베이스 테이블 구조 초기화
- `convert-csv.html`: CSV 데이터 변환 및 업로드 웹 인터페이스
- `fix-property-form.html`: 컬럼명 불일치 해결 가이드
- `troubleshooting-guide.html`: 종합적인 문제 해결 가이드

이 HTML 파일들은 브라우저에서 직접 열어 사용할 수 있습니다.