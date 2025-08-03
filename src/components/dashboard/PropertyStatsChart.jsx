import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  Home, 
  DollarSign, 
  Calendar,
  Activity,
  Users,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getRealtorNameByEmail } from '../../data/realtorNameMap';

const PropertyStatsChart = ({ properties = [], lookupData = {} }) => {
  // 매물 유형별 통계
  const typeStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const typeName = lookupData.propertyTypes?.find(t => t.id === property.property_type_id)?.name || '미지정';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: ((count / properties.length) * 100).toFixed(1)
    }));
  }, [properties, lookupData]);

  // 거래 유형별 통계
  const transactionStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const typeName = lookupData.transactionTypes?.find(t => t.id === property.transaction_type_id)?.name || '미지정';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / properties.length) * 100).toFixed(1)
    }));
  }, [properties, lookupData]);

  // 매물 상태별 통계
  const statusStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const statusName = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id)?.name || '미지정';
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / properties.length) * 100).toFixed(1)
    }));
  }, [properties, lookupData]);

  // 월별 통계 (최근 12개월)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const months = [];
    
    // 최근 12개월 생성
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key: monthKey,
        month: date.toLocaleDateString('ko-KR', { month: 'short' }),
        fullMonth: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
      });
    }

    // 매물 데이터 집계
    const monthStats = properties.reduce((acc, property) => {
      if (property.created_at) {
        const date = new Date(property.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            total: 0,
            completed: 0,
            available: 0,
            revenue: 0
          };
        }
        
        acc[monthKey].total++;
        
        const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id)?.name;
        if (status === '거래완료') {
          acc[monthKey].completed++;
          acc[monthKey].revenue += property.price || 0;
        } else if (status === '거래가능') {
          acc[monthKey].available++;
        }
      }
      return acc;
    }, {});

    return months.map(({ key, month, fullMonth }) => ({
      month,
      fullMonth,
      등록: monthStats[key]?.total || 0,
      완료: monthStats[key]?.completed || 0,
      진행중: monthStats[key]?.available || 0,
      매출: monthStats[key]?.revenue || 0
    }));
  }, [properties, lookupData]);

  // 직원별 성과 통계
  const staffPerformance = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const managerId = property.manager_id;
      if (!managerId) return acc;
      
      // manager_name이 있으면 우선 사용
      let managerName = property.manager_name;
      if (!managerName && managerId.includes('@')) {
        const email = managerId.replace('hardcoded-', '');
        managerName = getRealtorNameByEmail(email);
      }
      if (!managerName) {
        managerName = '미지정';
      }
      
      if (!acc[managerName]) {
        acc[managerName] = {
          total: 0,
          completed: 0,
          revenue: 0
        };
      }
      
      acc[managerName].total++;
      
      const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id)?.name;
      if (status === '거래완료') {
        acc[managerName].completed++;
        acc[managerName].revenue += property.price || 0;
      }
      
      return acc;
    }, {});

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        completed: data.completed,
        성과율: ((data.completed / data.total) * 100).toFixed(1),
        revenue: data.revenue
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5); // 상위 5명
  }, [properties, lookupData]);

  // 지역별 통계
  const locationStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      if (property.location) {
        const district = property.location.split(' ')[0]; // 첫 단어를 구로 가정
        acc[district] = (acc[district] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(stats)
      .map(([location, count]) => ({
        location,
        count,
        percentage: ((count / properties.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 상위 10개 지역
  }, [properties]);

  // 파이 차트 색상
  const pieColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // 주요 지표
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => {
    const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id)?.name;
    return status === '거래가능';
  }).length;
  const completedDeals = properties.filter(p => {
    const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id)?.name;
    return status === '거래완료';
  }).length;
  
  // 성장률 계산
  const currentMonth = monthlyStats[monthlyStats.length - 1]?.등록 || 0;
  const lastMonth = monthlyStats[monthlyStats.length - 2]?.등록 || 0;
  const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* 월별 트렌드 차트 */}
      <div className="grid-container grid-cols-1 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">월별 매물 등록 추이</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyStats}>
                <defs>
                  <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [value, name === '등록' ? '신규 등록' : name]}
                />
                <Area 
                  type="monotone" 
                  dataKey="등록" 
                  stroke="#2563EB" 
                  fillOpacity={1} 
                  fill="url(#colorRegistered)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="완료" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">매물 유형별 분포</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${value} (${entry.payload.percentage}%)`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 직원별 성과 & 거래 유형별 현황 */}
      <div className="grid-container grid-cols-1 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">직원별 성과 TOP 5</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {staffPerformance.map((staff, index) => (
                <div key={staff.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{staff.name}</p>
                      <p className="text-sm text-gray-600">총 {staff.total}건 / 완료 {staff.completed}건</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{staff.성과율}%</p>
                    <p className="text-xs text-gray-500">성과율</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">거래 유형별 현황</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [`${value}건 (${transactionStats.find(t => t.count === value)?.percentage}%)`, '매물 수']}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 지역별 분포 & 상태별 현황 */}
      <div className="grid-container grid-cols-1 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">지역별 매물 분포</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {locationStats.map((location, index) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-sm font-medium text-gray-700 w-20">{location.location}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${location.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {location.count}건
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold">매물 상태별 현황</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              {statusStats.map((status, index) => (
                <div key={status.status} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{status.status}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status.status === '거래완료' ? 'bg-blue-100 text-blue-700' :
                      status.status === '거래가능' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {status.percentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                  <p className="text-xs text-gray-500 mt-1">전체 {totalProperties}건 중</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PropertyStatsChart;