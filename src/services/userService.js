import { supabase } from './supabase';
import ENV_CONFIG from '../config/env';

// 사용자 목록 조회
export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    return { data: [], error: error.message };
  }
};

// 사용자 상세 조회
export const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // 실제 통계 정보 계산
    const stats = await calculateUserStats(id);
    
    return { data: { ...data, stats }, error: null };
  } catch (error) {
    console.error('사용자 상세 조회 실패:', error);
    return { 
      data: null, 
      error: error.message 
    };
  }
};

// 사용자 추가
export const createUser = async (userData) => {
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
  try {
    const stats = await calculateUserStats(userId);
    return { data: stats, error: null };
  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return { data: null, error: error.message };
  }
};

// 실제 사용자 통계 계산 함수
const calculateUserStats = async (userId) => {
  try {
    // 매물 통계 계산
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('property_status_id, transaction_type_id, price, lease_price, monthly_rent')
      .eq('manager_id', userId);

    if (propertiesError) throw propertiesError;

    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.property_status_id === 'available').length;
    const completedProperties = properties.filter(p => p.property_status_id === 'completed').length;
    
    // 총 거래 금액 계산
    const totalValue = properties.reduce((sum, property) => {
      const price = property.price || property.lease_price || property.monthly_rent || 0;
      return sum + price;
    }, 0);

    return {
      totalProperties,
      activeProperties,
      completedProperties,
      totalValue,
      successRate: totalProperties > 0 ? (completedProperties / totalProperties * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error('사용자 통계 계산 실패:', error);
    return {
      totalProperties: 0,
      activeProperties: 0,
      completedProperties: 0,
      totalValue: 0,
      successRate: 0
    };
  }
};

// 사용자 비밀번호 재설정
export const resetUserPassword = async (userId, newPassword) => {
  try {
    // Supabase Admin API를 사용하여 비밀번호 재설정
    // 주의: 이 기능은 서버 사이드 또는 관리자 권한이 있는 환경에서만 사용해야 합니다
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('비밀번호 재설정 실패:', error);
    return { error: error.message };
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics,
  resetUserPassword
};