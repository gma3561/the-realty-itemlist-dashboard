import { supabase } from './supabase';

// 고객 데이터 검증
export const validateCustomerData = (customerData) => {
  const errors = [];
  
  // 필수 필드 검증
  if (!customerData.name) errors.push('고객명이 필요합니다');
  
  // 이메일 형식 검증 (입력된 경우)
  if (customerData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      errors.push('유효한 이메일 형식이 아닙니다');
    }
  }
  
  return errors;
};

// 전화번호로 고객 조회
export const findCustomerByPhone = async (phone) => {
  if (!phone || phone.trim() === '') return null;
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('전화번호로 고객 조회 실패:', error);
    throw error;
  }
};

// 고객 생성
export const createCustomer = async (customerData, userId) => {
  try {
    // 데이터 검증
    const validationErrors = validateCustomerData(customerData);
    if (validationErrors.length > 0) {
      throw new Error(`데이터 검증 실패: ${validationErrors.join(', ')}`);
    }
    
    // 중복 전화번호 확인
    if (customerData.phone) {
      const existingCustomer = await findCustomerByPhone(customerData.phone);
      if (existingCustomer) {
        throw new Error('이미 등록된 전화번호입니다');
      }
    }
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customerData, user_id: userId }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('고객 생성 실패:', error);
    throw error;
  }
};

// 고객 정보 업데이트
export const updateCustomer = async (id, customerData) => {
  try {
    // 데이터 검증
    const validationErrors = validateCustomerData(customerData);
    if (validationErrors.length > 0) {
      throw new Error(`데이터 검증 실패: ${validationErrors.join(', ')}`);
    }
    
    // 중복 전화번호 확인 (자기 자신 제외)
    if (customerData.phone) {
      const { data: existingCustomers, error: phoneCheckError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', customerData.phone)
        .neq('id', id);
      
      if (phoneCheckError) throw phoneCheckError;
      
      if (existingCustomers && existingCustomers.length > 0) {
        throw new Error('이미 등록된 전화번호입니다');
      }
    }
    
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('고객 정보 업데이트 실패:', error);
    throw error;
  }
};

// 고객 관심 정보 등록
export const addCustomerInterest = async (interestData) => {
  try {
    const { data, error } = await supabase
      .from('customer_interests')
      .insert([interestData])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('고객 관심 정보 등록 실패:', error);
    throw error;
  }
};

// 고객별 퍼널 이벤트 조회
export const getCustomerFunnelEvents = async (customerId) => {
  try {
    const { data, error } = await supabase
      .from('funnel_events')
      .select(`
        *,
        property:property_id (
          property_name,
          location
        ),
        stage:stage_id (
          name,
          color
        ),
        previous_stage:previous_stage_id (
          name
        ),
        user:user_id (
          name
        )
      `)
      .eq('customer_id', customerId)
      .order('event_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('고객 퍼널 이벤트 조회 실패:', error);
    throw error;
  }
};

// 고객 퍼널 이벤트 추가
export const addCustomerFunnelEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('funnel_events')
      .insert([eventData])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('고객 퍼널 이벤트 추가 실패:', error);
    throw error;
  }
};

export default {
  validateCustomerData,
  findCustomerByPhone,
  createCustomer,
  updateCustomer,
  addCustomerInterest,
  getCustomerFunnelEvents,
  addCustomerFunnelEvent
};