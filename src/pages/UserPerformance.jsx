import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import userService from '../services/userService';
import propertyService from '../services/propertyService';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';

const UserPerformance = () => {
  const { id } = useParams();
  const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, last3Months, last6Months, thisYear
  
  // 사용자 정보 조회
  const { data: user, isLoading: userLoading } = useQuery(
    ['user', id],
    async () => {
      const { data, error } = await userService.getUserById(id);
      if (error) throw error;
      return data;
    }
  );
  
  // 전체 매물 조회
  const { data: properties = [], isLoading: propertiesLoading } = useQuery(
    ['user-properties', id],
    async () => {
      const { data, error } = await propertyService.getProperties({}, { isAdmin: true });
      if (error) throw error;
      // 해당 사용자의 매물만 필터링
      return (data || []).filter(p => p.manager_id === id);
    }
  );
  
  // 룩업 테이블 조회
  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    }
  );
  
  // 날짜 범위에 따른 매물 필터링
  const filteredProperties = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'thisMonth':
        startDate.setDate(1);
        break;
      case 'lastMonth':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'last3Months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last6Months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'thisYear':
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
      default:
        startDate.setDate(1);
    }
    
    return properties.filter(p => new Date(p.created_at) >= startDate);
  }, [properties, dateRange]);
  
  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredProperties.length;
    const completed = filteredProperties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래완료';
    }).length;
    
    const available = filteredProperties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래가능';
    }).length;
    
    const hold = filteredProperties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래보류';
    }).length;
    
    // 총 거래 금액 계산
    const totalValue = filteredProperties.reduce((sum, property) => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      if (status?.name === '거래완료') {
        const price = property.price || property.lease_price || 0;
        return sum + price;
      }
      return sum;
    }, 0);
    
    const successRate = total > 0 ? (completed / total * 100).toFixed(1) : 0;
    
    return {
      total,
      completed,
      available,
      hold,
      totalValue,
      successRate
    };
  }, [filteredProperties, lookupData]);
  
  // 월별 성과 데이터
  const monthlyData = useMemo(() => {
    const data = {};
    
    properties.forEach(property => {
      const date = new Date(property.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!data[monthKey]) {
        data[monthKey] = { month: monthKey, total: 0, completed: 0 };
      }
      
      data[monthKey].total++;
      
      const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
      if (status?.name === '거래완료') {
        data[monthKey].completed++;
      }
    });
    
    // 최근 6개월 데이터만 가져오기
    const months = Object.keys(data).sort().slice(-6);
    return months.map(month => data[month]);
  }, [properties, lookupData]);
  
  // 매물 유형별 분포
  const propertyTypeData = useMemo(() => {
    const typeCount = {};
    
    filteredProperties.forEach(property => {
      const type = lookupData.propertyTypes?.find(t => t.id === property.property_type_id);
      const typeName = type?.name || '기타';
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    });
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    return Object.entries(typeCount).map(([name, count], index) => ({
      name,
      count,
      color: colors[index % colors.length]
    }));
  }, [filteredProperties, lookupData]);
  
  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    
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
  
  if (userLoading || propertiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">성과 데이터를 불러오는 중...</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          직원 관리로 돌아가기
        </Link>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{user?.name} 님의 성과</h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            {/* 기간 선택 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">기간:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="thisMonth">이번 달</option>
                <option value="lastMonth">지난 달</option>
                <option value="last3Months">최근 3개월</option>
                <option value="last6Months">최근 6개월</option>
                <option value="thisYear">올해</option>
              </select>
            </div>
          </div>
          
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 매물</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}건</p>
                </div>
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">거래완료</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.completed}건</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">거래가능</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.available}건</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">성과율</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.successRate}%</p>
                </div>
                <Target className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">총 거래금액</p>
                  <p className="text-lg font-bold text-purple-900 mt-1">{formatPrice(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월별 성과 추이 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            월별 성과 추이
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="총 매물"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="거래완료"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 매물 유형별 분포 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            매물 유형별 분포
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}건`}
                  fontSize={12}
                >
                  {propertyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 최근 매물 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
          최근 담당 매물
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매물명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.slice(0, 10).map((property) => {
                const propertyType = lookupData.propertyTypes?.find(t => t.id === property.property_type_id);
                const transactionType = lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id);
                const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
                
                return (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.property_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {propertyType?.name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {transactionType?.name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(property.price || property.lease_price || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        status?.name === '거래완료' 
                          ? 'bg-green-100 text-green-800'
                          : status?.name === '거래가능'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(property.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        to={`/properties/${property.id}`}
                        className="text-blue-600 hover:text-blue-800"
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
        
        {filteredProperties.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              to={`/properties?manager=${id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체 매물 보기 ({filteredProperties.length}건)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPerformance;