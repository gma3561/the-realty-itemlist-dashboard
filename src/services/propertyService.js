import { supabase } from './supabase';
import ENV_CONFIG from '../config/env';
import { hasPropertyPermission, isAdmin } from '../utils/permissions';

// 룩업 테이블 데이터 초기화 함수
export const initializeLookupTables = async () => {
  try {
    // 매물 종류 초기화
    const propertyTypes = [
      { id: 'apt', name: '아파트', display_order: 1 },
      { id: 'officetel', name: '오피스텔', display_order: 2 },
      { id: 'villa', name: '빌라/연립', display_order: 3 },
      { id: 'house', name: '단독주택', display_order: 4 },
      { id: 'commercial', name: '상가', display_order: 5 }
    ];

    // 거래 유형 초기화
    const transactionTypes = [
      { id: 'presale', name: '분양', display_order: 1 },
      { id: 'developer', name: '시행사매물', display_order: 2 },
      { id: 'sale', name: '매매', display_order: 3 },
      { id: 'lease', name: '전세', display_order: 4 },
      { id: 'rent', name: '월세/렌트', display_order: 5 },
      { id: 'short', name: '단기', display_order: 6 }
    ];

    // 매물 상태 초기화
    const propertyStatuses = [
      { id: 'available', name: '거래가능', display_order: 1 },
      { id: 'completed', name: '거래완료', display_order: 2 },
      { id: 'hold', name: '거래보류', display_order: 3 },
      { id: 'cancelled', name: '거래철회', display_order: 4 },
      { id: 'inspection_available', name: '임장가능', display_order: 5 }
    ];

    // 각 테이블에 데이터 삽입 (ON CONFLICT DO NOTHING으로 중복 방지)
    const results = await Promise.allSettled([
      supabase.from('property_types').upsert(propertyTypes, { onConflict: 'id' }),
      supabase.from('transaction_types').upsert(transactionTypes, { onConflict: 'id' }),
      supabase.from('property_statuses').upsert(propertyStatuses, { onConflict: 'id' })
    ]);

    // console.log('룩업 테이블 초기화 완료:', results);
    return { success: true, results };
  } catch (error) {
    console.error('룩업 테이블 초기화 실패:', error);
    return { success: false, error: error.message };
  }
};

// 룩업 테이블 데이터 조회
export const getLookupTables = async () => {
  try {
    const [propertyTypesResult, transactionTypesResult, propertyStatusesResult] = await Promise.all([
      supabase.from('property_types').select('*').order('display_order'),
      supabase.from('transaction_types').select('*').order('display_order'),
      supabase.from('property_statuses').select('*').order('display_order')
    ]);

    if (propertyTypesResult.error) throw propertyTypesResult.error;
    if (transactionTypesResult.error) throw transactionTypesResult.error;
    if (propertyStatusesResult.error) throw propertyStatusesResult.error;

    return {
      propertyTypes: propertyTypesResult.data || [],
      transactionTypes: transactionTypesResult.data || [],
      propertyStatuses: propertyStatusesResult.data || []
    };
  } catch (error) {
    console.error('룩업 테이블 조회 실패:', error);
    throw error;
  }
};

// 매물 목록 조회 (권한 기반 필터링 포함)
export const getProperties = async (filters = {}, user = null) => {
  try {
    let query = supabase.from('properties').select('*');

    // 필터 적용
    if (filters.property_type_id) {
      query = query.eq('property_type_id', filters.property_type_id);
    }
    if (filters.transaction_type_id) {
      query = query.eq('transaction_type_id', filters.transaction_type_id);
    }
    if (filters.property_status_id) {
      query = query.eq('property_status_id', filters.property_status_id);
    }
    if (filters.search) {
      query = query.or(`property_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    // Supabase 기본 1000개 제한을 우회하여 전체 데이터 가져오기
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(0, 49); // 페이지당 50개로 제한 (TODO: 페이지네이션 구현)

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('매물 목록 조회 실패:', error);
    return { data: [], error: error.message };
  }
};

// 매물 상세 조회
export const getPropertyById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('매물 상세 조회 실패:', error);
    return { data: null, error: error.message };
  }
};

// 매물 추가 (사용자 정보 자동 설정)
export const createProperty = async (propertyData, user = null) => {
  // 권한 체크
  if (user && !hasPropertyPermission(user, null, 'create')) {
    return { data: null, error: '매물을 등록할 권한이 없습니다.' };
  }

  // 사용자 정보를 자동으로 설정
  const propertyWithUser = {
    ...propertyData,
    user_id: user?.id || propertyData.user_id,
    manager_id: user?.id || user?.email || propertyData.manager_id
  };

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyWithUser])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('매물 추가 실패:', error);
    return { data: null, error: error.message };
  }
};

// 매물 수정 (권한 체크 포함)
export const updateProperty = async (id, updates, user = null) => {
  try {
    // 먼저 매물 정보를 가져와서 권한 체크
    if (user) {
      const { data: property } = await getPropertyById(id);
      if (!hasPropertyPermission(user, property, 'edit')) {
        return { data: null, error: '이 매물을 수정할 권한이 없습니다.' };
      }
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('매물 수정 실패:', error);
    return { data: null, error: error.message };
  }
};

// 매물 삭제 (권한 체크 포함)
export const deleteProperty = async (id, user = null) => {
  try {
    // 먼저 매물 정보를 가져와서 권한 체크
    if (user) {
      const { data: property } = await getPropertyById(id);
      if (!hasPropertyPermission(user, property, 'delete')) {
        return { error: '이 매물을 삭제할 권한이 없습니다.' };
      }
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('매물 삭제 실패:', error);
    return { error: error.message };
  }
};

// 매물 데이터 검증
export const validatePropertyData = (propertyData) => {
  const errors = [];
  
  // 필수 필드 검증
  if (!propertyData.property_name) errors.push('매물명이 필요합니다');
  if (!propertyData.location) errors.push('소재지가 필요합니다');
  if (!propertyData.property_type) errors.push('매물종류가 필요합니다');
  if (!propertyData.transaction_type) errors.push('거래유형이 필요합니다');
  if (!propertyData.property_status) errors.push('진행상태가 필요합니다');
  
  // 거래유형별 가격 검증
  if (propertyData.transaction_type === 'sale' && (!propertyData.sale_price || propertyData.sale_price <= 0)) {
    errors.push('매매 거래시 매매가가 필요합니다');
  }
  
  if (propertyData.transaction_type === 'lease' && (!propertyData.lease_price || propertyData.lease_price <= 0)) {
    errors.push('전세 거래시 보증금이 필요합니다');
  }
  
  if (propertyData.transaction_type === 'rent' && (!propertyData.price || propertyData.price <= 0)) {
    errors.push('월세 거래시 월세가 필요합니다');
  }
  
  return errors;
};

// 매물 일괄 업로드
export const bulkUploadProperties = async (properties, userId) => {
  try {
    // 룩업 테이블 먼저 초기화
    await initializeLookupTables();
    
    const BATCH_SIZE = 50;
    let uploadedCount = 0;
    let failedCount = 0;
    const errors = [];
    
    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE);
      
      // 각 배치 데이터에 manager_id 추가
      const batchWithManagerId = batch.map(property => ({
        ...property,
        manager_id: userId || 'admin'  // 기본값으로 'admin' 사용
      }));
      
      try {
        // console.log(`배치 ${Math.floor(i/BATCH_SIZE) + 1} 업로드 중... (${batch.length}개 매물)`);
        
        // 데이터 검증
        for (const property of batchWithManagerId) {
          const validationErrors = validatePropertyData(property);
          if (validationErrors.length > 0) {
            throw new Error(`데이터 검증 실패: ${validationErrors.join(', ')}`);
          }
        }
        
        const { data, error } = await supabase
          .from('properties')
          .insert(batchWithManagerId)
          .select();
          
        if (error) throw error;
        
        uploadedCount += batch.length;
        // console.log(`배치 ${Math.floor(i/BATCH_SIZE) + 1} 완료: ${batch.length}개 업로드 (총 ${uploadedCount}개)`);
        
        // 배치 간 잠시 대기 (API 제한 방지)
        if (i + BATCH_SIZE < properties.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (batchError) {
        console.error(`배치 ${Math.floor(i/BATCH_SIZE) + 1} 실패:`, batchError);
        failedCount += batch.length;
        errors.push(`배치 ${Math.floor(i/BATCH_SIZE) + 1}: ${batchError.message}`);
      }
    }
    
    return {
      success: uploadedCount > 0,
      totalCount: properties.length,
      uploadedCount,
      failedCount,
      errors
    };
    
  } catch (error) {
    console.error('일괄 업로드 실패:', error);
    return {
      success: false,
      totalCount: properties.length,
      uploadedCount: 0,
      failedCount: properties.length,
      errors: [error.message]
    };
  }
};

export default {
  initializeLookupTables,
  getLookupTables,
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  validatePropertyData,
  bulkUploadProperties
};