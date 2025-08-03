#!/usr/bin/env node

const fs = require('fs').promises;
const csvParser = require('csv-parser');
const { createReadStream } = require('fs');
const { v4: uuidv4 } = require('uuid');

// CSV 파일명
const CSV_FILE = '더부동산_고객연락처.csv';

// 룩업 테이블 매핑
const PROPERTY_TYPE_MAPPING = {
  '아파트': 'APARTMENT',
  '오피스텔': 'OFFICETEL',
  '빌라': 'VILLA',
  '빌라/연립': 'VILLA',
  '단독주택': 'HOUSE',
  '원룸': 'STUDIO',
  '투룸': 'TWO_ROOM',
  '상가': 'COMMERCIAL',
  '오피스': 'OFFICE',
  '주상복합': 'MIXED_USE',
  '타운하우스': 'TOWNHOUSE'
};

const TRANSACTION_TYPE_MAPPING = {
  '매매': 'SALE',
  '전세': 'JEONSE',
  '월세': 'MONTHLY_RENT',
  '월세/렌트': 'MONTHLY_RENT',
  '단기임대': 'SHORT_TERM'
};

const PROPERTY_STATUS_MAPPING = {
  '거래가능': 'ACTIVE',
  '진행중': 'ACTIVE',
  '광고중': 'ACTIVE',
  '광고완료': 'COMPLETED',
  '거래완료': 'SOLD',
  '광고중지': 'INACTIVE',
  '임시등록': 'PENDING',
  '계약진행': 'IN_PROGRESS'
};

// 기본 담당자 ID
const DEFAULT_MANAGER_ID = '00000000-0000-0000-0000-000000000001';

class CSVMigrationProcessor {
  constructor() {
    this.processedData = [];
    this.errorLog = [];
    this.duplicates = [];
    this.statistics = {
      total: 0,
      success: 0,
      errors: 0,
      warnings: 0,
      duplicates: 0
    };
  }

  // 가격 파싱
  parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string' || priceStr.trim() === '') return null;
    
    // 불필요한 문자 제거
    const cleanPrice = priceStr.replace(/[원,\s]/g, '').trim();
    if (!cleanPrice) return null;
    
    try {
      let amount = 0;
      
      if (cleanPrice.includes('억')) {
        const parts = cleanPrice.split('억');
        const eok = parseFloat(parts[0]) || 0;
        amount += eok * 100000000;
        
        if (parts[1] && parts[1].trim()) {
          const remainder = parts[1].replace(/[^0-9.]/g, '');
          if (remainder) {
            amount += parseFloat(remainder) * 10000;
          }
        }
      } else if (cleanPrice.includes('천만')) {
        const num = parseFloat(cleanPrice.replace('천만', ''));
        amount = num * 10000000;
      } else if (cleanPrice.includes('만')) {
        const num = parseFloat(cleanPrice.replace('만', ''));
        amount = num * 10000;
      } else {
        // 순수 숫자
        const num = parseFloat(cleanPrice.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          // 크기에 따라 단위 추정
          if (num > 1000000) amount = num; // 이미 원 단위
          else if (num > 1000) amount = num * 10000; // 만원 단위
          else amount = num * 100000000; // 억원 단위
        }
      }
      
      return Math.round(amount);
    } catch (error) {
      console.warn(`가격 파싱 실패: ${priceStr}`, error.message);
      return null;
    }
  }

  // 거래유형별 가격 분리
  parsePriceByType(priceStr, transactionType) {
    const result = {
      salePrice: null,
      jeonseDeposit: null,
      monthlyDeposit: null,
      monthlyRent: null
    };

    if (!priceStr) return result;

    // 월세의 경우 "보증금/월세" 형태로 분리되어 있을 수 있음
    if (transactionType === 'MONTHLY_RENT' && priceStr.includes('/')) {
      const parts = priceStr.split('/');
      result.monthlyDeposit = this.parsePrice(parts[0]);
      result.monthlyRent = this.parsePrice(parts[1]);
    } else {
      const price = this.parsePrice(priceStr);
      if (!price) return result;

      switch (transactionType) {
        case 'SALE':
          result.salePrice = price;
          break;
        case 'JEONSE':
          result.jeonseDeposit = price;
          break;
        case 'MONTHLY_RENT':
          // 단일 금액인 경우 임시로 월세로 설정
          result.monthlyRent = price;
          break;
      }
    }

    return result;
  }

  // 날짜 파싱
  parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
    
    try {
      // 다양한 날짜 형식 처리
      const cleanDate = dateStr.trim();
      
      // YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
      const formats = [
        /^(\d{4})[.-/](\d{1,2})[.-/](\d{1,2})$/,
        /^(\d{2})[.-/](\d{1,2})[.-/](\d{1,2})$/
      ];
      
      for (const format of formats) {
        const match = cleanDate.match(format);
        if (match) {
          let year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);
          
          // 2자리 연도를 4자리로 변환
          if (year < 100) {
            year = year > 50 ? 1900 + year : 2000 + year;
          }
          
          // 유효한 날짜인지 확인
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() === year && 
              date.getMonth() === month - 1 && 
              date.getDate() === day) {
            return date.toISOString().split('T')[0];
          }
        }
      }
      
      // 기본 Date 생성자 시도
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        return date.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 면적 파싱
  parseArea(areaStr) {
    if (!areaStr || typeof areaStr !== 'string' || areaStr.trim() === '') return null;
    
    try {
      const cleanArea = areaStr.replace(/[^0-9.]/g, '');
      const area = parseFloat(cleanArea);
      
      if (isNaN(area) || area <= 0) return null;
      
      return Math.round(area * 100) / 100; // 소수점 2자리까지
    } catch (error) {
      return null;
    }
  }

  // 층수 파싱
  parseFloor(floorStr) {
    if (!floorStr || typeof floorStr !== 'string') return null;
    
    const match = floorStr.match(/^(-?\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // 총 층수 파싱
  parseTotalFloors(floorStr) {
    if (!floorStr || typeof floorStr !== 'string') return null;
    
    const match = floorStr.match(/\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // 방 개수 파싱
  parseRooms(roomStr) {
    if (!roomStr || typeof roomStr !== 'string') return null;
    
    const match = roomStr.match(/^(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // 욕실 개수 파싱
  parseBathrooms(roomStr) {
    if (!roomStr || typeof roomStr !== 'string') return 1;
    
    const match = roomStr.match(/\/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  // 중복 체크
  isDuplicate(property) {
    return this.processedData.some(existing => 
      existing.property_name === property.property_name &&
      existing.location === property.location &&
      existing.transaction_type === property.transaction_type
    );
  }

  // 단일 행 처리
  processRow(row, index) {
    try {
      this.statistics.total++;
      
      // 빈 행 건너뛰기
      if (!row || Object.keys(row).length === 0) {
        throw new Error('빈 행');
      }

      // 필수 필드 검증
      const propertyName = row['매물명'] || row['건물명'] || '';
      const location = row['소재지'] || row['위치'] || '';
      const transactionTypeRaw = row['거래유형'] || '';

      if (!propertyName.trim()) {
        throw new Error('매물명 누락');
      }
      
      if (!location.trim()) {
        throw new Error('소재지 누락');
      }

      // 거래유형 매핑
      const transactionType = TRANSACTION_TYPE_MAPPING[transactionTypeRaw] || 'SALE';
      
      // 가격 정보 파싱
      const priceInfo = this.parsePriceByType(row['금액'], transactionType);
      
      // 매물 데이터 생성
      const property = {
        id: uuidv4(),
        
        // 기본 정보
        property_name: propertyName.trim(),
        location: location.trim(),
        building_name: row['동'] || null,
        unit_number: row['호'] || null,
        
        // 매물 유형
        property_type: PROPERTY_TYPE_MAPPING[row['매물종류']] || 'APARTMENT',
        transaction_type: transactionType,
        is_commercial: (row['상가여부'] === 'Y' || row['상가여부'] === '상가'),
        
        // 가격 정보
        sale_price: priceInfo.salePrice,
        jeonse_deposit: priceInfo.jeonseDeposit,
        monthly_deposit: priceInfo.monthlyDeposit,
        monthly_rent: priceInfo.monthlyRent,
        maintenance_fee: this.parsePrice(row['관리비']) || 0,
        
        // 면적 정보
        area_m2: this.parseArea(row['공급/전용(㎡)']) || this.parseArea(row['면적']),
        area_pyeong: this.parseArea(row['공급/전용(평)']) || this.parseArea(row['평수']),
        
        // 층 정보
        floor: this.parseFloor(row['해당층/총층']) || this.parseFloor(row['층']),
        total_floors: this.parseTotalFloors(row['해당층/총층']),
        
        // 방 정보
        rooms: this.parseRooms(row['룸/욕실']) || this.parseRooms(row['방수']),
        bathrooms: this.parseBathrooms(row['룸/욕실']) || 1,
        
        // 기타 정보
        direction: row['방향'] || null,
        parking: row['주차'] || null,
        move_in_date: this.parseDate(row['입주가능일']),
        approval_date: this.parseDate(row['사용승인']),
        
        // 상태 및 관리
        property_status: PROPERTY_STATUS_MAPPING[row['매물상태']] || 'ACTIVE',
        ad_status: PROPERTY_STATUS_MAPPING[row['광고상태']] || 'ACTIVE',
        registration_date: this.parseDate(row['등록일']) || new Date().toISOString().split('T')[0],
        completion_date: this.parseDate(row['거래완료날짜']),
        
        // 담당자 정보
        manager_id: DEFAULT_MANAGER_ID,
        manager_name: row['담당자'] || '미지정',
        manager_phone: row['담당자연락처'] || row['담당자 연락처'] || null,
        
        // 공동중개
        co_broker_name: row['공동중개'] || null,
        co_broker_phone: row['공동연락처'] || null,
        
        // 소유주 정보
        owner_name: row['소유주(담당)'] || row['소유주'] || null,
        owner_phone: row['소유주연락처'] || row['소유주 연락처'] || null,
        
        // 메모 및 특이사항
        special_notes: row['특이사항'] || null,
        manager_memo: row['담당자MEMO'] || row['메모'] || null,
        
        // 메타데이터
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 중복 체크
      if (this.isDuplicate(property)) {
        this.statistics.duplicates++;
        this.duplicates.push({
          row: index + 1,
          property_name: property.property_name,
          location: property.location
        });
        throw new Error('중복 매물');
      }

      // 데이터 검증
      this.validateProperty(property);
      
      this.processedData.push(property);
      this.statistics.success++;
      
      return property;
      
    } catch (error) {
      this.statistics.errors++;
      this.errorLog.push({
        row: index + 1,
        data: row,
        error: error.message
      });
      
      return null;
    }
  }

  // 데이터 검증
  validateProperty(property) {
    // 가격 검증
    if (property.transaction_type === 'SALE' && !property.sale_price) {
      this.statistics.warnings++;
      console.warn(`매매 매물인데 가격 정보 없음: ${property.property_name}`);
    }
    
    if (property.transaction_type === 'JEONSE' && !property.jeonse_deposit) {
      this.statistics.warnings++;
      console.warn(`전세 매물인데 보증금 정보 없음: ${property.property_name}`);
    }
    
    if (property.transaction_type === 'MONTHLY_RENT' && !property.monthly_rent && !property.monthly_deposit) {
      this.statistics.warnings++;
      console.warn(`월세 매물인데 가격 정보 없음: ${property.property_name}`);
    }
  }

  // CSV 파일 처리
  async processCSV(csvFilePath) {
    console.log(`📊 CSV 파일 처리 시작: ${csvFilePath}`);
    
    const csvData = [];
    
    return new Promise((resolve, reject) => {
      createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => csvData.push(data))
        .on('end', () => {
          console.log(`📋 CSV 읽기 완료: ${csvData.length}행`);
          
          // 각 행 처리
          csvData.forEach((row, index) => {
            this.processRow(row, index);
          });
          
          // 결과 출력
          this.printStatistics();
          resolve(this.processedData);
        })
        .on('error', reject);
    });
  }

  // 통계 출력
  printStatistics() {
    console.log('\n📈 처리 결과:');
    console.log(`   전체: ${this.statistics.total}개`);
    console.log(`   성공: ${this.statistics.success}개`);
    console.log(`   실패: ${this.statistics.errors}개`);
    console.log(`   중복: ${this.statistics.duplicates}개`);
    console.log(`   경고: ${this.statistics.warnings}개`);
    console.log(`   성공률: ${((this.statistics.success / this.statistics.total) * 100).toFixed(1)}%`);
  }

  // 결과 저장
  async saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 정제된 데이터 저장
    await fs.writeFile(
      `cleaned_properties_${timestamp}.json`,
      JSON.stringify(this.processedData, null, 2)
    );
    
    // 에러 로그 저장
    if (this.errorLog.length > 0) {
      await fs.writeFile(
        `migration_errors_${timestamp}.json`,
        JSON.stringify(this.errorLog, null, 2)
      );
    }
    
    // 중복 로그 저장
    if (this.duplicates.length > 0) {
      await fs.writeFile(
        `duplicates_${timestamp}.json`,
        JSON.stringify(this.duplicates, null, 2)
      );
    }
    
    // 통계 저장
    await fs.writeFile(
      `migration_statistics_${timestamp}.json`,
      JSON.stringify(this.statistics, null, 2)
    );
    
    console.log(`\n💾 결과 파일 저장:`);
    console.log(`   - cleaned_properties_${timestamp}.json (${this.processedData.length}개)`);
    if (this.errorLog.length > 0) {
      console.log(`   - migration_errors_${timestamp}.json (${this.errorLog.length}개)`);
    }
    if (this.duplicates.length > 0) {
      console.log(`   - duplicates_${timestamp}.json (${this.duplicates.length}개)`);
    }
    console.log(`   - migration_statistics_${timestamp}.json`);
  }
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 CSV 마이그레이션 시작...');
    
    // CSV 파일 존재 확인
    try {
      await fs.access(CSV_FILE);
    } catch (error) {
      console.error(`❌ CSV 파일을 찾을 수 없습니다: ${CSV_FILE}`);
      process.exit(1);
    }
    
    const processor = new CSVMigrationProcessor();
    await processor.processCSV(CSV_FILE);
    await processor.saveResults();
    
    console.log('\n✅ CSV 정제 완료!');
    console.log('다음 단계: Supabase 연결 문제 해결 후 데이터 업로드');
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main();
}

module.exports = CSVMigrationProcessor;