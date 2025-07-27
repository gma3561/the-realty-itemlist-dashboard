import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Building2, CheckCircle, Clock, PlusCircle, BarChart, TrendingUp } from 'lucide-react';
import PropertyStatsChart from '../components/dashboard/PropertyStatsChart';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Supabase에서 매물 데이터 가져오기
  const { data: properties = [], isLoading } = useQuery(
    ['properties'],
    async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  );

  // 통계 계산
  const stats = {
    totalProperties: properties.length,
    completedDeals: properties.filter(p => p.property_status === 'completed').length,
    inProgress: properties.filter(p => p.property_status === 'available').length,
    thisMonth: properties.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  // 최근 매물 (상위 2개)
  const recentProperties = properties.slice(0, 2);

  const formatPrice = (price) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억원`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}만원`;
    }
    return `${price.toLocaleString()}원`;
  };

  // 타입 매핑 함수
  const getDisplayTransactionType = (type) => {
    const typeMap = {
      'sale': '매매',
      'lease': '전세',
      'rent': '월세'
    };
    return typeMap[type] || type;
  };

  const getDisplayStatus = (status) => {
    const statusMap = {
      'available': '거래가능',
      'reserved': '거래보류',
      'completed': '거래완료'
    };
    return statusMap[status] || status;
  };

  const getDisplayPrice = (property) => {
    const transactionType = getDisplayTransactionType(property.transaction_type);
    
    if (transactionType === '매매') {
      return formatPrice(property.sale_price || 0);
    } else if (transactionType === '전세') {
      return formatPrice(property.lease_price || 0);
    } else if (transactionType === '월세') {
      const deposit = formatPrice(property.lease_price || 0);
      const monthly = formatPrice(property.price || 0);
      return `${deposit} / ${monthly}`;
    }
    return '-';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">안녕하세요, {user?.name || user?.email}님!</h1>
        <p className="text-blue-100">오늘도 성공적인 부동산 중개 업무를 위해 팀 매물장을 활용해보세요.</p>
      </div>
      
      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">총 매물 수</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">거래 완료</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.completedDeals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">진행 중</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">이번 달 등록</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 작업 버튼들 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/properties/new"
            className="flex flex-col items-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <PlusCircle className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">새 매물 등록</span>
          </Link>
          
          <Link
            to="/properties"
            className="flex flex-col items-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Building2 className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">매물 목록 보기</span>
          </Link>
          
          <Link
            to="/users"
            className="flex flex-col items-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <BarChart className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">사용자 관리</span>
          </Link>
          
          <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
            <TrendingUp className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-500">통계 (준비중)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 등록 매물 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">최근 등록 매물</h2>
            <Link 
              to="/properties"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-4">
            {recentProperties.length === 0 ? (
              <div className="border rounded-lg p-6 text-center text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>아직 등록된 매물이 없습니다</p>
              </div>
            ) : (
              recentProperties.map((property) => (
                <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.property_name}</h3>
                      <p className="text-sm text-gray-600">{property.location}</p>
                      <p className="text-sm font-medium text-blue-600">{getDisplayPrice(property)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getDisplayStatus(property.property_status) === '거래가능'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getDisplayStatus(property.property_status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{new Date(property.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 월별 실적 요약 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">이번 달 실적 요약</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">신규 등록 매물</span>
              <span className="text-lg font-bold text-blue-600">{stats.thisMonth}건</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">성사된 거래</span>
              <span className="text-lg font-bold text-green-600">{stats.completedDeals}건</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">진행 중인 매물</span>
              <span className="text-lg font-bold text-yellow-600">{stats.inProgress}건</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              📈 지난달 대비 신규 등록 매물이 <span className="font-semibold text-green-600">50% 증가</span>했습니다!
            </p>
          </div>
        </div>
      </div>
      
      {/* 상세 통계 차트 */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">매물 분석 대시보드</h2>
          <PropertyStatsChart properties={properties} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;