import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, Calendar, Edit, Eye, Trash2 } from 'lucide-react';

const PropertyCard = ({ property, onEdit, onDelete, onView }) => {
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

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        {/* 헤더 - 매물명과 상태 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {property.property_name}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
          </div>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(property.property_status)}`}>
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
          <div className="text-lg font-bold text-gray-900">
            {getDisplayPrice()}
          </div>

          {/* 면적 정보 */}
          {property.supply_area_sqm && (
            <div className="flex items-center text-sm text-gray-600">
              <Home className="w-4 h-4 mr-1" />
              <span>공급면적: {formatArea(property.supply_area_sqm)}</span>
            </div>
          )}

          {/* 층/방향 정보 */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
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

        {/* 특이사항 (있을 경우) */}
        {property.special_notes && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <span className="font-medium">특이사항: </span>
            <span className="line-clamp-2">{property.special_notes}</span>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => onView && onView(property)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <Eye className="w-4 h-4 mr-1" />
              보기
            </button>
            <button
              onClick={() => onEdit && onEdit(property)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit className="w-4 h-4 mr-1" />
              수정
            </button>
          </div>
          
          {onDelete && (
            <button
              onClick={() => onDelete(property)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;