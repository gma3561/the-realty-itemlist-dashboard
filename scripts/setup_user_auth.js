const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 랜덤 비밀번호 생성 함수
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 직원 목록
const realtorList = [
  { name: '김규민', email: 'gyum@the-realty.co.kr', role: 'admin' },
  { name: '하상현', email: 'lucas@the-realty.co.kr', role: 'admin' },
  { name: '정연서', email: 'jenny@the-realty.co.kr', role: 'admin' },
  { name: '정서연', email: 'yool@the-realty.co.kr', role: 'user' },
  { name: '정선혜', email: 'grace@the-realty.co.kr', role: 'user' },
  { name: '박소현', email: 'sso@the-realty.co.kr', role: 'user' },
  { name: '송영주', email: 'joo@the-realty.co.kr', role: 'user' },
  { name: '정윤식', email: 'yun@the-realty.co.kr', role: 'user' },
  { name: '성은미', email: 'mimi@the-realty.co.kr', role: 'user' },
  { name: '서을선', email: 'sun@the-realty.co.kr', role: 'user' },
  { name: '서지혜', email: 'kylie@the-realty.co.kr', role: 'user' },
  { name: '이혜만', email: 'hmlee@the-realty.co.kr', role: 'user' },
  { name: '김효석', email: 'seok@the-realty.co.kr', role: 'user' }
];

async function setupUsers() {
  console.log('🔐 사용자 계정 설정 시작...\n');
  
  const userCredentials = [];
  
  for (const realtor of realtorList) {
    try {
      // 랜덤 비밀번호 생성
      const tempPassword = generateRandomPassword();
      
      console.log(`📧 ${realtor.name} (${realtor.email}) 처리 중...`);
      
      // Supabase Auth에 사용자 생성 또는 업데이트
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: realtor.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: realtor.name,
          role: realtor.role
        }
      });
      
      if (authError && authError.message.includes('already been registered')) {
        // 이미 존재하는 사용자의 경우 비밀번호 업데이트
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          authUser?.id || '',
          {
            password: tempPassword,
            user_metadata: {
              full_name: realtor.name,
              role: realtor.role
            }
          }
        );
        
        if (updateError) {
          console.error(`❌ ${realtor.email} 업데이트 실패:`, updateError.message);
          continue;
        }
      } else if (authError) {
        console.error(`❌ ${realtor.email} 생성 실패:`, authError.message);
        continue;
      }
      
      // 생성된 계정 정보 저장
      userCredentials.push({
        name: realtor.name,
        email: realtor.email,
        role: realtor.role,
        tempPassword: tempPassword
      });
      
      console.log(`✅ ${realtor.name} 계정 설정 완료`);
      
    } catch (error) {
      console.error(`❌ ${realtor.email} 처리 중 오류:`, error.message);
    }
  }
  
  // 생성된 계정 정보를 파일로 저장 (보안상 주의!)
  const fs = require('fs');
  const credentialsPath = './user_credentials_temp.json';
  
  fs.writeFileSync(credentialsPath, JSON.stringify(userCredentials, null, 2));
  
  console.log('\n✅ 모든 사용자 계정 설정 완료!');
  console.log(`📄 임시 비밀번호는 ${credentialsPath} 파일에 저장되었습니다.`);
  console.log('⚠️  보안 주의: 이 파일은 사용자에게 전달 후 즉시 삭제하세요!');
  console.log('\n📧 각 사용자에게 다음 정보를 안전하게 전달하세요:');
  console.log('1. 로그인 이메일');
  console.log('2. 임시 비밀번호');
  console.log('3. 첫 로그인 후 비밀번호 변경 요청');
}

// 실행
setupUsers().catch(console.error);