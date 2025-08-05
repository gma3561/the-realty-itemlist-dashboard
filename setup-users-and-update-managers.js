const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 현재 재직 중인 직원 목록
const currentEmployees = [
  { name: '김규민', email: 'gyum@the-realty.co.kr' },
  { name: '하상현', email: 'lucas@the-realty.co.kr' },
  { name: '정서연', email: 'yool@the-realty.co.kr' },
  { name: '정선혜', email: 'grace@the-realty.co.kr' },
  { name: '박소현', email: 'sso@the-realty.co.kr' },
  { name: '정연서', email: 'jenny@the-realty.co.kr' },
  { name: '송영주', email: 'joo@the-realty.co.kr' },
  { name: '정윤식', email: 'yun@the-realty.co.kr' },
  { name: '성은미', email: 'mimi@the-realty.co.kr' },
  { name: '서을선', email: 'sun@the-realty.co.kr' },
  { name: '서지혜', email: 'kylie@the-realty.co.kr' },
  { name: '이혜만', email: 'hmlee@the-realty.co.kr' },
  { name: '김효석', email: 'seok@the-realty.co.kr' }
];

async function setupUsersAndUpdateManagers() {
  console.log('🔧 사용자 설정 및 매니저 업데이트 시작...\n');

  try {
    // 1. 현재 users 테이블 확인
    console.log('📋 현재 Users 테이블 상태 확인...');
    const { count: existingUserCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`현재 등록된 사용자: ${existingUserCount}명\n`);

    // 2. 새로운 사용자 추가
    console.log('👥 직원 계정 생성...');
    
    for (const employee of currentEmployees) {
      // 이미 존재하는지 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', employee.email)
        .single();

      if (!existing) {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            email: employee.email,
            name: employee.name,
            role: 'manager'
            // Google OAuth 로그인 사용 - password 필드 없음
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ ${employee.name} 생성 실패:`, error.message);
        } else {
          console.log(`✅ ${employee.name} (${employee.email}) 계정 생성 완료`);
        }
      } else {
        console.log(`⏩ ${employee.name} 이미 존재 (ID: ${existing.id})`);
      }
    }

    // 3. 생성된 사용자 목록 가져오기
    console.log('\n📋 등록된 사용자 목록 확인...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email');

    if (usersError) {
      console.error('사용자 목록 조회 실패:', usersError);
      return;
    }

    // 이름 -> user ID 매핑 생성
    const nameToUserId = {};
    users.forEach(user => {
      nameToUserId[user.name] = user.id;
    });

    console.log(`\n등록된 사용자: ${users.length}명`);
    users.forEach(user => {
      console.log(`   - ${user.name}: ${user.id}`);
    });

    // 4. Properties 테이블의 매니저 업데이트
    console.log('\n\n🔄 매물 담당자 업데이트 시작...');
    
    // 전체 매물 가져오기
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, manager_name');

    if (propError) {
      console.error('매물 조회 실패:', propError);
      return;
    }

    console.log(`총 ${properties.length}개 매물 처리 중...`);

    // 통계를 위한 카운터
    let updatedCount = 0;
    let retiredCount = 0;
    let companyCount = 0;
    let unassignedCount = 0;

    // 배치 업데이트를 위한 준비
    const updates = [];
    
    for (const property of properties) {
      let newManagerId = null;
      let newManagerName = property.manager_name;

      if (!property.manager_name || property.manager_name === '미지정') {
        // 미지정인 경우
        newManagerName = '담당자 없음';
        unassignedCount++;
      } else if (property.manager_name === '회사매물' || property.manager_name === '대표매물') {
        // 회사/대표 매물인 경우 그대로 유지
        companyCount++;
      } else if (nameToUserId[property.manager_name]) {
        // 현재 재직 중인 직원인 경우
        newManagerId = nameToUserId[property.manager_name];
        updatedCount++;
      } else {
        // 퇴사자인 경우
        newManagerName = '담당자 없음';
        retiredCount++;
      }

      updates.push({
        id: property.id,
        manager_id: newManagerId,
        manager_name: newManagerName
      });
    }

    // 배치 업데이트 실행
    console.log('\n📝 데이터베이스 업데이트 중...');
    
    // 100개씩 나누어 업데이트
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { error } = await supabase
          .from('properties')
          .update({
            manager_id: update.manager_id,
            manager_name: update.manager_name
          })
          .eq('id', update.id);

        if (error) {
          console.error(`매물 ${update.id} 업데이트 실패:`, error.message);
        }
      }
      
      console.log(`진행률: ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
    }

    // 5. 결과 요약
    console.log('\n\n✅ 작업 완료!');
    console.log('=====================================');
    console.log(`📊 처리 결과:`);
    console.log(`   - 재직자 매물: ${updatedCount}개 (실제 user ID 연결)`);
    console.log(`   - 퇴사자 매물: ${retiredCount}개 → "담당자 없음"`);
    console.log(`   - 회사/대표 매물: ${companyCount}개 (유지)`);
    console.log(`   - 미지정 매물: ${unassignedCount}개 → "담당자 없음"`);
    console.log(`   - 총 처리: ${properties.length}개`);

    // 6. 업데이트 후 현황 확인
    console.log('\n\n📋 업데이트 후 담당자별 매물 현황:');
    console.log('=====================================');
    
    for (const user of users) {
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', user.id);
      
      console.log(`${user.name}: ${count}개`);
    }

    // 담당자 없음 확인
    const { count: noManagerCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('manager_name', '담당자 없음');
    
    console.log(`담당자 없음: ${noManagerCount}개`);

    // 회사/대표 매물 확인
    const { count: companyPropertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .or('manager_name.eq.회사매물,manager_name.eq.대표매물');
    
    console.log(`회사/대표 매물: ${companyPropertyCount}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행 확인
console.log('⚠️  주의: 이 스크립트는 데이터베이스를 수정합니다.');
console.log('계속하려면 10초 후에 실행됩니다...\n');

setTimeout(() => {
  setupUsersAndUpdateManagers();
}, 10000);