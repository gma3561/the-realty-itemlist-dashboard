import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, User, Building, AlertTriangle } from 'lucide-react';

const PropertyContactInfo = ({ property }) => {
  const { user } = useAuth();

  // 현재 사용자가 매물의 담당자인지 또는 관리자인지 확인
  const canViewContactInfo = user && (
    user.id === property.manager_id || 
    user.role === 'admin' || 
    property.is_visible_to_all === true
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Phone className="w-5 h-5 mr-2 text-blue-600" />
        연락처 정보
      </h2>

      {!canViewContactInfo && (
        <div className="bg-yellow-50 p-4 mb-4 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">제한된 접근</p>
            <p className="text-sm text-yellow-700">
              이 매물의 연락처 정보는 담당자만 볼 수 있습니다. 연락처 정보가 필요하시면 담당자에게 문의하세요.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 담당자 정보 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-500" />
            담당자 정보
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">담당자</p>
              <p className="text-sm text-gray-900">{property.manager?.name || '-'}</p>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">이메일</p>
              <p className="text-sm text-gray-900">{property.manager?.email || '-'}</p>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">연락처</p>
              {canViewContactInfo ? (
                <p className="text-sm text-gray-900">{property.manager_contact || '-'}</p>
              ) : (
                <p className="text-sm flex items-center text-gray-400">
                  <Lock className="w-3 h-3 mr-1" /> 권한 없음
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 소유주 정보 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Building className="w-4 h-4 mr-2 text-gray-500" />
            소유주 정보
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">소유주</p>
              {canViewContactInfo ? (
                <p className="text-sm text-gray-900">{property.owner?.name || '-'}</p>
              ) : (
                <p className="text-sm flex items-center text-gray-400">
                  <Lock className="w-3 h-3 mr-1" /> 권한 없음
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">연락처</p>
              {canViewContactInfo ? (
                <p className="text-sm text-gray-900">{property.owner?.phone || '-'}</p>
              ) : (
                <p className="text-sm flex items-center text-gray-400">
                  <Lock className="w-3 h-3 mr-1" /> 권한 없음
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200 py-2">
              <p className="text-sm font-medium text-gray-500">관계</p>
              {canViewContactInfo ? (
                <p className="text-sm text-gray-900">{property.owner?.contact_relation || '-'}</p>
              ) : (
                <p className="text-sm flex items-center text-gray-400">
                  <Lock className="w-3 h-3 mr-1" /> 권한 없음
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyContactInfo;