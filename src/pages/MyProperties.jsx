import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import { PlusCircle, Search, RefreshCw, Building2, MapPin, Calendar, Grid, List, User, Trash2, Hash } from 'lucide-react';
import PropertyCard from '../components/property/PropertyCard';
import propertyService from '../services/propertyService';
import ENV_CONFIG from '../config/env';

const MyProperties = () => {
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
  
  // 룩업 데이터 먼저 가져오기
  const { data: lookupData = {}, isLoading: isLoadingLookup } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
  
  // 본인 매물만 가져오기 (관리자 권한 무시)
  const { data: properties = [], isLoading: isLoadingProperties, error, refetch } = useQuery(
    ['my-properties', filters, user?.id],
    async () => {
      if (!user?.id) {
        console.log('사용자 ID가 없습니다');
        return [];
      }

      // Supabase에서 직접 본인 매물만 조회
      let query = supabase
        .from('properties')
        .select('*')
        .eq('manager_id', user.id); // manager_id가 현재 사용자 ID와 일치하는 것만

      // 필터 적용
      if (filters.search) {
        query = query.or(`property_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        const status = lookupData.propertyStatuses?.find(s => s.name === filters.status);
        if (status) query = query.eq('property_status_id', status.id);
      }
      if (filters.type) {
        const type = lookupData.propertyTypes?.find(t => t.name === filters.type);
        if (type) query = query.eq('property_type_id', type.id);
      }
      if (filters.transactionType) {
        const transType = lookupData.transactionTypes?.find(t => t.name === filters.transactionType);
        if (transType) query = query.eq('transaction_type_id', transType.id);
      }

      // 정렬
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('매물 조회 오류:', error);
        throw error;
      }

      console.log(`내 매물 ${data?.length || 0}개 조회됨`);
      return data || [];
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!user?.id && !!lookupData.propertyStatuses, // lookupData가 로드된 후에만 실행
    }
  );

  // 타입 매핑 함수 (룩업 데이터 사용)
  const getDisplayPropertyType = (property) => {
    const type = lookupData.propertyTypes?.find(t => t.id === property.property_type_id);
    return type?.name || '미지정';
  };

  const getDisplayTransactionType = (property) => {
    const type = lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id);
    return type?.name || '미지정';
  };

  const getDisplayStatus = (property) => {
    const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
    return status?.name || '미지정';
  };

  const getDisplayManager = (property) => {
    // 더미데이터에서는 manager_id에서 이메일 추출
    if (property.manager_id?.includes('@')) {
      const email = property.manager_id.replace('hardcoded-', '');
      const name = email.split('@')[0].toUpperCase();
      return name;
    }
    return property.users?.name || property.users?.email || '미지정';
  };

  // 매물 삭제 mutation
  const deleteMutation = useMutation(
    async (propertyId) => {
      const { error } = await propertyService.deleteProperty(propertyId, user);
      if (error) throw new Error(error);
      return propertyId;
    },
    {
      onSuccess: (deletedId) => {
        queryClient.invalidateQueries(['my-properties']);
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 매물 관리</h1>
          <p className="text-gray-600">본인이 담당하는 매물을 관리하고 고객정보를 확인할 수 있습니다.</p>
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
      {(isLoadingLookup || isLoadingProperties) && (
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

      {!isLoadingLookup && !isLoadingProperties && !error && (
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
              <p className="text-lg font-medium mb-2">담당 매물이 없습니다</p>
              <p className="text-sm">새로운 매물을 등록해보세요.</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    내 매물 목록 ({filteredProperties.length}건) - 고객정보 포함
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
                            고객정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
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
                        {filteredProperties.map((property) => {
                          const residentInfo = parseResidentInfo(property.resident);
                          return (
                            <tr key={property.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Hash className="w-4 h-4 mr-1" />
                                  <span className="font-mono text-xs">{property.id.slice(0, 8)}</span>
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
                                <div className="text-sm text-gray-900">
                                  {residentInfo ? (
                                    <div>
                                      <div className="font-medium">{residentInfo.name || '-'}</div>
                                      <div className="text-xs text-gray-500">{residentInfo.phone || '-'}</div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">정보 없음</span>
                                  )}
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
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
                      showCustomerInfo={true}
                      onView={(prop) => navigate(`/properties/${prop.id}`)}
                      onEdit={(prop) => navigate(`/properties/${prop.id}/edit`)}
                      onDelete={(prop) => handleDeleteClick(prop)}
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

export default MyProperties;