// 더부동산 실제 직원 목록
import { realtorList } from './realtorList';

// 실제 직원 데이터를 더미 사용자 형식으로 변환
export const dummyUsers = realtorList.map((realtor, index) => ({
  id: `hardcoded-${realtor.email}`,
  email: realtor.email,
  name: realtor.name,
  phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  role: realtor.role,
  status: 'active',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-07-31T00:00:00.000Z',
  last_login: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
}));

// 사용자별 통계 데이터 (실제 데이터로 대체 가능)
export const getUserStats = (userId) => {
  // 기본 통계값
  const defaultStats = {
    totalProperties: Math.floor(Math.random() * 10),
    activeProperties: Math.floor(Math.random() * 5),
    completedDeals: Math.floor(Math.random() * 20),
    monthlyDeals: Math.floor(Math.random() * 5)
  };

  // 특정 사용자별 커스텀 통계 (필요시 추가)
  const customStats = {
    'hardcoded-jenny@the-realty.co.kr': {
      totalProperties: 8,
      activeProperties: 6,
      completedDeals: 24,
      monthlyDeals: 4
    },
    'hardcoded-lucas@the-realty.co.kr': {
      totalProperties: 7,
      activeProperties: 5,
      completedDeals: 18,
      monthlyDeals: 3
    },
    'hardcoded-gyum@the-realty.co.kr': {
      totalProperties: 10,
      activeProperties: 7,
      completedDeals: 32,
      monthlyDeals: 5
    }
  };

  return customStats[userId] || defaultStats;
};

// 실제 직원 목록을 export (다른 컴포넌트에서 사용 가능)
export { realtorList };