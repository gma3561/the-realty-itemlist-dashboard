const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

// Service Role Key 사용 (RLS 우회)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function createUsersWithoutAuth() {
  console.log('👥 사용자 테이블에 직접 데이터 삽입...\n');

  const sampleUsers = [
    {
      id: uuidv4(),
      name: '관리자',
      email: 'admin@realty.com',
      role: 'admin',
      phone: '010-1234-5678',
      department: '시스템관리',
      position: '팀장',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '김철수',
      email: 'kim@realty.com',
      role: 'user',
      phone: '010-2345-6789',
      department: '영업부',
      position: '과장',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '이영희',
      email: 'lee@realty.com',
      role: 'user',
      phone: '010-3456-7890',
      department: '기획부',
      position: '대리',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '박민수',
      email: 'park@realty.com',
      role: 'user',
      phone: '010-4567-8901',
      department: '개발부',
      position: '사원',
      is_active: true
    },
    {
      id: uuidv4(),
      name: '최지은',
      email: 'choi@realty.com',
      role: 'user',
      phone: '010-5678-9012',
      department: '마케팅부',
      position: '주임',
      is_active: true
    }
  ];

  try {
    // 먼저 기존 데이터 삭제 (테스트용)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 더미 조건으로 모든 레코드 삭제

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.log('기존 데이터 삭제 중 오류:', deleteError.message);
    }

    // 사용자 추가
    const { data, error } = await supabase
      .from('users')
      .insert(sampleUsers)
      .select();

    if (error) {
      console.error('❌ 사용자 생성 중 오류 발생:', error);
      console.error('오류 세부사항:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ 샘플 사용자 생성 완료!');
    console.log(`   - 관리자: 1명`);
    console.log(`   - 일반 사용자: 4명`);

    // 생성된 사용자 확인
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!fetchError && users) {
      console.log('\n📋 현재 등록된 사용자 목록:');
      console.log('═'.repeat(80));
      users.forEach(user => {
        console.log(`👤 ${user.name}`);
        console.log(`   📧 이메일: ${user.email}`);
        console.log(`   🔑 역할: ${user.role}`);
        console.log(`   📱 전화: ${user.phone || 'N/A'}`);
        console.log(`   🏢 부서: ${user.department || 'N/A'} / ${user.position || 'N/A'}`);
        console.log(`   🟢 상태: ${user.is_active ? '활성' : '비활성'}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log('─'.repeat(80));
      });
      console.log(`\n총 ${users.length}명의 사용자가 등록되어 있습니다.`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

createUsersWithoutAuth();