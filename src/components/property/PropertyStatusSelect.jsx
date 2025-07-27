import React from 'react';
import { usePropertyStatuses } from '../../hooks/usePropertyStatuses';

const PropertyStatusSelect = ({ value, onChange, className = '', required = false }) => {
  const { propertyStatuses, loading, error } = usePropertyStatuses();
  
  if (loading) return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>;
  if (error) return <div className="text-red-500">상태 목록을 불러오는데 실패했습니다.</div>;
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      required={required}
    >
      <option value="">진행상태 선택</option>
      {propertyStatuses.map(status => (
        <option key={status.id} value={status.id}>{status.name}</option>
      ))}
    </select>
  );
};

export default PropertyStatusSelect;