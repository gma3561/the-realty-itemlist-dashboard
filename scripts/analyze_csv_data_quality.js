const fs = require('fs');
const csv = require('csv-parser');

const CSV_FILE_PATH = '/Users/tere.remote/Desktop/더부동산 고객연락처.csv';

// 데이터 품질 분석 결과
const analysisReport = {
  totalRows: 0,
  issues: {
    missingRequired: [],
    invalidFormat: [],
    inconsistentData: [],
    duplicates: [],
    warnings: []
  },
  statistics: {
    담당자별: {},
    매물종류별: {},
    거래유형별: {},
    매물상태별: {},
    가격범위: { min: Infinity, max: 0, avg: 0, count: 0 }
  },
  recommendations: []
};

// 필수 필드 정의
const REQUIRED_FIELDS = ['담당자', '소재지', '매물명', '매물종류', '거래유형', '매물상태'];

// 유효성 검사 함수들
const validators = {
  // 가격 형식 검증
  validatePrice: (priceStr, rowNum) => {
    if (!priceStr || priceStr === '-') return true;
    
    const validFormats = [
      /^\d+억(\s*\d+만)?(\s*\(.*?\))?$/,  // "60억", "28억 (26억가능)"
      /^\d+만$/,                          // "5000만"
      /^협의중$/                          // "협의중"
    ];
    
    const isValid = validFormats.some(format => format.test(priceStr.trim()));
    if (!isValid) {
      analysisReport.issues.invalidFormat.push({
        row: rowNum,
        field: '금액',
        value: priceStr,
        message: `잘못된 가격 형식: "${priceStr}"`
      });
    }
    return isValid;
  },

  // 면적 형식 검증
  validateArea: (areaStr, rowNum, fieldName) => {
    if (!areaStr || areaStr === '-') return true;
    
    // "184.03㎡ / 171.7㎡" 형식 확인
    const validFormat = /^\d+\.?\d*\s*(㎡|평)?\s*\/\s*\d+\.?\d*\s*(㎡|평)?$/;
    
    if (!validFormat.test(areaStr.trim())) {
      analysisReport.issues.invalidFormat.push({
        row: rowNum,
        field: fieldName,
        value: areaStr,
        message: `잘못된 면적 형식: "${areaStr}". 예상 형식: "184.03㎡ / 171.7㎡"`
      });
      return false;
    }
    return true;
  },

  // 날짜 형식 검증
  validateDate: (dateStr, rowNum, fieldName) => {
    if (!dateStr || dateStr === '-') return true;
    
    const validFormats = [
      /^\d{4}-\d{2}-\d{2}$/,     // 2025-08-02
      /^\d{4}\.\d{2}\.\d{2}$/,   // 2025.08.02
      /^즉시.*$/,                 // 즉시입주가능
      /^\d{4}년\s*\d{1,2}월/     // 2025년 10월초
    ];
    
    const isValid = validFormats.some(format => format.test(dateStr.trim()));
    if (!isValid) {
      analysisReport.issues.invalidFormat.push({
        row: rowNum,
        field: fieldName,
        value: dateStr,
        message: `잘못된 날짜 형식: "${dateStr}"`
      });
    }
    return isValid;
  },

  // 담당자 검증
  validateManager: (manager, rowNum) => {
    const validManagers = ['서지혜', '서을선', '김효석', '정선혜'];
    
    if (!validManagers.includes(manager)) {
      analysisReport.issues.warnings.push({
        row: rowNum,
        field: '담당자',
        value: manager,
        message: `알 수 없는 담당자: "${manager}". 시스템에 등록이 필요할 수 있습니다.`
      });
      return false;
    }
    return true;
  },

  // 매물종류 검증
  validatePropertyType: (type, rowNum) => {
    const validTypes = ['아파트', '단독주택', '주상복합', '상가건물', '오피스텔', '빌라', '원룸'];
    
    if (type && !validTypes.includes(type)) {
      analysisReport.issues.warnings.push({
        row: rowNum,
        field: '매물종류',
        value: type,
        message: `예상하지 못한 매물종류: "${type}"`
      });
    }
  },

  // 거래유형 검증
  validateTransactionType: (type, rowNum) => {
    const validTypes = ['매매', '전세', '월세', '급매'];
    
    if (type && !validTypes.includes(type)) {
      analysisReport.issues.warnings.push({
        row: rowNum,
        field: '거래유형',
        value: type,
        message: `예상하지 못한 거래유형: "${type}"`
      });
    }
  }
};

// 데이터 정제 제안 함수
function generateRecommendations() {
  const recommendations = [];
  
  // 필수 필드 누락
  if (analysisReport.issues.missingRequired.length > 0) {
    recommendations.push({
      type: 'CRITICAL',
      message: `${analysisReport.issues.missingRequired.length}개 행에서 필수 필드가 누락되었습니다.`,
      action: '누락된 필드를 채우거나 해당 행을 제외하고 import 하세요.'
    });
  }
  
  // 형식 오류
  if (analysisReport.issues.invalidFormat.length > 0) {
    const priceErrors = analysisReport.issues.invalidFormat.filter(i => i.field === '금액').length;
    const areaErrors = analysisReport.issues.invalidFormat.filter(i => i.field.includes('면적')).length;
    const dateErrors = analysisReport.issues.invalidFormat.filter(i => i.field.includes('일')).length;
    
    if (priceErrors > 0) {
      recommendations.push({
        type: 'HIGH',
        message: `${priceErrors}개의 가격 형식 오류가 있습니다.`,
        action: '가격은 "60억", "28억 5000만", "협의중" 형식으로 통일하세요.'
      });
    }
    
    if (areaErrors > 0) {
      recommendations.push({
        type: 'MEDIUM',
        message: `${areaErrors}개의 면적 형식 오류가 있습니다.`,
        action: '면적은 "184.03㎡ / 171.7㎡" 형식으로 통일하세요.'
      });
    }
    
    if (dateErrors > 0) {
      recommendations.push({
        type: 'MEDIUM',
        message: `${dateErrors}개의 날짜 형식 오류가 있습니다.`,
        action: '날짜는 "2025-08-02" 형식으로 통일하세요.'
      });
    }
  }
  
  // 중복 데이터
  if (analysisReport.issues.duplicates.length > 0) {
    recommendations.push({
      type: 'HIGH',
      message: `${analysisReport.issues.duplicates.length}개의 중복 매물이 발견되었습니다.`,
      action: '중복 매물을 제거하거나 병합하세요.'
    });
  }
  
  // 데이터 일관성
  recommendations.push({
    type: 'INFO',
    message: '데이터 정제 스크립트를 실행하여 자동으로 형식을 통일할 수 있습니다.',
    action: 'node scripts/clean_csv_data.js 실행'
  });
  
  return recommendations;
}

// CSV 분석 실행
async function analyzeCsvData() {
  console.log('🔍 CSV 데이터 품질 분석 시작...\n');
  
  const rows = [];
  const propertyMap = new Map(); // 중복 체크용
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        let rowNum = 0;
        
        rows.forEach((row) => {
          rowNum++;
          analysisReport.totalRows++;
          
          // 1. 필수 필드 체크
          const missingFields = [];
          REQUIRED_FIELDS.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
              missingFields.push(field);
            }
          });
          
          if (missingFields.length > 0) {
            analysisReport.issues.missingRequired.push({
              row: rowNum,
              fields: missingFields,
              message: `필수 필드 누락: ${missingFields.join(', ')}`
            });
          }
          
          // 2. 형식 검증
          validators.validatePrice(row['금액'], rowNum);
          validators.validateArea(row['공급/전용(㎡)'], rowNum, '공급/전용(㎡)');
          validators.validateArea(row['공급/전용(평)'], rowNum, '공급/전용(평)');
          validators.validateDate(row['등록일'], rowNum, '등록일');
          validators.validateDate(row['거래완료날짜'], rowNum, '거래완료날짜');
          validators.validateDate(row['입주가능일'], rowNum, '입주가능일');
          validators.validateDate(row['사용승인'], rowNum, '사용승인');
          
          // 3. 데이터 일관성 검증
          validators.validateManager(row['담당자'], rowNum);
          validators.validatePropertyType(row['매물종류'], rowNum);
          validators.validateTransactionType(row['거래유형'], rowNum);
          
          // 4. 중복 체크 (소재지 + 동 + 호로 체크)
          const propertyKey = `${row['소재지']}_${row['동']}_${row['호']}`;
          if (propertyMap.has(propertyKey)) {
            analysisReport.issues.duplicates.push({
              row: rowNum,
              duplicateOf: propertyMap.get(propertyKey),
              key: propertyKey,
              message: `중복 매물: ${row['매물명']} (${propertyKey})`
            });
          } else {
            propertyMap.set(propertyKey, rowNum);
          }
          
          // 5. 통계 수집
          // 담당자별
          if (row['담당자']) {
            analysisReport.statistics.담당자별[row['담당자']] = 
              (analysisReport.statistics.담당자별[row['담당자']] || 0) + 1;
          }
          
          // 매물종류별
          if (row['매물종류']) {
            analysisReport.statistics.매물종류별[row['매물종류']] = 
              (analysisReport.statistics.매물종류별[row['매물종류']] || 0) + 1;
          }
          
          // 거래유형별
          if (row['거래유형']) {
            analysisReport.statistics.거래유형별[row['거래유형']] = 
              (analysisReport.statistics.거래유형별[row['거래유형']] || 0) + 1;
          }
          
          // 매물상태별
          if (row['매물상태']) {
            analysisReport.statistics.매물상태별[row['매물상태']] = 
              (analysisReport.statistics.매물상태별[row['매물상태']] || 0) + 1;
          }
          
          // 가격 범위
          const priceMatch = row['금액']?.match(/(\d+)억/);
          if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            analysisReport.statistics.가격범위.min = Math.min(analysisReport.statistics.가격범위.min, price);
            analysisReport.statistics.가격범위.max = Math.max(analysisReport.statistics.가격범위.max, price);
            analysisReport.statistics.가격범위.count++;
            analysisReport.statistics.가격범위.avg += price;
          }
        });
        
        // 평균 계산
        if (analysisReport.statistics.가격범위.count > 0) {
          analysisReport.statistics.가격범위.avg /= analysisReport.statistics.가격범위.count;
        }
        
        // 권장사항 생성
        analysisReport.recommendations = generateRecommendations();
        
        // 보고서 출력
        printReport();
        
        resolve(analysisReport);
      })
      .on('error', (error) => {
        console.error('❌ CSV 파일 읽기 오류:', error);
        reject(error);
      });
  });
}

// 보고서 출력
function printReport() {
  console.log('📊 CSV 데이터 품질 분석 보고서');
  console.log('================================\n');
  
  console.log(`📄 총 ${analysisReport.totalRows}개 행 분석 완료\n`);
  
  // 문제점 요약
  console.log('🚨 발견된 문제점:');
  console.log(`  - 필수 필드 누락: ${analysisReport.issues.missingRequired.length}건`);
  console.log(`  - 형식 오류: ${analysisReport.issues.invalidFormat.length}건`);
  console.log(`  - 중복 데이터: ${analysisReport.issues.duplicates.length}건`);
  console.log(`  - 경고: ${analysisReport.issues.warnings.length}건\n`);
  
  // 통계
  console.log('📈 데이터 통계:');
  console.log('\n담당자별 매물 수:');
  Object.entries(analysisReport.statistics.담당자별).forEach(([manager, count]) => {
    console.log(`  - ${manager}: ${count}건`);
  });
  
  console.log('\n매물종류별 분포:');
  Object.entries(analysisReport.statistics.매물종류별).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}건`);
  });
  
  console.log('\n거래유형별 분포:');
  Object.entries(analysisReport.statistics.거래유형별).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}건`);
  });
  
  console.log('\n매물상태별 분포:');
  Object.entries(analysisReport.statistics.매물상태별).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}건`);
  });
  
  console.log('\n가격 범위:');
  console.log(`  - 최소: ${analysisReport.statistics.가격범위.min}억원`);
  console.log(`  - 최대: ${analysisReport.statistics.가격범위.max}억원`);
  console.log(`  - 평균: ${analysisReport.statistics.가격범위.avg.toFixed(1)}억원\n`);
  
  // 권장사항
  console.log('💡 권장사항:');
  analysisReport.recommendations.forEach(rec => {
    console.log(`\n[${rec.type}] ${rec.message}`);
    console.log(`  → ${rec.action}`);
  });
  
  // 상세 문제점 (일부만 표시)
  if (analysisReport.issues.missingRequired.length > 0) {
    console.log('\n\n❌ 필수 필드 누락 예시 (최대 5개):');
    analysisReport.issues.missingRequired.slice(0, 5).forEach(issue => {
      console.log(`  행 ${issue.row}: ${issue.message}`);
    });
  }
  
  if (analysisReport.issues.invalidFormat.length > 0) {
    console.log('\n❌ 형식 오류 예시 (최대 5개):');
    analysisReport.issues.invalidFormat.slice(0, 5).forEach(issue => {
      console.log(`  행 ${issue.row}: ${issue.message}`);
    });
  }
  
  if (analysisReport.issues.duplicates.length > 0) {
    console.log('\n❌ 중복 데이터 예시 (최대 5개):');
    analysisReport.issues.duplicates.slice(0, 5).forEach(issue => {
      console.log(`  행 ${issue.row}: ${issue.message}`);
    });
  }
  
  // 전체 보고서 파일로 저장
  const reportPath = '/Users/tere.remote/the-realty-itemlist-dashboard/csv_analysis_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(analysisReport, null, 2));
  console.log(`\n\n📁 전체 분석 보고서가 저장되었습니다: ${reportPath}`);
}

// 스크립트 실행
if (require.main === module) {
  analyzeCsvData().catch(console.error);
}

module.exports = { analyzeCsvData };