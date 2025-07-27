import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { PlusCircle, Search, RefreshCw, Building2, MapPin, Calendar, DollarSign } from 'lucide-react';

const PropertyList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });
  
  // 임시 매물 데이터 (실제로는 Supabase에서 가져올 예정)
  const mockProperties = [
    {
      id: 1,
      property_name: '래미안 아파트 101동 1503호',
      location: '서울시 강남구 삼성동',
      property_type: '아파트',
      transaction_type: '매매',
      sale_price: 2500000000,
      lease_deposit: 0,
      monthly_rent: 0,
      status: '거래가능',
      manager_name: '관리자',
      created_at: '2025-01-15',
      supply_area_sqm: 84.56
    },
    {
      id: 2,
      property_name: '힐스테이트 오피스텔 A동 205호',
      location: '서울시 서초구 서초동',
      property_type: '오피스텔',
      transaction_type: '전세',
      sale_price: 0,
      lease_deposit: 800000000,
      monthly_rent: 0,
      status: '거래가능',
      manager_name: '관리자',
      created_at: '2025-01-14',
      supply_area_sqm: 32.15
    },
    {
      id: 3,
      property_name: '신축 빌라 3층',
      location: '서울시 마포구 합정동',
      property_type: '빌라/연립',
      transaction_type: '월세',
      sale_price: 0,
      lease_deposit: 50000000,
      monthly_rent: 500000,
      status: '거래완료',
      manager_name: '관리자',
      created_at: '2025-01-13',
      supply_area_sqm: 65.23
    }
  ];

  // 필터된 매물 목록
  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = !filters.search || 
      property.property_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      property.location.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || property.status === filters.status;
    const matchesType = !filters.type || property.property_type === filters.type;
    
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
    if (property.transaction_type === '매매') {
      return formatPrice(property.sale_price);
    } else if (property.transaction_type === '전세') {
      return formatPrice(property.lease_deposit);
    } else if (property.transaction_type === '월세') {
      const deposit = formatPrice(property.lease_deposit);
      const monthly = formatPrice(property.monthly_rent);
      return `${deposit} / ${monthly}`;
    }
    return '-';
  };

  const formatArea = (sqm) => {
    const pyeong = (sqm * 0.3025).toFixed(1);
    return `${sqm}㎡ (${pyeong}평)`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">매물 목록</h1>
          <p className="text-gray-600">등록된 매물을 관리하고 조회할 수 있습니다.</p>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          새 매물 등록
        </Link>
      </div>

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
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            매물 목록 ({filteredProperties.length}건)
          </h2>
        </div>
        
        {filteredProperties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">매물이 없습니다</p>
            <p className="text-sm">새로운 매물을 등록해보세요.</p>
          </div>
        ) : (
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
                          {property.property_type} • {formatArea(property.supply_area_sqm)}
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
                        {property.transaction_type}
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
                        property.status === '거래가능'
                          ? 'bg-green-100 text-green-800'
                          : property.status === '거래완료'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {property.created_at}
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
        )}
      </div>
    </div>
  );
};

export default PropertyList;