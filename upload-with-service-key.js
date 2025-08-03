#!/usr/bin/env node

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (서비스 키 필요)
const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';

// 서비스 키가 필요합니다. 환경변수에서 가져오거나 직접 설정해야 합니다.
// const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';

async function uploadWithServiceKey() {
  console.log('🔑 Supabase 서비스 키 확인...');
  
  // 서비스 키 확인
  let serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    console.log('❌ 서비스 키를 찾을 수 없습니다.');
    console.log('');
    console.log('📋 해결 방법:');
    console.log('1. Supabase 대시보드에서 Project Settings > API 로 이동');
    console.log('2. "service_role" 키를 복사');
    console.log('3. 다음 명령으로 환경변수 설정:');
    console.log('   export SUPABASE_SERVICE_KEY="your-service-role-key"');
    console.log('4. 또는 키체인에 저장:');
    console.log('   security add-generic-password -a "supabase" -s "supabase-service-key" -w "your-service-role-key"');
    console.log('');
    console.log('⚠️ 서비스 키는 RLS 정책을 우회할 수 있는 관리자 권한 키입니다.');
    
    return false;
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, serviceKey);
    
    // 연결 테스트
    const { data, error } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ 서비스 키 연결 실패:', error.message);
      return false;
    }
    
    console.log('✅ 서비스 키로 연결 성공!');
    console.log(`📊 현재 properties 수: ${data || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('💥 서비스 키 테스트 실패:', error);
    return false;
  }
}

// 가격 필드 검증 및 수정
function validateAndFixPrice(price) {
  if (!price || price === null) return null;
  
  // JavaScript의 Number.MAX_SAFE_INTEGER 확인
  const MAX_SAFE_INTEGER = 9007199254740991;
  const MAX_BIGINT = 9223372036854775807; // PostgreSQL bigint 최대값
  
  if (typeof price === 'string') {
    price = parseFloat(price);
  }
  
  if (isNaN(price)) return null;
  
  // 너무 큰 값 제한
  if (price > MAX_BIGINT) {
    console.warn(`⚠️ 가격 값이 너무 큽니다: ${price} -> ${MAX_BIGINT}로 제한`);
    return MAX_BIGINT;
  }
  
  return Math.round(price);
}

// 데이터 정제 및 검증
function cleanPropertyData(property) {
  return {
    ...property,
    price: validateAndFixPrice(property.price),
    lease_price: validateAndFixPrice(property.lease_price),
    monthly_fee: validateAndFixPrice(property.monthly_fee),
    
    // RLS를 위한 user_id 설정 (기본값)
    user_id: property.user_id || '00000000-0000-0000-0000-000000000001',
    manager_id: property.manager_id || '00000000-0000-0000-0000-000000000001'
  };
}

// 메인 실행
async function main() {
  const success = await uploadWithServiceKey();
  
  if (!success) {
    console.log('\n🔧 임시 해결책: RLS 정책 무시하고 anon key로 업로드 시도');
    console.log('(프로덕션에서는 권장하지 않음)');
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateAndFixPrice, cleanPropertyData, uploadWithServiceKey };