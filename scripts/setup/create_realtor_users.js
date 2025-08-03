const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 더부동산 실제 직원 목록
const realtorList = [
  { id: 1, name: '김규민', email: 'gyum@the-realty.co.kr', role: 'admin' },
  { id: 2, name: '하상현', email: 'lucas@the-realty.co.kr', role: 'admin' },
  { id: 3, name: '정서연', email: 'yool@the-realty.co.kr', role: 'user' },
  { id: 4, name: '정선혜', email: 'grace@the-realty.co.kr', role: 'user' },
  { id: 5, name: '박소현', email: 'sso@the-realty.co.kr', role: 'user' },
  { id: 6, name: '정연서', email: 'jenny@the-realty.co.kr', role: 'admin' },
  { id: 7, name: '송영주', email: 'joo@the-realty.co.kr', role: 'user' },
  { id: 8, name: '정윤식', email: 'yun@the-realty.co.kr', role: 'user' },
  { id: 9, name: '성은미', email: 'mimi@the-realty.co.kr', role: 'user' },
  { id: 10, name: '서을선', email: 'sun@the-realty.co.kr', role: 'user' },
  { id: 11, name: '서지혜', email: 'kylie@the-realty.co.kr', role: 'user' },
  { id: 12, name: '이혜만', email: 'hmlee@the-realty.co.kr', role: 'user' },
  { id: 13, name: '김효석', email: 'seok@the-realty.co.kr', role: 'user' }
];

// Supabase 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('필요한 환경변수: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRealtorUsers() {
  console.log('🏢 더부동산 직원 계정 생성 시작');
  console.log('====================================');
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const realtor of realtorList) {
    try {
      console.log(`\n👤 처리 중: ${realtor.name} (${realtor.email})`);
      
      // 1. Auth 사용자 생성 (이미 존재하는지 확인)
      const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
      
      if (checkError) {
        console.error('❌ 사용자 확인 실패:', checkError.message);
        results.failed.push({ realtor, error: checkError.message });
        continue;
      }
      
      const userExists = existingUsers.users?.some(u => u.email === realtor.email);
      
      if (userExists) {
        console.log('⏭️  이미 존재하는 사용자입니다.');
        results.skipped.push(realtor);
        
        // public.users 테이블만 업데이트
        const existingUser = existingUsers.users.find(u => u.email === realtor.email);
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            email: realtor.email,
            name: realtor.name,
            role: realtor.role,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          
        if (updateError) {
          console.error('⚠️  public.users 업데이트 실패:', updateError.message);
        } else {
          console.log('✅ public.users 테이블 업데이트 완료');
        }
        
        continue;
      }
      
      // 2. 새 사용자 생성
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: realtor.email,
        password: 'therealty2025!', // 기본 비밀번호 (첫 로그인 시 변경 권장)
        email_confirm: true,
        user_metadata: {
          name: realtor.name,
          role: realtor.role
        }
      });
      
      if (createError) {
        console.error('❌ 사용자 생성 실패:', createError.message);
        results.failed.push({ realtor, error: createError.message });
        continue;
      }
      
      console.log('✅ Auth 사용자 생성 성공');
      
      // 3. public.users 테이블에 추가
      const { error: publicUserError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: realtor.email,
          name: realtor.name,
          role: realtor.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (publicUserError) {
        console.error('⚠️  public.users 테이블 추가 실패:', publicUserError.message);
        // Auth는 성공했으므로 부분 성공으로 처리
        results.success.push({ ...realtor, warning: 'public.users 추가 실패' });
      } else {
        console.log('✅ public.users 테이블 추가 완료');
        results.success.push(realtor);
      }
      
    } catch (error) {
      console.error('❌ 예상치 못한 오류:', error.message);
      results.failed.push({ realtor, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n\n📊 작업 완료 요약');
  console.log('=====================================');
  console.log(`✅ 성공: ${results.success.length}명`);
  results.success.forEach(r => {
    console.log(`   - ${r.name} (${r.email}) [${r.role}]`);
  });
  
  console.log(`\n⏭️  건너뜀: ${results.skipped.length}명`);
  results.skipped.forEach(r => {
    console.log(`   - ${r.name} (${r.email})`);
  });
  
  console.log(`\n❌ 실패: ${results.failed.length}명`);
  results.failed.forEach(r => {
    console.log(`   - ${r.realtor.name}: ${r.error}`);
  });
  
  console.log('\n\n📝 참고사항');
  console.log('=====================================');
  console.log('1. 모든 사용자의 기본 비밀번호는 "therealty2025!" 입니다.');
  console.log('2. 첫 로그인 시 비밀번호 변경을 권장합니다.');
  console.log('3. 관리자: 김규민, 하상현, 정연서');
  console.log('4. 이미 존재하는 사용자는 public.users 테이블만 업데이트됩니다.');
}

// 테이블 구조 확인
async function checkTableStructure() {
  console.log('\n📋 users 테이블 구조 확인');
  console.log('====================================');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ 테이블 확인 실패:', error.message);
    console.log('\n💡 users 테이블이 없다면 다음 SQL을 실행하세요:');
    console.log(`
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (id = auth.uid());

-- 관리자만 사용자 정보 수정 가능
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
`);
    return false;
  }
  
  console.log('✅ users 테이블 존재 확인');
  return true;
}

// 실행
async function main() {
  // 테이블 확인
  const tableExists = await checkTableStructure();
  
  if (!tableExists) {
    console.log('\n⚠️  users 테이블을 먼저 생성해주세요.');
    return;
  }
  
  // 사용자 생성
  await createRealtorUsers();
}

main().catch(console.error);