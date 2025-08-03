import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { getLookupTables } from '../../services/propertyService';
import { isHardcodedAdmin } from '../../data/hardcodedAdmins';

const PropertyForm = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 룩업 테이블 데이터 조회
  const { data: lookupData, isLoading: isLookupLoading } = useQuery(
    ['lookupTables'],
    getLookupTables,
    {
      staleTime: 5 * 60 * 1000, // 5분간 캐시
      onError: (err) => {
        console.error('룩업 테이블 조회 실패:', err);
      }
    }
  );

  const propertyTypes = lookupData?.propertyTypes || [];
  const propertyStatuses = lookupData?.propertyStatuses || [];
  const transactionTypes = lookupData?.transactionTypes || [];

  // 매물 상세 정보 조회 (수정 시)
  const { data: property, isLoading: isPropertyLoading } = useQuery(
    ['property', id],
    async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    },
    {
      enabled: isEditing && !!id,
      onError: (err) => {
        setError(`매물 정보를 불러오는데 실패했습니다: ${err.message}`);
      }
    }
  );

  // 숫자 및 날짜 필드 처리 함수 (빈 문자열을 null로 변환)
  const processNumericFields = (values) => {
    const numericFields = [
      'price', 'lease_price', 'supply_area_sqm', 'private_area_sqm', 
      'supply_area_pyeong', 'private_area_pyeong', 'maintenance_fee'
    ];
    
    const dateFields = [
      'move_in_date', 'available_date'
    ];
    
    const processedValues = { ...values };
    
    // 숫자 필드 처리
    numericFields.forEach(field => {
      if (processedValues[field] === '' || processedValues[field] === undefined) {
        processedValues[field] = null;
      } else if (processedValues[field] !== null) {
        // 숫자로 변환
        const numValue = parseFloat(processedValues[field]);
        processedValues[field] = isNaN(numValue) ? null : numValue;
      }
    });
    
    // 날짜 필드 처리
    dateFields.forEach(field => {
      if (processedValues[field] === '' || processedValues[field] === undefined) {
        processedValues[field] = null;
      }
    });
    
    return processedValues;
  };

  // 매물 등록/수정 Mutation
  const mutation = useMutation(
    async (values) => {
      const processedValues = processNumericFields(values);
      
      // 데이터베이스 컬럼에 맞게 필드 매핑
      const finalValues = {
        property_name: processedValues.property_name,
        location: processedValues.location,
        building_name: processedValues.dong || '',
        room_number: processedValues.ho || '',
        property_type: processedValues.property_type_id,
        transaction_type: processedValues.transaction_type_id,
        property_status: processedValues.property_status_id,
        price: processedValues.price,
        lease_price: processedValues.lease_price,
        area_m2: processedValues.supply_area_sqm,
        area_pyeong: processedValues.supply_area_sqm ? Math.round(processedValues.supply_area_sqm * 0.3025 * 10) / 10 : null,
        floor_current: processedValues.floor_current,
        floor_total: processedValues.floor_total,
        room_count: processedValues.rooms,
        bath_count: processedValues.bathrooms,
        monthly_fee: processedValues.maintenance_fee,
        description: processedValues.special_notes,
        special_notes: processedValues.manager_memo,
        available_date: processedValues.move_in_date || null,
        customer_name: processedValues.customer_name,
        customer_phone: processedValues.customer_phone,
        customer_request: processedValues.customer_notes,
        owner_name: processedValues.owner || '',
        owner_phone: processedValues.owner_contact || ''
      };
      
      if (isEditing) {
        // 수정
        const { data, error } = await supabase
          .from('properties')
          .update(finalValues)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // 등록
        const { data, error } = await supabase
          .from('properties')
          .insert([{ ...finalValues, manager_id: user.id }])
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['properties']);
        queryClient.invalidateQueries(['property', id]);
        setSuccess(true);
        
        // Navigate back to properties list after 2 seconds
        setTimeout(() => {
          navigate('/properties');
        }, 2000);
      },
      onError: (err) => {
        setError(`매물 ${isEditing ? '수정' : '등록'}에 실패했습니다: ${err.message}`);
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    mutation.mutate(values);
  };

  // 기존 고객 정보 파싱
  const getCustomerInfo = () => {
    if (property?.resident) {
      try {
        return JSON.parse(property.resident);
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const customerInfo = getCustomerInfo();

  // Formik 설정
  const formik = useFormik({
    initialValues: {
      property_type_id: property?.property_type_id || '',
      property_status_id: property?.property_status_id || '',
      transaction_type_id: property?.transaction_type_id || '',
      property_name: property?.property_name || '',
      location: property?.location || '',
      dong: property?.dong || '',
      ho: property?.ho || '',
      // 거래유형별 가격 필드 (데이터베이스 스키마에 맞게)
      lease_price: property?.lease_price || '',
      price: property?.price || '',
      supply_area_sqm: property?.supply_area_sqm || '',
      private_area_sqm: property?.private_area_sqm || '',
      floor_info: property?.floor_info || '',
      rooms_bathrooms: property?.rooms_bathrooms || '',
      direction: property?.direction || '',
      maintenance_fee: property?.maintenance_fee || '',
      parking: property?.parking || '',
      move_in_date: property?.move_in_date || '',
      approval_date: property?.approval_date || '',
      special_notes: property?.special_notes || '',
      manager_memo: property?.manager_memo || '',
      // 고객 정보 (기존 데이터에서 파싱)
      customer_name: customerInfo.name || '',
      customer_phone: customerInfo.phone || '',
      customer_email: customerInfo.email || '',
      customer_address: customerInfo.address || '',
      customer_notes: customerInfo.notes || ''
    },
    validationSchema: Yup.object({
      property_name: Yup.string().required('매물명은 필수 입력사항입니다'),
      location: Yup.string().required('소재지는 필수 입력사항입니다'),
      property_type_id: Yup.string().required('매물종류는 필수 선택사항입니다'),
      property_status_id: Yup.string().required('진행상태는 필수 선택사항입니다'),
      transaction_type_id: Yup.string().required('거래유형은 필수 선택사항입니다'),
      supply_area_sqm: Yup.number().positive('유효한 면적을 입력하세요'),
      private_area_sqm: Yup.number().positive('유효한 면적을 입력하세요'),
      // 고객 정보 유효성 검사
      customer_name: Yup.string().required('고객 이름은 필수 입력사항입니다'),
      customer_phone: Yup.string()
        .matches(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식을 입력하세요 (예: 010-1234-5678)')
        .required('고객 전화번호는 필수 입력사항입니다'),
      customer_email: Yup.string().email('올바른 이메일 형식을 입력하세요')
    }),
    onSubmit: handleSubmit,
    enableReinitialize: true
  });

  // 면적 계산 (제곱미터 -> 평)
  const calculatePyeong = (sqm) => {
    if (!sqm) return '';
    return (sqm * 0.3025).toFixed(2);
  };

  // UUID로 lookup 테이블의 name 찾기
  const getTransactionTypeName = (id) => {
    const type = transactionTypes.find(t => t.id === id);
    return type ? type.name : '';
  };

  if ((isEditing && isPropertyLoading) || isLookupLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">
          {isEditing ? '매물 정보를 불러오는 중...' : '시스템 데이터를 불러오는 중...'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 lg:p-8 border border-slate-200">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {isEditing ? '매물 정보 수정' : '새 매물 등록'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600">{isEditing ? '매물 정보를 수정하세요' : '새로운 매물을 등록해주세요'}</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-xl text-red-700 shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl text-green-700 shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">매물이 성공적으로 {isEditing ? '수정' : '등록'}되었습니다! 매물 목록으로 이동합니다...</span>
          </div>
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-200">기본 정보</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  매물명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="property_name"
                  value={formik.values.property_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 래미안 아파트 106동"
                />
                {formik.touched.property_name && formik.errors.property_name && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  소재지 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 서울시 강남구 삼성동"
                />
                {formik.touched.location && formik.errors.location && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.location}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  매물종류 <span className="text-red-500">*</span>
                </label>
                <select
                  name="property_type_id"
                  value={formik.values.property_type_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                >
                  <option value="">매물종류 선택</option>
                  {propertyTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formik.touched.property_type_id && formik.errors.property_type_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_type_id}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">동</label>
                  <input
                    type="text"
                    name="dong"
                    value={formik.values.dong}
                    onChange={formik.handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="예: 106동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">호</label>
                  <input
                    type="text"
                    name="ho"
                    value={formik.values.ho}
                    onChange={formik.handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="예: 1503호"
                  />
                </div>
              </div>
              
            </div>
          </div>
          
          {/* 거래 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">거래 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  진행상태 <span className="text-red-500">*</span>
                </label>
                <select
                  name="property_status_id"
                  value={formik.values.property_status_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                >
                  <option value="">진행상태 선택</option>
                  {propertyStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
                {formik.touched.property_status_id && formik.errors.property_status_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_status_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  거래유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="transaction_type_id"
                  value={formik.values.transaction_type_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                >
                  <option value="">거래유형 선택</option>
                  {transactionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formik.touched.transaction_type_id && formik.errors.transaction_type_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.transaction_type_id}</p>
                )}
              </div>
              
              {/* 거래유형별 가격 필드 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-800">가격 정보</h4>
                
                {/* 매매 */}
                {getTransactionTypeName(formik.values.transaction_type_id) === '매매' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      매매가 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="예: 2500000000"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                    </div>
                    {formik.touched.price && formik.errors.price && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.price}</p>
                    )}
                  </div>
                )}

                {/* 분양 */}
                {getTransactionTypeName(formik.values.transaction_type_id) === '분양' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      분양가 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="예: 3000000000"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                    </div>
                    {formik.touched.price && formik.errors.price && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.price}</p>
                    )}
                  </div>
                )}
                
                {/* 전세 */}
                {getTransactionTypeName(formik.values.transaction_type_id) === '전세' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      전세 보증금 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="lease_price"
                        value={formik.values.lease_price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="예: 200000000"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                    </div>
                    {formik.touched.lease_price && formik.errors.lease_price && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.lease_price}</p>
                    )}
                  </div>
                )}
                
                {/* 월세/월세렌트 */}
                {(getTransactionTypeName(formik.values.transaction_type_id) === '월세' ||
                  getTransactionTypeName(formik.values.transaction_type_id) === '월세/렌트') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        보증금 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="lease_price"
                          value={formik.values.lease_price}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="예: 50000000"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                      </div>
                      {formik.touched.lease_price && formik.errors.lease_price && (
                        <p className="mt-1 text-sm text-red-500">{formik.errors.lease_price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        월세 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="price"
                          value={formik.values.price}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="예: 500000"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                      </div>
                      {formik.touched.price && formik.errors.price && (
                        <p className="mt-1 text-sm text-red-500">{formik.errors.price}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 단기임대 */}
                {(getTransactionTypeName(formik.values.transaction_type_id) === '단기' ||
                  getTransactionTypeName(formik.values.transaction_type_id) === '단기임대') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      일일요금 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="예: 150000"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">원/일</span>
                    </div>
                    {formik.touched.price && formik.errors.price && (
                      <p className="mt-1 text-sm text-red-500">{formik.errors.price}</p>
                    )}
                  </div>
                )}

                {/* 거래유형이 선택되지 않았을 때 */}
                {!getTransactionTypeName(formik.values.transaction_type_id) && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                    거래유형을 먼저 선택하시면 해당 유형에 맞는 가격 입력 필드가 나타납니다.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 물건 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">물건 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">공급면적(㎡)</label>
                  <input
                    type="number"
                    name="supply_area_sqm"
                    value={formik.values.supply_area_sqm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="예: 84.56"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formik.values.supply_area_sqm ? `${calculatePyeong(formik.values.supply_area_sqm)}평` : ''}
                  </div>
                  {formik.touched.supply_area_sqm && formik.errors.supply_area_sqm && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.supply_area_sqm}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">전용면적(㎡)</label>
                  <input
                    type="number"
                    name="private_area_sqm"
                    value={formik.values.private_area_sqm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="예: 59.82"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formik.values.private_area_sqm ? `${calculatePyeong(formik.values.private_area_sqm)}평` : ''}
                  </div>
                  {formik.touched.private_area_sqm && formik.errors.private_area_sqm && (
                    <p className="mt-1 text-sm text-red-500">{formik.errors.private_area_sqm}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">층/총층</label>
                <input
                  type="text"
                  name="floor_info"
                  value={formik.values.floor_info}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 15층/25층"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">방/욕실</label>
                <input
                  type="text"
                  name="rooms_bathrooms"
                  value={formik.values.rooms_bathrooms}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 3개/2개"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">방향</label>
                <input
                  type="text"
                  name="direction"
                  value={formik.values.direction}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 남향"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">관리비</label>
                <input
                  type="text"
                  name="maintenance_fee"
                  value={formik.values.maintenance_fee}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 15만원"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">주차</label>
                <input
                  type="text"
                  name="parking"
                  value={formik.values.parking}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 2대"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">입주가능일</label>
                <input
                  type="text"
                  name="move_in_date"
                  value={formik.values.move_in_date}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="예: 즉시입주"
                />
              </div>
              
              {/* 관리자만 사용승인일 필드를 볼 수 있음 */}
              {isHardcodedAdmin(user?.email) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">사용승인일</label>
                  <input
                    type="text"
                    name="approval_date"
                    value={formik.values.approval_date}
                    onChange={formik.handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="예: 2022.05.20"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 특이사항 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">추가 정보</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  특이사항
                </label>
                <textarea
                  name="special_notes"
                  value={formik.values.special_notes}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="매물의 특이사항을 입력하세요"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  담당자 메모
                </label>
                <textarea
                  name="manager_memo"
                  value={formik.values.manager_memo}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="담당자만 볼 수 있는 내부 메모"
                ></textarea>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">고객 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  고객 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formik.values.customer_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="고객 이름을 입력하세요"
                />
                {formik.touched.customer_name && formik.errors.customer_name && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formik.values.customer_phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="010-1234-5678"
                />
                {formik.touched.customer_phone && formik.errors.customer_phone && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formik.values.customer_email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="customer@example.com"
                />
                {formik.touched.customer_email && formik.errors.customer_email && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  주소
                </label>
                <input
                  type="text"
                  name="customer_address"
                  value={formik.values.customer_address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="고객 주소를 입력하세요"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  고객 메모
                </label>
                <textarea
                  name="customer_notes"
                  value={formik.values.customer_notes}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white shadow-sm"
                  placeholder="고객 관련 메모사항을 입력하세요"
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* 버튼 그룹 */}
          <div className="md:col-span-2 flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/properties')}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </span>
              ) : isEditing ? '수정 완료' : '등록 완료'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;