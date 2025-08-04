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
  Bell,
  MessageCircle,
  Calendar,
  Target,
  Home,
  Phone,
  Eye,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getRealtorNameByEmail } from '../data/realtorNameMap';

const Dashboard = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'VIP 고객 홍길동님 계약 완료', time: '방금 전', read: false },
    { id: 2, type: 'info', message: '신규 매물 1건 크루월드 등록됨', time: '5분 전', read: false },
    { id: 3, type: 'warning', message: '오늘 상담 예정 3건 확인 필요', time: '1시간 전', read: true }
  ]);
  
  // 매물 데이터 가져오기
  const { data: properties = [], isLoading, error: propertiesError } = useQuery(
    ['dashboard-properties', user?.email],
    async () => {
      console.log('🔍 매물 데이터 조회 시작:', { userId: user?.id, userEmail: user?.email });
      const userInfo = {
        userId: user?.id,
        userEmail: user?.email,
        isAdmin: isHardcodedAdmin(user?.email)
      };
      const { data, error } = await propertyService.getProperties({}, userInfo);
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

  // 기본 통계 계산
  console.log('📈 통계 계산:', { propertiesLength: properties.length, properties: properties.slice(0, 3) });
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

  // 실제 데이터 상태에 맞는 통계 계산
  const processStats = {
    total: stats.totalProperties, // 총 매물
    available: properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래가능';
    }).length,
    reserved: properties.filter(p => {
      const status = lookupData.propertyStatuses?.find(s => s.id === p.property_status_id);
      return status?.name === '거래보류';
    }).length,
    completed: stats.completedDeals // 거래완료
  };

  // 성장률 계산
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthCount = properties.filter(p => {
    const created = new Date(p.created_at);
    return created.getMonth() === lastMonth.getMonth() && created.getFullYear() === lastMonth.getFullYear();
  }).length;
  const growthRate = lastMonthCount > 0 ? ((stats.thisMonth - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;

  // 실제 데이터 기반 채널별 문의 (매물 수 기반으로 계산)
  const channelData = [
    { name: '직접문의', count: Math.floor(stats.totalProperties * 0.4), color: '#3B82F6' },
    { name: '온라인', count: Math.floor(stats.totalProperties * 0.3), color: '#10B981' },
    { name: '소개', count: Math.floor(stats.totalProperties * 0.2), color: '#F59E0B' },
    { name: '기타', count: Math.floor(stats.totalProperties * 0.1), color: '#8B5CF6' }
  ];

  // 실제 매물 데이터 기반 가격대별 분포
  const priceRangeData = useMemo(() => {
    const ranges = { '10억 이하': 0, '10-20억': 0, '20-30억': 0, '30억 이상': 0 };
    
    properties.forEach(property => {
      const price = property.price || 0;
      const eok = price / 100000000;
      
      if (eok <= 10) ranges['10억 이하']++;
      else if (eok <= 20) ranges['10-20억']++;
      else if (eok <= 30) ranges['20-30억']++;
      else ranges['30억 이상']++;
    });
    
    return [
      { range: '10억 이하', count: ranges['10억 이하'], color: '#3B82F6' },
      { range: '10-20억', count: ranges['10-20억'], color: '#10B981' },
      { range: '20-30억', count: ranges['20-30억'], color: '#F59E0B' },
      { range: '30억 이상', count: ranges['30억 이상'], color: '#8B5CF6' }
    ];
  }, [properties]);

  // 실제 사용자 데이터에서 팀 성과 계산
  const teamPerformance = useMemo(() => {
    // 실제 사용자별 매물 수 계산
    const userStats = {};
    
    properties.forEach(property => {
      const managerId = property.manager_id || property.users?.email || 'unknown';
      if (!userStats[managerId]) {
        userStats[managerId] = { total: 0, completed: 0 };
      }
      userStats[managerId].total++;
      
      const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
      if (status?.name === '거래완료') {
        userStats[managerId].completed++;
      }
    });

    return Object.entries(userStats).map(([managerId, stats]) => {
      const rate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0';
      const name = managerId.includes('@') ? managerId.split('@')[0] : managerId;
      
      return {
        name: name,
        total: stats.total,
        consultation: Math.floor(stats.total * 0.8),
        contract: stats.completed,
        rate: `${rate}%`,
        status: parseFloat(rate) > 15 ? 'high' : parseFloat(rate) > 5 ? 'medium' : 'low'
      };
    }).slice(0, 5); // 상위 5명만
  }, [properties, lookupData]);

  // 알림 읽음 처리
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // 새 알림 추가 (매물 등록 시뮬레이션)
  const addNotification = (type, message) => {
    const newNotif = {
      id: Date.now(),
      type,
      message,
      time: '방금 전',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
  };

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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900">
      {/* 상단 헤더 - 모바일 최적화 */}
      <div className="mb-4 sm:mb-6 flex gap-3 sm:gap-5 flex-col xl:flex-row w-full px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-6 text-slate-900 dark:text-white">
                더부동산 관리
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium leading-4 text-slate-500 dark:text-slate-400">
                {user?.name || user?.email?.split('@')[0]}님 안녕하세요
              </p>
            </div>
          </div>
          
          <Link
            to="/properties/new"
            className="flex h-9 sm:h-10 items-center justify-center rounded-lg bg-slate-900 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">매물 </span>등록
          </Link>
        </div>
      </div>

      {/* KPI 카드들 - 모바일 최적화 */}
      <div className="grid grid-cols-2 gap-3 px-3 sm:gap-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 총 매물 카드 */}
        <div className="border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/20">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                총 매물
              </h5>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {processStats.total}건
              </p>
            </div>
          </div>
        </div>

        {/* 거래가능 카드 */}
        <div className="border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/20">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                거래가능
              </h5>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {processStats.available}건
              </p>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {processStats.total > 0 ? Math.round((processStats.available / processStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 거래보류 카드 */}
        <div className="border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/20">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                거래보류
              </h5>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {processStats.reserved}건
              </p>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {processStats.total > 0 ? Math.round((processStats.reserved / processStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 거래완료 카드 */}
        <div className="border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/20">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                거래완료
              </h5>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {processStats.completed}건
              </p>
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                {processStats.total > 0 ? Math.round((processStats.completed / processStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 차트 - 모바일 최적화 */}
      <div className="mb-4 sm:mb-6 flex gap-4 sm:gap-5 flex-col xl:flex-row w-full px-3 sm:px-6">
        {/* 채널별 문의량 차트 */}
        <div className="border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm w-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/20">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                채널별 매물 문의량
              </h5>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {channelData.reduce((sum, item) => sum + item.count, 0)}건
              </p>
            </div>
          </div>

          {/* 차트 영역 */}
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 가격 분포와 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 px-3 sm:px-6 mb-4 sm:mb-5">
        {/* 가격대별 매물 분포 */}
        <div className="border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/20">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                가격대별 매물 분포
              </h5>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                가격 분포 분석
              </p>
            </div>
          </div>
          
          <div className="h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceRangeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  dataKey="count"
                  label={({ range, count }) => `${range}: ${count}건`}
                  fontSize={10}
                >
                  {priceRangeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 실시간 알림 */}
        <div className="border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/20">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  알림
                </h5>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  실시간 알림
                </p>
              </div>
            </div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  notif.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                  notif.type === 'warning' ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' :
                  'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                } ${notif.read ? 'opacity-60' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    notif.type === 'success' ? 'bg-green-500/10 dark:bg-green-500/20' :
                    notif.type === 'warning' ? 'bg-orange-500/10 dark:bg-orange-500/20' :
                    'bg-blue-500/10 dark:bg-blue-500/20'
                  }`}>
                    {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                    {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                    {notif.type === 'info' && <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-950 dark:text-white">{notif.message}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 팀 성과 현황 - Horizon UI 스타일 */}
      <div className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 rounded-xl border shadow-sm mb-5 px-6">
        <div className="flex items-center gap-3 py-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 text-4xl dark:border-zinc-800 dark:text-white bg-blue-500/10 dark:bg-blue-500/20">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h5 className="text-sm font-medium leading-5 text-zinc-600 dark:text-zinc-400">
              팀 성과 현황
            </h5>
            <p className="mt-1 text-lg font-bold leading-6 text-zinc-950 dark:text-white">
              팀 성과 현황
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">직원명</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">총담수</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">상담수</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">계약수</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">성약률</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {teamPerformance.map((member, index) => (
                <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-zinc-950 dark:text-white flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    {member.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">{member.total}건</td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">{member.consultation}건</td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">{member.contract}건</td>
                  <td className="px-4 py-4 text-sm font-medium text-zinc-950 dark:text-white">{member.rate}</td>
                  <td className="px-4 py-4">
                    <div className={`w-3 h-3 rounded-full ${
                      member.status === 'high' ? 'bg-green-500' :
                      member.status === 'medium' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 빠른 액션 - Horizon UI 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 px-6">
        <Link 
          to="/properties" 
          className="group border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-950 dark:text-white">매물 관리</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">전체 매물 조회 및 관리</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </Link>
        
        <Link 
          to="/performance" 
          className="group border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 dark:bg-green-500/20">
            <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-950 dark:text-white">직원 성과</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">개인별 실적 분석</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
        </Link>
        
        <button 
          onClick={() => addNotification('info', '신규 매물 등록 완료')}
          className="group border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
            <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-950 dark:text-white">알림 테스트</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">알림 기능 테스트</p>
          </div>
        </button>

        <Link 
          to="/users" 
          className="group border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/20">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-950 dark:text-white">직원 관리</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">사용자 권한 설정</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;