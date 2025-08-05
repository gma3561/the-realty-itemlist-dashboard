import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 초기 직원 데이터
const initialEmployees = [
  {
    email: 'Lucas@the-realty.co.kr',
    name: '하상현',
    role: 'admin',
    phone: '010-1234-5678',
    status: 'active'
  },
  {
    email: 'sso@the-realty.co.kr',
    name: '박소현',
    role: 'user',
    phone: '010-2345-6789',
    status: 'active'
  },
  {
    email: 'admin01@the-realty.co.kr',
    name: '김관리',
    role: 'admin',
    phone: '010-3456-7890',
    status: 'active'
  },
  {
    email: 'admin02@the-realty.co.kr',
    name: '이관리',
    role: 'admin',
    phone: '010-4567-8901',
    status: 'active'
  },
  {
    email: 'admin03@the-realty.co.kr',
    name: '박관리',
    role: 'admin',
    phone: '010-5678-9012',
    status: 'active'
  }
];

async function setupInitialEmployees() {
  console.log('🚀 초기 직원 데이터 설정 시작...');

  try {
    // 각 직원에 대해 처리
    for (const employee of initialEmployees) {
      // 이미 존재하는지 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', employee.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 결과가 없을 때 발생
        console.error(`❌ ${employee.email} 확인 중 오류:`, checkError);
        continue;
      }

      if (existingUser) {
        // 이미 존재하면 업데이트
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: employee.name,
            role: employee.role,
            phone: employee.phone,
            status: employee.status
          })
          .eq('email', employee.email);

        if (updateError) {
          console.error(`❌ ${employee.email} 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${employee.name} (${employee.email}) 정보 업데이트 완료`);
        }
      } else {
        // 존재하지 않으면 생성
        const { error: insertError } = await supabase
          .from('users')
          .insert([employee]);

        if (insertError) {
          console.error(`❌ ${employee.email} 추가 실패:`, insertError);
        } else {
          console.log(`✅ ${employee.name} (${employee.email}) 추가 완료`);
        }
      }
    }

    console.log('\n✅ 초기 직원 데이터 설정 완료!');
    
    // 전체 직원 목록 확인
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!listError && allUsers) {
      console.log('\n📋 전체 직원 목록:');
      allUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

setupInitialEmployees();