import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

import Input from '../common/Input';
import Button from '../common/Button';
import PropertyTypeSelect from './PropertyTypeSelect';
import PropertyStatusSelect from './PropertyStatusSelect';
import TransactionTypeSelect from './TransactionTypeSelect';

const PropertyForm = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  // 매물 등록/수정 Mutation
  const mutation = useMutation(
    async (values) => {
      if (isEditing) {
        // 수정
        const { data, error } = await supabase
          .from('properties')
          .update(values)
          .eq('id', id);
          
        if (error) throw error;
        return data;
      } else {
        // 등록
        const { data, error } = await supabase
          .from('properties')
          .insert([{ ...values, manager_id: user.id }]);
          
        if (error) throw error;
        return data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        navigate('/properties');
      },
      onError: (err) => {
        setError(`매물 ${isEditing ? '수정' : '등록'}에 실패했습니다: ${err.message}`);
        setIsSubmitting(false);
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  // Formik 설정
  const formik = useFormik({
    initialValues: {
      property_type_id: '',
      property_status_id: '',
      transaction_type_id: '',
      property_name: '',
      location: '',
      building: '',
      unit: '',
      price: '',
      supply_area_sqm: '',
      private_area_sqm: '',
      floor_info: '',
      rooms_bathrooms: '',
      direction: '',
      maintenance_fee: '',
      parking: '',
      move_in_date: '',
      approval_date: '',
      special_notes: '',
      manager_memo: '',
      is_commercial: false
    },
    validationSchema: Yup.object({
      property_name: Yup.string().required('매물명은 필수 입력사항입니다'),
      location: Yup.string().required('소재지는 필수 입력사항입니다'),
      property_type_id: Yup.string().required('매물종류는 필수 선택사항입니다'),
      property_status_id: Yup.string().required('진행상태는 필수 선택사항입니다'),
      transaction_type_id: Yup.string().required('거래유형은 필수 선택사항입니다'),
      price: Yup.number().positive('유효한 금액을 입력하세요').required('금액은 필수 입력사항입니다'),
      supply_area_sqm: Yup.number().positive('유효한 면적을 입력하세요'),
      private_area_sqm: Yup.number().positive('유효한 면적을 입력하세요')
    }),
    onSubmit: (values) => {
      setIsSubmitting(true);
      mutation.mutate(values);
    },
    enableReinitialize: true
  });

  // 수정 시 초기값 설정
  useEffect(() => {
    if (isEditing && property) {
      const initialValues = { ...formik.initialValues };
      
      // property 객체의 값으로 initialValues 업데이트
      Object.keys(initialValues).forEach(key => {
        if (property[key] !== undefined) {
          initialValues[key] = property[key];
        }
      });
      
      formik.resetForm({ values: initialValues });
    }
  }, [isEditing, property]);

  if (isEditing && isPropertyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">매물 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 면적 계산 (제곱미터 -> 평)
  const calculatePyeong = (sqm) => {
    if (!sqm) return '';
    return (sqm * 0.3025).toFixed(2);
  };

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
      
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 기본 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="매물명"
                name="property_name"
                value={formik.values.property_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.property_name && formik.errors.property_name}
                required
                placeholder="예: 래미안 아파트 106동"
              />
              
              <Input
                label="소재지"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && formik.errors.location}
                required
                placeholder="예: 서울시 강남구 삼성동"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물종류 <span className="text-red-500">*</span>
                </label>
                <PropertyTypeSelect
                  value={formik.values.property_type_id}
                  onChange={(value) => formik.setFieldValue('property_type_id', value)}
                  onBlur={() => formik.setFieldTouched('property_type_id')}
                  required
                />
                {formik.touched.property_type_id && formik.errors.property_type_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_type_id}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="동"
                  name="building"
                  value={formik.values.building}
                  onChange={formik.handleChange}
                  placeholder="예: 106동"
                />
                <Input
                  label="호"
                  name="unit"
                  value={formik.values.unit}
                  onChange={formik.handleChange}
                  placeholder="예: 1503호"
                />
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
                <PropertyStatusSelect
                  value={formik.values.property_status_id}
                  onChange={(value) => formik.setFieldValue('property_status_id', value)}
                  onBlur={() => formik.setFieldTouched('property_status_id')}
                  required
                />
                {formik.touched.property_status_id && formik.errors.property_status_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_status_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래유형 <span className="text-red-500">*</span>
                </label>
                <TransactionTypeSelect
                  value={formik.values.transaction_type_id}
                  onChange={(value) => formik.setFieldValue('transaction_type_id', value)}
                  onBlur={() => formik.setFieldTouched('transaction_type_id')}
                  required
                />
                {formik.touched.transaction_type_id && formik.errors.transaction_type_id && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.transaction_type_id}</p>
                )}
              </div>
              
              <Input
                label="금액"
                name="price"
                type="number"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && formik.errors.price}
                required
                placeholder="예: 25000000000"
              />
            </div>
          </div>
          
          {/* 물건 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-800 mb-3">물건 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    label="공급면적(㎡)"
                    name="supply_area_sqm"
                    type="number"
                    value={formik.values.supply_area_sqm}
                    onChange={(e) => {
                      formik.handleChange(e);
                      const pyeong = calculatePyeong(e.target.value);
                      formik.setFieldValue('supply_area_pyeong', pyeong);
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.supply_area_sqm && formik.errors.supply_area_sqm}
                    placeholder="예: 84.56"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formik.values.supply_area_sqm ? `${calculatePyeong(formik.values.supply_area_sqm)}평` : ''}
                  </div>
                </div>
                
                <div>
                  <Input
                    label="전용면적(㎡)"
                    name="private_area_sqm"
                    type="number"
                    value={formik.values.private_area_sqm}
                    onChange={(e) => {
                      formik.handleChange(e);
                      const pyeong = calculatePyeong(e.target.value);
                      formik.setFieldValue('private_area_pyeong', pyeong);
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.private_area_sqm && formik.errors.private_area_sqm}
                    placeholder="예: 59.82"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formik.values.private_area_sqm ? `${calculatePyeong(formik.values.private_area_sqm)}평` : ''}
                  </div>
                </div>
              </div>
              
              <Input
                label="층/총층"
                name="floor_info"
                value={formik.values.floor_info}
                onChange={formik.handleChange}
                placeholder="예: 15층/25층"
              />
              
              <Input
                label="방/욕실"
                name="rooms_bathrooms"
                value={formik.values.rooms_bathrooms}
                onChange={formik.handleChange}
                placeholder="예: 3개/2개"
              />
              
              <Input
                label="방향"
                name="direction"
                value={formik.values.direction}
                onChange={formik.handleChange}
                placeholder="예: 남향"
              />
              
              <Input
                label="관리비"
                name="maintenance_fee"
                value={formik.values.maintenance_fee}
                onChange={formik.handleChange}
                placeholder="예: 15만원"
              />
              
              <Input
                label="주차"
                name="parking"
                value={formik.values.parking}
                onChange={formik.handleChange}
                placeholder="예: 2대"
              />
              
              <Input
                label="입주가능일"
                name="move_in_date"
                value={formik.values.move_in_date}
                onChange={formik.handleChange}
                placeholder="예: 즉시입주"
              />
              
              <Input
                label="사용승인일"
                name="approval_date"
                value={formik.values.approval_date}
                onChange={formik.handleChange}
                placeholder="예: 2022.05.20"
              />
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
          
          {/* 버튼 그룹 */}
          <div className="md:col-span-2 flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/properties')}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : isEditing ? '수정 완료' : '등록 완료'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;