import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from 'react-query';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import { PlusCircle, Search, RefreshCw, Building2, MapPin, Calendar, Grid, List, User, Trash2, Hash } from 'lucide-react';
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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, property: null });
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  // 페이지 크기
  const PAGE_SIZE = 30;
  
  // 매물 데이터 가져오기 (무한 스크롤)
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery(
    ['properties-infinite', filters, user?.email],
    async ({ pageParam = 0 }) => {
      console.log('🔍 매물 페이지 조회:', { page: pageParam, pageSize: PAGE_SIZE });
      
      const tempUser = JSON.parse(localStorage.getItem('temp-bypass-user') || '{}');
      const currentUser = tempUser.id ? tempUser : user;
      
      const userInfo = {
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        isAdmin: isHardcodedAdmin(currentUser?.email)
      };
      
      const result = await propertyService.getProperties(
        filters, 
        userInfo,
        { page: pageParam, pageSize: PAGE_SIZE }
      );
      
      if (result.error) throw new Error(result.error);
      
      return {
        properties: result.data,
        totalCount: result.totalCount,
        nextPage: result.data.length === PAGE_SIZE ? pageParam + 1 : undefined
      };
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
      refetchOnWindowFocus: false,
    }
  );

  // 전체 매물 리스트와 총 개수
  const allProperties = data?.pages.flatMap(page => page.properties) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

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

  // 무한 스크롤 설정
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    // Supabase users 테이블에서 조인된 manager 정보 우선 사용
    if (property.manager?.name) {
      return property.manager.name;
    }
    
    // manager_id가 이메일 형식이면 이름으로 변환 (fallback)
    if (property.manager_id?.includes('@')) {
      const email = property.manager_id.replace('hardcoded-', '');
      return getRealtorNameByEmail(email);
    }
    
    return '미지정';
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
        queryClient.invalidateQueries(['properties-infinite']);
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
  const filteredProperties = allProperties.filter(property => {
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
    if (!price || price === 0) return '-';
    // 만원 단위로 표시
    const manWon = Math.floor(price / 10000);
    return manWon.toLocaleString();
  };

  const formatPriceDisplay = (price) => {
    if (!price || price === 0) return '-';
    if (price >= 10000) {
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (eok > 0 && man > 0) {
        return `${eok}.${Math.floor(man/1000)}억`;
      } else if (eok > 0) {
        return `${eok}억`;
      }
      return `${man.toLocaleString()}`;
    }
    return price.toLocaleString();
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
      return `${deposit}/${monthly}`;
    }
    return formatPrice(property.price || 0) || '-';
  };

  const formatArea = (sqm) => {
    if (!sqm) return '-';
    const pyeong = (sqm * 0.3025).toFixed(2);
    return pyeong;
  };

  const formatPropertyNumber = (id) => {
    // ID의 앞 8자리를 숫자로 변환하여 A로 시작하는 형식으로
    const numericPart = parseInt(id.replace(/-/g, '').substring(0, 7), 16);
    return `A${numericPart.toString().padStart(7, '0')}`;
  };

  const canDeleteProperty = (property) => {
    if (!user) return false;
    const userEmail = user.email;
    
    // 관리자는 모든 매물 삭제 가능
    if (isHardcodedAdmin(userEmail)) {
      return true;
    }
    
    // 본인이 등록한 매물만 삭제 가능
    const managerEmail = property.manager_id?.replace('hardcoded-', '');
    return userEmail === managerEmail;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매물장</h1>
            <p className="text-sm text-gray-600 mt-1">*매물장의 정보를 간편하게 관리하세요.</p>
          </div>
          <button 
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition-colors"
            onClick={() => navigate('/properties/new')}
          >
            <PlusCircle className="w-4 h-4 inline mr-2" />
            매물 등록
          </button>
        </div>
      </div>

      {/* 로딩 및 에러 처리 */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
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
          {/* 매물 검색 */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">매물 검색</h3>
              <p className="text-sm text-gray-600">매물 종류를 선택하시면 상세 검색이 가능합니다.</p>
            </div>
            
            {/* 지역조회 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">지역조회</h4>
              <div className="grid grid-cols-4 gap-3">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm">
                  <option>매물종류</option>
                </select>
                <input type="text" placeholder="시/도" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm" />
                <input type="text" placeholder="구/군" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm" />
                <input type="text" placeholder="읍/면/동" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm" />
              </div>
            </div>
            
            {/* 조건조회 */}
            <div>
              <h4 className="text-sm font-medium mb-3">조건조회</h4>
              <div className="grid grid-cols-6 gap-3">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm">
                  <option>거래유형</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm">
                  <option>상태</option>
                </select>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">매물가격 범위</label>
                  <div className="flex items-center space-x-2">
                    <input type="text" placeholder="최소 만원" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm w-full" />
                    <span className="text-sm text-gray-400">~</span>
                    <input type="text" placeholder="최대 만원" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm w-full" />
                  </div>
                </div>
                <input type="text" placeholder="매물번호" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm" />
              </div>
            </div>
            
            {/* 버튼 */}
            <div className="flex justify-center mt-6 space-x-3">
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                초기화
              </button>
              <button className="px-8 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Search className="w-4 h-4 inline mr-2" />
                검색
              </button>
            </div>
          </div>

          {/* 매물 리스트 */}
          <div className="bg-white">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 text-sm rounded hover:bg-pink-100 transition-colors">
                    삭제하기
                  </button>
                  <button className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 text-sm rounded hover:bg-pink-100 transition-colors">
                    엑셀다운
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">최신순</span>
                  <select className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500">
                    <option>50개씩 보기</option>
                    <option>100개씩 보기</option>
                  </select>
                </div>
              </div>
            </div>
              
              {/* 테이블 뷰 */}
              {filteredProperties.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">매물이 없습니다</p>
                  <p className="text-sm">새로운 매물을 등록해보세요.</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            체크박스
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            즐겨찾기
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매물번호
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매물종류
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            지역명/상세주소
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            면적
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            가격유형/가격
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            담당자
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            등록일
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProperties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap text-center">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center">
                              <button className="text-gray-400 hover:text-yellow-400">
                                ☆
                              </button>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-pink-500 rounded-full cursor-pointer hover:bg-pink-600 transition-colors" onClick={() => navigate(`/properties/${property.id}`)}>
                                {formatPropertyNumber(property.id)}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getDisplayPropertyType(property)}
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="text-sm">
                                <div className="font-semibold text-gray-900">
                                  {property.location}
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                  {property.property_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{property.supply_area_sqm}㎡ ({formatArea(property.supply_area_sqm)}평)</div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <span className={
                                  getDisplayTransactionType(property) === '매매' ? 'inline-block px-2 py-1 text-xs font-semibold rounded-full mb-1 bg-yellow-100 text-yellow-800' :
                                  getDisplayTransactionType(property) === '전세' ? 'inline-block px-2 py-1 text-xs font-semibold rounded-full mb-1 bg-blue-100 text-blue-800' :
                                  'inline-block px-2 py-1 text-xs font-semibold rounded-full mb-1 bg-purple-100 text-purple-800'
                                }>
                                  {getDisplayTransactionType(property)}
                                </span>
                                <div className="font-medium text-gray-900">
                                  {getDisplayPrice(property)}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getDisplayManager(property)}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={
                                getDisplayStatus(property) === '거래가능' ? 'inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800' :
                                getDisplayStatus(property) === '거래완료' ? 'inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800' :
                                'inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
                              }>
                                {getDisplayStatus(property)}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(property.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '.')}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-center">
                              <div className="flex space-x-1">
                                <button 
                                  className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200 transition-colors"
                                  onClick={() => navigate(`/properties/${property.id}`)}
                                >
                                  보기
                                </button>
                                <button 
                                  className="px-2 py-1 text-xs bg-pink-50 text-pink-700 border border-pink-200 rounded hover:bg-pink-100 transition-colors" 
                                  onClick={() => navigate(`/properties/${property.id}/edit`)}
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
                </div>
              )}
              
              {/* 무한 스크롤 로더 */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="ml-2 text-gray-600">더 불러오는 중...</p>
                  </div>
                )}
                {!hasNextPage && allProperties.length > 0 && (
                  <p className="text-gray-500">모든 매물을 불러왔습니다</p>
                )}
              </div>
          </div>
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
                  &apos;{deleteConfirm.property?.property_name}&apos; 매물을 정말로 삭제하시겠습니까?
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