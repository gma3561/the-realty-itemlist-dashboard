import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyFilter from '../components/property/PropertyFilter';
import Button from '../components/common/Button';
import { useQuery } from 'react-query';
import { supabase } from '../services/supabase';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';

const PropertyList = () => {
  const [filters, setFilters] = useState({});
  
  // 매물 목록 조회 쿼리
  const fetchProperties = async () => {
    let query = supabase.from('properties').select(`
      *,
      property_type:property_types(name),
      property_status:property_statuses(name),
      transaction_type:transaction_types(name),
      manager:users(name, email)
    `);
    
    // 필터 적용
    if (filters.propertyTypeId) {
      query = query.eq('property_type_id', filters.propertyTypeId);
    }
    
    if (filters.propertyStatusId) {
      query = query.eq('property_status_id', filters.propertyStatusId);
    }
    
    if (filters.transactionTypeId) {
      query = query.eq('transaction_type_id', filters.transactionTypeId);
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters.propertyName) {
      query = query.ilike('property_name', `%${filters.propertyName}%`);
    }
    
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    
    if (filters.managerId) {
      query = query.eq('manager_id', filters.managerId);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  };
  
  const { data: properties, isLoading, isError, error, refetch } = useQuery(
    ['properties', filters],
    fetchProperties,
    {
      keepPreviousData: true,
    }
  );
  
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">매물 목록</h1>
        <Link to="/properties/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            새 매물 등록
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <PropertyFilter onFilter={handleFilter} />
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="text-gray-700">
            <Search className="w-4 h-4 inline mr-2" />
            검색 결과: {isLoading ? '로딩 중...' : properties?.length || 0}개
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">매물 정보를 불러오는 중...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            <p>오류가 발생했습니다: {error.message}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        ) : properties?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>매물 정보가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매물명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소재지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    종류
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래유형
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr 
                    key={property.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/properties/${property.id}`;
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {property.property_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.building} {property.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{property.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.property_type?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.transaction_type?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.price 
                          ? new Intl.NumberFormat('ko-KR').format(property.price) + '원'
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${property.property_status?.name === '거래가능' 
                          ? 'bg-green-100 text-green-800' 
                          : property.property_status?.name === '거래완료' 
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {property.property_status?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.manager?.name || '-'}
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