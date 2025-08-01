import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { getLookupTables } from '../../services/propertyService';

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

  // 숫자 필드 처리 함수 (빈 문자열을 null로 변환)
  const processNumericFields = (values) => {
    const numericFields = [
      'price', 'lease_price', 'supply_area_sqm', 'private_area_sqm', 
      'supply_area_pyeong', 'private_area_pyeong', 'maintenance_fee'
    ];
    
    const processedValues = { ...values };
    
    numericFields.forEach(field => {
      if (processedValues[field] === '' || processedValues[field] === undefined) {
        processedValues[field] = null;
      } else if (processedValues[field] !== null) {
        // 숫자로 변환
        const numValue = parseFloat(processedValues[field]);
        processedValues[field] = isNaN(numValue) ? null : numValue;
      }
    });
    
    return processedValues;
  };

  // 매물 등록/수정 Mutation
  const mutation = useMutation(
    async (values) => {
      const processedValues = processNumericFields(values);
      
      // 고객 정보를 resident 컬럼에 JSON으로 저장
      const customerInfo = {
        name: values.customer_name,
        phone: values.customer_phone,
        email: values.customer_email,
        address: values.customer_address,
        notes: values.customer_notes
      };

      const finalValues = {
        ...processedValues,
        resident: JSON.stringify(customerInfo)
      };

      // 고객 정보 필드들은 데이터베이스에 직접 저장하지 않으므로 제거
      delete finalValues.customer_name;
      delete finalValues.customer_phone;
      delete finalValues.customer_email;
      delete finalValues.customer_address;
      delete finalValues.customer_notes;
      
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
      building: property?.building || '',
      unit: property?.unit || '',
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
      is_commercial: property?.is_commercial || false,
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
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? '매물 정보 수정' : '새 매물 등록'}
      </h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          매물이 성공적으로 {isEditing ? '수정' : '등록'}되었습니다! 매물 목록으로 이동합니다...
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 기본 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="property_name"
                  value={formik.values.property_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 래미안 아파트 106동"
                />
                {formik.touched.property_name && formik.errors.property_name && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소재지 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 서울시 강남구 삼성동"
                />
                {formik.touched.location && formik.errors.location && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.location}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물종류 <span className="text-red-500">*</span>
                </label>
                <select
                  name="property_type_id"
                  value={formik.values.property_type_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">동</label>
                  <input
                    type="text"
                    name="building"
                    value={formik.values.building}
                    onChange={formik.handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 106동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">호</label>
                  <input
                    type="text"
                    name="unit"
                    value={formik.values.unit}
                    onChange={formik.handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 1503호"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상가여부
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="is_commercial"
                      checked={formik.values.is_commercial}
                      onChange={formik.handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-gray-700">상가</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* 거래 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">거래 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  진행상태 <span className="text-red-500">*</span>
                </label>
                <select
                  name="property_status_id"
                  value={formik.values.property_status_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="transaction_type_id"
                  value={formik.values.transaction_type_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      매매가 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      분양가 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전세 보증금 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="lease_price"
                        value={formik.values.lease_price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        보증금 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="lease_price"
                          value={formik.values.lease_price}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="예: 50000000"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500">원</span>
                      </div>
                      {formik.touched.lease_price && formik.errors.lease_price && (
                        <p className="mt-1 text-sm text-red-500">{formik.errors.lease_price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        월세 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="price"
                          value={formik.values.price}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      일일요금 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formik.values.price}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <h3 className="text-lg font-medium text-gray-800 mb-3">물건 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공급면적(㎡)</label>
                  <input
                    type="number"
                    name="supply_area_sqm"
                    value={formik.values.supply_area_sqm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">전용면적(㎡)</label>
                  <input
                    type="number"
                    name="private_area_sqm"
                    value={formik.values.private_area_sqm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">층/총층</label>
                <input
                  type="text"
                  name="floor_info"
                  value={formik.values.floor_info}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 15층/25층"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방/욕실</label>
                <input
                  type="text"
                  name="rooms_bathrooms"
                  value={formik.values.rooms_bathrooms}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 3개/2개"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방향</label>
                <input
                  type="text"
                  name="direction"
                  value={formik.values.direction}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 남향"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리비</label>
                <input
                  type="text"
                  name="maintenance_fee"
                  value={formik.values.maintenance_fee}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 15만원"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주차</label>
                <input
                  type="text"
                  name="parking"
                  value={formik.values.parking}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 2대"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입주가능일</label>
                <input
                  type="text"
                  name="move_in_date"
                  value={formik.values.move_in_date}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 즉시입주"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용승인일</label>
                <input
                  type="text"
                  name="approval_date"
                  value={formik.values.approval_date}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 2022.05.20"
                />
              </div>
            </div>
          </div>
          
          {/* 특이사항 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">추가 정보</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특이사항
                </label>
                <textarea
                  name="special_notes"
                  value={formik.values.special_notes}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="매물의 특이사항을 입력하세요"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 메모
                </label>
                <textarea
                  name="manager_memo"
                  value={formik.values.manager_memo}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="담당자만 볼 수 있는 내부 메모"
                ></textarea>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">고객 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formik.values.customer_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="고객 이름을 입력하세요"
                />
                {formik.touched.customer_name && formik.errors.customer_name && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formik.values.customer_phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-1234-5678"
                />
                {formik.touched.customer_phone && formik.errors.customer_phone && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formik.values.customer_email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="customer@example.com"
                />
                {formik.touched.customer_email && formik.errors.customer_email && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.customer_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  name="customer_address"
                  value={formik.values.customer_address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="고객 주소를 입력하세요"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객 메모
                </label>
                <textarea
                  name="customer_notes"
                  value={formik.values.customer_notes}
                  onChange={formik.handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="고객 관련 메모사항을 입력하세요"
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* 버튼 그룹 */}
          <div className="md:col-span-2 flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={() => navigate('/properties')}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? '처리 중...' : isEditing ? '수정 완료' : '등록 완료'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;