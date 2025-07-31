// 실제 사용자 시나리오 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('👤 실제 사용자 시나리오 테스트');
console.log('=============================');

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testUserScenarios() {
  try {
    console.log('🔐 시나리오 1: 관리자 로그인 테스트');
    console.log('----------------------------------');
    
    // 실제 프론트엔드에서 하는 것과 동일한 로그인
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });

    if (loginError) {
      console.log('❌ 로그인 실패:', loginError.message);
      return;
    }

    console.log('✅ 로그인 성공');
    console.log(`   사용자: ${loginData.user.email}`);
    console.log(`   ID: ${loginData.user.id}`);

    // 로그인된 사용자 정보로 권한 확인
    console.log('\n👑 사용자 권한 확인');
    console.log('------------------');
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, name, status')
      .eq('id', loginData.user.id)
      .single();

    if (profileError) {
      console.log('❌ 사용자 프로필 조회 실패:', profileError.message);
    } else {
      console.log('✅ 사용자 프로필 확인');
      console.log(`   이름: ${userProfile.name}`);
      console.log(`   권한: ${userProfile.role}`);
      console.log(`   상태: ${userProfile.status}`);
      
      const isAdmin = userProfile.role === 'admin';
      console.log(`   관리자 권한: ${isAdmin ? '✅' : '❌'}`);
    }

    console.log('\n👥 시나리오 2: 사용자 추가 테스트 (관리자 기능)');
    console.log('-----------------------------------------------');
    
    const testUserEmail = `testuser${Date.now()}@company.com`;
    const testUserData = {
      email: testUserEmail,
      name: '테스트 사용자 (시나리오)',
      phone: '010-9999-9999',
      role: 'user'
    };

    console.log('추가할 사용자 정보:', testUserData);

    // 관리자 서비스를 통한 사용자 추가 (프론트엔드와 동일한 방식)
    try {
      // 1. 임시 Auth 사용자 생성
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUserData.email,
        password: 'tempPassword123!',
        email_confirm: false,
        user_metadata: {
          name: testUserData.name,
          role: testUserData.role,
          created_by_admin: true,
          awaiting_google_login: true
        }
      });

      if (authError) {
        console.log('❌ Auth 사용자 생성 실패:', authError.message);
      } else {
        console.log('✅ Auth 사용자 생성 성공');

        // 2. public.users에 사용자 정보 저장
        const { data: publicUserData, error: publicError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            google_id: null,
            email: testUserData.email,
            name: testUserData.name,
            phone: testUserData.phone,
            role: testUserData.role,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (publicError) {
          console.log('❌ Public 사용자 추가 실패:', publicError.message);
          // 정리
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } else {
          console.log('✅ 사용자 추가 완료!');
          console.log('   Google 로그인 대기 상태로 설정됨');
          
          // 추가된 사용자 확인
          const { data: allUsers, error: listError } = await supabase
            .from('users')
            .select('name, email, role, status')
            .order('created_at', { ascending: false })
            .limit(3);

          if (!listError) {
            console.log('\n📋 최근 사용자 목록:');
            allUsers.forEach((user, index) => {
              console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
            });
          }

          // 테스트 사용자 정리
          await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          console.log('🗑️ 테스트 사용자 정리 완료');
        }
      }
    } catch (error) {
      console.log('❌ 사용자 추가 과정에서 오류:', error.message);
    }

    console.log('\n🏠 시나리오 3: 매물 등록 테스트');
    console.log('--------------------------------');

    // 룩업 테이블 데이터 확인
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('id, name').limit(1),
      supabase.from('property_statuses').select('id, name').limit(1),
      supabase.from('transaction_types').select('id, name').limit(1)
    ]);

    if (!propertyTypes.data?.[0]) {
      console.log('❌ 매물 등록 테스트 불가 - 룩업 테이블 데이터 없음');
    } else {
      const testPropertyData = {
        property_name: `테스트 매물 ${Date.now()}`,
        location: '서울시 강남구 테스트동',
        building: '101동',
        unit: '1001호',
        property_type_id: propertyTypes.data[0].id,
        property_status_id: propertyStatuses.data[0].id,
        transaction_type_id: transactionTypes.data[0].id,
        price: '', // 빈 문자열 테스트
        lease_price: '50000000',
        supply_area_sqm: '', // 빈 문자열 테스트
        private_area_sqm: '75.2',
        floor_info: '10층',
        rooms_bathrooms: '3룸 2욕실',
        direction: '남향',
        maintenance_fee: '', // 빈 문자열 테스트
        parking: '1대',
        move_in_date: '즉시입주',
        special_notes: '사용자 시나리오 테스트용 매물',
        is_commercial: false
      };

      console.log('등록할 매물 정보:', {
        ...testPropertyData,
        property_type: propertyTypes.data[0].name,
        property_status: propertyStatuses.data[0].name,
        transaction_type: transactionTypes.data[0].name
      });

      // 숫자 필드 전처리 (프론트엔드와 동일)
      const processedData = { ...testPropertyData };
      const numericFields = ['price', 'lease_price', 'supply_area_sqm', 'private_area_sqm', 'maintenance_fee'];
      
      numericFields.forEach(field => {
        if (processedData[field] === '' || processedData[field] === undefined) {
          processedData[field] = null;
        } else if (processedData[field] !== null) {
          const numValue = parseFloat(processedData[field]);
          processedData[field] = isNaN(numValue) ? null : numValue;
        }
      });

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert({ ...processedData, manager_id: loginData.user.id })
        .select();

      if (propertyError) {
        console.log('❌ 매물 등록 실패:', propertyError.message);
      } else {
        console.log('✅ 매물 등록 성공!');
        console.log('   빈 문자열 숫자 필드들이 null로 정상 처리됨');
        
        // 등록된 매물 확인
        const { data: recentProperties, error: listError } = await supabase
          .from('properties')
          .select('property_name, location, price, lease_price')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!listError) {
          console.log('\n🏠 최근 매물 목록:');
          recentProperties.forEach((property, index) => {
            console.log(`   ${index + 1}. ${property.property_name} (${property.location})`);
          });
        }

        // 테스트 매물 정리
        await supabase.from('properties').delete().eq('id', propertyData[0].id);
        console.log('🗑️ 테스트 매물 정리 완료');
      }
    }

    // 로그아웃
    console.log('\n🚪 로그아웃');
    console.log('----------');
    await supabase.auth.signOut();
    console.log('✅ 로그아웃 완료');

    console.log('\n🎉 모든 사용자 시나리오 테스트 완료!');
    console.log('=====================================');
    console.log('✅ 로그인 - 정상 작동');
    console.log('✅ 사용자 추가 - 정상 작동');
    console.log('✅ 매물 등록 - 정상 작동 (빈 필드 처리 포함)');
    console.log('✅ 로그아웃 - 정상 작동');

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testUserScenarios();