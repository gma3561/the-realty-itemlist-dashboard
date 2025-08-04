import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import { PlusCircle, Search, RefreshCw, Building2, MapPin, Calendar, Grid, List, User, Trash2, Hash } from 'lucide-react';
import PropertyCard from '../components/property/PropertyCard';
import propertyService from '../services/propertyService';
import { getRealtorNameByEmail } from '../data/realtorNameMap';
import ENV_CONFIG from '../config/env';

const PropertyList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    transactionType: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, property: null });
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  // 매물 데이터 가져오기
  const { data: properties = [], isLoading, error, refetch } = useQuery(
    ['properties', filters, user?.email],
    async () => {
      console.log('🔍 매물 목록 조회 시작:', { userId: user?.id, userEmail: user?.email });
      // 임시 로그인 사용자 정보 가져오기
      const tempUser = JSON.parse(localStorage.getItem('temp-bypass-user') || '{}');
      const currentUser = tempUser.id ? tempUser : user;
      
      const userInfo = {
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        isAdmin: isHardcodedAdmin(currentUser?.email)
      };
      
      const { data, error } = await propertyService.getProperties(filters, userInfo);
      console.log('📊 매물 목록 조회 결과:', { data: data?.length || 0, error });
      if (error) throw error;
      return data || [];
    },
    {
      refetchOnWindowFocus: false,
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

  // 타입 매핑 함수 (룩업 데이터 사용)
  const getDisplayPropertyType = (property) => {
    const typeId = property.property_type_id || property.property_type;
    const type = lookupData.propertyTypes?.find(t => t.id === typeId);
    return type?.name || typeId || '미지정';
  };

  const getDisplayTransactionType = (property) => {
    const typeId = property.transaction_type_id || property.transaction_type;
    const type = lookupData.transactionTypes?.find(t => t.id === typeId);
    return type?.name || typeId || '미지정';
  };

  const getDisplayStatus = (property) => {
    const statusId = property.property_status_id || property.property_status;
    const status = lookupData.propertyStatuses?.find(s => s.id === statusId);
    // 데이터베이스의 영어 상태를 한글로 매핑
    const statusMap = {
      'available': '거래가능',
      'completed': '거래완료',
      'hold': '거래보류',
      'cancelled': '거래철회',
      'inspection_available': '임장가능'
    };
    return status?.name || statusMap[statusId] || statusId || '미지정';
  };

  const getDisplayManager = (property) => {
    // manager_name이 있으면 우선 사용
    if (property.manager_name) {
      return property.manager_name;
    }
    
    // manager_id가 이메일 형식이면 이름으로 변환
    if (property.manager_id?.includes('@')) {
      const email = property.manager_id.replace('hardcoded-', '');
      return getRealtorNameByEmail(email);
    }
    
    // users 테이블 조인 데이터가 있으면 사용
    return property.users?.name || property.users?.email || '미지정';
  };

  // 매물 삭제 mutation
  const deleteMutation = useMutation(
    async (propertyId) => {
      const { error } = await propertyService.deleteProperty(propertyId);
      if (error) throw new Error(error);
      return propertyId;
    },
    {
      onSuccess: (deletedId) => {
        queryClient.invalidateQueries(['properties']);
        setDeleteConfirm({ show: false, property: null });
        alert('매물이 성공적으로 삭제되었습니다.');
      },
      onError: (error) => {
        alert(`매물 삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  );

  const handleDeleteClick = (property) => {
    setDeleteConfirm({ show: true, property });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.property) {
      deleteMutation.mutate(deleteConfirm.property.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, property: null });
  };

  // 필터된 매물 목록
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !filters.search || 
      property.property_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      property.location.toLowerCase().includes(filters.search.toLowerCase());
    
    const displayStatus = getDisplayStatus(property);
    const displayType = getDisplayPropertyType(property);
    const displayTransactionType = getDisplayTransactionType(property);
    
    const matchesStatus = !filters.status || displayStatus === filters.status;
    const matchesType = !filters.type || displayType === filters.type;
    const matchesTransactionType = !filters.transactionType || displayTransactionType === filters.transactionType;
    
    return matchesSearch && matchesStatus && matchesType && matchesTransactionType;
  });

  const formatPrice = (price) => {
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

  const getDisplayPrice = (property) => {
    const transactionType = getDisplayTransactionType(property);
    
    if (transactionType === '매매') {
      return formatPrice(property.price || 0);
    } else if (transactionType === '전세') {
      return formatPrice(property.lease_price || 0);
    } else if (transactionType === '월세') {
      const deposit = formatPrice(property.lease_price || 0);
      const monthly = formatPrice(property.monthly_rent || 0);
      return `${deposit} / ${monthly}`;
    }
    return formatPrice(property.price || 0) || '-';
  };

  const formatArea = (sqm) => {
    if (!sqm) return '-';
    const pyeong = (sqm * 0.3025).toFixed(1);
    return `${sqm}㎡ (${pyeong}평)`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">매물 목록</h1>
          <p className="text-gray-600">등록된 매물을 관리하고 조회할 수 있습니다.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* 뷰 모드 토글 */}
          <div className="hidden sm:flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          
          <Link
            to="/properties/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            새 매물 등록
          </Link>
        </div>
      </div>

      {/* 로딩 및 에러 처리 */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-2 text-gray-600">매물 목록을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600">매물 목록을 불러오는데 실패했습니다: {error.message}</span>
            <button 
              onClick={() => refetch()}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* 필터 섹션 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">필터 및 검색</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검색
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="매물명, 지역 검색"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  진행상태
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {lookupData.propertyStatuses?.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물종류
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {lookupData.propertyTypes?.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매물유형
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {lookupData.transactionTypes?.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', status: '', type: '', transactionType: '' })}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 매물 목록 */}
          {filteredProperties.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">매물이 없습니다</p>
              <p className="text-sm">새로운 매물을 등록해보세요.</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    매물 목록 ({filteredProperties.length}건)
                  </h2>
                </div>
              </div>
              
              {/* 테이블 뷰 (데스크톱) */}
              {viewMode === 'table' && (
                <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매물ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매물정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            위치
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매물유형
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            가격
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            담당자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            등록일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProperties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Hash className="w-4 h-4 mr-1" />
                                <span className="font-mono text-xs">{property.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {property.property_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getDisplayPropertyType(property)} • {formatArea(property.supply_area_sqm)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                {property.location}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getDisplayTransactionType(property)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm font-medium text-gray-900">
                                {getDisplayPrice(property)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                getDisplayStatus(property) === '매물확보' || getDisplayStatus(property) === '광고진행'
                                  ? 'bg-green-100 text-green-800'
                                  : getDisplayStatus(property) === '거래완료'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {getDisplayStatus(property)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <User className="w-4 h-4 mr-1 text-gray-400" />
                                {getDisplayManager(property)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(property.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <Link
                                  to={`/properties/${property.id}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  상세
                                </Link>
                                {/* 본인 매물이거나 관리자인 경우에만 수정/삭제 버튼 표시 */}
                                {(isHardcodedAdmin(user?.email) || property.manager_id === user?.id || property.manager_id === user?.email) && (
                                  <>
                                    <Link
                                      to={`/properties/${property.id}/edit`}
                                      className="text-green-600 hover:text-green-800 font-medium"
                                    >
                                      수정
                                    </Link>
                                  <button
                                    onClick={() => handleDeleteClick(property)}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                    disabled={deleteMutation.isLoading}
                                  >
                                    삭제
                                  </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 카드 뷰 (모바일 및 카드 모드) */}
              {(viewMode === 'card' || window.innerWidth < 768) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onView={(prop) => navigate(`/properties/${prop.id}`)}
                      onEdit={(isHardcodedAdmin(user?.email) || property.manager_id === user?.id || property.manager_id === user?.email) ? 
                        (prop) => navigate(`/properties/${prop.id}/edit`) : null}
                      onDelete={(isHardcodedAdmin(user?.email) || property.manager_id === user?.id || property.manager_id === user?.email) ? 
                        (prop) => handleDeleteClick(prop) : null}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* 삭제 확인 모달 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                매물 삭제 확인
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  '{deleteConfirm.property?.property_name}' 매물을 정말로 삭제하시겠습니까?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  삭제된 매물은 복구할 수 없습니다.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={deleteMutation.isLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    disabled={deleteMutation.isLoading}
                  >
                    {deleteMutation.isLoading ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;