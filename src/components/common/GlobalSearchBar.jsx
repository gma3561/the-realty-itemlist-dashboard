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
        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="매물명, 지역 검색..."
          className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 text-sm"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white border border-slate-100 rounded-lg shadow-xl z-50 max-h-80 sm:max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-slate-500">
              <div className="inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mr-2"></div>
              <span className="text-xs sm:text-sm font-medium">검색 중...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((property, index) => (
                <div
                  key={property.id}
                  className={`p-3 sm:p-4 cursor-pointer border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-all duration-200 ${
                    index === selectedIndex ? 'bg-slate-50 border-l-2 border-l-slate-500' : ''
                  }`}
                  onClick={() => handleSelectProperty(property)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate mb-1 text-sm">
                        {property.property_name}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 truncate mb-2">
                        {property.location}
                      </p>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {getPropertyTypeDisplay(property.property_type)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getStatusColor(property.property_status)} bg-opacity-10`}>
                          {getStatusDisplay(property.property_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-2 sm:p-3 text-center border-t border-slate-50 bg-slate-50">
                <button
                  onClick={() => {
                    navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="text-xs sm:text-sm text-slate-600 hover:text-slate-700 font-semibold transition-colors duration-200"
                >
                  모든 검색 결과 보기 →
                </button>
              </div>
            </>
          ) : debouncedSearch.trim() ? (
            <div className="p-4 sm:p-6 text-center text-slate-400">
              <div className="text-2xl sm:text-3xl mb-2">🔍</div>
              <p className="font-medium text-sm">검색 결과가 없습니다</p>
              <p className="text-xs mt-1">다른 키워드로 검색해보세요</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;