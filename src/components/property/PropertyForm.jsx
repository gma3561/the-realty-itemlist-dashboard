import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PropertyForm = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Mock data for property types, statuses, and transaction types
  const propertyTypes = [
    { id: 'apt', name: '아파트' },
    { id: 'officetel', name: '오피스텔' },
    { id: 'villa', name: '빌라/연립' },
    { id: 'house', name: '단독주택' },
    { id: 'commercial', name: '상가' }
  ];

  const propertyStatuses = [
    { id: 'available', name: '거래가능' },
    { id: 'reserved', name: '거래보류' },
    { id: 'completed', name: '거래완료' }
  ];

  const transactionTypes = [
    { id: 'sale', name: '매매' },
    { id: 'lease', name: '전세' },
    { id: 'rent', name: '월세' }
  ];

  // Mock property data for editing
  const mockProperty = isEditing && id ? {
    id: parseInt(id),
    property_name: id === '1' ? '래미안 아파트 101동 1503호' : id === '2' ? '힐스테이트 오피스텔 A동 205호' : '신축 빌라 3층',
    location: id === '1' ? '서울시 강남구 삼성동' : id === '2' ? '서울시 서초구 서초동' : '서울시 마포구 합정동',
    property_type: id === '1' ? 'apt' : id === '2' ? 'officetel' : 'villa',
    transaction_type: id === '1' ? 'sale' : id === '2' ? 'lease' : 'rent',
    property_status: id === '1' ? 'available' : id === '2' ? 'available' : 'completed',
    price: id === '1' ? 2500000000 : id === '2' ? 800000000 : 50000000,
    supply_area_sqm: id === '1' ? 84.56 : id === '2' ? 32.15 : 65.23,
    private_area_sqm: id === '1' ? 59.82 : id === '2' ? 25.48 : 52.31,
    building: id === '1' ? '101동' : id === '2' ? 'A동' : '',
    unit: id === '1' ? '1503호' : id === '2' ? '205호' : '3층',
    floor_info: id === '1' ? '15층/25층' : id === '2' ? '2층/15층' : '3층/3층',
    rooms_bathrooms: id === '1' ? '3개/2개' : id === '2' ? '1개/1개' : '2개/1개',
    direction: id === '1' ? '남향' : id === '2' ? '동향' : '남서향',
    maintenance_fee: id === '1' ? '15만원' : id === '2' ? '8만원' : '5만원',
    parking: id === '1' ? '2대' : id === '2' ? '1대' : '1대',
    move_in_date: '즉시입주',
    approval_date: '2020.05.15',
    special_notes: '',
    manager_memo: '',
    is_commercial: false
  } : null;

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Mock API call - simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('매물 데이터:', values);
      
      setSuccess(true);
      
      // Navigate back to properties list after 2 seconds
      setTimeout(() => {
        navigate('/properties');
      }, 2000);
      
    } catch (err) {
      setError(`매물 ${isEditing ? '수정' : '등록'}에 실패했습니다: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formik 설정
  const formik = useFormik({
    initialValues: {
      property_type: mockProperty?.property_type || '',
      property_status: mockProperty?.property_status || '',
      transaction_type: mockProperty?.transaction_type || '',
      property_name: mockProperty?.property_name || '',
      location: mockProperty?.location || '',
      building: mockProperty?.building || '',
      unit: mockProperty?.unit || '',
      price: mockProperty?.price || '',
      supply_area_sqm: mockProperty?.supply_area_sqm || '',
      private_area_sqm: mockProperty?.private_area_sqm || '',
      floor_info: mockProperty?.floor_info || '',
      rooms_bathrooms: mockProperty?.rooms_bathrooms || '',
      direction: mockProperty?.direction || '',
      maintenance_fee: mockProperty?.maintenance_fee || '',
      parking: mockProperty?.parking || '',
      move_in_date: mockProperty?.move_in_date || '',
      approval_date: mockProperty?.approval_date || '',
      special_notes: mockProperty?.special_notes || '',
      manager_memo: mockProperty?.manager_memo || '',
      is_commercial: mockProperty?.is_commercial || false
    },
    validationSchema: Yup.object({
      property_name: Yup.string().required('매물명은 필수 입력사항입니다'),
      location: Yup.string().required('소재지는 필수 입력사항입니다'),
      property_type: Yup.string().required('매물종류는 필수 선택사항입니다'),
      property_status: Yup.string().required('진행상태는 필수 선택사항입니다'),
      transaction_type: Yup.string().required('거래유형은 필수 선택사항입니다'),
      price: Yup.number().positive('유효한 금액을 입력하세요').required('금액은 필수 입력사항입니다'),
      supply_area_sqm: Yup.number().positive('유효한 면적을 입력하세요'),
      private_area_sqm: Yup.number().positive('유효한 면적을 입력하세요')
    }),
    onSubmit: handleSubmit,
    enableReinitialize: true
  });

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
                  name="property_type"
                  value={formik.values.property_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">매물종류 선택</option>
                  {propertyTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formik.touched.property_type && formik.errors.property_type && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_type}</p>
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
                  name="property_status"
                  value={formik.values.property_status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">진행상태 선택</option>
                  {propertyStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
                {formik.touched.property_status && formik.errors.property_status && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.property_status}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="transaction_type"
                  value={formik.values.transaction_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">거래유형 선택</option>
                  {transactionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formik.touched.transaction_type && formik.errors.transaction_type && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.transaction_type}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  금액 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 25000000000"
                />
                {formik.touched.price && formik.errors.price && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.price}</p>
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