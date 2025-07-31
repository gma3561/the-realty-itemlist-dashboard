import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Home, DollarSign, Calendar } from 'lucide-react';

const PropertyStatsChart = ({ properties = [] }) => {
  // 매물 유형별 통계 (JOIN된 데이터 사용)
  const typeStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const type = property.property_types?.name || '미지정';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / properties.length) * 100).toFixed(1)
    }));
  }, [properties]);

  // 거래 유형별 통계 (JOIN된 데이터 사용)
  const transactionStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const type = property.transaction_types?.name || '미지정';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count
    }));
  }, [properties]);

  // 매물 상태별 통계 (JOIN된 데이터 사용)
  const statusStats = useMemo(() => {
    const stats = properties.reduce((acc, property) => {
      const status = property.property_statuses?.name || '미지정';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([status, count]) => ({
      status,
      count
    }));
  }, [properties]);

  // 월별 등록 통계
  const monthlyStats = useMemo(() => {
    const monthStats = properties.reduce((acc, property) => {
      if (property.created_at) {
        const date = new Date(property.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(monthStats)
      .sort()
      .slice(-6) // 최근 6개월
      .map(([month, count]) => ({
        month: month.substring(5), // MM 형태로 표시
        count
      }));
  }, [properties]);

  // 파이 차트 색상
  const pieColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // 주요 통계 계산 (DB 구조에 맞게 수정)
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => 
    p.property_statuses?.name === '매물확보' || p.property_statuses?.name === '광고진행'
  ).length;
  const completedDeals = properties.filter(p => p.property_statuses?.name === '거래완료').length;
  const avgPrice = properties.length > 0 ? 
    properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0;

  // 추가 통계
  const recentProperties = properties.filter(p => {
    const created = new Date(p.created_at);
    const now = new Date();
    const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // 최근 7일
  }).length;

  // 거래유형별 평균 가격
  const avgPriceByTransaction = useMemo(() => {
    const transactionGroups = properties.reduce((acc, property) => {
      const type = property.transaction_types?.name || '미지정';
      if (!acc[type]) acc[type] = [];
      if (property.price && property.price > 0) {
        acc[type].push(property.price);
      }
      return acc;
    }, {});

    return Object.entries(transactionGroups).map(([type, prices]) => ({
      type,
      avgPrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      count: prices.length
    })).filter(item => item.count > 0);
  }, [properties]);

  return (
    <div className="space-y-6">
      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 매물</p>
              <p className="text-3xl font-bold text-gray-900">{totalProperties}</p>
              <p className="text-xs text-gray-500 mt-1">등록된 매물 수</p>
            </div>
            <Home className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">거래 가능</p>
              <p className="text-3xl font-bold text-green-600">{availableProperties}</p>
              <p className="text-xs text-gray-500 mt-1">활성 매물</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">거래 완료</p>
              <p className="text-3xl font-bold text-blue-600">{completedDeals}</p>
              <p className="text-xs text-gray-500 mt-1">성사된 거래</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 가격</p>
              <p className="text-3xl font-bold text-purple-600">
                {avgPrice > 0 ? `${(avgPrice / 100000000).toFixed(1)}억` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">매물별 평균</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">최근 7일</p>
              <p className="text-3xl font-bold text-orange-600">{recentProperties}</p>
              <p className="text-xs text-gray-500 mt-1">신규 등록</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매물 유형별 분포 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">매물 유형별 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {typeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 거래 유형별 현황 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">거래 유형별 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 매물 상태별 현황 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">매물 상태별 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 등록 추이 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">월별 등록 추이 (최근 6개월)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 거래유형별 평균 가격 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">거래유형별 평균 가격</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgPriceByTransaction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis 
                tickFormatter={(value) => 
                  value >= 100000000 ? `${(value / 100000000).toFixed(1)}억` :
                  value >= 10000 ? `${(value / 10000).toFixed(0)}만` : value
                }
              />
              <Tooltip 
                formatter={([value]) => [
                  value >= 100000000 ? `${(value / 100000000).toFixed(1)}억원` :
                  value >= 10000 ? `${(value / 10000).toFixed(0)}만원` : `${value}원`,
                  '평균 가격'
                ]}
              />
              <Bar dataKey="avgPrice" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PropertyStatsChart;