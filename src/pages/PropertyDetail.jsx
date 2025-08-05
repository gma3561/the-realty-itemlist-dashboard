import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import propertyService from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import { getRealtorNameByEmail } from '../data/realtorNameMap';
import Button from '../components/common/Button';
import ManagerAssignment from '../components/matching/ManagerAssignment';
import PropertyContactInfo from '../components/property/PropertyContactInfo';
import PropertyComments from '../components/property/PropertyComments';
import { Edit, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { data: property, isLoading, error } = useQuery(
    ['property', id],
    async () => {
      const { data, error } = await propertyService.getPropertyById(id);
      if (error) throw new Error(error);
      return data;
    }
  );

  // 룩업 데이터 가져오기
  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
  
  const deleteMutation = useMutation(
    async () => {
      setIsDeleting(true);
      const { error } = await propertyService.deleteProperty(id);
      if (error) throw new Error(error);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        navigate('/properties');
      },
      onError: (error) => {
        console.error('Delete error:', error);
        setIsDeleting(false);
      }
    }
  );
  
  const handleDelete = () => {
    setShowConfirmation(true);
  };
  
  const confirmDelete = () => {
    deleteMutation.mutate();
  };
  
  const cancelDelete = () => {
    setShowConfirmation(false);
  };
  
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">매물 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600">
        <AlertTriangle className="w-6 h-6 inline-block mr-2" />
        매물 정보를 불러오는데 실패했습니다: {error.message}
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
        <AlertTriangle className="w-6 h-6 inline-block mr-2" />
        해당 매물을 찾을 수 없습니다.
      </div>
    );
  }
  
  // 헬퍼 함수 추가
  const getPropertyType = () => {
    // property_type_id가 문자열일 경우 직접 매핑
    const typeMapping = {
      'apt': '아파트',
      'officetel': '오피스텔',
      'villa': '빌라/연립',
      'house': '단독주택',
      'commercial': '상가'
    };
    
    if (typeMapping[property.property_type_id]) {
      return typeMapping[property.property_type_id];
    }
    
    // UUID로 찾기
    return lookupData.propertyTypes?.find(t => t.id === property.property_type_id)?.name || property.property_type_id || '-';
  };

  const getTransactionType = () => {
    // transaction_type_id가 문자열일 경우 직접 매핑
    const typeMapping = {
      'presale': '분양',
      'developer': '시행사매물',
      'sale': '매매',
      'lease': '전세',
      'rent': '월세/렌트',
      'short': '단기'
    };
    
    if (typeMapping[property.transaction_type_id]) {
      return typeMapping[property.transaction_type_id];
    }
    
    // UUID로 찾기
    return lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id)?.name || property.transaction_type_id || '-';
  };

  const getPropertyStatus = () => {
    // property_status_id가 문자열일 경우 직접 매핑
    const statusMapping = {
      'available': '거래가능',
      'completed': '거래완료',
      'hold': '거래보류',
      'cancelled': '거래철회',
      'inspection_available': '임장가능'
    };
    
    if (statusMapping[property.property_status_id]) {
      return statusMapping[property.property_status_id];
    }
    
    // UUID로 찾기
    return lookupData.propertyStatuses?.find(s => s.id === property.property_status_id)?.name || property.property_status_id || '-';
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    
    if (price >= 100000000) {
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (man > 0) {
        return `${eok}억 ${man.toLocaleString()}만원`;
      }
      return `${eok}억원`;
    } else if (price >= 10000) {
      return `${(price / 10000).toLocaleString()}만원`;
    }
    return `${price.toLocaleString()}원`;
  };

  const getDisplayPrice = () => {
    const transactionType = getTransactionType();
    
    if (transactionType === '매매') {
      return formatPrice(property.price || 0);
    } else if (transactionType === '전세') {
      return formatPrice(property.lease_price || 0);
    } else if (transactionType === '월세/렌트' || transactionType === '월세') {
      const deposit = formatPrice(property.lease_price || 0);
      const monthly = formatPrice(property.monthly_rent || property.price || 0);
      return `${deposit} / ${monthly}`;
    }
    return formatPrice(property.price || 0) || '-';
  };

  const calculatePyeong = (sqm) => {
    if (!sqm) return '-';
    return `${(sqm * 0.3025).toFixed(1)}평`;
  };

  const canEdit = user && (user.id === property.manager_id || user.email === property.manager_id || user.role === 'admin');
  
  return (
    <div>
      {/* 상단 버튼 그룹 */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/properties')}
            className="text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" /> 목록으로
          </Button>
        </div>
        
        {canEdit && (
          <div className="flex space-x-1.5 sm:space-x-2">
            <Link to={`/properties/${id}/edit`}>
              <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" /> 수정
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs sm:text-sm"
            >
              <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" /> 삭제
            </Button>
          </div>
        )}
      </div>
      
      {/* 매물 헤더 */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{property.property_name}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">{property.location} {property.building} {property.unit}</p>
          </div>
          <div className="mt-3 md:mt-0">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full 
              ${getPropertyStatus() === '거래가능' 
                ? 'bg-green-100 text-green-800' 
                : getPropertyStatus() === '거래완료' 
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {getPropertyStatus()}
            </span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">매물종류</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900">{getPropertyType()}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">거래유형</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900">{getTransactionType()}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">금액</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900">{getDisplayPrice()}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">담당자</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-gray-900">
              {property.manager?.name || 
               (property.manager_id?.includes('@') 
                 ? getRealtorNameByEmail(property.manager_id.replace('hardcoded-', ''))
                 : property.manager_id) || '-'}
            </p>
          </div>
        </div>
      </div>
      
      {/* 매물 상세 정보 */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">매물 상세 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">기본 정보</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 border-b border-gray-200 py-1.5 sm:py-2">
                <p className="text-xs sm:text-sm font-medium text-gray-500">소재지</p>
                <p className="text-xs sm:text-sm text-gray-900">{property.location || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">건물명</p>
                <p className="text-sm text-gray-900">{property.property_name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">동/호수</p>
                <p className="text-sm text-gray-900">
                  {property.building ? property.building : ''} 
                  {property.unit ? `${property.building ? '/' : ''} ${property.unit}` : ''}
                  {!property.building && !property.unit && '-'}
                </p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">매물종류</p>
                <p className="text-sm text-gray-900">{getPropertyType()}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">상가여부</p>
                <p className="text-sm text-gray-900">{property.is_commercial ? '상가' : '비상가'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">거래 정보</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 border-b border-gray-200 py-1.5 sm:py-2">
                <p className="text-xs sm:text-sm font-medium text-gray-500">진행상태</p>
                <p className="text-xs sm:text-sm text-gray-900">{getPropertyStatus()}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">거래유형</p>
                <p className="text-sm text-gray-900">{getTransactionType()}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">금액</p>
                <p className="text-sm text-gray-900">{getDisplayPrice()}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">거래완료날짜</p>
                <p className="text-sm text-gray-900">{property.transaction_completed_date || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">등록일</p>
                <p className="text-sm text-gray-900">
                  {property.created_at 
                    ? new Date(property.created_at).toLocaleDateString('ko-KR')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">물건 정보</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">공급/전용(㎡)</p>
                <p className="text-sm text-gray-900">
                  {property.supply_area_sqm ? `${property.supply_area_sqm}㎡` : '-'} / 
                  {property.private_area_sqm ? ` ${property.private_area_sqm}㎡` : ' -'}
                </p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">공급/전용(평)</p>
                <p className="text-sm text-gray-900">
                  {property.supply_area_sqm ? calculatePyeong(property.supply_area_sqm) : '-'} / 
                  {property.private_area_sqm ? ` ${calculatePyeong(property.private_area_sqm)}` : ' -'}
                </p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">해당층/총층</p>
                <p className="text-sm text-gray-900">{property.floor_info || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">방/욕실</p>
                <p className="text-sm text-gray-900">{property.rooms_bathrooms || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">방향</p>
                <p className="text-sm text-gray-900">{property.direction || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">관리비</p>
                <p className="text-sm text-gray-900">{property.maintenance_fee || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">주차</p>
                <p className="text-sm text-gray-900">{property.parking || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">입주가능일</p>
                <p className="text-sm text-gray-900">{property.move_in_date || '-'}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-200 py-2">
                <p className="text-sm font-medium text-gray-500">사용승인</p>
                <p className="text-sm text-gray-900">{property.approval_date || '-'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">추가 정보</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">특이사항</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {property.special_notes || '특이사항이 없습니다.'}
                  </p>
                </div>
              </div>
              
              {canEdit && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">담당자 메모 (내부용)</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {property.manager_memo || '메모가 없습니다.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 연락처 정보 섹션 */}
      <PropertyContactInfo property={property} />
      
      {/* 매칭 관리 섹션 - 관리자만 표시 */}
      {user && isHardcodedAdmin(user.email) && (
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">매칭 관리</h2>
          
          {/* 담당자 관리 - 관리자만 */}
          <ManagerAssignment propertyId={id} currentManagerId={property?.manager_id} />
        </div>
      )}
      
      {/* 타인 매물 코멘트 섹션 */}
      <PropertyComments propertyId={id} />
      
      {/* 삭제 확인 모달 */}
      {showConfirmation && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">매물 삭제</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        정말로 이 매물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-auto sm:ml-3"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full sm:w-auto sm:mt-0"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;