import { supabase } from './supabase';
import ENV_CONFIG from '../config/env';
import { dummyUsers, getUserStats } from '../data/dummyUsers';

// 더미데이터 사용 여부
const USE_DUMMY_DATA = ENV_CONFIG.USE_DUMMY_DATA;

// 사용자 목록 조회
export const getUsers = async () => {
  if (USE_DUMMY_DATA) {
    console.log('🎭 더미데이터 모드: 사용자 목록 반환');
    return {
      data: dummyUsers,
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    return { data: dummyUsers, error: error.message };
  }
};

// 사용자 상세 조회
export const getUserById = async (id) => {
  if (USE_DUMMY_DATA) {
    const user = dummyUsers.find(u => u.id === id);
    const stats = getUserStats(id);
    return { 
      data: user ? { ...user, stats } : null, 
      error: user ? null : 'User not found' 
    };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // 통계 정보 추가 (실제 구현 시 별도 쿼리 필요)
    const stats = getUserStats(id);
    
    return { data: { ...data, stats }, error: null };
  } catch (error) {
    console.error('사용자 상세 조회 실패:', error);
    const user = dummyUsers.find(u => u.id === id);
    return { 
      data: user ? { ...user, stats: getUserStats(id) } : null, 
      error: error.message 
    };
  }
};

// 사용자 추가
export const createUser = async (userData) => {
  if (USE_DUMMY_DATA) {
    console.log('🎭 더미데이터 모드: 사용자 추가 시뮬레이션');
    const newUser = {
      ...userData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    dummyUsers.push(newUser);
    return { data: newUser, error: null };
  }

  try {
    // 실제 환경에서는 Auth와 연동하여 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) throw authError;

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        id: authData.user.id,
        password: undefined // 비밀번호는 저장하지 않음
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('사용자 추가 실패:', error);
    return { data: null, error: error.message };
  }
};

// 사용자 수정
export const updateUser = async (id, updates) => {
  if (USE_DUMMY_DATA) {
    console.log('🎭 더미데이터 모드: 사용자 수정 시뮬레이션');
    const index = dummyUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      dummyUsers[index] = {
        ...dummyUsers[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return { data: dummyUsers[index], error: null };
    }
    return { data: null, error: 'User not found' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('사용자 수정 실패:', error);
    return { data: null, error: error.message };
  }
};

// 사용자 삭제 (비활성화)
export const deleteUser = async (id) => {
  if (USE_DUMMY_DATA) {
    console.log('🎭 더미데이터 모드: 사용자 삭제 시뮬레이션');
    const index = dummyUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      dummyUsers[index].status = 'inactive';
      dummyUsers[index].updated_at = new Date().toISOString();
      return { error: null };
    }
    return { error: 'User not found' };
  }

  try {
    // 실제로는 삭제하지 않고 비활성화
    const { error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    return { error: error.message };
  }
};

// 사용자 통계 조회
export const getUserStatistics = async (userId) => {
  if (USE_DUMMY_DATA) {
    return {
      data: getUserStats(userId),
      error: null
    };
  }

  try {
    // 실제 구현 시 properties 테이블과 JOIN하여 통계 계산
    const stats = getUserStats(userId);
    return { data: stats, error: null };
  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return { data: getUserStats(userId), error: error.message };
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics
};