const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createSampleUsers() {
  console.log('👥 샘플 사용자 생성 시작...\n');

  const sampleUsers = [
    {
      id: 'admin-001',
      name: '관리자',
      email: 'admin@realty.com',
      role: 'admin',
      is_active: true
    },
    {
      id: 'realtor-001',
      name: '김철수',
      email: 'kim@realty.com',
      role: 'realtor',
      is_active: true
    },
    {
      id: 'realtor-002',
      name: '이영희',
      email: 'lee@realty.com',
      role: 'realtor',
      is_active: true
    },
    {
      id: 'user-001',
      name: '박민수',
      email: 'park@example.com',
      role: 'user',
      is_active: true
    },
    {
      id: 'user-002',
      name: '최지은',
      email: 'choi@example.com',
      role: 'user',
      is_active: true
    }
  ];

  try {
    // 기존 사용자 확인
    const { count: existingCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (existingCount > 0) {
      console.log(`⚠️  이미 ${existingCount}명의 사용자가 존재합니다.`);
      console.log('기존 데이터를 유지하고 새 사용자를 추가합니다.\n');
    }

    // 사용자 추가
    const { data, error } = await supabase
      .from('users')
      .upsert(sampleUsers, { onConflict: 'id' });

    if (error) {
      console.error('❌ 사용자 생성 중 오류 발생:', error.message);
      return;
    }

    console.log('✅ 샘플 사용자 생성 완료!');
    console.log(`   - 관리자: 1명`);
    console.log(`   - 부동산업자: 2명`);
    console.log(`   - 일반 사용자: 2명`);

    // 생성된 사용자 확인
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!fetchError && users) {
      console.log('\n📋 현재 등록된 사용자 목록:');
      users.forEach(user => {
        console.log(`   ${user.name} (${user.email}) - ${user.role} - ${user.is_active ? '활성' : '비활성'}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

createSampleUsers();