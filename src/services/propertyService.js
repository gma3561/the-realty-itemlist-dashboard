import { supabase } from './supabase';

// 룩업 테이블 데이터 초기화 함수
export const initializeLookupTables = async () => {
  try {
    // 매물 종류 초기화
    const propertyTypes = [
      { id: 'apt', name: '아파트', order: 1 },
      { id: 'officetel', name: '오피스텔', order: 2 },
      { id: 'villa', name: '빌라/연립', order: 3 },
      { id: 'house', name: '단독주택', order: 4 },
      { id: 'commercial', name: '상가', order: 5 }
    ];

    // 거래 유형 초기화
    const transactionTypes = [
      { id: 'sale', name: '매매', order: 1 },
      { id: 'lease', name: '전세', order: 2 },
      { id: 'rent', name: '월세', order: 3 }
    ];

    // 매물 상태 초기화
    const propertyStatuses = [
      { id: 'available', name: '거래가능', order: 1 },
      { id: 'reserved', name: '거래보류', order: 2 },
      { id: 'completed', name: '거래완료', order: 3 }
    ];

    // 각 테이블에 데이터 삽입 (ON CONFLICT DO NOTHING으로 중복 방지)
    const results = await Promise.allSettled([
      supabase.from('property_types').upsert(propertyTypes, { onConflict: 'id' }),
      supabase.from('transaction_types').upsert(transactionTypes, { onConflict: 'id' }),
      supabase.from('property_statuses').upsert(propertyStatuses, { onConflict: 'id' })
    ]);

    console.log('룩업 테이블 초기화 완료:', results);
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
      supabase.from('property_types').select('*').order('order'),
      supabase.from('transaction_types').select('*').order('order'),
      supabase.from('property_statuses').select('*').order('order')
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
    
    // 룩업 테이블이 없거나 조회 실패 시 하드코딩된 데이터 반환
    return {
      propertyTypes: [
        { id: 'apt', name: '아파트' },
        { id: 'officetel', name: '오피스텔' },
        { id: 'villa', name: '빌라/연립' },
        { id: 'house', name: '단독주택' },
        { id: 'commercial', name: '상가' }
      ],
      transactionTypes: [
        { id: 'sale', name: '매매' },
        { id: 'lease', name: '전세' },
        { id: 'rent', name: '월세' }
      ],
      propertyStatuses: [
        { id: 'available', name: '거래가능' },
        { id: 'reserved', name: '거래보류' },
        { id: 'completed', name: '거래완료' }
      ]
    };
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
        console.log(`배치 ${Math.floor(i/BATCH_SIZE) + 1} 업로드 중... (${batch.length}개 매물)`);
        
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
        console.log(`배치 ${Math.floor(i/BATCH_SIZE) + 1} 완료: ${batch.length}개 업로드 (총 ${uploadedCount}개)`);
        
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
  validatePropertyData,
  bulkUploadProperties
};