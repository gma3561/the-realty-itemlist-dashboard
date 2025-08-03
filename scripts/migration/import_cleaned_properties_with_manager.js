const fs = require('fs');
const path = require('path');

// 현재 직원 목록
const currentRealtors = [
  '김규민', '하상현', '정서연', '정선혜', '박소현', '정연서', 
  '송영주', '정윤식', '성은미', '서을선', '서지혜', '이혜만', '김효석'
];

// 직원 이메일 매핑
const realtorEmailMap = {
  '김규민': 'gyum@the-realty.co.kr',
  '하상현': 'lucas@the-realty.co.kr',
  '정서연': 'yool@the-realty.co.kr',
  '정선혜': 'grace@the-realty.co.kr',
  '박소현': 'sso@the-realty.co.kr',
  '정연서': 'jenny@the-realty.co.kr',
  '송영주': 'joo@the-realty.co.kr',
  '정윤식': 'yun@the-realty.co.kr',
  '성은미': 'mimi@the-realty.co.kr',
  '서을선': 'sun@the-realty.co.kr',
  '서지혜': 'kylie@the-realty.co.kr',
  '이혜만': 'hmlee@the-realty.co.kr',
  '김효석': 'seok@the-realty.co.kr'
};

// 정제된 데이터 파일 읽기
const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));

// 매물 유형 매핑
const propertyTypeMap = {
  'APARTMENT': '550e8400-e29b-41d4-a716-446655440001',
  'OFFICETEL': '550e8400-e29b-41d4-a716-446655440002', 
  'VILLA': '550e8400-e29b-41d4-a716-446655440003',
  'HOUSE': '550e8400-e29b-41d4-a716-446655440004',
  'COMMERCIAL': '550e8400-e29b-41d4-a716-446655440005',
  'MIXED_USE': '550e8400-e29b-41d4-a716-446655440005' // 주상복합도 상가로 분류
};

// 거래 유형 매핑
const transactionTypeMap = {
  'SALE': '650e8400-e29b-41d4-a716-446655440001',
  'LEASE': '650e8400-e29b-41d4-a716-446655440002',
  'RENT': '650e8400-e29b-41d4-a716-446655440003'
};

// 매물 상태 매핑 (모든 매물을 거래가능으로 설정)
const propertyStatusId = '750e8400-e29b-41d4-a716-446655440001'; // 거래가능

// 담당자별 통계
const managerStats = {};

// 정제된 데이터를 더미 데이터 형식으로 변환
const convertedProperties = cleanedProperties.map((property, index) => {
  // 기존 담당자 확인
  let managerName = property.manager_name;
  
  // 현재 직원 명단에 없는 경우 정연서(대표)로 배정
  if (!managerName || !currentRealtors.includes(managerName)) {
    managerName = '정연서';
  }
  
  // 통계 수집
  managerStats[managerName] = (managerStats[managerName] || 0) + 1;
  
  // manager_id 생성
  const managerId = `hardcoded-${realtorEmailMap[managerName]}`;
  
  // 가격 정보 처리
  let price = null;
  let leasePrice = null;
  let monthlyRent = null;
  
  if (property.transaction_type === 'SALE') {
    price = property.sale_price || property.price;
  } else if (property.transaction_type === 'LEASE') {
    leasePrice = property.jeonse_deposit || property.price;
  } else if (property.transaction_type === 'RENT') {
    leasePrice = property.monthly_deposit || property.deposit || 0;
    monthlyRent = property.monthly_rent || property.price;
  }
  
  // 거주자 정보 생성
  const resident = JSON.stringify({
    name: property.owner_name || "",
    phone: property.owner_phone || "",
    email: "",
    address: "",
    notes: ""
  });
  
  // 층 정보 생성
  let floorInfo = '';
  if (property.floor && property.total_floors) {
    floorInfo = `${property.floor}층/${property.total_floors}층`;
  } else if (property.floor) {
    floorInfo = `${property.floor}층`;
  }
  
  // 방/욕실 정보 생성
  let roomBathroom = '';
  if (property.rooms && property.bathrooms) {
    roomBathroom = `${property.rooms}/${property.bathrooms}개`;
  } else if (property.bathrooms) {
    roomBathroom = `방${property.bathrooms}개`;
  }
  
  return {
    id: property.id,
    property_name: property.property_name || `${property.building_name || property.location} ${property.unit_number || ''}`.trim(),
    location: property.location || '',
    property_type_id: propertyTypeMap[property.property_type] || propertyTypeMap['APARTMENT'],
    transaction_type_id: transactionTypeMap[property.transaction_type] || transactionTypeMap['SALE'],
    property_status_id: propertyStatusId,
    price: price,
    lease_price: leasePrice,
    monthly_rent: monthlyRent,
    supply_area_pyeong: property.area_pyeong || null,
    private_area_pyeong: property.area_pyeong ? Math.round(property.area_pyeong * 0.85) : null, // 전용면적 추정
    supply_area_sqm: property.area_m2 || null,
    private_area_sqm: property.area_m2 ? Math.round(property.area_m2 * 0.85) : null, // 전용면적 추정
    floor_info: floorInfo,
    room_bathroom: roomBathroom,
    direction: property.direction || '',
    maintenance_fee_text: property.maintenance_fee ? `${Math.round(property.maintenance_fee / 10000)}만원` : '',
    parking: property.parking || '',
    description: property.special_notes || property.manager_memo || '',
    resident: resident,
    manager_id: managerId,
    created_at: property.registration_date || property.created_at || new Date().toISOString(),
    updated_at: property.updated_at || new Date().toISOString()
  };
});

// dummyProperties.js 파일 생성
const outputContent = `// 정제된 실제 매물 데이터 (${convertedProperties.length}개)
// 생성일: ${new Date().toISOString()}
// 원본 파일: cleaned_properties_2025-08-03.json
// 기존 담당자 유지, 없는 경우 정연서(대표) 배정

export const dummyProperties = ${JSON.stringify(convertedProperties, null, 2)};

// 룩업 테이블 더미 데이터
export const dummyPropertyTypes = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: '아파트' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: '오피스텔' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: '빌라/연립' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: '단독주택' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: '상가' }
];

export const dummyTransactionTypes = [
  { id: '650e8400-e29b-41d4-a716-446655440001', name: '매매' },
  { id: '650e8400-e29b-41d4-a716-446655440002', name: '전세' },
  { id: '650e8400-e29b-41d4-a716-446655440003', name: '월세' }
];

export const dummyPropertyStatuses = [
  { id: '750e8400-e29b-41d4-a716-446655440001', name: '거래가능' },
  { id: '750e8400-e29b-41d4-a716-446655440002', name: '거래보류' },
  { id: '750e8400-e29b-41d4-a716-446655440003', name: '거래완료' }
];
`;

// 백업 생성
const backupPath = path.join(__dirname, '..', 'src', 'data', 'dummyProperties.backup.js');
const originalPath = path.join(__dirname, '..', 'src', 'data', 'dummyProperties.js');

// 기존 파일 백업
if (fs.existsSync(originalPath)) {
  fs.copyFileSync(originalPath, backupPath);
  console.log('✅ 기존 dummyProperties.js 파일을 백업했습니다.');
}

// 새 파일 생성
fs.writeFileSync(originalPath, outputContent, 'utf-8');

console.log(`
📊 매물 데이터 변환 완료
====================================
✅ 총 ${convertedProperties.length}개의 매물 데이터를 변환했습니다.
✅ 파일 위치: src/data/dummyProperties.js
✅ 백업 파일: src/data/dummyProperties.backup.js

📈 매물 통계:
- 아파트: ${cleanedProperties.filter(p => p.property_type === 'APARTMENT').length}개
- 오피스텔: ${cleanedProperties.filter(p => p.property_type === 'OFFICETEL').length}개
- 빌라/연립: ${cleanedProperties.filter(p => p.property_type === 'VILLA').length}개
- 단독주택: ${cleanedProperties.filter(p => p.property_type === 'HOUSE').length}개
- 상가: ${cleanedProperties.filter(p => p.property_type === 'COMMERCIAL').length}개
- 주상복합: ${cleanedProperties.filter(p => p.property_type === 'MIXED_USE').length}개

- 매매: ${cleanedProperties.filter(p => p.transaction_type === 'SALE').length}개
- 전세: ${cleanedProperties.filter(p => p.transaction_type === 'LEASE').length}개
- 월세: ${cleanedProperties.filter(p => p.transaction_type === 'RENT').length}개

🏢 직원별 담당 매물 현황:
`);

// 직원별 배정 수 출력
Object.entries(managerStats).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  console.log(`- ${name}: ${count}개`);
});

// 기존 담당자 중 현재 직원 명단에 없는 사람들 확인
const oldManagers = new Set();
cleanedProperties.forEach(p => {
  if (p.manager_name && !currentRealtors.includes(p.manager_name)) {
    oldManagers.add(p.manager_name);
  }
});

if (oldManagers.size > 0) {
  console.log(`
📌 정연서(대표)에게 재배정된 기존 담당자들:
${Array.from(oldManagers).join(', ')}
`);
}

console.log(`
📝 다음 단계:
1. 애플리케이션을 재시작하여 새 데이터를 확인하세요.
2. 매물 목록 페이지에서 담당자가 올바르게 표시되는지 확인하세요.
3. 기존 담당자가 유지되고, 미지정 매물은 정연서님께 배정되었는지 확인하세요.
`);