// RLS 정책 확인 및 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔒 RLS 정책 확인 및 수정');
console.log('=======================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixRlsPolicies() {
  try {
    console.log('📋 현재 users 테이블 RLS 정책 확인');
    console.log('------------------------------------');
    
    // RLS 정책 조회
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');

    if (policiesError) {
      console.log('❌ 정책 조회 실패:', policiesError.message);
    } else {
      console.log(`현재 정책 수: ${policies.length}개`);
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        console.log(`  조건: ${policy.qual}`);
      });
    }

    console.log('\n🔧 관리자 사용자 추가를 위한 INSERT 정책 생성');
    console.log('-----------------------------------------------');
    
    // 현재 로그인된 사용자가 관리자인 경우 INSERT 허용하는 정책 생성
    const insertPolicySQL = `
      CREATE POLICY "Allow admin to insert users" ON users
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
    `;

    try {
      const { error: createPolicyError } = await supabase.rpc('execute_sql', { 
        sql: insertPolicySQL 
      }).catch(async () => {
        // RPC가 없으면 직접 실행 시도
        return await supabase
          .from('_supabase_admin')
          .select('*')
          .limit(0); // 이건 실패할 것임
      });

      if (createPolicyError) {
        console.log('❌ 정책 생성 실패 (예상됨 - SQL 실행 권한 없음)');
        console.log('수동으로 Supabase 대시보드에서 다음 정책을 추가해야 합니다:');
        console.log('');
        console.log('정책 이름: Allow admin to insert users');
        console.log('테이블: users');
        console.log('작업: INSERT');
        console.log('조건:');
        console.log('EXISTS (');
        console.log('  SELECT 1 FROM users');
        console.log('  WHERE id = auth.uid()');
        console.log('  AND role = \'admin\'');
        console.log(')');
      } else {
        console.log('✅ INSERT 정책 생성 성공');
      }
    } catch (err) {
      console.log('❌ SQL 실행 불가 - 수동 설정 필요');
    }

    console.log('\n💡 대안: Service Role Key를 프론트엔드에서 사용');
    console.log('--------------------------------------------------');
    console.log('보안상 권장되지 않지만, 관리 기능만을 위해 제한적으로 사용 가능');
    console.log('1. 환경 변수로 Service Role Key를 프론트엔드에 노출');
    console.log('2. 관리자 로그인 확인 후에만 Service Role Key 사용');
    console.log('3. 또는 백엔드 API 엔드포인트 생성');

    console.log('\n🧪 Service Role Key로 직접 삽입 테스트');
    console.log('--------------------------------------');
    
    const testEmail = `admintest${Date.now()}@the-realty.co.kr`;
    
    const { data: directInsert, error: directError } = await supabase
      .from('users')
      .insert({
        id: '12345678-1234-1234-1234-123456789012', // 임시 UUID
        email: testEmail,
        name: '관리자 테스트',
        phone: '010-9999-9999',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (directError) {
      console.log('❌ Service Role Key 직접 삽입도 실패:', directError.message);
      if (directError.message.includes('violates foreign key constraint')) {
        console.log('💡 외래키 제약조건 때문에 실패 - Auth 사용자가 먼저 필요함');
      }
    } else {
      console.log('✅ Service Role Key 직접 삽입 성공');
      
      // 정리
      await supabase.from('users').delete().eq('email', testEmail);
      console.log('🗑️ 테스트 데이터 정리 완료');
    }

  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkAndFixRlsPolicies();