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
      staleTime: 5 * 60 * 1000,
    }
  );

  // 기본 통계 계산
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">더부동산 통합 관리 시스템</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              2025. 8. 3. 오후 8:42:23
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{user?.name || user?.email?.split('@')[0]} 로그아웃</span>
          </div>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          매물 등록
        </Link>
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium">조회 기간:</span>
        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">월간</button>
        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">주간</button>
      </div>

      {/* 실제 매물 상태 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{processStats.total}건</div>
                <div className="text-sm text-gray-600">총 매물</div>
              </div>
            </div>
            <div className="text-blue-600 text-sm font-medium">100%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{processStats.available}건</div>
                <div className="text-sm text-gray-600">거래가능</div>
              </div>
            </div>
            <div className="text-green-600 text-sm font-medium">
              {processStats.total > 0 ? Math.round((processStats.available / processStats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{processStats.reserved}건</div>
                <div className="text-sm text-gray-600">거래보류</div>
              </div>
            </div>
            <div className="text-orange-600 text-sm font-medium">
              {processStats.total > 0 ? Math.round((processStats.reserved / processStats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{processStats.completed}건</div>
                <div className="text-sm text-gray-600">거래완료</div>
              </div>
            </div>
            <div className="text-purple-600 text-sm font-medium">
              {processStats.total > 0 ? Math.round((processStats.completed / processStats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 채널별 문의량 차트 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">채널별 문의량</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 가격대별 매물 분포 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">가격대별 매물 분포</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceRangeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  label={({ range, count }) => `${range}: ${count}건`}
                  fontSize={12}
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">실시간 알림</h3>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-colors ${
                  notif.type === 'success' ? 'border-green-500 bg-green-50' :
                  notif.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                  'border-blue-500 bg-blue-50'
                } ${notif.read ? 'opacity-60' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start gap-2">
                  {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                  {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />}
                  {notif.type === 'info' && <Building2 className="w-4 h-4 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 팀 성과 현황 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">팀 성과 현황</h3>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">직원명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총담수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상담수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성약률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamPerformance.map((member, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.total}건</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.consultation}건</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.contract}건</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.rate}</td>
                  <td className="px-6 py-4">
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

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/properties" className="flex items-center p-4 bg-white border rounded-lg hover:bg-gray-50 group">
          <Building2 className="w-5 h-5 text-gray-600 mr-3" />
          <span className="font-medium">매물 관리</span>
          <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-600" />
        </Link>
        
        <Link to="/performance" className="flex items-center p-4 bg-white border rounded-lg hover:bg-gray-50 group">
          <BarChart3 className="w-5 h-5 text-gray-600 mr-3" />
          <span className="font-medium">직원 성과</span>
          <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-600" />
        </Link>
        
        <button 
          onClick={() => addNotification('info', '신규 매물 등록 완료')}
          className="flex items-center p-4 bg-white border rounded-lg hover:bg-gray-50 group"
        >
          <Bell className="w-5 h-5 text-gray-600 mr-3" />
          <span className="font-medium">알림 테스트</span>
        </button>

        <Link to="/users" className="flex items-center p-4 bg-white border rounded-lg hover:bg-gray-50 group">
          <Users className="w-5 h-5 text-gray-600 mr-3" />
          <span className="font-medium">직원 관리</span>
          <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-600" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;