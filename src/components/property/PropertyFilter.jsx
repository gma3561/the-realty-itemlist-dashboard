import React, { useState } from 'react';
import PropertyTypeSelect from './PropertyTypeSelect';
import PropertyStatusSelect from './PropertyStatusSelect';
import TransactionTypeSelect from './TransactionTypeSelect';
import Input from '../common/Input';
import Button from '../common/Button';

const PropertyFilter = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    propertyTypeId: '',
    propertyStatusId: '',
    transactionTypeId: '',
    location: '',
    propertyName: '',
    minPrice: '',
    maxPrice: '',
    managerId: ''
  });
  
  const handleChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };
  
  const handleReset = () => {
    setFilters({
      propertyTypeId: '',
      propertyStatusId: '',
      transactionTypeId: '',
      location: '',
      propertyName: '',
      minPrice: '',
      maxPrice: '',
      managerId: ''
    });
    onFilter({});
  };
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">매물 검색</h3>
        <p className="text-sm text-gray-600">매물 종류를 선택하시면 상세 검색이 가능합니다.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* 지역조회 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">지역조회</h4>
          <div className="grid grid-cols-4 gap-3">
            <PropertyTypeSelect 
              value={filters.propertyTypeId} 
              onChange={(value) => handleChange('propertyTypeId', value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm" 
            />
            <Input
              type="text"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="시/도"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
            <Input
              type="text"
              value={filters.propertyName}
              onChange={(e) => handleChange('propertyName', e.target.value)}
              placeholder="구/군"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
            <input
              type="text" 
              placeholder="읍/면/동" 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
          </div>
        </div>
        
        {/* 조건조회 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">조건조회</h4>
          <div className="grid grid-cols-6 gap-3">
            <TransactionTypeSelect 
              value={filters.transactionTypeId} 
              onChange={(value) => handleChange('transactionTypeId', value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
            <PropertyStatusSelect 
              value={filters.propertyStatusId} 
              onChange={(value) => handleChange('propertyStatusId', value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">매물가격 범위</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleChange('minPrice', e.target.value)}
                  placeholder="최소 만원"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm w-full"
                />
                <span className="text-sm text-gray-400">~</span>
                <Input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleChange('maxPrice', e.target.value)}
                  placeholder="최대 만원"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm w-full"
                />
              </div>
            </div>
            <input
              type="text" 
              placeholder="매물번호" 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
            <input
              type="text" 
              placeholder="담당자" 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button 
            type="button" 
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            초기화
          </button>
          <button 
            type="submit" 
            className="px-8 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            검색
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFilter;