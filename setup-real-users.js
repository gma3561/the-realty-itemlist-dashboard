import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Service Role Key가 필요합니다.');
  console.log('   .env.local에 SUPABASE_SERVICE_KEY를 추가하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 실제 더 리얼티 직원 정보
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

async function setupRealUsers() {
  console.log('👥 실제 사용자 계정 생성 중...\n');

  for (const userData of REAL_USERS) {
    try {
      console.log(`🔐 ${userData.name} (${userData.email}) 계정 생성 중...`);
      
      // 1. Auth 사용자 생성
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  ${userData.email} 이미 존재하는 계정입니다.`);
          
          // 기존 사용자 정보 업데이트
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === userData.email);
          
          if (existingUser) {
            // Public 사용자 테이블에 추가/업데이트
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: existingUser.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                phone: userData.phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (upsertError) {
              console.log(`❌ Public 테이블 업데이트 실패: ${upsertError.message}`);
            } else {
              console.log(`✅ ${userData.name} 사용자 정보 업데이트 완료`);
            }
          }
          continue;
        } else {
          throw authError;
        }
      }

      console.log(`✅ Auth 계정 생성 완료: ${authUser.user.id}`);

      // 2. Public 사용자 테이블에 추가
      const { error: publicError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (publicError) {
        console.log(`❌ Public 테이블 추가 실패: ${publicError.message}`);
      } else {
        console.log(`✅ ${userData.name} 사용자 생성 완료\n`);
      }

    } catch (error) {
      console.error(`❌ ${userData.name} 계정 생성 실패:`, error.message);
    }
  }

  // 생성된 사용자 확인
  console.log('📋 생성된 사용자 목록:');
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (users) {
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ID: ${user.id.substring(0, 8)}...`);
    });
  }

  console.log('\n🎉 실제 사용자 계정 설정 완료!');
  console.log('\n📝 로그인 정보:');
  REAL_USERS.forEach(user => {
    console.log(`   - ${user.name}: ${user.email} / ${user.password}`);
  });
}

setupRealUsers();