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
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
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
      console.log('📊 매물 데이터 조회 결과:', { 
        data: data?.length || 0, 
        error,
        sampleData: data?.slice(0, 5).map(p => ({
          id: p.id,
          name: p.property_name,
          status: p.property_status
        }))
      });
      if (error) throw new Error(error);
      return data || [];
    },
    {
      retry: false,
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

  // 최근 활동 내역 가져오기 (더미 데이터 제외)
  const { data: recentActivities = [], refetch: refetchActivities } = useQuery(
    ['recentActivities'],
    async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('recent_activities')
        .select('*')
        .neq('changed_by', 'system') // system 사용자 제외
        .not('changed_by', 'ilike', '%test%') // test 관련 제외
        .not('changed_by', 'ilike', '%dummy%') // dummy 관련 제외
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
        .lt('changed_at', new Date().toISOString())
        .neq('changed_by', 'system') // system 사용자 제외
        .not('changed_by', 'ilike', '%test%') // test 관련 제외
        .not('changed_by', 'ilike', '%dummy%'); // dummy 관련 제외
      
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
    
    console.log('📊 상태별 매물 수:', counts);
    console.log('🔍 전체 매물 수:', properties.length);
    
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
      
      // 이번 주 변경 이력을 담당자별로 집계 (더미 데이터 제외)
      const { data: changes, error: changesError } = await supabase
        .from('property_status_history')
        .select('changed_by, new_status')
        .gte('changed_at', weekStart.toISOString())
        .neq('changed_by', 'system')
        .not('changed_by', 'ilike', '%test%')
        .not('changed_by', 'ilike', '%dummy%');
      
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
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">대시보드</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                {format(monday, 'M/d', { locale: ko })} - {format(sunday, 'M/d', { locale: ko })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-300 text-xs sm:text-sm rounded hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1 sm:mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{autoRefresh ? '자동 갱신 중' : '새로고침'}</span>
                <span className="sm:hidden">{autoRefresh ? '자동' : '갱신'}</span>
              </button>
              <Link
                to="/properties/new"
                className="inline-flex items-center px-3 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1 sm:mr-1.5" />
                매물 등록
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 현재 매물 현황 (상태별) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">현재 매물 현황</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* 거래가능 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">거래가능</p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-green-600">
                  {currentStatusCounts.available.toLocaleString()}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 hidden sm:block">즉시 거래 가능</p>
              </div>
              <div className="hidden sm:flex p-2 sm:p-3 bg-green-100 rounded-full">
                <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* 계약중 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">계약중</p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-blue-600">
                  {currentStatusCounts.contract.toLocaleString()}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 hidden sm:block">계약 진행중</p>
              </div>
              <div className="hidden sm:flex p-2 sm:p-3 bg-blue-100 rounded-full">
                <FileText className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* 임장가능 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">임장가능</p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-purple-600">
                  {currentStatusCounts.inspection_available.toLocaleString()}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 hidden sm:block">현장 확인 가능</p>
              </div>
              <div className="hidden sm:flex p-2 sm:p-3 bg-purple-100 rounded-full">
                <Eye className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* 보류 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">보류</p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-yellow-600">
                  {currentStatusCounts.hold.toLocaleString()}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 hidden sm:block">일시 중단</p>
              </div>
              <div className="hidden sm:flex p-2 sm:p-3 bg-yellow-100 rounded-full">
                <Pause className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이번 주 활동 현황 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">이번 주 활동 현황</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* 신규 등록 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <PlusCircle className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              <span className="text-xs text-gray-500">신규</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{weeklyStats.newRegistrations}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">신규 등록</p>
          </div>

          {/* 계약 진행 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <ArrowUpRight className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
              <span className="text-xs text-gray-500">계약</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{weeklyStats.contractStarted}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">계약 진행</p>
          </div>

          {/* 거래 완료 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-500" />
              <span className="text-xs text-gray-500">완료</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{weeklyStats.completed}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">거래 완료</p>
          </div>

          {/* 거래 철회 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <XCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
              <span className="text-xs text-gray-500">철회</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{weeklyStats.cancelled}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">거래 철회</p>
          </div>

          {/* 보류 처리 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Pause className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500" />
              <span className="text-xs text-gray-500">보류</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{weeklyStats.onHold}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">보류 처리</p>
          </div>
        </div>
      </div>

      {/* 실시간 활동 피드 & 팀 성과 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* 실시간 활동 피드 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">최근 활동</h3>
                <Bell className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              </div>
              <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const formatted = formatActivity(activity);
                    return (
                      <div key={activity.id || index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 ${formatted.isNew ? 'bg-green-500' : 'bg-blue-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-900">
                            <span className="font-medium">{formatted.user}</span>님이{' '}
                            <span className="font-medium">{formatted.property}</span>을(를){' '}
                            <span className="font-medium">{formatted.change}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{formatted.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    최근 활동이 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 주간 팀 성과 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">주간 팀 활동</h3>
              <div className="space-y-2 sm:space-y-3">
                {weeklyUserStats.length > 0 ? (
                  weeklyUserStats.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-medium text-gray-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            <span className="sm:hidden">신{member.newRegistrations} 변{member.statusChanges} 완{member.completed}</span>
                            <span className="hidden sm:inline">신규 {member.newRegistrations} · 변경 {member.statusChanges} · 완료 {member.completed}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">총 {member.total}건</p>
                        {member.completed > 0 && (
                          <p className="text-xs text-green-600">{Math.round((member.completed / member.total) * 100)}%</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    이번 주 활동 기록이 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 주간 활동 차트 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">주간 활동 추이</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip 
                  contentStyle={{ fontSize: '12px', padding: '8px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="신규" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="계약" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="완료" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;