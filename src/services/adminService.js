// 관리자 전용 서비스 (Service Role Key 사용)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// 관리자 전용 Supabase 클라이언트 (Service Role Key 사용)
// 주의: 이는 임시 해결책이며, 프로덕션에서는 백엔드 API를 통해 처리해야 함
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 관리자 권한으로 사용자 추가 (임시 Auth 사용자 생성 포함)
export const addUserAsAdmin = async (userData) => {
  try {
    // 1. 임시 Auth 사용자 생성 (구글 로그인 전까지 사용)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'tempPassword123!', // 임시 비밀번호 (구글 로그인으로 대체될 예정)
      email_confirm: false, // 이메일 확인 불필요 (구글 로그인으로 처리)
      user_metadata: {
        name: userData.name,
        role: userData.role,
        created_by_admin: true,
        awaiting_google_login: true
      }
    });

    if (authError) {
      throw new Error(`임시 인증 사용자 생성 실패: ${authError.message}`);
    }

    // 2. public.users에 사용자 정보 저장
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // auth 사용자 ID 사용
        google_id: null, // 구글 로그인 시 업데이트
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // public.users 생성 실패 시 auth 사용자 정리
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`사용자 프로필 생성 실패: ${error.message}`);
    }

    return {
      ...data,
      isGoogleLoginPending: true,
      tempAuthCreated: true
    };
  } catch (error) {
    console.error('Admin service error:', error);
    throw error;
  }
};

// 관리자 권한으로 사용자 수정
export const updateUserAsAdmin = async (id, userData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`사용자 수정 실패: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Admin service error:', error);
    throw error;
  }
};

// 관리자 권한으로 사용자 상태 변경
export const updateUserStatusAsAdmin = async (id, newStatus) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`사용자 상태 변경 실패: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Admin service error:', error);
    throw error;
  }
};