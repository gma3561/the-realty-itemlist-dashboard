import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { supabase } from '../../services/supabase';

const GlobalSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  // 디바운스된 검색어
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 검색 쿼리
  const { data: searchResults = [], isLoading } = useQuery(
    ['globalSearch', debouncedSearch],
    async () => {
      if (!debouncedSearch.trim()) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, property_name, location, property_type, property_status, transaction_type')
        .or(`property_name.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`)
        .order('created_at', { ascending: false })
        .limit(8);
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!debouncedSearch.trim(),
      staleTime: 2 * 60 * 1000
    }
  );

  // 외부 클릭 시 검색 결과 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleSelectProperty(searchResults[selectedIndex]);
        } else if (searchResults.length > 0) {
          handleSelectProperty(searchResults[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handleSelectProperty = (property) => {
    navigate(`/properties/${property.id}`);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    searchRef.current?.focus();
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

  const getStatusColor = (status) => {
    const colors = {
      'available': 'text-green-600',
      'reserved': 'text-yellow-600',
      'completed': 'text-blue-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      'available': '거래가능',
      'reserved': '거래보류',
      'completed': '거래완료'
    };
    return statuses[status] || status;
  };

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="매물명, 지역 검색..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              검색 중...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((property, index) => (
                <div
                  key={property.id}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectProperty(property)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {property.property_name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {property.location}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {getPropertyTypeDisplay(property.property_type)}
                        </span>
                        <span className={`text-xs font-medium ${getStatusColor(property.property_status)}`}>
                          {getStatusDisplay(property.property_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-2 text-center border-t border-gray-100">
                <button
                  onClick={() => {
                    navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  모든 검색 결과 보기
                </button>
              </div>
            </>
          ) : debouncedSearch.trim() ? (
            <div className="p-4 text-center text-gray-500">
              검색 결과가 없습니다
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;