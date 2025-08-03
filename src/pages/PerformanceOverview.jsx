import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import userService from '../services/userService';
import propertyService from '../services/propertyService';
import { 
  User, 
  Building2, 
  TrendingUp, 
  BarChart3,
  Award,
  Activity,
  Users,
  ArrowRight
} from 'lucide-react';

const PerformanceOverview = () => {
  const { user } = useAuth();
  
  // 관리자 권한 확인
  const isAdmin = isHardcodedAdmin(user?.email);
  
  if (!isAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">접근 권한 없음</h2>
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          관리자 권한이 필요합니다. 관리자에게 문의하세요.
        </div>
      </div>
    );
  }

  // 모든 사용자 조회
  const { data: users = [], isLoading: usersLoading } = useQuery(
    'users',
    async () => {
      const { data, error } = await userService.getUsers();
      if (error) throw error;
      return data;
    }
  );

  // 모든 매물 조회
  const { data: properties = [], isLoading: propertiesLoading } = useQuery(
    'all-properties',
    async () => {
      const { data, error } = await propertyService.getProperties();
      if (error) throw error;
      return data || [];
    }
  );

  // 룩업 데이터
  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // 직원별 통계 계산
  const calculateUserStats = (userId, userEmail) => {
    // 더미데이터에서는 hardcoded ID를 사용하므로 이를 고려
    const userProperties = properties.filter(p => {
      const managerId = p.manager_id;
      return managerId === userId || 
             managerId === `hardcoded-${userEmail}` ||
             (userEmail && managerId?.includes(userEmail));
    });
    
    const stats = {
      totalProperties: userProperties.length,
      completedDeals: 0,
      activeDeals: 0,
      pendingDeals: 0,
      monthlyDeals: 0
    };

    userProperties.forEach(property => {
      const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
      if (status?.name === '거래완료') {
        stats.completedDeals++;
      } else if (status?.name === '거래가능') {
        stats.activeDeals++;
      } else if (status?.name === '거래보류') {
        stats.pendingDeals++;
      }

      // 이번달 등록된 매물 계산
      const createdDate = new Date(property.created_at);
      const now = new Date();
      if (createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()) {
        stats.monthlyDeals++;
      }
    });

    return stats;
  };

  // 전체 통계 계산
  const calculateOverallStats = () => {
    const totalProperties = properties.length;
    const completedDeals = properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래완료';
    }).length;
    
    const activeDeals = properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래가능';
    }).length;

    const performanceRate = totalProperties > 0 ? Math.round((completedDeals / totalProperties) * 100) : 0;

    return {
      totalProperties,
      completedDeals,
      activeDeals,
      performanceRate,
      totalStaff: users.length
    };
  };

  const overallStats = calculateOverallStats();

  if (usersLoading || propertiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">성과 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 사용자별 성과 데이터와 함께 정렬
  const usersWithStats = users.map(user => ({
    ...user,
    stats: calculateUserStats(user.id, user.email)
  })).sort((a, b) => b.stats.totalProperties - a.stats.totalProperties);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
          <BarChart3 className="w-8 h-8 mr-2 text-blue-600" />
          직원 성과 현황
        </h1>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">총 직원</p>
                <p className="text-2xl font-bold text-blue-900">{overallStats.totalStaff}명</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">총 매물</p>
                <p className="text-2xl font-bold text-purple-900">{overallStats.totalProperties}건</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">거래완료</p>
                <p className="text-2xl font-bold text-green-900">{overallStats.completedDeals}건</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">진행중</p>
                <p className="text-2xl font-bold text-yellow-900">{overallStats.activeDeals}건</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">평균 성과율</p>
                <p className="text-2xl font-bold text-red-900">{overallStats.performanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 직원별 성과 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">직원별 성과 순위</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersWithStats.map((staffUser, index) => {
            const stats = staffUser.stats;
            const performanceRate = stats.totalProperties > 0 
              ? Math.round((stats.completedDeals / stats.totalProperties) * 100) 
              : 0;
            
            return (
              <Link
                key={staffUser.id}
                to={`/users/${staffUser.id}/performance`}
                className="block border rounded-lg p-4 hover:shadow-md transition-shadow hover:border-blue-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{staffUser.name}</h3>
                      <p className="text-sm text-gray-600">{staffUser.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 매물</span>
                    <span className="font-semibold">{stats.totalProperties}건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">거래완료</span>
                    <span className="font-semibold text-green-600">{stats.completedDeals}건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">진행중</span>
                    <span className="font-semibold text-blue-600">{stats.activeDeals}건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">이번달 등록</span>
                    <span className="font-semibold">{stats.monthlyDeals}건</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">성과율</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${performanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{performanceRate}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;