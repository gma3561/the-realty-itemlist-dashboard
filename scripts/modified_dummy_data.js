// 더부동산 통합 관리 시스템 더미 데이터 생성 스크립트 (수정버전)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 유틸리티 함수
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
const randomPhone = () => `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date) => date.toISOString();

// 역할 데이터 추가
async function addRoleData() {
  console.log('역할 데이터 추가 중...');
  
  const roles = [
    { id: 'admin', name: '관리자', permissions: { all: true }, description: '모든 권한을 가진 관리자' },
    { id: 'employee', name: '직원', permissions: { view_own_properties: true, manage_own_properties: true, view_own_performance: true }, description: '자신의 매물만 관리할 수 있는 일반 직원' }
  ];
  
  for (const role of roles) {
    const { data, error } = await supabase.from('roles').insert([role]).select();
    
    if (error) {
      if (error.code === '23505') { // 중복 키 오류
        console.log(`역할 '${role.id}'는 이미 존재합니다.`);
      } else {
        console.error(`역할 '${role.id}' 추가 오류:`, error);
      }
    } else {
      console.log(`역할 '${role.id}' 추가 완료`);
    }
  }
}

// 직원 데이터 추가
async function addEmployeeData() {
  console.log('직원 데이터 추가 중...');
  
  // 관리자 계정
  const adminUser = {
    email: 'admin@the-realty.co.kr',
    name: '관리자',
    role: 'admin'
  };
  
  // 하드코딩된 관리자들
  const hardcodedAdmins = [
    { email: 'jenny@the-realty.co.kr', name: 'Jenny', role: 'admin' },
    { email: 'lucas@the-realty.co.kr', name: 'Lucas', role: 'admin' },
    { email: 'hmlee@the-realty.co.kr', name: 'Hyungmin Lee', role: 'admin' }
  ];
  
  // 직원 계정 리스트
  const employeeNames = ['김지원', '이민준', '박서연', '최준호', '정하은', '강민서', '윤지아', '임준영', '한소연', '오승현'];
  const employees = employeeNames.map((name, index) => ({
    email: `employee${index + 1}@the-realty.co.kr`,
    name,
    role: 'employee'
  }));
  
  // 모든 사용자 데이터
  const users = [adminUser, ...hardcodedAdmins, ...employees];
  
  for (const user of users) {
    try {
      // 이미 존재하는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`사용자 '${user.email}'는 이미 존재합니다.`);
        continue;
      }
      
      // 새 사용자 추가
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: user.email,
          name: user.name,
          role_id: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        }])
        .select();
      
      if (error) {
        console.error(`사용자 '${user.email}' 추가 오류:`, error);
      } else {
        console.log(`사용자 '${user.email}' 추가 완료`);
      }
    } catch (error) {
      console.error(`사용자 '${user.email}' 처리 중 오류:`, error);
    }
  }
}

// 매물 유형 추가
async function addPropertyTypes() {
  console.log('매물 유형 추가 중...');
  
  const types = [
    '아파트', '오피스텔', '빌라', '단독주택', '상가', '사무실', '토지', '공장/창고'
  ];
  
  for (const type of types) {
    try {
      // 이미 존재하는지 확인
      const { data: existingType } = await supabase
        .from('property_types')
        .select('*')
        .eq('name', type)
        .single();
      
      if (existingType) {
        console.log(`매물 유형 '${type}'은 이미 존재합니다.`);
        continue;
      }
      
      // 새 매물 유형 추가
      const { data, error } = await supabase
        .from('property_types')
        .insert([{
          name: type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error(`매물 유형 '${type}' 추가 오류:`, error);
      } else {
        console.log(`매물 유형 '${type}' 추가 완료`);
      }
    } catch (error) {
      console.error(`매물 유형 '${type}' 처리 중 오류:`, error);
    }
  }
}

// 매물 상태 추가
async function addPropertyStatuses() {
  console.log('매물 상태 추가 중...');
  
  const statuses = [
    '거래가능', '거래보류', '거래완료', '만료', '숨김'
  ];
  
  for (const status of statuses) {
    try {
      // 이미 존재하는지 확인
      const { data: existingStatus } = await supabase
        .from('property_statuses')
        .select('*')
        .eq('name', status)
        .single();
      
      if (existingStatus) {
        console.log(`매물 상태 '${status}'는 이미 존재합니다.`);
        continue;
      }
      
      // 새 매물 상태 추가
      const { data, error } = await supabase
        .from('property_statuses')
        .insert([{
          name: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error(`매물 상태 '${status}' 추가 오류:`, error);
      } else {
        console.log(`매물 상태 '${status}' 추가 완료`);
      }
    } catch (error) {
      console.error(`매물 상태 '${status}' 처리 중 오류:`, error);
    }
  }
}

// 거래 유형 추가
async function addTransactionTypes() {
  console.log('거래 유형 추가 중...');
  
  const types = [
    '매매', '전세', '월세', '단기임대'
  ];
  
  for (const type of types) {
    try {
      // 이미 존재하는지 확인
      const { data: existingType } = await supabase
        .from('transaction_types')
        .select('*')
        .eq('name', type)
        .single();
      
      if (existingType) {
        console.log(`거래 유형 '${type}'은 이미 존재합니다.`);
        continue;
      }
      
      // 새 거래 유형 추가
      const { data, error } = await supabase
        .from('transaction_types')
        .insert([{
          name: type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error(`거래 유형 '${type}' 추가 오류:`, error);
      } else {
        console.log(`거래 유형 '${type}' 추가 완료`);
      }
    } catch (error) {
      console.error(`거래 유형 '${type}' 처리 중 오류:`, error);
    }
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('더미 데이터 추가 시작...');
    
    // 1. 역할 데이터 추가
    await addRoleData();
    
    // 2. 직원 데이터 추가
    await addEmployeeData();
    
    // 3. 매물 유형 추가
    await addPropertyTypes();
    
    // 4. 매물 상태 추가
    await addPropertyStatuses();
    
    // 5. 거래 유형 추가
    await addTransactionTypes();
    
    console.log('기본 더미 데이터 추가 완료!');
    console.log('이제 웹 애플리케이션에서 데이터가 나타나는지 확인해보세요.');
    
  } catch (error) {
    console.error('더미 데이터 추가 중 오류 발생:', error);
  }
}

// 스크립트 실행
main();