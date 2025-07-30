// 더부동산 통합 관리 시스템 더미 데이터 생성 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 유틸리티 함수
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
const randomPhone = () => `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date) => date.toISOString();

// 더미 사용자 데이터 생성
async function generateUsers() {
  console.log('더미 사용자 데이터 생성 중...');
  
  // 관리자 계정
  const adminUser = {
    email: 'admin@the-realty.co.kr',
    name: '관리자',
    password_hash: 'admin123!', // 실제 시스템에서는 암호화된 해시를 저장해야 함
    role_id: 'admin',
    is_active: true
  };
  
  // 직원 계정 리스트
  const employeeNames = ['김지원', '이민준', '박서연', '최준호', '정하은', '강민서', '윤지아', '임준영', '한소연', '오승현'];
  const employees = employeeNames.map((name, index) => ({
    email: `employee${index + 1}@the-realty.co.kr`,
    name,
    password_hash: `employee${index + 1}!`, // 실제 시스템에서는 암호화된 해시를 저장해야 함
    role_id: 'employee',
    is_active: true
  }));
  
  // 모든 사용자 데이터
  const users = [adminUser, ...employees];
  
  // Supabase에 사용자 데이터 삽입
  const { data, error } = await supabase.from('users').insert(users);
  
  if (error) {
    console.error('사용자 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${users.length}명의 사용자 데이터 생성 완료`);
  return data;
}

// 더미 고객 데이터 생성
async function generateCustomers(users) {
  console.log('더미 고객 데이터 생성 중...');
  
  const customerNames = [
    '이영호', '김미영', '박종현', '최수진', '정대현', '강은지', '윤성민', '임지은', '한동현', '오지수',
    '서민우', '나은영', '조현우', '김태리', '장원영', '이재민', '유지민', '신동혁', '황미나', '권준호',
    '노지연', '백승훈', '송미래', '신현진', '류태인', '홍지수', '주영진', '민서연', '곽동훈', '채수빈'
  ];
  
  const sources = ['채널톡', '네이버톡톡', '전화문의', '방문상담', '지인소개', '포털검색', '페이스북', '인스타그램'];
  
  const customers = [];
  
  for (let i = 0; i < 30; i++) {
    const employeeUser = randomElement(users.filter(u => u.role_id === 'employee'));
    
    customers.push({
      name: customerNames[i],
      phone: randomPhone(),
      email: `customer${i + 1}@example.com`,
      source: randomElement(sources),
      notes: `${randomElement(['관심있음', '급함', '투자목적', '직접거주', '시간여유있음', '예산협의가능'])} 고객입니다.`,
      user_id: employeeUser.id
    });
  }
  
  // Supabase에 고객 데이터 삽입
  const { data, error } = await supabase.from('customers').insert(customers);
  
  if (error) {
    console.error('고객 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${customers.length}명의 고객 데이터 생성 완료`);
  return data;
}

// 더미 매물 데이터 생성
async function generateProperties(users, customers) {
  console.log('더미 매물 데이터 생성 중...');
  
  // 룩업 테이블 데이터 조회
  const { data: propertyTypes } = await supabase.from('property_types').select('*');
  const { data: propertyStatuses } = await supabase.from('property_statuses').select('*');
  const { data: transactionTypes } = await supabase.from('transaction_types').select('*');
  const { data: funnelStages } = await supabase.from('funnel_stages').select('*');
  
  const locations = [
    '서울시 강남구 역삼동', '서울시 서초구 반포동', '서울시 용산구 한남동', '서울시 마포구 합정동',
    '서울시 종로구 효자동', '서울시 강서구 마곡동', '서울시 송파구 잠실동', '서울시 중구 명동',
    '경기도 성남시 분당구', '경기도 과천시', '경기도 용인시 수지구', '경기도 고양시 일산동구',
    '인천시 연수구 송도동', '인천시 중구 운서동', '부산시 해운대구', '대구시 수성구'
  ];
  
  const buildingNames = [
    '래미안 아파트', '푸르지오', '자이', '힐스테이트', '더샵', '아이파크', '롯데캐슬', '센트럴파크',
    '파크뷰', '그린빌', '에코타운', '스카이뷰', '미소지움', '서울숲리버', '센트럴타워', '현대홈타운'
  ];
  
  const properties = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 50; i++) {
    const employeeUser = randomElement(users.filter(u => u.role_id === 'employee'));
    const customer = randomElement(customers);
    const propertyType = randomElement(propertyTypes);
    const transactionType = randomElement(transactionTypes);
    const propertyStatus = randomElement(propertyStatuses);
    const funnelStage = randomElement(funnelStages);
    
    const location = randomElement(locations);
    const buildingName = randomElement(buildingNames);
    const unit = `${randomInt(101, 2501)}동 ${randomInt(101, 1501)}호`;
    
    const salePrice = randomInt(50000000, 2000000000);
    const leasePrice = randomInt(10000000, 500000000);
    const monthlyPrice = randomInt(50, 300) * 10000;
    
    const supplyArea = randomInt(20, 200);
    const privateArea = supplyArea * 0.8;
    
    properties.push({
      user_id: employeeUser.id,
      customer_id: customer.id,
      property_status_id: propertyStatus.id,
      funnel_stage_id: funnelStage.id,
      location,
      property_name: `${buildingName} ${unit}`,
      building: buildingName,
      unit,
      property_type_id: propertyType.id,
      transaction_type_id: transactionType.id,
      sale_price: salePrice,
      lease_price: leasePrice,
      price: monthlyPrice,
      supply_area_sqm: supplyArea,
      private_area_sqm: privateArea,
      supply_area_pyeong: supplyArea / 3.3058,
      private_area_pyeong: privateArea / 3.3058,
      floor_info: `${randomInt(1, 25)}층`,
      rooms_bathrooms: `${randomInt(2, 5)}R/${randomInt(1, 3)}B`,
      direction: randomElement(['남향', '동향', '서향', '북향', '남동향', '남서향']),
      maintenance_fee: `${randomInt(5, 50)}만원`,
      parking: `${randomInt(1, 3)}대`,
      move_in_date: randomElement(['즉시입주가능', '협의가능', '2개월 후']),
      special_notes: randomElement(['신축', '역세권', '학군좋음', '한강뷰', '조용한 동네', '공원인접', '교통편리', '주차용이']),
      is_visible_to_all: Math.random() > 0.2, // 80%는 공개, 20%는 비공개
      created_at: formatDate(randomDate(sixMonthsAgo, now))
    });
  }
  
  // Supabase에 매물 데이터 삽입
  const { data, error } = await supabase.from('properties').insert(properties);
  
  if (error) {
    console.error('매물 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${properties.length}개의 매물 데이터 생성 완료`);
  return data;
}

// 더미 퍼널 이벤트 데이터 생성
async function generateFunnelEvents(properties, users) {
  console.log('더미 퍼널 이벤트 데이터 생성 중...');
  
  const { data: funnelStages } = await supabase.from('funnel_stages').select('*');
  const funnelEvents = [];
  
  // 최근 3개월 이내의 날짜
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  for (let property of properties) {
    const employeeUser = users.find(u => u.id === property.user_id);
    const stagesCount = randomInt(1, funnelStages.length);
    
    // 정렬된 퍼널 단계
    const sortedStages = [...funnelStages].sort((a, b) => a.order - b.order);
    const selectedStages = sortedStages.slice(0, stagesCount);
    
    let previousStage = null;
    for (let stage of selectedStages) {
      funnelEvents.push({
        property_id: property.id,
        customer_id: property.customer_id,
        user_id: employeeUser.id,
        stage_id: stage.id,
        previous_stage_id: previousStage ? previousStage.id : null,
        notes: `${stage.name} 단계로 진행되었습니다.`,
        event_date: formatDate(randomDate(threeMonthsAgo, now))
      });
      
      previousStage = stage;
    }
  }
  
  // Supabase에 퍼널 이벤트 데이터 삽입
  const { data, error } = await supabase.from('funnel_events').insert(funnelEvents);
  
  if (error) {
    console.error('퍼널 이벤트 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${funnelEvents.length}개의 퍼널 이벤트 데이터 생성 완료`);
  return data;
}

// 더미 성과 지표 데이터 생성
async function generatePerformanceMetrics(users) {
  console.log('더미 성과 지표 데이터 생성 중...');
  
  const metricTypes = [
    'inquiry_count', 'consultation_count', 'visit_count', 
    'contract_count', 'conversion_rate'
  ];
  
  const timePeriods = ['daily', 'weekly', 'monthly'];
  const performanceMetrics = [];
  
  // 최근 6개월 이내의 날짜
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  // 직원만 선택
  const employees = users.filter(u => u.role_id === 'employee');
  
  for (let user of employees) {
    for (let metricType of metricTypes) {
      for (let timePeriod of timePeriods) {
        const startDate = randomDate(sixMonthsAgo, now);
        let endDate;
        
        // 기간에 따른 종료일 계산
        if (timePeriod === 'daily') {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        } else if (timePeriod === 'weekly') {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
        } else { // monthly
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
        }
        
        // 지표 값 생성
        let metricValue;
        if (metricType === 'conversion_rate') {
          metricValue = randomInt(10, 70) / 100; // 10%~70% 사이
        } else {
          metricValue = randomInt(1, 50); // 1~50 사이의 건수
        }
        
        performanceMetrics.push({
          user_id: user.id,
          metric_type: metricType,
          metric_value: metricValue,
          time_period: timePeriod,
          start_date: formatDate(startDate).split('T')[0], // 날짜만 추출
          end_date: formatDate(endDate).split('T')[0] // 날짜만 추출
        });
      }
    }
  }
  
  // Supabase에 성과 지표 데이터 삽입
  const { data, error } = await supabase.from('performance_metrics').insert(performanceMetrics);
  
  if (error) {
    console.error('성과 지표 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${performanceMetrics.length}개의 성과 지표 데이터 생성 완료`);
  return data;
}

// 더미 성과 목표 데이터 생성
async function generatePerformanceGoals(users) {
  console.log('더미 성과 목표 데이터 생성 중...');
  
  const metricTypes = [
    'inquiry_count', 'consultation_count', 'visit_count', 
    'contract_count', 'conversion_rate'
  ];
  
  const timePeriods = ['monthly', 'quarterly', 'yearly'];
  const performanceGoals = [];
  
  // 현재 날짜
  const now = new Date();
  
  // 회사 전체 목표
  for (let metricType of metricTypes) {
    for (let timePeriod of timePeriods) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      // 기간에 따른 시작일/종료일 계산
      if (timePeriod === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (timePeriod === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      } else { // yearly
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }
      
      // 지표 값 생성
      let targetValue;
      if (metricType === 'conversion_rate') {
        targetValue = randomInt(30, 90) / 100; // 30%~90% 사이
      } else {
        targetValue = randomInt(50, 500); // 50~500 사이의 건수
      }
      
      performanceGoals.push({
        user_id: null, // 회사 전체 목표
        metric_type: metricType,
        target_value: targetValue,
        time_period: timePeriod,
        start_date: formatDate(startDate).split('T')[0], // 날짜만 추출
        end_date: formatDate(endDate).split('T')[0] // 날짜만 추출
      });
    }
  }
  
  // 직원 개인 목표
  const employees = users.filter(u => u.role_id === 'employee');
  
  for (let user of employees) {
    for (let metricType of metricTypes) {
      // 직원은 월간 목표만 설정
      const timePeriod = 'monthly';
      
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // 지표 값 생성
      let targetValue;
      if (metricType === 'conversion_rate') {
        targetValue = randomInt(20, 80) / 100; // 20%~80% 사이
      } else {
        targetValue = randomInt(5, 50); // 5~50 사이의 건수
      }
      
      performanceGoals.push({
        user_id: user.id,
        metric_type: metricType,
        target_value: targetValue,
        time_period: timePeriod,
        start_date: formatDate(startDate).split('T')[0], // 날짜만 추출
        end_date: formatDate(endDate).split('T')[0] // 날짜만 추출
      });
    }
  }
  
  // Supabase에 성과 목표 데이터 삽입
  const { data, error } = await supabase.from('performance_goals').insert(performanceGoals);
  
  if (error) {
    console.error('성과 목표 데이터 생성 오류:', error);
    return null;
  }
  
  console.log(`${performanceGoals.length}개의 성과 목표 데이터 생성 완료`);
  return data;
}

// 메인 실행 함수
async function main() {
  try {
    console.log('더미 데이터 생성 시작...');
    
    // 1. 사용자 데이터 생성
    const users = await generateUsers();
    if (!users) return;
    
    // 2. 고객 데이터 생성
    const customers = await generateCustomers(users);
    if (!customers) return;
    
    // 3. 매물 데이터 생성
    const properties = await generateProperties(users, customers);
    if (!properties) return;
    
    // 4. 퍼널 이벤트 데이터 생성
    await generateFunnelEvents(properties, users);
    
    // 5. 성과 지표 데이터 생성
    await generatePerformanceMetrics(users);
    
    // 6. 성과 목표 데이터 생성
    await generatePerformanceGoals(users);
    
    console.log('모든 더미 데이터 생성 완료!');
  } catch (error) {
    console.error('더미 데이터 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
main();