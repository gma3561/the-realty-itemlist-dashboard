import { useState, useMemo, useCallback } from 'react';

/**
 * 매물 필터링 로직을 관리하는 커스텀 훅
 * @param {Array} properties - 필터링할 매물 배열
 * @param {Object} initialFilters - 초기 필터 값
 * @returns {Object} 필터링 관련 상태와 함수들
 */
export const usePropertyFilters = (properties = [], initialFilters = {}) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    propertyType: '',
    transactionType: '',
    status: '',
    priceRange: { min: 0, max: Infinity },
    areaRange: { min: 0, max: Infinity },
    location: '',
    managerId: '',
    dateRange: { start: null, end: null },
    ...initialFilters
  });

  // 필터링된 매물 목록
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // 검색어 필터링
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(property => 
        property.property_name?.toLowerCase().includes(term) ||
        property.location?.toLowerCase().includes(term) ||
        property.building?.toLowerCase().includes(term) ||
        property.unit?.toLowerCase().includes(term)
      );
    }

    // 매물 종류 필터링
    if (filters.propertyType) {
      filtered = filtered.filter(property => 
        property.property_type_id === filters.propertyType
      );
    }

    // 거래 유형 필터링
    if (filters.transactionType) {
      filtered = filtered.filter(property => 
        property.transaction_type_id === filters.transactionType
      );
    }

    // 상태 필터링
    if (filters.status) {
      filtered = filtered.filter(property => 
        property.property_status_id === filters.status
      );
    }

    // 가격 범위 필터링
    if (filters.priceRange.min > 0 || filters.priceRange.max < Infinity) {
      filtered = filtered.filter(property => {
        const price = parseInt(property.price || 0);
        const leasePrice = parseInt(property.lease_price || 0);
        const maxPrice = Math.max(price, leasePrice);
        
        return maxPrice >= filters.priceRange.min && maxPrice <= filters.priceRange.max;
      });
    }

    // 면적 범위 필터링
    if (filters.areaRange.min > 0 || filters.areaRange.max < Infinity) {
      filtered = filtered.filter(property => {
        const area = parseFloat(property.supply_area_sqm || 0);
        return area >= filters.areaRange.min && area <= filters.areaRange.max;
      });
    }

    // 지역 필터링
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(property => 
        property.location?.toLowerCase().includes(location)
      );
    }

    // 담당자 필터링
    if (filters.managerId) {
      filtered = filtered.filter(property => 
        property.manager_id === filters.managerId
      );
    }

    // 날짜 범위 필터링
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(property => {
        const createdDate = new Date(property.created_at);
        
        if (filters.dateRange.start && createdDate < new Date(filters.dateRange.start)) {
          return false;
        }
        
        if (filters.dateRange.end && createdDate > new Date(filters.dateRange.end)) {
          return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [properties, filters]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      propertyType: '',
      transactionType: '',
      status: '',
      priceRange: { min: 0, max: Infinity },
      areaRange: { min: 0, max: Infinity },
      location: '',
      managerId: '',
      dateRange: { start: null, end: null },
      ...initialFilters
    });
  }, [initialFilters]);

  // 개별 필터 업데이트 함수들
  const setSearchTerm = useCallback((term) => {
    updateFilters({ searchTerm: term });
  }, [updateFilters]);

  const setPropertyType = useCallback((type) => {
    updateFilters({ propertyType: type });
  }, [updateFilters]);

  const setTransactionType = useCallback((type) => {
    updateFilters({ transactionType: type });
  }, [updateFilters]);

  const setStatus = useCallback((status) => {
    updateFilters({ status });
  }, [updateFilters]);

  const setPriceRange = useCallback((range) => {
    updateFilters({ priceRange: range });
  }, [updateFilters]);

  const setAreaRange = useCallback((range) => {
    updateFilters({ areaRange: range });
  }, [updateFilters]);

  const setLocation = useCallback((location) => {
    updateFilters({ location });
  }, [updateFilters]);

  const setManagerId = useCallback((managerId) => {
    updateFilters({ managerId });
  }, [updateFilters]);

  const setDateRange = useCallback((dateRange) => {
    updateFilters({ dateRange });
  }, [updateFilters]);

  // 필터 통계
  const filterStats = useMemo(() => {
    return {
      totalProperties: properties.length,
      filteredProperties: filteredProperties.length,
      filterApplied: Object.values(filters).some(value => {
        if (typeof value === 'string') return value.length > 0;
        if (typeof value === 'object' && value !== null) {
          if (value.min !== undefined) return value.min > 0 || value.max < Infinity;
          if (value.start !== undefined) return value.start !== null || value.end !== null;
        }
        return false;
      })
    };
  }, [properties, filteredProperties, filters]);

  // 활성 필터 목록
  const activeFilters = useMemo(() => {
    const active = [];
    
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `검색: ${filters.searchTerm}` });
    if (filters.propertyType) active.push({ key: 'propertyType', label: `매물종류: ${filters.propertyType}` });
    if (filters.transactionType) active.push({ key: 'transactionType', label: `거래유형: ${filters.transactionType}` });
    if (filters.status) active.push({ key: 'status', label: `상태: ${filters.status}` });
    if (filters.location) active.push({ key: 'location', label: `지역: ${filters.location}` });
    if (filters.managerId) active.push({ key: 'managerId', label: `담당자: ${filters.managerId}` });
    
    if (filters.priceRange.min > 0 || filters.priceRange.max < Infinity) {
      const min = filters.priceRange.min > 0 ? `${(filters.priceRange.min / 10000).toFixed(0)}만원` : '';
      const max = filters.priceRange.max < Infinity ? `${(filters.priceRange.max / 10000).toFixed(0)}만원` : '';
      const label = min && max ? `${min} ~ ${max}` : min || `~ ${max}`;
      active.push({ key: 'priceRange', label: `가격: ${label}` });
    }
    
    if (filters.areaRange.min > 0 || filters.areaRange.max < Infinity) {
      const min = filters.areaRange.min > 0 ? `${filters.areaRange.min}㎡` : '';
      const max = filters.areaRange.max < Infinity ? `${filters.areaRange.max}㎡` : '';
      const label = min && max ? `${min} ~ ${max}` : min || `~ ${max}`;
      active.push({ key: 'areaRange', label: `면적: ${label}` });
    }
    
    return active;
  }, [filters]);

  // 개별 필터 제거
  const removeFilter = useCallback((filterKey) => {
    switch (filterKey) {
      case 'searchTerm':
        setSearchTerm('');
        break;
      case 'propertyType':
        setPropertyType('');
        break;
      case 'transactionType':
        setTransactionType('');
        break;
      case 'status':
        setStatus('');
        break;
      case 'location':
        setLocation('');
        break;
      case 'managerId':
        setManagerId('');
        break;
      case 'priceRange':
        setPriceRange({ min: 0, max: Infinity });
        break;
      case 'areaRange':
        setAreaRange({ min: 0, max: Infinity });
        break;
      default:
        break;
    }
  }, [setSearchTerm, setPropertyType, setTransactionType, setStatus, setLocation, setManagerId, setPriceRange, setAreaRange]);

  return {
    // 필터 상태
    filters,
    filteredProperties,
    filterStats,
    activeFilters,
    
    // 필터 업데이트 함수들
    updateFilters,
    resetFilters,
    removeFilter,
    
    // 개별 필터 설정 함수들
    setSearchTerm,
    setPropertyType,
    setTransactionType,
    setStatus,
    setPriceRange,
    setAreaRange,
    setLocation,
    setManagerId,
    setDateRange
  };
};

export default usePropertyFilters;