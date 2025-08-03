import React from 'react';

const SkeletonLoader = ({ type = 'text', className = '', count = 1 }) => {
  const getSkeletonClass = () => {
    const baseClass = 'animate-pulse bg-gray-200 rounded';
    
    switch (type) {
      case 'text':
        return `${baseClass} h-4 w-full`;
      case 'title':
        return `${baseClass} h-6 w-3/4`;
      case 'card':
        return `${baseClass} h-32 w-full`;
      case 'avatar':
        return `${baseClass} h-10 w-10 rounded-full`;
      case 'button':
        return `${baseClass} h-10 w-24`;
      case 'table-row':
        return `${baseClass} h-12 w-full`;
      default:
        return baseClass;
    }
  };

  const renderSkeleton = () => {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div key={i} className={`${getSkeletonClass()} ${className} ${i > 0 ? 'mt-2' : ''}`} />
      );
    }
    return skeletons;
  };

  return <>{renderSkeleton()}</>;
};

// 테이블 스켈레톤 로더
export const TableSkeletonLoader = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <SkeletonLoader type="text" className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      
      {/* 행 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <SkeletonLoader type="text" className="h-3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// 카드 스켈레톤 로더
export const CardSkeletonLoader = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <SkeletonLoader type="title" className="mb-4" />
      <SkeletonLoader type="text" count={3} />
      <div className="mt-4 flex justify-between items-center">
        <SkeletonLoader type="button" />
        <SkeletonLoader type="avatar" />
      </div>
    </div>
  );
};

// 대시보드 통계 카드 스켈레톤
export const StatsCardSkeletonLoader = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonLoader type="text" className="h-3 w-24 mb-2" />
          <SkeletonLoader type="title" className="h-8 w-32" />
        </div>
        <SkeletonLoader type="avatar" className="h-12 w-12" />
      </div>
    </div>
  );
};

export default SkeletonLoader;