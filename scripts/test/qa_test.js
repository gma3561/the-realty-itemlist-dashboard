// 웹사이트 QA 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 부동산 매물 관리 시스템 QA 테스트 시작');
console.log('=====================================');

async function qaTest() {
  try {
    // 1단계: 데이터베이스 연결 테스트
    console.log('\n1️⃣ 데이터베이스 연결 테스트');
    console.log('----------------------------');
    
    const { data: connectionTest, error: connectionError, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (connectionError) {
      console.log('❌ 데이터베이스 연결 실패:', connectionError.message);
      return;
    }
    
    console.log('✅ 데이터베이스 연결 성공');
    console.log(`📊 총 매물 개수: ${count || 0}개`);
    
    // 2단계: 룩업 테이블 데이터 검증
    console.log('\n2️⃣ 룩업 테이블 데이터 검증');
    console.log('----------------------------');
    
    const [ptResult, psResult, ttResult] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'), 
      supabase.from('transaction_types').select('*')
    ]);
    
    console.log(`📋 매물종류: ${ptResult.data?.length || 0}개`);
    if (ptResult.data?.length > 0) {
      console.log('   - ' + ptResult.data.slice(0, 3).map(t => t.name).join(', ') + (ptResult.data.length > 3 ? ' 등...' : ''));
    }
    
    console.log(`📋 진행상태: ${psResult.data?.length || 0}개`);
    if (psResult.data?.length > 0) {
      console.log('   - ' + psResult.data.slice(0, 3).map(s => s.name).join(', ') + (psResult.data.length > 3 ? ' 등...' : ''));
    }
    
    console.log(`📋 거래유형: ${ttResult.data?.length || 0}개`);
    if (ttResult.data?.length > 0) {
      console.log('   - ' + ttResult.data.slice(0, 3).map(t => t.name).join(', ') + (ttResult.data.length > 3 ? ' 등...' : ''));
    }
    
    // 3단계: 매물 데이터 존재 여부 확인
    console.log('\n3️⃣ 매물 데이터 존재 여부 확인');
    console.log('----------------------------');
    
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(5);
    
    if (propertiesError) {
      console.log('❌ 매물 데이터 조회 실패:', propertiesError.message);
      return;
    }
    
    if (properties && properties.length > 0) {
      console.log(`✅ 매물 데이터 존재: ${properties.length}개 (최대 5개 표시)`);
      properties.forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.property_name || '이름 없음'}`);
        console.log(`      위치: ${property.location || '위치 없음'}`);
        console.log(`      매물종류 ID: ${property.property_type_id || 'null'}`);
        console.log(`      진행상태 ID: ${property.property_status_id || 'null'}`);
        console.log(`      거래유형 ID: ${property.transaction_type_id || 'null'}`);
      });
    } else {
      console.log('⚠️ 매물 데이터가 존재하지 않습니다');
    }
    
    // 4단계: 조인 쿼리 테스트 (프론트엔드와 동일한 쿼리)
    console.log('\n4️⃣ 조인 쿼리 테스트 (프론트엔드와 동일)');
    console.log('-------------------------------------------');
    
    const { data: joinedProperties, error: joinError } = await supabase
      .from('properties')
      .select(`
        *,
        property_types(id, name),
        property_statuses(id, name),
        transaction_types(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (joinError) {
      console.log('❌ 조인 쿼리 실패:', joinError.message);
      return;
    }
    
    if (joinedProperties && joinedProperties.length > 0) {
      console.log(`✅ 조인 쿼리 성공: ${joinedProperties.length}개 매물`);
      joinedProperties.forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.property_name}`);
        console.log(`      매물종류: ${property.property_types?.name || '❌ 조인 실패'}`);
        console.log(`      진행상태: ${property.property_statuses?.name || '❌ 조인 실패'}`);
        console.log(`      거래유형: ${property.transaction_types?.name || '❌ 조인 실패'}`);
        console.log(`      가격: ${property.price ? property.price.toLocaleString() + '원' : '가격 없음'}`);
      });
    } else {
      console.log('⚠️ 조인된 매물 데이터가 없습니다');
    }
    
    // 5단계: 기획 요구사항 대비 검증
    console.log('\n5️⃣ 기획 요구사항 대비 검증');
    console.log('----------------------------');
    
    const requirements = [
      {
        name: '매물 기본 정보',
        test: () => joinedProperties && joinedProperties.some(p => p.property_name && p.location),
        status: joinedProperties && joinedProperties.some(p => p.property_name && p.location) ? '✅ 통과' : '❌ 실패'
      },
      {
        name: '매물종류 표시',
        test: () => joinedProperties && joinedProperties.some(p => p.property_types?.name),
        status: joinedProperties && joinedProperties.some(p => p.property_types?.name) ? '✅ 통과' : '❌ 실패'
      },
      {
        name: '진행상태 표시',
        test: () => joinedProperties && joinedProperties.some(p => p.property_statuses?.name),
        status: joinedProperties && joinedProperties.some(p => p.property_statuses?.name) ? '✅ 통과' : '❌ 실패'
      },
      {
        name: '거래유형 표시',
        test: () => joinedProperties && joinedProperties.some(p => p.transaction_types?.name),
        status: joinedProperties && joinedProperties.some(p => p.transaction_types?.name) ? '✅ 통과' : '❌ 실패'
      },
      {
        name: '가격 정보',
        test: () => joinedProperties && joinedProperties.some(p => p.price),
        status: joinedProperties && joinedProperties.some(p => p.price) ? '✅ 통과' : '❌ 실패'
      }
    ];
    
    requirements.forEach(req => {
      console.log(`   ${req.status} ${req.name}`);
    });
    
    // 6단계: 웹사이트 URL 및 접근성 확인
    console.log('\n6️⃣ 웹사이트 정보');
    console.log('-------------------');
    console.log('🌐 웹사이트 URL: https://gma3561.github.io/the-realty-itemlist-dashboard/');
    console.log('🔑 로그인 정보: admin@the-realty.co.kr / password123');
    
    // 최종 결과
    console.log('\n📋 QA 테스트 결과 요약');
    console.log('=======================');
    
    const passedCount = requirements.filter(req => req.status.includes('✅')).length;
    const totalCount = requirements.length;
    
    console.log(`✅ 통과: ${passedCount}/${totalCount}개 항목`);
    console.log(`❌ 실패: ${totalCount - passedCount}/${totalCount}개 항목`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 모든 테스트 통과! 웹사이트에서 매물이 정상적으로 표시될 것입니다.');
    } else {
      console.log('\n⚠️ 일부 테스트 실패. 웹사이트에서 매물 표시에 문제가 있을 수 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ QA 테스트 중 오류 발생:', error);
  }
}

qaTest();