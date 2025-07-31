import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, RefreshCw, Building2, MapPin, Calendar, DollarSign, Grid, List, User } from 'lucide-react';
import PropertyCard from '../components/property/PropertyCard';

const PropertyList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  // Supabase에서 매물 데이터 가져오기 (권한별 접근 제한 + 담당자 정보 JOIN)
  const { data: properties = [], isLoading, error, refetch } = useQuery(
    ['properties', user?.id, userProfile?.role],
    async () => {
      if (!user || !userProfile) return [];

      let query = supabase
        .from('properties')
        .select(`
          *,
          property_types(id, name),
          property_statuses(id, name),
          transaction_types(id, name),
          users!properties_manager_id_fkey(id, name, email, role)
        `);

      // 권한별 접근 제한
      if (userProfile.role !== 'admin') {
        // 일반 사용자는 본인이 등록한 매물만 볼 수 있음
        query = query.eq('manager_id', user.id);
      }
      // 관리자는 모든 매물을 볼 수 있음

      const { data, error } = await query.order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!user && !!userProfile,
    }
  );

  // 타입 매핑 함수 (JOIN된 데이터 사용)
  const getDisplayPropertyType = (property) => {
    return property.property_types?.name || '미지정';
  };

  const getDisplayTransactionType = (property) => {
    return property.transaction_types?.name || '미지정';
  };

  const getDisplayStatus = (property) => {
    return property.property_statuses?.name || '미지정';
  };

  const getDisplayManager = (property) => {
    if (property.users) {
      return property.users.name || property.users.email || '미지정';
    }
    return '미지정';
  };

  // 필터된 매물 목록
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !filters.search || 
      property.property_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      property.location.toLowerCase().includes(filters.search.toLowerCase());
    
    const displayStatus = getDisplayStatus(property);
    const displayType = getDisplayPropertyType(property);
    
    const matchesStatus = !filters.status || displayStatus === filters.status;
    const matchesType = !filters.type || displayType === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatPrice = (price) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억원`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}만원`;
    }
    return `${price.toLocaleString()}원`;
  };

  const getDisplayPrice = (property) => {
    const transactionType = getDisplayTransactionType(property);
    
    if (transactionType === '매매') {
      return formatPrice(property.price || 0);
    } else if (transactionType === '전세') {
      return formatPrice(property.price || 0);
    } else if (transactionType === '월세') {
      const deposit = formatPrice(property.lease_price || 0);
      const monthly = formatPrice(property.price || 0);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="거래가능">거래가능</option>
                  <option value="거래완료">거래완료</option>
                  <option value="거래보류">거래보류</option>
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
                  <option value="아파트">아파트</option>
                  <option value="오피스텔">오피스텔</option>
                  <option value="빌라/연립">빌라/연립</option>
                  <option value="단독주택">단독주택</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', status: '', type: '' })}
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
                            매물정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            위치
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            거래정보
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
                                <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
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
                                <Link
                                  to={`/properties/${property.id}/edit`}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  수정
                                </Link>
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
                      onEdit={(prop) => navigate(`/properties/${prop.id}/edit`)}
                      onDelete={(prop) => {
                        if (window.confirm('정말로 이 매물을 삭제하시겠습니까?')) {
                          // TODO: 삭제 기능 구현
                          console.log('Delete property:', prop.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyList;