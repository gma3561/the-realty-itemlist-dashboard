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
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">매물종류</label>
          <PropertyTypeSelect 
            value={filters.propertyTypeId} 
            onChange={(value) => handleChange('propertyTypeId', value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">진행상태</label>
          <PropertyStatusSelect 
            value={filters.propertyStatusId} 
            onChange={(value) => handleChange('propertyStatusId', value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">거래유형</label>
          <TransactionTypeSelect 
            value={filters.transactionTypeId} 
            onChange={(value) => handleChange('transactionTypeId', value)} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
          <Input
            type="text"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="예: 강남구 삼성동"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">매물명</label>
          <Input
            type="text"
            value={filters.propertyName}
            onChange={(e) => handleChange('propertyName', e.target.value)}
            placeholder="예: 래미안아파트"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소가격</label>
            <Input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              placeholder="최소가격"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대가격</label>
            <Input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              placeholder="최대가격"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="secondary"
          onClick={handleReset}
        >
          초기화
        </Button>
        <Button 
          type="submit" 
          variant="primary"
        >
          검색
        </Button>
      </div>
    </form>
  );
};

export default PropertyFilter;