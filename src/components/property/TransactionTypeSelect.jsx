import React from 'react';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';

const TransactionTypeSelect = ({ value, onChange, className = '', required = false }) => {
  const { transactionTypes, loading, error } = useTransactionTypes();
  
  if (loading) return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>;
  if (error) return <div className="text-red-500">거래유형 목록을 불러오는데 실패했습니다.</div>;
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      required={required}
    >
      <option value="">거래유형 선택</option>
      {transactionTypes.map(type => (
        <option key={type.id} value={type.id}>{type.name}</option>
      ))}
    </select>
  );
};

export default TransactionTypeSelect;