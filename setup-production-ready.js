import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.log('❌ VITE_SUPABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('❌ SUPABASE_SERVICE_KEY가 설정되지 않았습니다.');
  console.log('   Supabase 대시보드 > Settings > API > service_role key를 복사하여');
  console.log('   .env.local 파일에 SUPABASE_SERVICE_KEY=your-service-key 로 추가하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 더 리얼티 시스템 프로덕션 준비 시작');
console.log('=' .repeat(50));

async function step1_CleanDatabase() {
  console.log('\n1️⃣ 기존 더미 데이터 정리 중...');
  
  try {
    // 매물 데이터 삭제
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('   ✅ 기존 매물 데이터 삭제 완료');
    
    // 코멘트 삭제  
    await supabase.from('property_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('   ✅ 기존 코멘트 삭제 완료');
    
    // 상태 이력 삭제
    await supabase.from('property_status_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('   ✅ 기존 상태 이력 삭제 완료');
    
  } catch (error) {
    console.log('   ⚠️ 일부 데이터 삭제 중 오류:', error.message);
  }
}

async function step2_CreateRealUsers() {
  console.log('\n2️⃣ 실제 사용자 계정 생성 중...');
  
  const REAL_USERS = [
    {
      email: 'Lucas@the-realty.co.kr',
      name: '하상현',
      role: 'admin',
      password: 'TheRealty2024!',
      phone: '010-1234-5678'
    },
    {
      email: 'sso@the-realty.co.kr', 
      name: '박소현',
      role: 'user',
      password: 'TheRealty2024!',
      phone: '010-2345-6789'  
    },
    {
      email: 'manager@the-realty.co.kr',
      name: '김매니저',
      role: 'user', 
      password: 'TheRealty2024!',
      phone: '010-3456-7890'
    }
  ];

  for (const userData of REAL_USERS) {
    try {
      // Auth 사용자 생성 또는 업데이트
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.name,
          role: userData.role
        }
      });

      let userId;
      
      if (authError && authError.message.includes('already registered')) {
        console.log(`   ⚠️ ${userData.email} 이미 존재 - 정보 업데이트`);
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === userData.email);
        userId = existingUser?.id;
      } else if (authError) {
        console.log(`   ❌ ${userData.name} Auth 생성 실패:`, authError.message);
        continue;
      } else {
        userId = authUser.user.id;
        console.log(`   ✅ ${userData.name} Auth 계정 생성 완료`);
      }

      if (userId) {
        // Public 사용자 테이블에 upsert
        const { error: publicError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (publicError) {
          console.log(`   ❌ ${userData.name} Public 테이블 실패:`, publicError.message);
        } else {
          console.log(`   ✅ ${userData.name} 사용자 정보 저장 완료`);
        }
      }

    } catch (error) {
      console.error(`   ❌ ${userData.name} 처리 중 오류:`, error.message); 
    }
  }
}

async function step3_CreateSampleProperties() {
  console.log('\n3️⃣ 실제 매물 샘플 데이터 생성 중...');

  // 사용자 정보 가져오기
  const { data: users } = await supabase.from('users').select('id, name, email');
  
  if (!users || users.length === 0) {
    console.log('   ❌ 사용자가 없습니다. 2단계를 먼저 완료하세요.');
    return;
  }

  const userMapping = {};
  users.forEach(user => userMapping[user.name] = user.id);

  const SAMPLE_PROPERTIES = [
    {
      property_name: '래미안 대치팰리스 84㎡',
      location: '서울특별시 강남구 대치동',
      building_name: '래미안 대치팰리스',
      room_number: '101동 1205호',
      property_type: 'apt',
      transaction_type: 'sale',
      property_status: 'available',
      area_pyeong: 25.4,
      area_m2: 84,
      floor_current: 12,
      floor_total: 25,
      room_count: 3,
      bath_count: 2,
      price: 1850000000,
      monthly_fee: 450000,
      description: '대치동 역세권 프리미엄 아파트. 남향, 리모델링 완료, 즉시 입주 가능.',
      special_notes: '즉시 입주 가능, 주차 2대, 개별난방',
      available_date: '2025-01-15',
      manager_name: '하상현',
      owner_name: '김소유',
      owner_phone: '010-1111-2222'
    },
    {
      property_name: '서초 아크로타워 전세',
      location: '서울특별시 서초구 서초동',
      building_name: '아크로타워',
      room_number: '205동 805호',
      property_type: 'apt', 
      transaction_type: 'lease',
      property_status: 'available',
      area_pyeong: 32.1,
      area_m2: 106,
      floor_current: 8,
      floor_total: 20,
      room_count: 4,
      bath_count: 2,
      lease_price: 1200000000,
      monthly_fee: 350000,
      description: '서초역 도보 3분. 신축 아파트, 한강뷰.',
      special_notes: '신축, 한강뷰, 고층, 주차 2대',
      available_date: '2025-02-01',
      manager_name: '박소현',
      owner_name: '이집주',
      owner_phone: '010-2222-3333',
      customer_name: '정고객',
      customer_phone: '010-4444-5555'
    },
    {
      property_name: '역삼동 오피스텔',
      location: '서울특별시 강남구 역삼동',
      building_name: '역삼 트윈타워',
      room_number: 'A동 1205호',
      property_type: 'officetel',
      transaction_type: 'monthly',
      property_status: 'available',
      area_pyeong: 15.2,
      area_m2: 50,
      floor_current: 12,
      floor_total: 25,
      room_count: 1,
      bath_count: 1,
      price: 100000000,
      monthly_fee: 180000,
      description: '강남역 도보 5분. 신축 오피스텔.',
      special_notes: '신축, 강남역 근처, 피트니스 센터',
      available_date: '2025-01-10',
      manager_name: '김매니저',
      owner_name: '김투자',
      owner_phone: '010-4444-5555'  
    }
  ];

  for (const propData of SAMPLE_PROPERTIES) {
    try {
      const managerId = userMapping[propData.manager_name];
      
      const { error } = await supabase
        .from('properties')
        .insert({
          ...propData,
          manager_id: managerId,
          user_id: managerId,
          created_by: managerId,
          updated_by: managerId,
          view_count: 0,
          exclusive_type: 'general',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.log(`   ❌ ${propData.property_name}:`, error.message);
      } else {
        console.log(`   ✅ ${propData.property_name} 생성 완료`);
      }
    } catch (error) {
      console.log(`   ❌ ${propData.property_name} 오류:`, error.message);
    }
  }
}

async function step4_VerifySetup() {
  console.log('\n4️⃣ 설정 완료 확인 중...');

  // 사용자 확인
  const { data: users, count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact' });

  console.log(`   👥 사용자: ${userCount}명`);
  users?.forEach(user => {
    console.log(`      - ${user.name} (${user.email}) - ${user.role}`);
  });

  // 매물 확인
  const { count: propCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  console.log(`   🏠 매물: ${propCount}개`);

  // 상태별 통계
  const { data: statusData } = await supabase
    .from('properties')
    .select('property_status');

  if (statusData) {
    const statusCount = statusData.reduce((acc, item) => {
      acc[item.property_status] = (acc[item.property_status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   📊 매물 상태:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`      - ${status}: ${count}개`);
    });
  }
}

async function main() {
  try {
    await step1_CleanDatabase();
    await step2_CreateRealUsers();  
    await step3_CreateSampleProperties();
    await step4_VerifySetup();

    console.log('\n🎉 더 리얼티 시스템 프로덕션 준비 완료!');
    console.log('=' .repeat(50));
    console.log('\n📋 로그인 정보:');
    console.log('   - 관리자: Lucas@the-realty.co.kr / TheRealty2024!');
    console.log('   - 직원1: sso@the-realty.co.kr / TheRealty2024!');
    console.log('   - 직원2: manager@the-realty.co.kr / TheRealty2024!');
    console.log('\n✅ 이제 실제 운영 환경으로 사용할 수 있습니다!');
    
  } catch (error) {
    console.error('\n❌ 설정 중 오류 발생:', error);
  }
}

main();