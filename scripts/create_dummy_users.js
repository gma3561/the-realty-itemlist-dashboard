import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzc2MjQxOCwiZXhwIjoyMDUzMzM4NDE4fQ.Ay9ksUHlxE2-PdVaQrqRAIdOqSTGHlNpE-Zp6PRHM8w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 더미 사용자 데이터
const dummyUsers = [
  {
    id: 'cec8266a-7bb4-4b4f-8b91-7c8a5c4d3e2f',
    email: 'jenny@the-realty.co.kr',
    name: 'Jenny',
    role: 'admin',
    phone: '010-1234-5678',
    department: '영업팀',
    position: '팀장'
  },
  {
    id: 'd9f4e6b3-2a8c-4f7e-9b5a-8c7d6e5f4g3h',
    email: 'lucas@the-realty.co.kr', 
    name: 'Lucas',
    role: 'admin',
    phone: '010-2345-6789',
    department: '영업팀',
    position: '부팀장'
  },
  {
    id: 'e8a7b5c9-3d1f-4e6a-8c9b-7d6e5f4g3h2i',
    email: 'hmlee@the-realty.co.kr',
    name: 'Hyungmin Lee',
    role: 'admin', 
    phone: '010-3456-7890',
    department: '관리팀',
    position: '이사'
  },
  {
    id: 'f7b6c8d9-4e1a-5f2b-9c8d-6e5f4g3h2i1j',
    email: 'minji.kim@the-realty.co.kr',
    name: '김민지',
    role: 'user',
    phone: '010-4567-8901',
    department: '영업팀',
    position: '사원'
  },
  {
    id: 'g8c7d9e0-5f2b-6a3c-0d9e-7f6g5h4i3j2k',
    email: 'seongho.park@the-realty.co.kr',
    name: '박성호',
    role: 'user',
    phone: '010-5678-9012',
    department: '영업팀',
    position: '대리'
  }
];

async function createDummyUsers() {
  console.log('더미 사용자 생성을 시작합니다...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const userData of dummyUsers) {
    try {
      // users 테이블에 삽입 (upsert 사용)
      const { data, error } = await supabase
        .from('users')
        .upsert([{
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          department: userData.department,
          position: userData.position,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'id'
        })
        .select();
      
      if (error) {
        console.error(`사용자 ${userData.name} 생성 실패:`, error);
        errorCount++;
      } else {
        console.log(`사용자 ${userData.name} 생성 성공`);
        successCount++;
      }
      
    } catch (err) {
      console.error(`사용자 ${userData.name} 처리 중 오류:`, err);
      errorCount++;
    }
  }
  
  console.log(`\n더미 사용자 생성 완료:`);
  console.log(`- 성공: ${successCount}개`);
  console.log(`- 실패: ${errorCount}개`);
  
  return { success: successCount, errors: errorCount };
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  createDummyUsers()
    .then(() => {
      console.log('더미 사용자 생성이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('더미 사용자 생성 중 오류 발생:', error);
      process.exit(1);
    });
}

export default createDummyUsers;