const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');

const INPUT_FILE = '/Users/tere.remote/Desktop/더부동산 고객연락처.csv';
const OUTPUT_FILE = '/Users/tere.remote/Desktop/더부동산_고객연락처_정제.csv';
const ERROR_FILE = '/Users/tere.remote/Desktop/더부동산_고객연락처_오류.csv';

// 유효한 값 정의
const VALID_VALUES = {
  매물종류: ['아파트', '단독주택', '주상복합', '상가건물', '오피스텔', '빌라/연립', 
            '타운하우스', '근린생활시설', '업무시설', '토지', '건물', '빌딩'],
  거래유형: ['매매', '전세', '월세', '월세/렌트', '렌트', '분양'],
  매물상태: ['거래가능', '거래완료', '거래보류', '매물철회', '확인필요'],
  담당자: ['서지혜', '서을선', '김효석', '정선혜', '박소현', '송영주', '성은미', 
          '정윤식', '장승환', '정이든', '장민아']
};

// 데이터 정제 함수들
const cleaners = {
  // 가격 정제 및 거래유형별 분리
  cleanPrice: (priceStr, transactionType) => {
    if (!priceStr || priceStr === '-' || priceStr === 'O') return { price: '', deposit: '', monthly: '' };
    
    // 숫자만 있는 경우 (45, 150 등) - 거래유형에 잘못 들어간 경우
    if (/^\d+$/.test(priceStr) && parseInt(priceStr) < 10000) {
      return { price: '', deposit: '', monthly: '' }; // 무시
    }
    
    // 정상적인 가격 형식으로 변환
    let cleaned = priceStr.trim();
    
    // "(미정)", "(협의가능)" 등 괄호 안 내용 제거
    cleaned = cleaned.replace(/\s*\(.*?\)/g, '');
    
    // "45억5천" -> "45억 5000만" 형식으로 변환
    cleaned = cleaned.replace(/(\d+)억\s*(\d+)천/g, (match, eok, cheon) => {
      return `${eok}억 ${cheon}000만`;
    });
    
    // "/" 포함된 경우 - 월세
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      return {
        price: '',
        deposit: parts[0].trim(),
        monthly: parts[1].trim()
      };
    }
    
    // 거래유형에 따라 적절한 필드에 할당
    if (transactionType === '월세' || transactionType === '월세/렌트') {
      // 월세인데 /가 없는 경우 - 보증금만 있는 것으로 간주
      return { price: '', deposit: cleaned, monthly: '' };
    } else if (transactionType === '전세') {
      // 전세 - lease_price에 할당
      return { price: '', deposit: cleaned, monthly: '' };
    } else {
      // 매매 또는 기타 - price에 할당
      return { price: cleaned, deposit: '', monthly: '' };
    }
  },
  
  // 날짜 정제
  cleanDate: (dateStr) => {
    if (!dateStr || dateStr === '-') return '';
    
    // 2025-08-02 형식은 그대로
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 2025.08.02 -> 2025-08-02
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
      return dateStr.replace(/\./g, '-');
    }
    
    // 26.03.26 -> 2026-03-26 (2000년대로 가정)
    if (/^\d{2}\.\d{2}\.\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('.');
      const year = parseInt(parts[0]) < 50 ? `20${parts[0]}` : `19${parts[0]}`;
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    
    // "즉시", "협의" 등은 그대로
    if (/즉시|협의|추후/i.test(dateStr)) {
      return dateStr;
    }
    
    // "2025년 10월초" 같은 형식은 그대로
    return dateStr;
  },
  
  // 면적 정제
  cleanArea: (areaStr) => {
    if (!areaStr || areaStr === '-') return '';
    
    // 이미 올바른 형식인 경우
    if (/^\d+\.?\d*\s*\/\s*\d+\.?\d*$/.test(areaStr)) {
      return areaStr.replace(/\s+/g, ' ');
    }
    
    // "(전용률93%)" 같은 추가 정보 제거
    let cleaned = areaStr.replace(/\(.*?\)/g, '').trim();
    
    // "/" 주변 공백 정리
    cleaned = cleaned.replace(/\s*\/\s*/g, ' / ');
    
    return cleaned;
  },
  
  // 매물종류 정제
  cleanPropertyType: (typeStr) => {
    if (!typeStr) return '';
    
    // 알려진 매물종류 매핑
    const typeMap = {
      '공동주택': '아파트',
      '빌라': '빌라/연립',
      '다세대': '빌라/연립',
      '연립': '빌라/연립',
      '상가주택': '상가건물',
      '사무실/상가': '상가건물',
      '빌딩/건물': '빌딩',
      '근생': '근린생활시설',
      '1종근생': '근린생활시설',
      '2종근생': '근린생활시설'
    };
    
    // 복합 유형 처리 (예: "공동주택/아파트")
    const parts = typeStr.split('/');
    for (let part of parts) {
      const trimmed = part.trim();
      if (VALID_VALUES.매물종류.includes(trimmed)) {
        return trimmed;
      }
      if (typeMap[trimmed]) {
        return typeMap[trimmed];
      }
    }
    
    // 매핑 확인
    const mapped = typeMap[typeStr] || typeStr;
    
    // 유효한 값인지 확인
    if (!VALID_VALUES.매물종류.includes(mapped)) {
      return '기타'; // 알 수 없는 경우 '기타'로
    }
    
    return mapped;
  },
  
  // 거래유형 정제
  cleanTransactionType: (typeStr) => {
    if (!typeStr) return '';
    
    // 숫자만 있거나 "억"이 포함된 경우 - 잘못된 데이터
    if (/^\d+$/.test(typeStr) || /억/.test(typeStr)) {
      return '';
    }
    
    // 알려진 거래유형 매핑
    const typeMap = {
      '급매': '매매',
      '반전세': '전세',
      '단기/렌트': '월세/렌트',
      '렌트': '월세/렌트',
      '전매': '매매'
    };
    
    const mapped = typeMap[typeStr] || typeStr;
    
    // 유효한 값인지 확인
    if (!VALID_VALUES.거래유형.includes(mapped)) {
      return '';
    }
    
    return mapped;
  },
  
  // 담당자 정제
  cleanManager: (managerStr) => {
    if (!managerStr) return '';
    
    // 유효한 담당자인지 확인
    if (VALID_VALUES.담당자.includes(managerStr)) {
      return managerStr;
    }
    
    // "대표매물", "회사매물" 등은 빈 값으로
    if (/대표|회사|분양|공동/.test(managerStr)) {
      return '';
    }
    
    return '';
  },
  
  // 매물상태 정제
  cleanStatus: (statusStr) => {
    if (!statusStr) return '확인필요';
    
    // 날짜 형식인 경우 '확인필요'로
    if (/^\d{4}-\d{2}-\d{2}$/.test(statusStr)) {
      return '확인필요';
    }
    
    // 알려진 상태 매핑
    const statusMap = {
      '보류': '거래보류',
      '매물철회': '거래철회',
      '계약완료': '거래완료',
      '확인중': '확인필요',
      '진행가능': '거래가능'
    };
    
    const mapped = statusMap[statusStr] || statusStr;
    
    // 유효한 값인지 확인
    if (!VALID_VALUES.매물상태.includes(mapped)) {
      return '확인필요';
    }
    
    return mapped;
  }
};

// CSV 정제 실행
async function cleanCsvData() {
  console.log('🧹 CSV 데이터 정제 시작...\n');
  
  const cleanedRows = [];
  const errorRows = [];
  const duplicateCheck = new Map();
  let rowNum = 0;
  let cleanedCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csv())
      .on('data', (row) => {
        rowNum++;
        
        // 필수 필드 확인
        const requiredFields = ['담당자', '소재지', '매물명'];
        const missingRequired = requiredFields.filter(field => !row[field] || row[field].trim() === '');
        
        // 모든 필수 필드가 비어있으면 오류 행으로
        if (missingRequired.length === requiredFields.length) {
          errorRows.push({ ...row, _error_reason: '모든 필수 필드 누락' });
          errorCount++;
          return;
        }
        
        // 거래유형 먼저 정제
        const cleanedTransactionType = cleaners.cleanTransactionType(row['거래유형']);
        
        // 거래유형이 비어있고 금액 패턴으로 추론 가능한 경우
        let inferredType = cleanedTransactionType;
        if (!inferredType && row['금액']) {
          if (row['금액'].includes('/')) {
            inferredType = '월세';
          } else {
            inferredType = '매매';
          }
        }
        
        // 가격 정보 정제 (거래유형에 따라 다르게 처리)
        const priceData = cleaners.cleanPrice(row['금액'], inferredType);
        const leaseData = cleaners.cleanPrice(row['임차금액'], '전세');
        
        // 데이터 정제
        const cleanedRow = {
          ...row,
          // 담당자
          '담당자': cleaners.cleanManager(row['담당자']),
          
          // 날짜 필드
          '등록일': cleaners.cleanDate(row['등록일']),
          '거래완료날짜': cleaners.cleanDate(row['거래완료날짜']),
          '입주가능일': cleaners.cleanDate(row['입주가능일']),
          '사용승인': cleaners.cleanDate(row['사용승인']),
          
          // 매물 정보
          '매물종류': cleaners.cleanPropertyType(row['매물종류']),
          '거래유형': inferredType,
          '매물상태': cleaners.cleanStatus(row['매물상태']),
          
          // 가격 정보 (거래유형별로 분리)
          '매매가': priceData.price,
          '전세보증금': priceData.deposit || leaseData.deposit,
          '월세보증금': priceData.deposit,
          '월세': priceData.monthly,
          
          // 면적 정보
          '공급/전용(㎡)': cleaners.cleanArea(row['공급/전용(㎡)']),
          '공급/전용(평)': cleaners.cleanArea(row['공급/전용(평)'])
        };
        
        // 원본 "금액" 필드는 제거 (거래유형별로 분리했으므로)
        delete cleanedRow['금액'];
        delete cleanedRow['임차금액'];
        
        }
        
        // 중복 체크 (소재지 + 동 + 호)
        const duplicateKey = `${row['소재지']}_${row['동']}_${row['호']}`;
        if (duplicateCheck.has(duplicateKey)) {
          // 기존 데이터와 비교하여 더 완전한 데이터 선택
          const existing = duplicateCheck.get(duplicateKey);
          const existingCompleteness = Object.values(existing).filter(v => v && v !== '-').length;
          const currentCompleteness = Object.values(cleanedRow).filter(v => v && v !== '-').length;
          
          if (currentCompleteness > existingCompleteness) {
            // 현재 데이터가 더 완전하면 교체
            duplicateCheck.set(duplicateKey, cleanedRow);
            cleanedRows[existing._index] = cleanedRow;
            cleanedRow._index = existing._index;
          }
          duplicateCount++;
          return;
        }
        
        // 정제된 데이터 저장
        cleanedRow._index = cleanedRows.length;
        duplicateCheck.set(duplicateKey, cleanedRow);
        cleanedRows.push(cleanedRow);
        cleanedCount++;
      })
      .on('end', () => {
        // _index 필드 제거
        cleanedRows.forEach(row => delete row._index);
        
        // 정제된 데이터 저장
        const headers = Object.keys(cleanedRows[0] || {});
        const cleanedCsv = stringify(cleanedRows, { header: true, columns: headers });
        fs.writeFileSync(OUTPUT_FILE, cleanedCsv, 'utf-8');
        
        // 오류 데이터 저장
        if (errorRows.length > 0) {
          const errorHeaders = Object.keys(errorRows[0]);
          const errorCsv = stringify(errorRows, { header: true, columns: errorHeaders });
          fs.writeFileSync(ERROR_FILE, errorCsv, 'utf-8');
        }
        
        // 결과 출력
        console.log('📊 데이터 정제 완료!');
        console.log('================================\n');
        console.log(`📄 총 ${rowNum}개 행 처리`);
        console.log(`✅ 정제 완료: ${cleanedCount}개`);
        console.log(`🔄 중복 제거: ${duplicateCount}개`);
        console.log(`❌ 오류 행: ${errorCount}개\n`);
        
        console.log(`📁 정제된 파일: ${OUTPUT_FILE}`);
        if (errorRows.length > 0) {
          console.log(`📁 오류 파일: ${ERROR_FILE}`);
        }
        
        // 정제 전후 비교
        console.log('\n📈 주요 개선사항:');
        console.log('- 날짜 형식 통일 (YYYY-MM-DD)');
        console.log('- 가격 형식 정리 (억/만원 단위)');
        console.log('- 매물종류/거래유형 표준화');
        console.log('- 중복 데이터 제거');
        console.log('- 잘못된 담당자명 정리');
        
        resolve({ cleanedCount, errorCount, duplicateCount });
      })
      .on('error', (error) => {
        console.error('❌ CSV 파일 처리 오류:', error);
        reject(error);
      });
  });
}

// 스크립트 실행
if (require.main === module) {
  cleanCsvData().catch(console.error);
}

module.exports = { cleanCsvData };