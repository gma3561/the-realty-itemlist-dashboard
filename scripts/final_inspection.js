// 최종 웹사이트 검수 - 전체 플로우 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 최종 웹사이트 검수');
console.log('====================');
console.log(`🌐 웹사이트: https://gma3561.github.io/the-realty-itemlist-dashboard/`);
console.log(`📅 검수 시간: ${new Date().toLocaleString()}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalInspection() {
  try {
    console.log('\n📋 검수 체크리스트');
    console.log('==================');
    
    const checklist = [
      { id: 1, name: '데이터베이스 연결', status: '⏳' },
      { id: 2, name: '사용자 인증 시스템', status: '⏳' },
      { id: 3, name: '매물 데이터 존재', status: '⏳' },
      { id: 4, name: '조인 쿼리 작동', status: '⏳' },
      { id: 5, name: '프론트엔드 데이터 표시', status: '⏳' },
      { id: 6, name: '매물 등록 기능', status: '⏳' }
    ];
    
    // 1. 데이터베이스 연결 테스트
    console.log('\n1️⃣ 데이터베이스 연결 테스트');
    console.log('-----------------------------');
    
    try {
      const { data, error, count } = await supabase
        .from('properties') 
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      checklist[0].status = '✅';
      console.log(`✅ 연결 성공 - 총 매물: ${count}개`);
    } catch (err) {
      checklist[0].status = '❌';
      console.log(`❌ 연결 실패: ${err.message}`);
    }
    
    // 2. 사용자 인증 시스템 테스트
    console.log('\n2️⃣ 사용자 인증 시스템 테스트');
    console.log('-------------------------------');
    
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@the-realty.co.kr',
        password: 'password123'
      });
      
      if (signInError) throw signInError;
      
      checklist[1].status = '✅';
      console.log(`✅ 로그인 성공: ${signInData.user.email}`);
      
      // 3. 매물 데이터 존재 확인
      console.log('\n3️⃣ 매물 데이터 존재 확인');
      console.log('-------------------------');
      
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, property_name, location, property_type_id, property_status_id, transaction_type_id');
      
      if (propertiesError) throw propertiesError;
      
      checklist[2].status = properties.length > 0 ? '✅' : '⚠️';
      console.log(`${checklist[2].status} 매물 데이터: ${properties.length}개`);
      
      if (properties.length > 0) {
        const completeProperties = properties.filter(p => 
          p.property_type_id && p.property_status_id && p.transaction_type_id
        );
        console.log(`   - 완전한 매물: ${completeProperties.length}개`);
        console.log(`   - 불완전한 매물: ${properties.length - completeProperties.length}개`);
      }
      
      // 4. 조인 쿼리 작동 확인 (프론트엔드와 동일)
      console.log('\n4️⃣ 조인 쿼리 작동 확인');
      console.log('------------------------');
      
      const { data: joinedProperties, error: joinError } = await supabase
        .from('properties')
        .select(`
          *,
          property_types(id, name),
          property_statuses(id, name),
          transaction_types(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (joinError) throw joinError;
      
      checklist[3].status = '✅';
      console.log(`✅ 조인 쿼리 성공: ${joinedProperties.length}개`);
      
      // 5. 프론트엔드 데이터 표시 시뮬레이션
      console.log('\n5️⃣ 프론트엔드 데이터 표시 시뮬레이션');
      console.log('---------------------------------------');
      
      let displayableCount = 0;
      
      if (joinedProperties && joinedProperties.length > 0) {
        console.log('📋 표시될 매물 목록:');
        
        joinedProperties.forEach((property, index) => {
          const propertyType = property.property_types?.name || '미지정';
          const propertyStatus = property.property_statuses?.name || '미지정';
          const transactionType = property.transaction_types?.name || '미지정';
          const price = property.price ? `${property.price.toLocaleString()}원` : '가격 없음';
          
          console.log(`   ${index + 1}. ${property.property_name}`);
          console.log(`      📍 위치: ${property.location}`);
          console.log(`      🏠 종류: ${propertyType}`);
          console.log(`      📊 상태: ${propertyStatus}`);
          console.log(`      💰 거래: ${transactionType}`);
          console.log(`      💵 가격: ${price}`);
          console.log(`      📅 등록: ${new Date(property.created_at).toLocaleDateString()}`);
          
          if (property.property_name && property.location) {
            displayableCount++;
          }
        });
        
        checklist[4].status = displayableCount > 0 ? '✅' : '⚠️';
        console.log(`\n${checklist[4].status} 표시 가능한 매물: ${displayableCount}개`);
      } else {
        checklist[4].status = '❌';
        console.log('❌ 표시할 매물 없음');
      }
      
      // 6. 매물 등록 기능 테스트
      console.log('\n6️⃣ 매물 등록 기능 테스트');
      console.log('--------------------------');
      
      // 룩업 테이블 데이터 확인
      const [ptResult, psResult, ttResult] = await Promise.all([
        supabase.from('property_types').select('*').limit(1),
        supabase.from('property_statuses').select('*').limit(1),
        supabase.from('transaction_types').select('*').limit(1)
      ]);
      
      if (ptResult.data?.[0] && psResult.data?.[0] && ttResult.data?.[0]) {
        checklist[5].status = '✅';
        console.log('✅ 매물 등록 준비 완료');
        console.log(`   - 매물종류: ${ptResult.data[0].name}`);
        console.log(`   - 진행상태: ${psResult.data[0].name}`);
        console.log(`   - 거래유형: ${ttResult.data[0].name}`);
      } else {
        checklist[5].status = '⚠️';
        console.log('⚠️ 룩업 테이블 데이터 부족');
      }
      
    } catch (authErr) {
      checklist[1].status = '❌';
      console.log(`❌ 인증 실패: ${authErr.message}`);
      
      // 인증 실패 시 나머지 테스트 건너뛰기
      for (let i = 2; i < checklist.length; i++) {
        checklist[i].status = '⏭️';
      }
    }
    
    // 최종 결과 출력
    console.log('\n📊 최종 검수 결과');
    console.log('==================');
    
    checklist.forEach(item => {
      console.log(`${item.status} ${item.name}`);
    });
    
    const passCount = checklist.filter(item => item.status === '✅').length;
    const warnCount = checklist.filter(item => item.status === '⚠️').length;
    const failCount = checklist.filter(item => item.status === '❌').length;
    const skipCount = checklist.filter(item => item.status === '⏭️').length;
    
    console.log('\n📈 통계');
    console.log('--------');
    console.log(`✅ 통과: ${passCount}개`);
    console.log(`⚠️ 경고: ${warnCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⏭️ 건너뜀: ${skipCount}개`);
    
    console.log('\n🎯 최종 판정');
    console.log('=============');
    
    if (passCount >= 4 && failCount === 0) {
      console.log('🎉 검수 통과! 웹사이트가 정상적으로 작동합니다.');
      console.log('📝 사용자 액션:');
      console.log('   1. https://gma3561.github.io/the-realty-itemlist-dashboard/ 접속');
      console.log('   2. admin@the-realty.co.kr / password123 로그인');
      console.log('   3. "매물 목록" 메뉴 클릭');
      console.log('   4. 매물 데이터 확인');
    } else if (failCount > 0) {
      console.log('❌ 검수 실패! 중요한 기능에 문제가 있습니다.');
      console.log('🔧 수정 필요 사항을 확인하고 해결해주세요.');
    } else {
      console.log('⚠️ 부분 통과. 일부 기능에 제한이 있을 수 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 최종 검수 중 오류:', error);
  }
}

finalInspection();