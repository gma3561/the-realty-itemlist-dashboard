const fs = require('fs');
const path = require('path');

// 직원 목록 (realtorList.js 내용을 직접 포함)
const realtorList = [
  { id: 1, name: '김규민', email: 'gyum@the-realty.co.kr', role: 'admin' },
  { id: 2, name: '하상현', email: 'lucas@the-realty.co.kr', role: 'admin' },
  { id: 3, name: '정서연', email: 'yool@the-realty.co.kr', role: 'user' },
  { id: 4, name: '정선혜', email: 'grace@the-realty.co.kr', role: 'user' },
  { id: 5, name: '박소현', email: 'sso@the-realty.co.kr', role: 'user' },
  { id: 6, name: '정연서', email: 'jenny@the-realty.co.kr', role: 'admin' },
  { id: 7, name: '송영주', email: 'joo@the-realty.co.kr', role: 'user' },
  { id: 8, name: '정윤식', email: 'yun@the-realty.co.kr', role: 'user' },
  { id: 9, name: '성은미', email: 'mimi@the-realty.co.kr', role: 'user' },
  { id: 10, name: '서을선', email: 'sun@the-realty.co.kr', role: 'user' },
  { id: 11, name: '서지혜', email: 'kylie@the-realty.co.kr', role: 'user' },
  { id: 12, name: '이혜만', email: 'hmlee@the-realty.co.kr', role: 'user' },
  { id: 13, name: '김효석', email: 'seok@the-realty.co.kr', role: 'user' }
];

// 정제된 데이터 파일 읽기
const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));

// 매물 유형 매핑
const propertyTypeMap = {
  'APARTMENT': '550e8400-e29b-41d4-a716-446655440001',
  'OFFICETEL': '550e8400-e29b-41d4-a716-446655440002', 
  'VILLA': '550e8400-e29b-41d4-a716-446655440003',
  'HOUSE': '550e8400-e29b-41d4-a716-446655440004',
  'COMMERCIAL': '550e8400-e29b-41d4-a716-446655440005'
};

// 거래 유형 매핑
const transactionTypeMap = {
  'SALE': '650e8400-e29b-41d4-a716-446655440001',
  'LEASE': '650e8400-e29b-41d4-a716-446655440002',
  'RENT': '650e8400-e29b-41d4-a716-446655440003'
};

// 매물 상태 매핑 (모든 매물을 거래가능으로 설정)
const propertyStatusId = '750e8400-e29b-41d4-a716-446655440001'; // 거래가능

// 직원 이메일 목록 (manager_id로 사용)
const realtorEmails = realtorList.map(r => `hardcoded-${r.email}`);

// 정제된 데이터를 더미 데이터 형식으로 변환
const convertedProperties = cleanedProperties.map((property, index) => {
  // 랜덤하게 직원 배정
  const managerId = realtorEmails[index % realtorEmails.length];
  
  // 가격 정보 처리
  let price = null;
  let leasePrice = null;
  let monthlyRent = null;
  
  if (property.transaction_type === 'SALE') {
    price = property.price;
  } else if (property.transaction_type === 'LEASE') {
    leasePrice = property.price;
  } else if (property.transaction_type === 'RENT') {
    leasePrice = property.deposit || 0;
    monthlyRent = property.monthly_rent || property.price;
  }
  
  // 거주자 정보 생성
  const resident = JSON.stringify({
    name: property.resident_name || "",
    phone: property.resident_phone || "",
    email: "",
    address: "",
    notes: ""
  });
  
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
    supply_area_pyeong: property.supply_area_pyeong || null,
    private_area_pyeong: property.private_area_pyeong || null,
    supply_area_sqm: property.supply_area_sqm || null,
    private_area_sqm: property.private_area_sqm || null,
    floor_info: property.floor_info || '',
    room_bathroom: property.room_bathroom || '',
    direction: property.direction || '',
    maintenance_fee_text: property.maintenance_fee_text || '',
    parking: property.parking || '',
    description: property.description || '',
    resident: resident,
    manager_id: managerId,
    created_at: property.registration_date || new Date().toISOString(),
    updated_at: property.registration_date || new Date().toISOString()
  };
});

// dummyProperties.js 파일 생성
const outputContent = `// 정제된 실제 매물 데이터 (${convertedProperties.length}개)
// 생성일: ${new Date().toISOString()}
// 원본 파일: cleaned_properties_2025-08-03.json

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

- 매매: ${cleanedProperties.filter(p => p.transaction_type === 'SALE').length}개
- 전세: ${cleanedProperties.filter(p => p.transaction_type === 'LEASE').length}개
- 월세: ${cleanedProperties.filter(p => p.transaction_type === 'RENT').length}개

🏢 직원별 배정 현황:
`);

// 직원별 배정 수 계산
const managerCounts = {};
convertedProperties.forEach(prop => {
  managerCounts[prop.manager_id] = (managerCounts[prop.manager_id] || 0) + 1;
});

Object.entries(managerCounts).forEach(([managerId, count]) => {
  const email = managerId.replace('hardcoded-', '');
  const realtor = realtorList.find(r => r.email === email);
  console.log(`- ${realtor?.name || email}: ${count}개`);
});

console.log(`
📝 다음 단계:
1. 애플리케이션을 재시작하여 새 데이터를 확인하세요.
2. 매물 목록 페이지에서 1,468개의 실제 매물이 표시되는지 확인하세요.
3. 각 직원별로 매물이 균등하게 배분되었는지 확인하세요.
`);