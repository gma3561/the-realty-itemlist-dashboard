import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Calendar, User, Building2 } from 'lucide-react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import propertyService from '../services/propertyService';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import { getRealtorNameByEmail } from '../data/realtorNameMap';
import { useNavigate } from 'react-router-dom';

const PropertyListNew = () => {
  const [properties, setProperties] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    propertyType: '',
    region: '',
    district: '',
    dong: '',
    transactionType: '',
    status: '',
    channel: '',
    minPrice: '',
    maxPrice: '',
    propertyNumber: ''
  });

  // 매물 데이터 가져오기
  const { data: propertiesData, isLoading, error, refetch } = useQuery(
    ['properties', filters, user?.email],
    async () => {
      const tempUser = JSON.parse(localStorage.getItem('temp-bypass-user') || '{}');
      const currentUser = tempUser.id ? tempUser : user;
      
      const userInfo = {
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        isAdmin: isHardcodedAdmin(currentUser?.email)
      };
      
      const result = await propertyService.getProperties(filters, userInfo);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    {
      enabled: !!user,
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
      staleTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (propertiesData) {
      setProperties(propertiesData);
    }
  }, [propertiesData]);

  const handleCheckAll = () => {
    setAllChecked(!allChecked);
  };

  const handleCheckItem = (id) => {
    // 개별 체크 로직
  };

  const handleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };

  // 타입 매핑 함수들
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
    if (property.manager?.name) {
      return property.manager.name;
    }
    
    if (property.manager_id?.includes('@')) {
      const email = property.manager_id.replace('hardcoded-', '');
      return getRealtorNameByEmail(email);
    }
    
    return '미지정';
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    if (price >= 100000000) {
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (man > 0) {
        return `${eok}억 ${man.toLocaleString()}만`;
      }
      return `${eok}억`;
    } else if (price >= 10000) {
      return `${(price / 10000).toLocaleString()}만`;
    }
    return `${price.toLocaleString()}`;
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

  const handleSearch = () => {
    refetch();
  };

  const handleReset = () => {
    setFilters({
      propertyType: '',
      region: '',
      district: '',
      dong: '',
      transactionType: '',
      status: '',
      channel: '',
      minPrice: '',
      maxPrice: '',
      propertyNumber: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">매물장</h1>
              <span className="text-gray-500">*매물장의 정보를 간편하게 관리하세요.</span>
            </div>
            <button 
              onClick={() => navigate('/properties/new')}
              className="bg-[#FF66B2] hover:bg-[#E6287F] text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <span>✓</span> 매물 등록
            </button>
          </div>

          {/* 검색 섹션 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">매물 검색</h3>
              <p className="text-sm text-gray-600">매물 종류를 선택하시면 상세 검색이 가능합니다.</p>
            </div>
            
            {/* 지역조회 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">📍 지역조회</label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select 
                  className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                >
                  <option value="">매물종류</option>
                  {lookupData.propertyTypes?.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  placeholder="시/도"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                  value={filters.region}
                  onChange={(e) => setFilters({...filters, region: e.target.value})}
                />
                <input 
                  type="text"
                  placeholder="구/군"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                  value={filters.district}
                  onChange={(e) => setFilters({...filters, district: e.target.value})}
                />
                <input 
                  type="text"
                  placeholder="읍/면/동"
                  className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                  value={filters.dong}
                  onChange={(e) => setFilters({...filters, dong: e.target.value})}
                />
              </div>
            </div>

            {/* 조건조회 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">⚙️ 조건조회</label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select 
                    className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                    value={filters.transactionType}
                    onChange={(e) => setFilters({...filters, transactionType: e.target.value})}
                  >
                    <option value="">거래유형</option>
                    {lookupData.transactionTypes?.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <select 
                    className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">상태</option>
                    {lookupData.propertyStatuses?.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">💰 매물가격</span>
                  <input 
                    type="text" 
                    placeholder="최소 만원"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-28 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  />
                  <span className="text-gray-500">~</span>
                  <input 
                    type="text" 
                    placeholder="최대 만원"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-28 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">🔍 매물번호</span>
                  <input 
                    type="text" 
                    placeholder="매물번호를 입력해 주세요"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 flex-1 focus:border-[#FF66B2] focus:ring-2 focus:ring-[#FF66B2]/20 transition-colors"
                    value={filters.propertyNumber}
                    onChange={(e) => setFilters({...filters, propertyNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 검색 버튼 */}
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-100">
              <button 
                onClick={handleReset}
                className="border border-gray-300 px-6 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                초기화
              </button>
              <button 
                onClick={handleSearch}
                className="bg-[#FF66B2] text-white px-6 py-2.5 rounded-lg hover:bg-[#E6287F] flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" /> 검색
              </button>
            </div>
          </div>

          {/* 매물 리스트 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">매물 리스트</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">최신순</span>
                <select 
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="50items">50개씩 보기</option>
                  <option value="100items">100개씩 보기</option>
                </select>
              </div>
            </div>
          </div>

          {/* 로딩 및 에러 처리 */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-[#FF66B2] border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-2 text-gray-600">매물 목록을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-600">매물 목록을 불러오는데 실패했습니다: {error.message}</span>
              </div>
            </div>
          )}

          {/* 테이블 */}
          {!isLoading && !error && (
            <>
              {properties.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">매물이 없습니다</p>
                  <p className="text-sm">새로운 매물을 등록해보세요.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-4 py-3 text-left w-12">
                          <input 
                            type="checkbox" 
                            checked={allChecked}
                            onChange={handleCheckAll}
                            className="w-4 h-4 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left w-12"></th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-28">매물번호</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">매물종류</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">지역명/상세주소</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">면적</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">가격유형/가격</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20">담당자</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20">상태</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">등록일</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {properties.map((property, index) => (
                        <tr key={property.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              onChange={() => handleCheckItem(property.id)}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavorite(property.id);
                              }}
                              className="text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                              {favorites.includes(property.id) ? 
                                <Star className="w-4 h-4 text-yellow-500 fill-current" /> : 
                                <Star className="w-4 h-4" />
                              }
                            </button>
                          </td>
                          <td className="px-4 py-3" onClick={() => navigate(`/properties/${property.id}`)}>
                            <span className="bg-pink-100 text-[#FF66B2] px-2 py-1 rounded text-xs font-semibold tracking-wide">
                              #{property.id.slice(0, 7)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{getDisplayPropertyType(property)}</td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="text-sm text-gray-900 font-medium truncate">{property.property_name}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5 truncate">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{property.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">
                            {formatArea(property.supply_area_sqm)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-1">
                              {getDisplayTransactionType(property)}
                            </div>
                            <div className="text-xs font-semibold text-gray-900">{getDisplayPrice(property)}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center text-xs text-gray-900">
                              <User className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="truncate max-w-20">{getDisplayManager(property)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              getDisplayStatus(property) === '거래가능' || getDisplayStatus(property) === '임장가능'
                                ? 'bg-green-100 text-green-700'
                                : getDisplayStatus(property) === '거래완료'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {getDisplayStatus(property)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{new Date(property.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/properties/${property.id}`);
                                }}
                                className="px-2 py-1 rounded text-xs bg-[#FF66B2] text-white hover:bg-[#E6287F] font-medium"
                              >
                                상세
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/properties/${property.id}/edit`);
                                }}
                                className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                              >
                                수정
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyListNew;