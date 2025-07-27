# CSV 데이터 마이그레이션 문제점 분석

## 1. 분석 대상 파일
- 파일명: 고객연락처_표준화 - 장민아 정이든 장승환.csv
- 줄 수: 약 6,016줄
- 용도: 기존 매물 정보 데이터베이스로 마이그레이션

## 2. 주요 문제점 요약

### 2.1 구조적 문제점
1. **필드 수 불일치**: 각 행마다 필드 수가 다름 (1~45개로 불규칙)
2. **줄바꿈 문자 포함**: 필드 내에 줄바꿈 문자가 포함되어 CSV 구조 파괴
3. **따옴표 처리 오류**: 따옴표(")로 감싸진 필드 내 따옴표 처리 오류
4. **인코딩 문제**: UTF-8이 아닌 다른 인코딩으로 저장되어 한글 깨짐 발생

### 2.2 데이터 품질 문제점
1. **중복 데이터**: 동일 매물이 여러 행에 중복 등록
2. **불완전한 데이터**: 필수 필드가 비어 있는 행 다수 존재
3. **일관성 없는 형식**: 
   - 날짜 형식 불일치 (예: 2022-11-11, 2022.11.11, 22.11.11)
   - 금액 형식 불일치 (예: 25억, 25억원, 25.0억)
4. **개인정보 노출**: 주민등록번호, 연락처 등 민감한 개인정보 포함

## 3. 세부 문제점 분석

### 3.1 CSV 구조 파괴 문제
```
,회사매물,,,박윤정,840128-2,010-7467-0890,박윤정,"그레이스(뱅크)
성은미(뱅크)",,"129034465 그
129034467 성",,2025-07-19,거래가능,,한남동 1-241,힐탑빌,-,302,빌라/연립,매매,25억 ,137.46 / 122.97,41평/37평,3층/4층,3/2개,남향,20만원+,1대,즉시입주,1992.10.02,"한남동 유엔빌리지 내에 위치한 고급빌라입니다.
```

- 위 예시에서 여러 필드에 줄바꿈 문자가 포함되어 CSV 파서가 이를 새로운 행으로 인식
- 특히 "특이사항" 필드에 많은 줄바꿈 포함

### 3.2 필드 수 불일치 문제
```
awk -F',' '{print NF}' "고객연락처_표준화 - 장민아 정이든 장승환.csv" | sort -n | uniq -c | sort -n
```

- 결과: 1~45개의 다양한 필드 수가 존재
- 가장 많은 행(2,453개)은 필드가 1개
- 일관된 데이터 처리 불가능

### 3.3 데이터 형식 불일치 문제

#### 3.3.1 매물 상태
- 거래가능
- 진행중
- 진행상태가 표준화되지 않음

#### 3.3.2 거래 유형
- 매매
- 전세
- 월세/렌트
- 반전세
- 형식이 통일되지 않음

#### 3.3.3 금액 표기
- "25억"
- "25억 "
- "25,000,000,000"
- 공백과 콤마 사용이 일관되지 않음

#### 3.3.4 면적 표기
- "137.46 / 122.97"
- "137.46/122.97"
- 공백 사용이 일관되지 않음

### 3.4 개인정보 보호 문제
- 주민등록번호 앞자리 노출: "840128-2"
- 개인 연락처 노출: "010-7467-0890"
- 민감한 개인정보가 암호화되지 않은 상태로 포함

## 4. 마이그레이션 전략

### 4.1 데이터 정제 단계
1. **CSV 구조 복구**:
   - 줄바꿈 문자 처리를 위한 특수 CSV 파서 사용
   - Python의 `pandas` 라이브러리 + `csv` 모듈 결합

2. **데이터 정규화**:
   - 필수 필드 식별 및 누락 데이터 처리
   - 중복 행 제거
   - 표준 형식으로 변환 (날짜, 금액, 면적 등)

3. **개인정보 처리**:
   - 주민등록번호 마스킹 또는 암호화
   - 연락처 암호화 저장

### 4.2 변환 스크립트 (Python)

```python
import pandas as pd
import re
import hashlib
from datetime import datetime

def mask_personal_id(id_str):
    """주민등록번호 마스킹"""
    if not id_str or pd.isna(id_str):
        return None
    parts = id_str.split('-')
    if len(parts) != 2:
        return id_str
    return f"{parts[0]}-*******"

def standardize_date(date_str):
    """날짜 형식 표준화"""
    if not date_str or pd.isna(date_str):
        return None
    
    # 다양한 날짜 형식 처리
    formats = [
        '%Y-%m-%d', '%Y.%m.%d', '%y.%m.%d',
        '%Y/%m/%d', '%y/%m/%d', '%m/%d/%Y'
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    return None

def standardize_price(price_str):
    """가격 형식 표준화"""
    if not price_str or pd.isna(price_str):
        return None
    
    # 억 단위 처리
    if '억' in price_str:
        # 25억, 25.5억 등의 형식 처리
        price_str = price_str.replace('억원', '억').replace('억 ', '억')
        bil_pattern = r'(\d+\.?\d*)억'
        match = re.search(bil_pattern, price_str)
        if match:
            bil_amount = float(match.group(1))
            return int(bil_amount * 100000000)
    
    # 순수 숫자 처리
    price_str = price_str.replace(',', '').strip()
    if price_str.isdigit():
        return int(price_str)
    
    return None

def encrypt_phone(phone_str):
    """전화번호 암호화"""
    if not phone_str or pd.isna(phone_str):
        return None
    
    # 형식 검증
    phone_pattern = r'^\d{2,3}-\d{3,4}-\d{4}$'
    if not re.match(phone_pattern, phone_str):
        return phone_str
    
    # 마지막 4자리만 해시로 대체
    parts = phone_str.split('-')
    if len(parts) == 3:
        hash_obj = hashlib.sha256(parts[2].encode())
        hashed = hash_obj.hexdigest()[:4]
        return f"{parts[0]}-{parts[1]}-{hashed}"
    
    return phone_str

def process_csv(file_path):
    """CSV 파일 처리 메인 함수"""
    # CSV 파일을 읽을 때 줄바꿈 문자가 포함된 필드 처리
    df = pd.read_csv(file_path, 
                     on_bad_lines='warn', 
                     escapechar='\\',
                     quoting=1,  # QUOTE_ALL
                     encoding='utf-8',
                     engine='python')
    
    # 필수 컬럼 확인 및 생성
    required_columns = [
        '담당자', '소유주(담당)', '소유주 연락처', '매물상태', 
        '소재지', '매물명', '매물종류', '거래유형', '금액'
    ]
    
    for col in required_columns:
        if col not in df.columns:
            df[col] = None
    
    # 데이터 정제
    df['주민(법인)등록번호'] = df['주민(법인)등록번호'].apply(mask_personal_id)
    df['소유주 연락처'] = df['소유주 연락처'].apply(encrypt_phone)
    df['등록일'] = df['등록일'].apply(standardize_date)
    df['거래완료날짜'] = df['거래완료날짜'].apply(standardize_date)
    df['금액_표준화'] = df['금액'].apply(standardize_price)
    
    # 중복 행 제거
    df = df.drop_duplicates(subset=['소재지', '매물명', '동', '호'], keep='first')
    
    # 필수 필드가 없는 행 필터링
    valid_rows = df[df['소재지'].notna() & df['매물명'].notna() & df['매물종류'].notna()]
    
    return valid_rows

# 처리 실행
try:
    clean_data = process_csv('고객연락처_표준화.csv')
    clean_data.to_csv('정제된_매물데이터.csv', index=False, encoding='utf-8')
    print(f"처리 완료: {len(clean_data)} 행의 유효 데이터")
except Exception as e:
    print(f"오류 발생: {str(e)}")
```

### 4.3 Supabase 마이그레이션 방식

1. **단계적 접근**:
   - 정제된 CSV 데이터를 임시 테이블로 먼저 가져오기
   - 각 레코드 검증 후 실제 테이블로 이관

2. **Transaction 사용**:
   - 데이터 무결성 보장을 위해 트랜잭션 내에서 처리
   - 오류 발생 시 롤백

3. **Data Mapping**:
   - CSV 필드와 DB 테이블 간의 매핑 정의
   - 소유주, 매물 등 관계 테이블 처리

## 5. 개발 우선순위 및 일정

### 5.1 1일차: 데이터 분석 및 정제 스크립트 개발
- CSV 분석 완료
- 정제 스크립트 개발
- 테스트 데이터로 검증

### 5.2 2일차: 임시 테이블 설계 및 데이터 임포트
- 임시 테이블 스키마 정의
- 정제된 데이터 임포트
- 데이터 검증

### 5.3 3일차: 실제 테이블 마이그레이션
- 최종 데이터 구조로 변환
- 관계 설정 및 제약조건 적용
- 마이그레이션 스크립트 개발

### 5.4 4일차: 검증 및 문제해결
- 전체 데이터 검증
- 오류 수정
- 최종 마이그레이션 실행

### 5.5 5일차 이후: 활용 기능 개발
- 마이그레이션된 데이터 기반 UI 개발
- 검색 및 필터링 기능 개발

## 6. 결론 및 권장사항

### 6.1 결론
CSV 파일은 구조적 문제와 데이터 품질 문제가 심각하여 직접적인 마이그레이션은 불가능합니다. 정제 과정을 통해 데이터 품질을 개선한 후 단계적 마이그레이션이 필요합니다.

### 6.2 권장사항
1. **데이터 정제 우선**: 스크립트를 통한 정제 먼저 수행
2. **소규모 테스트**: 소량의 데이터로 먼저 테스트
3. **검증 프로세스**: 각 단계별 검증 절차 마련
4. **개인정보 처리방침**: 민감 정보 처리 방안 명확화
5. **데이터 백업**: 원본 데이터 백업 유지