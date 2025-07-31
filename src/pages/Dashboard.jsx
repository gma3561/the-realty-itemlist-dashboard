import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import propertyService from '../services/propertyService';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  BarChart, 
  TrendingUp,
  Home,
  DollarSign,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import PropertyStatsChart from '../components/dashboard/PropertyStatsChart';

const Dashboard = () => {
  const { user } = useAuth();
  
  // 매물 데이터 가져오기
  const { data: properties = [], isLoading } = useQuery(
    ['dashboard-properties', user?.email],
    async () => {
      const userInfo = {
        userId: user?.id,
        userEmail: user?.email,
        isAdmin: isHardcodedAdmin(user?.email)
      };
      const { data, error } = await propertyService.getProperties({}, userInfo);
      if (error) throw new Error(error);
      return data || [];
    }
  );

  // 룩업 데이터 가져오기
  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5분
    }
  );

  // 통계 계산
  const stats = {
    totalProperties: properties.length,
    completedDeals: properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래완료';
    }).length,
    inProgress: properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래가능' || status?.name === '거래보류';
    }).length,
    thisMonth: properties.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  // 성장률 계산 (전월 대비)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthCount = properties.filter(p => {
    const created = new Date(p.created_at);
    return created.getMonth() === lastMonth.getMonth() && created.getFullYear() === lastMonth.getFullYear();
  }).length;
  const growthRate = lastMonthCount > 0 ? ((stats.thisMonth - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;

  // 최근 매물 (상위 5개)
  const recentProperties = properties.slice(0, 5);

  const formatPrice = (price) => {
    if (price >= 100000000) {
      const eok = Math.floor(price / 100000000);
      const man = Math.floor((price % 100000000) / 10000);
      if (man > 0) {
        return `${eok}억 ${man.toLocaleString()}만원`;
      }
      return `${eok}억원`;
    } else if (price >= 10000) {
      return `${(price / 10000).toLocaleString()}만원`;
    }
    return `${price.toLocaleString()}원`;
  };

  // 룩업 데이터 사용을 위한 헬퍼 함수
  const getDisplayTransactionType = (property) => {
    const type = lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id);
    return type?.name || '미지정';
  };

  const getDisplayStatus = (property) => {
    const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
    return status?.name || '미지정';
  };

  const getDisplayPropertyType = (property) => {
    const type = lookupData.propertyTypes?.find(t => t.id === property.property_type_id);
    return type?.name || '미지정';
  };

  const getDisplayPrice = (property) => {
    const transactionType = getDisplayTransactionType(property);
    
    if (transactionType === '매매') {
      return formatPrice(property.price || 0);
    } else if (transactionType === '전세') {
      return formatPrice(property.lease_price || 0);
    } else if (transactionType === '월세' || transactionType === '월세/렌트') {
      const deposit = formatPrice(property.lease_price || 0);
      const monthly = formatPrice(property.monthly_rent || 0);
      return `${deposit} / ${monthly}`;
    }
    return formatPrice(property.price || 0) || '-';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">안녕하세요, {user?.name || user?.email?.split('@')[0]}님. 오늘의 부동산 현황을 확인하세요.</p>
      </div>
      
      {/* 통계 카드들 */}
      <div className="grid-container grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* 총 매물 수 */}
        <div className="data-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="data-card-label">총 매물 수</p>
              <p className="data-card-value">{stats.totalProperties}</p>
              <div className="flex items-center mt-2">
                {growthRate > 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-success-600 mr-1" />
                    <span className="text-sm text-success-600 font-medium">+{growthRate}%</span>
                  </>
                ) : growthRate < 0 ? (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-error-600 mr-1" />
                    <span className="text-sm text-error-600 font-medium">{growthRate}%</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">변동 없음</span>
                )}
              </div>
            </div>
            <div className="data-card-icon bg-primary-100 text-primary-600">
              <Building2 />
            </div>
          </div>
        </div>

        {/* 거래 완료 */}
        <div className="data-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="data-card-label">거래 완료</p>
              <p className="data-card-value">{stats.completedDeals}</p>
              <p className="text-sm text-gray-500 mt-2">
                성공률 {stats.totalProperties > 0 ? Math.round((stats.completedDeals / stats.totalProperties) * 100) : 0}%
              </p>
            </div>
            <div className="data-card-icon bg-success-50 text-success-600">
              <CheckCircle />
            </div>
          </div>
        </div>

        {/* 진행 중 */}
        <div className="data-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="data-card-label">진행 중</p>
              <p className="data-card-value">{stats.inProgress}</p>
              <p className="text-sm text-gray-500 mt-2">활성 매물</p>
            </div>
            <div className="data-card-icon bg-warning-50 text-warning-600">
              <Clock />
            </div>
          </div>
        </div>

        {/* 이번 달 등록 */}
        <div className="data-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="data-card-label">이번 달 등록</p>
              <p className="data-card-value">{stats.thisMonth}</p>
              <p className="text-sm text-gray-500 mt-2">{new Date().toLocaleDateString('ko-KR', { month: 'long' })}</p>
            </div>
            <div className="data-card-icon bg-purple-100 text-purple-600">
              <TrendingUp />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-container grid-cols-1 lg:grid-cols-3">
        {/* 최근 등록 매물 */}
        <div className="card col-span-2">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">최근 등록 매물</h2>
              <Link 
                to="/properties"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                전체 보기
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {recentProperties.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>아직 등록된 매물이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="table">
                  <thead>
                    <tr>
                      <th>매물명</th>
                      <th>위치</th>
                      <th>매물유형</th>
                      <th>거래유형</th>
                      <th>가격</th>
                      <th>담당자</th>
                      <th>등록일</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProperties.map((property) => {
                      const managerEmail = property.manager_id?.replace('hardcoded-', '').split('@')[0];
                      const managerName = property.manager_id?.includes('jenny') ? '정연서' :
                                         property.manager_id?.includes('lucas') ? '하상현' :
                                         property.manager_id?.includes('hmlee') ? '이혜만' :
                                         property.manager_id?.includes('jma') ? '장민아' :
                                         property.manager_id?.includes('jed') ? '정이든' :
                                         property.manager_id?.includes('jsh') ? '장승환' :
                                         property.manager_id?.includes('pjh') ? '박지혜' :
                                         managerEmail || '-';
                      
                      return (
                        <tr key={property.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `#/properties/${property.id}`}>
                          <td className="font-medium">{property.property_name}</td>
                          <td className="text-gray-600">{property.location}</td>
                          <td>
                            <span className="text-sm text-gray-600">
                              {getDisplayPropertyType(property)}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-gray-600">
                              {getDisplayTransactionType(property)}
                            </span>
                          </td>
                          <td className="font-medium text-primary-600">{getDisplayPrice(property)}</td>
                          <td className="text-sm text-gray-700">{managerName}</td>
                          <td className="text-sm text-gray-500">
                            {new Date(property.created_at).toLocaleDateString('ko-KR', { 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </td>
                          <td>
                            <span className={`badge ${
                              getDisplayStatus(property) === '거래가능' 
                                ? 'badge-success' 
                                : getDisplayStatus(property) === '거래완료'
                                ? 'badge-error'
                                : 'badge-warning'
                            }`}>
                              {getDisplayStatus(property)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 작업 */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">빠른 작업</h2>
          </div>
          <div className="card-body space-y-3">
            <Link
              to="/properties/new"
              className="flex items-center p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">새 매물 등록</p>
                <p className="text-sm text-gray-500">새로운 매물을 등록합니다</p>
              </div>
            </Link>
            
            <Link
              to="/properties"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">매물 목록</p>
                <p className="text-sm text-gray-500">전체 매물을 확인합니다</p>
              </div>
            </Link>
            
            <Link
              to="/users"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">직원 관리</p>
                <p className="text-sm text-gray-500">직원 정보를 관리합니다</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">매물 통계</h2>
        </div>
        <div className="card-body">
          <PropertyStatsChart properties={properties} lookupData={lookupData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;