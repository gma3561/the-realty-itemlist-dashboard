/**
 * 부동산 실거래가 데이터 수집 페이지
 */

import React from 'react';
import RealEstateCollector from '../components/RealEstateCollector';
import RealTimePropertyData from '../components/RealTimePropertyData';

const DataCollection = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 부동산 실거래가 데이터 수집
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            공공데이터포털 API를 활용한 자동 데이터 수집 시스템
          </p>
        </div>

        {/* 실시간 부동산 실거래가 조회 */}
        <RealTimePropertyData />
        
        {/* 부동산 데이터 수집 컴포넌트 */}
        <div className="mt-8">
          <RealEstateCollector />
        </div>

        {/* 추가 안내 정보 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🔄 자동 수집 시스템
            </h3>
            <p className="text-gray-600 text-sm">
              3시간마다 자동으로 서울시 주요 8개 지역의 아파트 실거래가 데이터를 수집합니다.
              API 호출 제한을 준수하여 안정적으로 운영됩니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 데이터 분석
            </h3>
            <p className="text-gray-600 text-sm">
              수집된 데이터는 실시간으로 분석되어 거래 트렌드, 평균 가격, 
              지역별 분포 등의 인사이트를 제공합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🔒 데이터 보안
            </h3>
            <p className="text-gray-600 text-sm">
              모든 데이터는 Supabase에 안전하게 저장되며, 
              API 키는 암호화되어 관리됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;