const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Service Role Key 사용하여 RLS 우회
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 현재 재직 중인 직원 목록
const currentEmployeeEmails = [
  'gyum@the-realty.co.kr',
  'lucas@the-realty.co.kr',
  'yool@the-realty.co.kr',
  'grace@the-realty.co.kr',
  'sso@the-realty.co.kr',
  'jenny@the-realty.co.kr',
  'joo@the-realty.co.kr',
  'yun@the-realty.co.kr',
  'mimi@the-realty.co.kr',
  'sun@the-realty.co.kr',
  'kylie@the-realty.co.kr',
  'hmlee@the-realty.co.kr',
  'seok@the-realty.co.kr'
];

async function quickUpdateManagers() {
  console.log('🚀 빠른 매니저 업데이트 시작...\n');

  try {
    // 1. 현재 재직자 목록 가져오기
    console.log('📋 재직자 정보 로드...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('email', currentEmployeeEmails);

    if (usersError) {
      console.error('사용자 조회 실패:', usersError);
      return;
    }

    const nameToUserId = {};
    users.forEach(user => {
      nameToUserId[user.name] = user.id;
    });

    console.log(`재직자 ${users.length}명 확인\n`);

    // 2. 총 매물 수 확인
    console.log('🔍 전체 매물 수 확인...');
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    console.log(`전체 매물: ${totalCount}개\n`);

    // 3. 배치 업데이트 준비
    console.log('🔄 매물 업데이트 시작...\n');

    // 재직자 매물 업데이트
    for (const [name, userId] of Object.entries(nameToUserId)) {
      const { error } = await supabase
        .from('properties')
        .update({ manager_id: userId })
        .eq('manager_name', name);

      if (!error) {
        console.log(`✅ ${name} 매물 업데이트 완료`);
      }
    }

    // 퇴사자 및 미지정 매물 업데이트
    console.log('\n🔄 퇴사자 및 미지정 매물 처리...');
    
    // 퇴사자 목록 (현재 직원이 아닌 사람들)
    const { error: retiredError } = await supabase
      .from('properties')
      .update({ 
        manager_id: null,
        manager_name: '담당자 없음' 
      })
      .not('manager_name', 'in', [...Object.keys(nameToUserId), '회사매물', '대표매물'])
      .not('manager_name', 'is', null);

    if (!retiredError) {
      console.log('✅ 퇴사자 매물 → "담당자 없음" 업데이트 완료');
    }

    // 미지정 매물 업데이트
    const { error: unassignedError } = await supabase
      .from('properties')
      .update({ 
        manager_id: null,
        manager_name: '담당자 없음' 
      })
      .or('manager_name.is.null,manager_name.eq.미지정');

    if (!unassignedError) {
      console.log('✅ 미지정 매물 → "담당자 없음" 업데이트 완료');
    }

    // 4. 최종 결과 확인
    console.log('\n\n📊 최종 매물 현황:');
    console.log('=====================================');
    
    // 각 재직자별 매물 수
    for (const user of users) {
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', user.id);
      
      console.log(`${user.name}: ${count}개`);
    }

    // 담당자 없음
    const { count: noManagerCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('manager_name', '담당자 없음');
    
    console.log(`\n담당자 없음: ${noManagerCount}개`);

    // 회사/대표 매물
    const { count: companyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .or('manager_name.eq.회사매물,manager_name.eq.대표매물');
    
    console.log(`회사/대표 매물: ${companyCount}개`);

    // 전체 매물
    const { count: finalTotalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n총 매물: ${finalTotalCount}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 즉시 실행
quickUpdateManagers();