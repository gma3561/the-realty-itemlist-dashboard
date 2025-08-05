import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, Calendar, Edit, Eye, Trash2, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPropertyPermission } from '../../utils/permissions';

const PropertyCard = ({ property, onEdit, onDelete, onView, showCustomerInfo = false }) => {
  const { user } = useAuth();
  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800 border-green-200',
      'reserved': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      'available': '거래가능',
      'reserved': '거래보류',
      'completed': '거래완료'
    };
    return statuses[status] || status;
  };

  const getPropertyTypeDisplay = (type) => {
    const types = {
      'apt': '아파트',
      'officetel': '오피스텔',
      'villa': '빌라/연립',
      'house': '단독주택',
      'commercial': '상가'
    };
    return types[type] || type;
  };

  const getTransactionTypeDisplay = (type) => {
    const types = {
      'sale': '매매',
      'lease': '전세',
      'rent': '월세'
    };
    return types[type] || type;
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
    const transactionType = property.transaction_type;
    
    if (transactionType === 'sale') {
      return formatPrice(property.sale_price);
    } else if (transactionType === 'lease') {
      return formatPrice(property.lease_price);
    } else if (transactionType === 'rent') {
      const deposit = formatPrice(property.lease_price);
      const monthly = formatPrice(property.price);
      return `${deposit} / ${monthly}`;
    }
    return '-';
  };

  const formatArea = (area) => {
    if (!area) return '-';
    const pyeong = (area * 0.3025).toFixed(1);
    return `${area}㎡ (${pyeong}평)`;
  };

  // 고객정보 파싱 함수
  const parseResidentInfo = (residentStr) => {
    if (!residentStr) return null;
    try {
      return JSON.parse(residentStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => onView && onView(property)}>
      <div className="p-3 sm:p-4">
        {/* 헤더 - 매물명과 상태 */}
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {property.property_name}
            </h3>
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
              <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
          <span className={`ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${getStatusColor(property.property_status)}`}>
            {getStatusDisplay(property.property_status)}
          </span>
        </div>

        {/* 매물 정보 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {getPropertyTypeDisplay(property.property_type)}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {getTransactionTypeDisplay(property.transaction_type)}
              </span>
            </div>
          </div>

          {/* 가격 */}
          <div className="text-base sm:text-lg font-bold text-gray-900">
            {getDisplayPrice()}
          </div>

          {/* 면적 정보 */}
          {property.supply_area_sqm && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Home className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1" />
              <span>공급: {formatArea(property.supply_area_sqm)}</span>
            </div>
          )}

          {/* 층/방향 정보 */}
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
            {property.floor_info && (
              <span>{property.floor_info}</span>
            )}
            {property.direction && (
              <span>{property.direction}</span>
            )}
            {property.rooms_bathrooms && (
              <span>{property.rooms_bathrooms}</span>
            )}
          </div>

          {/* 등록일 */}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>등록: {new Date(property.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* 고객정보 (showCustomerInfo가 true일 때만 표시) */}
        {showCustomerInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center mb-2">
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">고객정보</span>
            </div>
            {(() => {
              const residentInfo = parseResidentInfo(property.resident);
              if (residentInfo) {
                return (
                  <div className="text-sm text-blue-700">
                    <div><span className="font-medium">이름:</span> {residentInfo.name || '-'}</div>
                    <div><span className="font-medium">연락처:</span> {residentInfo.phone || '-'}</div>
                    {residentInfo.notes && (
                      <div><span className="font-medium">메모:</span> {residentInfo.notes}</div>
                    )}
                  </div>
                );
              } else {
                return <div className="text-sm text-blue-600">고객정보가 없습니다.</div>;
              }
            })()}
          </div>
        )}

        {/* 특이사항 (있을 경우) */}
        {property.special_notes && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <span className="font-medium">특이사항: </span>
            <span className="line-clamp-2">{property.special_notes}</span>
          </div>
        )}

        {/* 액션 버튼들 - 권한 기반 */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-100">
          <div className="flex space-x-1.5 sm:space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(property);
              }}
              className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" />
              보기
            </button>
            
            {/* 수정 버튼: 권한이 있는 경우에만 표시 */}
            {hasPropertyPermission(user, property, 'edit') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(property);
                }}
                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" />
                수정
              </button>
            )}
          </div>
          
          {/* 삭제 버튼: 권한이 있는 경우에만 표시 */}
          {onDelete && hasPropertyPermission(user, property, 'delete') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(property);
              }}
              className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" />
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;