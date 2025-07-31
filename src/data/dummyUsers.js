// 하드코딩된 더미 사용자 데이터
export const dummyUsers = [
  {
    id: 'hardcoded-jenny@the-realty.co.kr',
    email: 'jenny@the-realty.co.kr',
    name: 'Jenny Kim',
    phone: '010-1234-5678',
    role: 'admin',
    status: 'active',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T09:00:00.000Z'
  },
  {
    id: 'hardcoded-lucas@the-realty.co.kr',
    email: 'lucas@the-realty.co.kr',
    name: 'Lucas Lee',
    phone: '010-2345-6789',
    role: 'admin',
    status: 'active',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T08:30:00.000Z'
  },
  {
    id: 'hardcoded-hmlee@the-realty.co.kr',
    email: 'hmlee@the-realty.co.kr',
    name: 'HM Lee',
    phone: '010-3456-7890',
    role: 'admin',
    status: 'active',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T07:45:00.000Z'
  },
  {
    id: 'user-001',
    email: 'jma@the-realty.co.kr',
    name: '장민아',
    phone: '010-4567-8901',
    role: 'user',
    status: 'active',
    created_at: '2025-02-15T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T10:00:00.000Z'
  },
  {
    id: 'user-002',
    email: 'jed@the-realty.co.kr',
    name: '정이든',
    phone: '010-5678-9012',
    role: 'user',
    status: 'active',
    created_at: '2025-02-20T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-30T16:30:00.000Z'
  },
  {
    id: 'user-003',
    email: 'jsh@the-realty.co.kr',
    name: '장승환',
    phone: '010-6789-0123',
    role: 'user',
    status: 'active',
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T11:15:00.000Z'
  },
  {
    id: 'user-004',
    email: 'kym@the-realty.co.kr',
    name: '김영민',
    phone: '010-7890-1234',
    role: 'user',
    status: 'inactive',
    created_at: '2025-01-15T00:00:00.000Z',
    updated_at: '2025-06-30T00:00:00.000Z',
    last_login: '2025-06-30T18:00:00.000Z'
  },
  {
    id: 'user-005',
    email: 'pjh@the-realty.co.kr',
    name: '박지혜',
    phone: '010-8901-2345',
    role: 'user',
    status: 'active',
    created_at: '2025-04-01T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z',
    last_login: '2025-07-31T09:30:00.000Z'
  }
];

// 사용자 통계 데이터
export const getUserStats = (userId) => {
  const stats = {
    'hardcoded-jenny@the-realty.co.kr': {
      totalProperties: 4,
      activeProperties: 4,
      completedDeals: 12,
      monthlyDeals: 2
    },
    'hardcoded-lucas@the-realty.co.kr': {
      totalProperties: 3,
      activeProperties: 3,
      completedDeals: 8,
      monthlyDeals: 1
    },
    'hardcoded-hmlee@the-realty.co.kr': {
      totalProperties: 3,
      activeProperties: 3,
      completedDeals: 15,
      monthlyDeals: 3
    },
    'user-001': {
      totalProperties: 2,
      activeProperties: 2,
      completedDeals: 5,
      monthlyDeals: 1
    },
    'user-002': {
      totalProperties: 1,
      activeProperties: 1,
      completedDeals: 3,
      monthlyDeals: 0
    },
    'user-003': {
      totalProperties: 0,
      activeProperties: 0,
      completedDeals: 7,
      monthlyDeals: 2
    },
    'user-004': {
      totalProperties: 0,
      activeProperties: 0,
      completedDeals: 2,
      monthlyDeals: 0
    },
    'user-005': {
      totalProperties: 1,
      activeProperties: 1,
      completedDeals: 4,
      monthlyDeals: 1
    }
  };

  return stats[userId] || {
    totalProperties: 0,
    activeProperties: 0,
    completedDeals: 0,
    monthlyDeals: 0
  };
};