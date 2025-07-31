import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';
import userService from '../services/userService';
import propertyService from '../services/propertyService';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  FileText,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Target,
  Award
} from 'lucide-react';

const StaffPerformance = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month'); // month, quarter, year, all
  
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

  // 사용자 정보 조회
  const { data: staffUser, isLoading: userLoading } = useQuery(
    ['user', userId],
    async () => {
      const { data, error } = await userService.getUserById(userId);
      if (error) throw new Error(error);
      return data;
    }
  );

  // 매물 목록 조회
  const { data: properties = [], isLoading: propertiesLoading } = useQuery(
    ['staff-properties', userId],
    async () => {
      const { data, error } = await propertyService.getProperties();
      if (error) throw new Error(error);
      // 해당 직원의 매물만 필터링 - hardcoded ID도 고려
      return data.filter(p => {
        const managerId = p.manager_id;
        return managerId === userId || 
               managerId === `hardcoded-${staffUser?.email}` ||
               (staffUser?.email && managerId?.includes(staffUser.email));
      });
    },
    {
      enabled: !!staffUser
    }
  );

  // 룩업 데이터
  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    }
  );

  // 통계 계산
  const calculateStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    // 날짜 범위별 필터링
    const filteredProperties = properties.filter(p => {
      const propDate = new Date(p.created_at);
      const propYear = propDate.getFullYear();
      const propMonth = propDate.getMonth();
      const propQuarter = Math.floor(propMonth / 3);

      switch (dateRange) {
        case 'month':
          return propYear === currentYear && propMonth === currentMonth;
        case 'quarter':
          return propYear === currentYear && propQuarter === currentQuarter;
        case 'year':
          return propYear === currentYear;
        case 'all':
        default:
          return true;
      }
    });

    // 상태별 통계
    const statusStats = {
      total: filteredProperties.length,
      available: 0,
      completed: 0,
      pending: 0
    };

    // 거래 유형별 통계
    const transactionStats = {
      sale: 0,
      lease: 0,
      rent: 0
    };

    // 매물 종류별 통계
    const propertyTypeStats = {};

    filteredProperties.forEach(p => {
      // 상태별
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      if (status?.name === '거래가능') statusStats.available++;
      else if (status?.name === '거래완료') statusStats.completed++;
      else if (status?.name === '거래보류') statusStats.pending++;

      // 거래 유형별
      const transType = lookupData.transactionTypes?.find(t => t.id === p.transaction_type_id);
      if (transType?.name === '매매') transactionStats.sale++;
      else if (transType?.name === '전세') transactionStats.lease++;
      else if (transType?.name === '월세') transactionStats.rent++;

      // 매물 종류별
      const propType = lookupData.propertyTypes?.find(t => t.id === p.property_type_id);
      if (propType?.name) {
        propertyTypeStats[propType.name] = (propertyTypeStats[propType.name] || 0) + 1;
      }
    });

    return {
      statusStats,
      transactionStats,
      propertyTypeStats,
      filteredProperties
    };
  };

  const stats = calculateStats();

  if (userLoading || propertiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">성과 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!staffUser) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">사용자를 찾을 수 없습니다</h2>
        <Link to="/users" className="text-blue-600 hover:text-blue-800">
          사용자 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/users')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="w-8 h-8 mr-2 text-blue-600" />
                {staffUser.name} 님의 성과
              </h1>
              <p className="text-gray-600 mt-1">{staffUser.email}</p>
            </div>
          </div>
          
          {/* 기간 선택 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">기간:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">이번 달</option>
              <option value="quarter">이번 분기</option>
              <option value="year">올해</option>
              <option value="all">전체</option>
            </select>
          </div>
        </div>

        {/* 기본 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">총 매물</p>
                <p className="text-2xl font-bold text-blue-900">{stats.statusStats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">거래완료</p>
                <p className="text-2xl font-bold text-green-900">{stats.statusStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">진행중</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.statusStats.available}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">성과율</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.statusStats.total > 0 
                    ? Math.round((stats.statusStats.completed / stats.statusStats.total) * 100) 
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 거래 유형별 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            거래 유형별 분석
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">매매</span>
              <span className="text-lg font-bold text-blue-600">{stats.transactionStats.sale}건</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">전세</span>
              <span className="text-lg font-bold text-green-600">{stats.transactionStats.lease}건</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">월세</span>
              <span className="text-lg font-bold text-purple-600">{stats.transactionStats.rent}건</span>
            </div>
          </div>
        </div>

        {/* 매물 종류별 통계 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            매물 종류별 분석
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.propertyTypeStats).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{type}</span>
                <span className="text-lg font-bold">{count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 매물 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          최근 담당 매물
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매물명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  위치
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.filteredProperties.slice(0, 10).map((property) => {
                const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
                const transType = lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id);
                
                return (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.property_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transType?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        status?.name === '거래완료'
                          ? 'bg-blue-100 text-blue-800'
                          : status?.name === '거래가능'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/properties/${property.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformance;