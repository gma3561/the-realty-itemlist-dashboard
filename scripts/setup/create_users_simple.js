const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function createSimpleUsers() {
  console.log('👥 간단한 사용자 데이터 생성...\n');

  // users 테이블의 기본 컬럼만 사용
  const sampleUsers = [
    {
      id: uuidv4(),
      name: '관리자',
      email: 'admin@realty.com',
      role: 'admin',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '김철수',
      email: 'kim@realty.com',
      role: 'user',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '이영희',
      email: 'lee@realty.com',
      role: 'user',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '박민수',
      email: 'park@realty.com',
      role: 'user',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '최지은',
      email: 'choi@realty.com',
      role: 'user',
      is_active: true
    }
  ];

  try {
    // 사용자 추가
    const { data, error } = await supabase
      .from('users')
      .insert(sampleUsers)
      .select();

    if (error) {
      console.error('❌ 사용자 생성 중 오류 발생:', error.message);
      return;
    }

    console.log('✅ 샘플 사용자 생성 완료!');
    console.log(`   생성된 사용자 수: ${data.length}명\n`);

    // 생성된 사용자 확인
    const { data: users, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (users) {
      console.log('📋 현재 등록된 사용자 목록:');
      console.log('─'.repeat(60));
      users.forEach(user => {
        console.log(`${user.name} | ${user.email} | ${user.role} | ${user.is_active ? '활성' : '비활성'}`);
      });
      console.log('─'.repeat(60));
      console.log(`총 ${count}명의 사용자가 등록되어 있습니다.`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createSimpleUsers();