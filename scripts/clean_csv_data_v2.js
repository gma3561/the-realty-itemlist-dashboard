const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');

const INPUT_FILE = '/Users/tere.remote/Desktop/더부동산 고객연락처.csv';
const OUTPUT_FILE = '/Users/tere.remote/Desktop/더부동산_고객연락처_정제.csv';
const ERROR_FILE = '/Users/tere.remote/Desktop/더부동산_고객연락처_오류.csv';
const LOOKUP_MAPPING_FILE = '/Users/tere.remote/Desktop/룩업테이블_매핑.json';

// 데이터베이스에 있는 룩업 테이블 값들 (코드 형태로 저장)
const LOOKUP_VALUES = {
  매물종류: {
    '아파트': 'apartment',
    '단독주택': 'house', 
    '주상복합': 'mixed_use',
    '상가건물': 'commercial',
    '오피스텔': 'officetel',
    '빌라/연립': 'villa',
    '타운하우스': 'townhouse',
    '근린생활시설': 'neighborhood',
    '업무시설': 'office',
    '토지': 'land',
    '건물': 'building',
    '빌딩': 'building_large'
  },
  거래유형: {
    '매매': 'sale',
    '전세': 'jeonse',
    '월세': 'monthly',
    '월세/렌트': 'monthly_rent',
    '분양': 'presale'
  },
  매물상태: {
    '거래가능': 'available',
    '거래완료': 'completed',
    '거래보류': 'pending',
    '거래철회': 'cancelled',
    '확인필요': 'needs_check'
  }
};

// 담당자 이메일 매핑
const MANAGER_MAPPING = {
  '서지혜': 'pjh@the-realty.co.kr',
  '서을선': 'ses@the-realty.co.kr',
  '김효석': 'khs@the-realty.co.kr',
  '정선혜': 'jsh@the-realty.co.kr',
  '박소현': 'psh@the-realty.co.kr',
  '송영주': 'syj@the-realty.co.kr',
  '성은미': 'sem@the-realty.co.kr',
  '정윤식': 'jys@the-realty.co.kr',
  '장승환': 'jsh2@the-realty.co.kr',
  '정이든': 'jed@the-realty.co.kr',
  '장민아': 'jma@the-realty.co.kr'
};

// 데이터 정제 함수들
const cleaners = {
  // 가격 파싱 (억/만원 단위를 숫자로 변환)
  parsePrice: (priceStr) => {
    if (!priceStr || priceStr === '-' || priceStr === 'O') return null;
    
    // 협의중, 확인필요 등은 null
    if (/협의|확인|미정/i.test(priceStr)) return null;
    
    let cleaned = priceStr.trim();
    // 괄호 내용 제거
    cleaned = cleaned.replace(/\s*\(.*?\)/g, '');
    
    // 숫자 추출
    let totalPrice = 0;
    
    // 억 단위
    const eokMatch = cleaned.match(/(\d+)\s*억/);
    if (eokMatch) {
      totalPrice += parseInt(eokMatch[1]) * 100000000;
    }
    
    // 천만 단위 (예: 5천)
    const cheonMatch = cleaned.match(/(\d+)\s*천(?!만)/);
    if (cheonMatch) {
      totalPrice += parseInt(cheonMatch[1]) * 10000000;
    }
    
    // 만원 단위
    const manMatch = cleaned.match(/(\d+)\s*만/);
    if (manMatch) {
      totalPrice += parseInt(manMatch[1]) * 10000;
    }
    
    // 단순 숫자만 있는 경우 (월세 등)
    if (totalPrice === 0 && /^\d+$/.test(cleaned)) {
      const num = parseInt(cleaned);
      // 1000 이상이면 만원 단위로 간주
      if (num >= 1000) {
        totalPrice = num * 10000;
      } else {
        // 작은 숫자는 만원 단위 월세로 간주
        totalPrice = num * 10000;
      }
    }
    
    return totalPrice > 0 ? totalPrice : null;
  },
  
  // 거래유형별 가격 분리
  splitPriceByType: (priceStr, transactionType) => {
    const result = {
      sale_price: null,      // 매매가
      jeonse_price: null,    // 전세보증금
      monthly_deposit: null,  // 월세보증금
      monthly_rent: null     // 월세
    };
    
    if (!priceStr || priceStr === '-' || priceStr === 'O') return result;
    
    // "/" 포함된 경우 - 월세 (보증금/월세)
    if (priceStr.includes('/')) {
      const parts = priceStr.split('/');
      result.monthly_deposit = cleaners.parsePrice(parts[0]);
      result.monthly_rent = cleaners.parsePrice(parts[1]);
      return result;
    }
    
    // 거래유형에 따라 적절한 필드에 할당
    const price = cleaners.parsePrice(priceStr);
    
    if (transactionType === 'monthly' || transactionType === 'monthly_rent') {
      result.monthly_deposit = price;
    } else if (transactionType === 'jeonse') {
      result.jeonse_price = price;
    } else if (transactionType === 'sale' || transactionType === 'presale') {
      result.sale_price = price;
    }
    
    return result;
  },
  
  // 날짜 정제
  cleanDate: (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    
    // 이미 올바른 형식
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 2025.08.02 -> 2025-08-02
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
      return dateStr.replace(/\./g, '-');
    }
    
    // 26.03.26 -> 2026-03-26
    if (/^\d{2}\.\d{2}\.\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('.');
      const year = parseInt(parts[0]) < 50 ? `20${parts[0]}` : `19${parts[0]}`;
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    
    // 즉시, 협의 등은 null
    return null;
  },
  
  // 면적 파싱
  parseArea: (areaStr) => {
    if (!areaStr || areaStr === '-') return { supply: null, private: null };
    
    // 추가 정보 제거
    let cleaned = areaStr.replace(/\(.*?\)/g, '').trim();
    
    // "숫자 / 숫자" 형태 파싱
    const match = cleaned.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
    if (match) {
      return {
        supply: parseFloat(match[1]),
        private: parseFloat(match[2])
      };
    }
    
    return { supply: null, private: null };
  },
  
  // 매물종류 정제 및 코드 변환
  cleanPropertyType: (typeStr) => {
    if (!typeStr) return null;
    
    // 복합 형태 처리 (예: "공동주택/아파트")
    const parts = typeStr.split('/');
    for (let part of parts) {
      const trimmed = part.trim();
      
      // 직접 매핑 확인
      if (LOOKUP_VALUES.매물종류[trimmed]) {
        return LOOKUP_VALUES.매물종류[trimmed];
      }
      
      // 유사 매핑
      if (trimmed === '공동주택') return LOOKUP_VALUES.매물종류['아파트'];
      if (trimmed === '빌라' || trimmed === '다세대' || trimmed === '연립') return LOOKUP_VALUES.매물종류['빌라/연립'];
      if (trimmed === '상가주택' || trimmed === '사무실/상가') return LOOKUP_VALUES.매물종류['상가건물'];
      if (trimmed.includes('근생') || trimmed.includes('근린생활')) return LOOKUP_VALUES.매물종류['근린생활시설'];
      if (trimmed === '빌딩/건물' || trimmed === '빌딩') return LOOKUP_VALUES.매물종류['빌딩'];
    }
    
    return null; // 매핑할 수 없는 경우
  },
  
  // 거래유형 정제 및 코드 변환
  cleanTransactionType: (typeStr, priceStr) => {
    if (!typeStr) {
      // 가격 패턴으로 추론
      if (priceStr && priceStr.includes('/')) {
        return LOOKUP_VALUES.거래유형['월세'];
      }
      return null;
    }
    
    // 숫자나 금액이 잘못 들어간 경우
    if (/^\d+$/.test(typeStr) || /억/.test(typeStr)) {
      // 가격 패턴으로 추론
      if (priceStr && priceStr.includes('/')) {
        return LOOKUP_VALUES.거래유형['월세'];
      }
      return LOOKUP_VALUES.거래유형['매매']; // 기본값
    }
    
    // 직접 매핑
    if (LOOKUP_VALUES.거래유형[typeStr]) {
      return LOOKUP_VALUES.거래유형[typeStr];
    }
    
    // 유사 매핑
    if (typeStr === '급매') return LOOKUP_VALUES.거래유형['매매'];
    if (typeStr === '렌트' || typeStr === '단기/렌트') return LOOKUP_VALUES.거래유형['월세/렌트'];
    if (typeStr === '반전세') return LOOKUP_VALUES.거래유형['전세'];
    
    return null;
  },
  
  // 매물상태 정제 및 코드 변환
  cleanPropertyStatus: (statusStr) => {
    if (!statusStr) return LOOKUP_VALUES.매물상태['확인필요'];
    
    // 날짜 형식인 경우
    if (/^\d{4}-\d{2}-\d{2}$/.test(statusStr)) {
      return LOOKUP_VALUES.매물상태['확인필요'];
    }
    
    // 직접 매핑
    if (LOOKUP_VALUES.매물상태[statusStr]) {
      return LOOKUP_VALUES.매물상태[statusStr];
    }
    
    // 유사 매핑
    if (statusStr === '보류' || statusStr.includes('보류')) return LOOKUP_VALUES.매물상태['거래보류'];
    if (statusStr === '매물철회') return LOOKUP_VALUES.매물상태['거래철회'];
    if (statusStr === '계약완료' || statusStr.includes('완료')) return LOOKUP_VALUES.매물상태['거래완료'];
    if (statusStr === '확인중' || statusStr === '확인필요') return LOOKUP_VALUES.매물상태['확인필요'];
    
    return LOOKUP_VALUES.매물상태['확인필요']; // 기본값
  }
};

// CSV 정제 실행
async function cleanCsvData() {
  console.log('🧹 CSV 데이터 정제 시작 (v2)...\n');
  
  const cleanedRows = [];
  const errorRows = [];
  const duplicateCheck = new Map();
  const lookupMapping = {
    propertyTypes: new Set(),
    transactionTypes: new Set(),
    propertyStatuses: new Set(),
    managers: new Set()
  };
  
  let rowNum = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csv())
      .on('data', (row) => {
        rowNum++;
        
        try {
          // 필수 필드 확인
          if (!row['소재지'] || !row['매물명']) {
            errorRows.push({ 
              ...row, 
              _error_row: rowNum,
              _error_reason: '필수 필드(소재지, 매물명) 누락' 
            });
            return;
          }
          
          // 거래유형 정제 (가격 정보도 참고)
          const transactionType = cleaners.cleanTransactionType(row['거래유형'], row['금액']);
          
          // 가격 정보 분리
          const mainPrice = cleaners.splitPriceByType(row['금액'], transactionType);
          const leasePrice = cleaners.splitPriceByType(row['임차금액'], 'jeonse');
          
          // 면적 정보 파싱
          const areaSqm = cleaners.parseArea(row['공급/전용(㎡)']);
          const areaPyeong = cleaners.parseArea(row['공급/전용(평)']);
          
          // 정제된 데이터
          const cleanedRow = {
            // 기본 정보
            '담당자_이메일': MANAGER_MAPPING[row['담당자']] || null,
            '담당자명': row['담당자'] || null,
            
            // 매물 기본정보
            '소재지': row['소재지'],
            '매물명': row['매물명'],
            '동': row['동'] || null,
            '호': row['호'] || null,
            
            // 코드 필드 (룩업 테이블 참조)
            '매물종류_코드': cleaners.cleanPropertyType(row['매물종류']),
            '거래유형_코드': transactionType,
            '매물상태_코드': cleaners.cleanPropertyStatus(row['매물상태']),
            
            // 원본 텍스트 (참고용)
            '매물종류_원본': row['매물종류'],
            '거래유형_원본': row['거래유형'],
            '매물상태_원본': row['매물상태'],
            
            // 가격 정보 (거래유형별로 분리)
            '매매가': mainPrice.sale_price,
            '전세보증금': mainPrice.jeonse_price || leasePrice.jeonse_price,
            '월세보증금': mainPrice.monthly_deposit,
            '월세': mainPrice.monthly_rent,
            
            // 면적 정보
            '공급면적_sqm': areaSqm.supply,
            '전용면적_sqm': areaSqm.private,
            '공급면적_평': areaPyeong.supply,
            '전용면적_평': areaPyeong.private,
            
            // 날짜 정보
            '등록일': cleaners.cleanDate(row['등록일']),
            '거래완료날짜': cleaners.cleanDate(row['거래완료날짜']),
            '입주가능일': row['입주가능일'] || null, // 텍스트 그대로 (즉시, 협의 등)
            '사용승인': cleaners.cleanDate(row['사용승인']),
            
            // 기타 정보
            '해당층_총층': row['해당층/총층'] || null,
            '룸_욕실': row['룸/욕실'] || null,
            '방향': row['방향'] || null,
            '관리비': row['관리비'] || null,
            '주차': row['주차'] || null,
            '특이사항': row['특이사항'] || null,
            '담당자MEMO': row['담당자MEMO'] || null,
            
            // 광고 정보
            '광고상태': row['광고상태'] || null,
            '광고기간': row['광고기간'] || null,
            
            // 소유주 정보
            '소유주': row['소유주(담당)'] || null,
            '소유주_연락처': row['소유주 연락처'] || null,
            
            // 공동중개 정보
            '공동중개': row['공동중개'] || null,
            '공동연락처': row['공동연락처'] || null,
            
            // 메타 정보
            '_원본행번호': rowNum
          };
          
          // 룩업 매핑 수집
          if (cleanedRow['매물종류_코드']) lookupMapping.propertyTypes.add(cleanedRow['매물종류_원본']);
          if (cleanedRow['거래유형_코드']) lookupMapping.transactionTypes.add(cleanedRow['거래유형_원본']);
          if (cleanedRow['매물상태_코드']) lookupMapping.propertyStatuses.add(cleanedRow['매물상태_원본']);
          if (cleanedRow['담당자명']) lookupMapping.managers.add(cleanedRow['담당자명']);
          
          // 중복 체크
          const duplicateKey = `${cleanedRow['소재지']}_${cleanedRow['동']}_${cleanedRow['호']}`;
          if (duplicateCheck.has(duplicateKey)) {
            const existing = duplicateCheck.get(duplicateKey);
            // 더 완전한 데이터 선택 (null이 아닌 필드가 많은 것)
            const existingCount = Object.values(existing).filter(v => v !== null && v !== '').length;
            const currentCount = Object.values(cleanedRow).filter(v => v !== null && v !== '').length;
            
            if (currentCount > existingCount) {
              // 현재 데이터가 더 완전함
              const index = cleanedRows.findIndex(r => r._원본행번호 === existing._원본행번호);
              if (index !== -1) {
                cleanedRows[index] = cleanedRow;
                duplicateCheck.set(duplicateKey, cleanedRow);
              }
            }
            return;
          }
          
          duplicateCheck.set(duplicateKey, cleanedRow);
          cleanedRows.push(cleanedRow);
          
        } catch (error) {
          errorRows.push({ 
            ...row, 
            _error_row: rowNum,
            _error_reason: error.message 
          });
        }
      })
      .on('end', () => {
        // 정제된 데이터 저장
        if (cleanedRows.length > 0) {
          const headers = Object.keys(cleanedRows[0]);
          const cleanedCsv = stringify(cleanedRows, { header: true, columns: headers });
          fs.writeFileSync(OUTPUT_FILE, '\ufeff' + cleanedCsv, 'utf-8'); // BOM 추가 (한글 엑셀 호환)
        }
        
        // 오류 데이터 저장
        if (errorRows.length > 0) {
          const errorHeaders = Object.keys(errorRows[0]);
          const errorCsv = stringify(errorRows, { header: true, columns: errorHeaders });
          fs.writeFileSync(ERROR_FILE, '\ufeff' + errorCsv, 'utf-8');
        }
        
        // 룩업 매핑 정보 저장 (참고용)
        const mappingInfo = {
          총행수: rowNum,
          정제완료: cleanedRows.length,
          오류: errorRows.length,
          중복제거: rowNum - cleanedRows.length - errorRows.length,
          사용된_룩업값: {
            매물종류: Array.from(lookupMapping.propertyTypes),
            거래유형: Array.from(lookupMapping.transactionTypes),
            매물상태: Array.from(lookupMapping.propertyStatuses),
            담당자: Array.from(lookupMapping.managers)
          }
        };
        fs.writeFileSync(LOOKUP_MAPPING_FILE, JSON.stringify(mappingInfo, null, 2), 'utf-8');
        
        // 결과 출력
        console.log('📊 데이터 정제 완료!');
        console.log('================================\n');
        console.log(`📄 총 ${rowNum}개 행 처리`);
        console.log(`✅ 정제 완료: ${cleanedRows.length}개`);
        console.log(`🔄 중복 제거: ${rowNum - cleanedRows.length - errorRows.length}개`);
        console.log(`❌ 오류 행: ${errorRows.length}개\n`);
        
        console.log('📁 생성된 파일:');
        console.log(`  - 정제된 데이터: ${OUTPUT_FILE}`);
        console.log(`  - 오류 데이터: ${ERROR_FILE}`);
        console.log(`  - 룩업 매핑: ${LOOKUP_MAPPING_FILE}\n`);
        
        console.log('✨ 주요 개선사항:');
        console.log('  - 거래유형별 가격 필드 분리 (매매가, 전세보증금, 월세보증금/월세)');
        console.log('  - 룩업 테이블 코드값으로 변환 (매물종류, 거래유형, 매물상태)');
        console.log('  - 날짜 형식 통일 (YYYY-MM-DD)');
        console.log('  - 면적 정보 숫자로 파싱');
        console.log('  - 중복 데이터 제거 (더 완전한 데이터 우선)');
        
        resolve({ 
          cleaned: cleanedRows.length, 
          errors: errorRows.length,
          duplicates: rowNum - cleanedRows.length - errorRows.length
        });
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