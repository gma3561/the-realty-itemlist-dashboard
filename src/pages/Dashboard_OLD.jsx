import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3, 
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle,
  Upload,
  Eye,
  Pause,
  Calendar,
  FileText,
  XCircle,
  RefreshCw,
  Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';
import { supabase } from '../services/supabase';
import { getRealtorNameByEmail } from '../data/realtorNameMap';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  // 전체 매물 수 조회 (카운트만)
  const { data: totalCount = 0, refetch: refetchTotal } = useQuery(
    ['dashboard-total-count', user?.email],
    async () => {
      const userInfo = {
        userId: user?.id,
        userEmail: user?.email,
        isAdmin: isHardcodedAdmin(user?.email)
      };
      const { totalCount, error } = await propertyService.getProperties({ countOnly: true }, userInfo);
      if (error) throw new Error(error);
      return totalCount;
    },
    {
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  // 매물 데이터 가져오기 (모든 데이터)
  const { data: properties = [], isLoading, error: propertiesError, refetch: refetchProperties } = useQuery(
    ['dashboard-properties', user?.email],
    async () => {
      console.log('🔍 매물 데이터 조회 시작:', { userId: user?.id, userEmail: user?.email });
      const userInfo = {
        userId: user?.id,
        userEmail: user?.email,
        isAdmin: isHardcodedAdmin(user?.email)
      };
      // 모든 매물 가져오기 (pagination 없이 호출하여 제한 우회)
      const { data, error } = await propertyService.getProperties({}, userInfo, null);
      console.log('📊 매물 데이터 조회 결과:', { data: data?.length || 0, error });
      if (error) throw new Error(error);
      return data || [];
    },
    {
      retry: false, // 실패 시 재시도 안함
      refetchOnWindowFocus: false
    }
  );

  // 룩업 데이터 가져오기
  const { data: lookupData = {}, refetch: refetchLookup } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // 최근 활동 내역 가져오기
  const { data: recentActivities = [], refetch: refetchActivities } = useQuery(
    ['recentActivities'],
    async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('recent_activities')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('최근 활동 조회 실패:', error);
        return [];
      }
      
      return data || [];
    },
    {
      refetchInterval: 30000, // 30초마다 자동 갱신
      enabled: !!supabase
    }
  );
  
  // 이번 주 상태 변경 통계
  const { data: weeklyChanges = {} } = useQuery(
    ['weeklyChanges'],
    async () => {
      if (!supabase) return {};
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 월요일 시작
      
      const { data, error } = await supabase
        .from('property_status_history')
        .select('new_status')
        .gte('changed_at', weekStart.toISOString())
        .lt('changed_at', new Date().toISOString());
      
      if (error) {
        console.error('주간 변경 통계 조회 실패:', error);
        return {};
      }
      
      // 상태별로 집계
      const changes = {};
      data?.forEach(item => {
        changes[item.new_status] = (changes[item.new_status] || 0) + 1;
      });
      
      return changes;
    },
    {
      refetchInterval: 60000, // 1분마다 갱신
      enabled: !!supabase
    }
  );
  
  // 모든 데이터 새로고침 함수
  const refetchAll = () => {
    refetchTotal();
    refetchProperties();
    refetchLookup();
    refetchActivities();
  };
  
  // 주간 데이터 필터링 (월요일~일요일)
  const getWeekRange = () => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    
    return { monday, sunday };
  };
  
  const { monday, sunday } = getWeekRange();
  const weeklyProperties = properties.filter(p => {
    const created = new Date(p.created_at);
    return created >= monday && created <= sunday;
  });

  // 현재 상태별 매물 수 계산
  const currentStatusCounts = useMemo(() => {
    const counts = {
      available: 0,          // 거래가능
      contract: 0,           // 계약중
      inspection_available: 0, // 임장가능
      hold: 0,               // 보류
      completed: 0,          // 거래완료
      cancelled: 0           // 거래철회
    };
    
    properties.forEach(p => {
      if (counts.hasOwnProperty(p.property_status)) {
        counts[p.property_status]++;
      }
    });
    
    return counts;
  }, [properties]);
  
  // 이번 주 신규 등록 매물
  const weeklyNewProperties = properties.filter(p => {
    const created = new Date(p.created_at);
    return created >= monday && created <= sunday;
  }).length;
  
  // 상태 변경 이력을 기반으로 한 주간 통계
  const weeklyStats = {
    newRegistrations: weeklyNewProperties,
    contractStarted: weeklyChanges['contract'] || 0,
    completed: weeklyChanges['completed'] || 0,
    cancelled: weeklyChanges['cancelled'] || 0,
    onHold: weeklyChanges['hold'] || 0
  };

  // 상태 라벨 가져오기 함수
  const getStatusLabel = (statusId) => {
    const status = lookupData.propertyStatuses?.find(s => s.id === statusId);
    return status?.name || statusId;
  };
  
  // 활동 피드 포맷팅
  const formatActivity = (activity) => {
    const time = format(new Date(activity.changed_at), 'HH:mm', { locale: ko });
    const oldStatus = getStatusLabel(activity.old_status);
    const newStatus = getStatusLabel(activity.new_status);
    
    return {
      time,
      user: activity.changed_by_name || activity.changed_by,
      property: activity.property_name,
      change: oldStatus ? `${oldStatus} → ${newStatus}` : `${newStatus}로 등록`,
      isNew: !activity.old_status
    };
  };

  // 사용자 데이터 가져오기
  const { data: users = [], refetch: refetchUsers } = useQuery(
    'users',
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // 주간 담당자별 활동 통계
  const { data: weeklyUserStats = [] } = useQuery(
    ['weeklyUserStats'],
    async () => {
      if (!supabase) return [];
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // 이번 주 변경 이력을 담당자별로 집계
      const { data: changes, error: changesError } = await supabase
        .from('property_status_history')
        .select('changed_by, new_status')
        .gte('changed_at', weekStart.toISOString());
      
      // 이번 주 신규 등록을 담당자별로 집계
      const { data: newProps, error: propsError } = await supabase
        .from('properties')
        .select('manager_id')
        .gte('created_at', weekStart.toISOString());
      
      if (changesError || propsError) {
        console.error('주간 사용자 통계 조회 실패');
        return [];
      }
      
      // 담당자별로 집계
      const userStats = {};
      
      // 신규 등록 카운트
      newProps?.forEach(prop => {
        const userId = prop.manager_id;
        if (!userStats[userId]) {
          userStats[userId] = { newRegistrations: 0, statusChanges: 0, completed: 0 };
        }
        userStats[userId].newRegistrations++;
      });
      
      // 상태 변경 카운트
      changes?.forEach(change => {
        const userId = change.changed_by;
        if (!userStats[userId]) {
          userStats[userId] = { newRegistrations: 0, statusChanges: 0, completed: 0 };
        }
        userStats[userId].statusChanges++;
        if (change.new_status === 'completed') {
          userStats[userId].completed++;
        }
      });
      
      // 사용자 정보와 매칭
      const results = Object.entries(userStats).map(([userId, stats]) => {
        const user = users.find(u => u.id === userId || u.email === userId);
        const name = user?.name || (userId.includes('@') ? getRealtorNameByEmail(userId) : userId);
        
        return {
          id: userId,
          name,
          ...stats,
          total: stats.newRegistrations + stats.statusChanges
        };
      });
      
      return results.sort((a, b) => b.total - a.total).slice(0, 5);
    },
    {
      enabled: !!supabase && users.length > 0,
      refetchInterval: 60000
    }
  );

  // 주간 차트 데이터 준비
  const weeklyChartData = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        day: format(date, 'E', { locale: ko }),
        date: format(date, 'MM-dd'),
        신규: 0,
        계약: 0,
        완료: 0
      });
    }
    
    // 여기에 실제 데이터를 채우는 로직 추가 가능
    return days;
  }, [monday]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">대시보드를 불러오는 중...</p>
      </div>
    );
  }

  // 데이터 조회 에러 표시
  if (propertiesError) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 조회 실패</h3>
          <p className="text-gray-600 mb-4">매물 데이터를 불러올 수 없습니다.</p>
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
            에러: {propertiesError.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            현재 사용자: {user?.email} ({user?.testUserType || 'unknown'})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 - 더 간결하게 */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">대시보드</h1>
              <p className="text-sm text-gray-500">
                {monday.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} - {sunday.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </p>
            </div>
            <Link
              to="/properties/new"
              className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              매물 등록
            </Link>
          </div>
        </div>
      </div>


      {/* 매물 상태별 KPI 카드들 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 거래가능 */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">거래가능</p>
                <p className="mt-1 text-2xl font-medium text-gray-900">
                  {properties.filter(p => p.property_status === 'available').length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-400">즉시 거래 가능</p>
              </div>
              <Building2 className="h-8 w-8 text-green-200" />
            </div>
          </div>

          {/* 계약중 */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">계약중</p>
                <p className="mt-1 text-2xl font-medium text-gray-900">
                  {properties.filter(p => p.property_status === 'contract').length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-400">계약 진행중</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          {/* 임장가능 */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">임장가능</p>
                <p className="mt-1 text-2xl font-medium text-gray-900">
                  {properties.filter(p => p.property_status === 'inspection_available').length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-400">현장 확인 가능</p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          {/* 보류 */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">보류</p>
                <p className="mt-1 text-2xl font-medium text-gray-900">
                  {properties.filter(p => p.property_status === 'hold').length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-400">일시 중단</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 - 깔끔한 스타일 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 매물 상태별 차트 */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">
              매물 상태
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#f3f4f6' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#f3f4f6' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#4b5563"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 매물 유형별 차트 */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">
              매물 유형
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                    labelLine={false}
                  >
                    {typeChartData.map((entry, index) => {
                      const colors = ['#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 팀 성과 현황 - 미니멀 테이블 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">
              주간 팀 성과
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      완료
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      성과
                    </th>
                    <th className="pb-3">
                    </th>
                  </tr>
                </thead>
                <tbody>
                {teamPerformance.map((member, index) => (
                  <tr key={member.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {member.total}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {member.contract}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-20 mr-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="bg-gray-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: member.rate }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600">{member.rate}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/performance/${member.id}`}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        보기 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 - 심플한 버튼 스타일 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-4">빠른 액션</h3>
        <div className="flex flex-wrap gap-3">
          <Link 
            to="/properties" 
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">매물 관리</span>
          </Link>
          
          <Link 
            to="/performance" 
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">직원 성과</span>
          </Link>
          
          <Link 
            to="/properties/upload" 
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">엑셀 업로드</span>
          </Link>

          <Link 
            to="/users" 
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <Users className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">직원 관리</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;