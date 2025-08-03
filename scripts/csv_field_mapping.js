// CSV 필드와 데이터베이스 필드 매핑
const CSV_TO_DB_MAPPING = {
  // 공동중개 정보 (co_brokers 테이블)
  '공동중개': 'co_brokers.broker_name',
  '공동연락처': 'co_brokers.broker_contact',
  
  // 소유주 정보 (owners 테이블)
  '소유주(담당)': 'owners.name',
  '주민(법인)등록번호': 'owners.id_number',
  '소유주 연락처': 'owners.phone',
  '연락처 관계': 'owners.contact_relation',
  
  // 매물 기본 정보 (properties 테이블)
  '광고상태': 'ad_status', // active, inactive, pending
  '광고기간': 'ad_period',
  '임시매물번호': 'temp_property_number',
  '등록완료번호': 'registered_number',
  '등록일': 'registration_date',
  '거래완료날짜': 'transaction_completed_date',
  
  // 매물 상태 및 위치
  '매물상태': 'property_status_id', // 거래가능, 거래완료 등
  '소재지': 'location',
  '매물명': 'property_name',
  '동': 'building',
  '호': 'unit',
  
  // 매물 유형
  '매물종류': 'property_type_id', // 아파트, 단독주택, 주상복합, 상가건물
  '상가여부': 'is_commercial',
  '거래유형': 'transaction_type_id', // 매매, 전세, 월세
  
  // 가격 정보
  '금액': 'price', // 매매가 또는 전세가
  '임차금액': 'lease_price',
  
  // 면적 정보
  '공급/전용(㎡)': {
    supply_area: 'supply_area_sqm',
    private_area: 'private_area_sqm'
  },
  '공급/전용(평)': {
    supply_area: 'supply_area_pyeong',
    private_area: 'private_area_pyeong'
  },
  
  // 기타 정보
  '해당층/총층': 'floor_info',
  '룸/욕실': 'rooms_bathrooms',
  '방향': 'direction',
  '관리비': 'maintenance_fee',
  '주차': 'parking',
  '입주가능일': 'move_in_date',
  '사용승인': 'approval_date',
  '특이사항': 'special_notes',
  '담당자MEMO': 'manager_memo',
  
  // 임차 정보
  '거주자': 'resident',
  '임차유형': 'lease_type',
  '계약기간': 'contract_period',
  
  // 담당자 정보
  '담당자': 'manager_id', // users 테이블 참조
  
  // CSV에는 있지만 DB에 없는 필드
  'XXX': null, // 용도 불명
  '재등록사유': null, // 별도 테이블 필요할 수 있음
  '사진': null, // property_media 테이블 사용
  '영상': null, // property_media 테이블 사용
  '출연': null // 용도 불명
};

// 데이터 변환 함수
const transformCsvData = (csvRow) => {
  const propertyData = {};
  const ownerData = {};
  const coBrokerData = [];
  
  // 가격 파싱 함수
  const parsePrice = (priceStr) => {
    if (!priceStr) return null;
    
    // "60억 (미정)", "28억 (26억가능)" 형태 처리
    const match = priceStr.match(/(\d+)억\s*(\d+)?/);
    if (match) {
      const eok = parseInt(match[1]) * 100000000;
      const man = match[2] ? parseInt(match[2]) * 10000 : 0;
      return eok + man;
    }
    return null;
  };
  
  // 면적 파싱 함수
  const parseArea = (areaStr) => {
    if (!areaStr) return { supply: null, private: null };
    
    // "184.03㎡ / 171.7㎡" 형태 처리
    const match = areaStr.match(/(\d+\.?\d*)㎡?\s*\/\s*(\d+\.?\d*)㎡?/);
    if (match) {
      return {
        supply: parseFloat(match[1]),
        private: parseFloat(match[2])
      };
    }
    return { supply: null, private: null };
  };
  
  // 평수 파싱 함수
  const parsePyeong = (pyeongStr) => {
    if (!pyeongStr) return { supply: null, private: null };
    
    // "55.66평 / 51.93평" 형태 처리
    const match = pyeongStr.match(/(\d+\.?\d*)평?\s*\/\s*(\d+\.?\d*)평?/);
    if (match) {
      return {
        supply: parseFloat(match[1]),
        private: parseFloat(match[2])
      };
    }
    return { supply: null, private: null };
  };
  
  return { propertyData, ownerData, coBrokerData };
};

module.exports = {
  CSV_TO_DB_MAPPING,
  transformCsvData
};