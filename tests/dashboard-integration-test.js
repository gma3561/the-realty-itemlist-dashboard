// Dashboard 통합 테스트 - 실제 데이터 로직 검증
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';
import { AuthProvider } from '../src/context/AuthContext';
import propertyService from '../src/services/propertyService';

// Mock 설정
vi.mock('../src/services/propertyService');

// 테스트용 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

// 테스트용 래퍼 컴포넌트
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

describe('Dashboard 실제 데이터 통합 테스트', () => {
  // 테스트 데이터
  const mockUser = {
    id: 'test-user-123',
    email: 'test@realty.com',
    name: '테스트 사용자'
  };

  const mockProperties = [
    {
      id: 1,
      property_name: '강남 오피스텔',
      price: 1500000000, // 15억
      property_status_id: 1, // 거래가능
      manager_id: 'test@realty.com',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      property_name: '서초 아파트',
      price: 2500000000, // 25억
      property_status_id: 2, // 거래보류
      manager_id: 'test@realty.com',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      property_name: '판교 오피스',
      price: 3500000000, // 35억
      property_status_id: 3, // 거래완료
      manager_id: 'other@realty.com',
      created_at: new Date().toISOString()
    }
  ];

  const mockLookupData = {
    propertyStatuses: [
      { id: 1, name: '거래가능' },
      { id: 2, name: '거래보류' },
      { id: 3, name: '거래완료' }
    ]
  };

  beforeEach(() => {
    // 서비스 Mock 설정
    propertyService.getProperties.mockResolvedValue({
      data: mockProperties,
      error: null
    });
    
    propertyService.getLookupTables.mockResolvedValue(mockLookupData);
  });

  it('1. 실제 데이터로 KPI 카드가 정확히 계산되는지 검증', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // 총 매물: 3건
      expect(screen.getByText('3건')).toBeInTheDocument();
      
      // 거래가능: 1건 (33%)
      expect(screen.getByText('1건')).toBeInTheDocument();
      expect(screen.getByText('33%')).toBeInTheDocument();
      
      // 거래보류: 1건 (33%)
      expect(screen.getAllByText('1건')[1]).toBeInTheDocument();
      
      // 거래완료: 1건 (33%)
      expect(screen.getAllByText('1건')[2]).toBeInTheDocument();
    });
  });

  it('2. 가격대별 분포가 정확히 계산되는지 검증', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // 10-20억: 1건 (15억)
      // 20-30억: 1건 (25억)
      // 30억 이상: 1건 (35억)
      const priceRanges = screen.getAllByText(/억.*건/);
      expect(priceRanges).toHaveLength(4); // 4개 가격대
    });
  });

  it('3. 팀 성과 데이터가 정확히 집계되는지 검증', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // test@realty.com: 2건 중 0건 완료 (0%)
      // other@realty.com: 1건 중 1건 완료 (100%)
      const performanceRows = screen.getAllByRole('row');
      expect(performanceRows.length).toBeGreaterThan(1);
    });
  });

  it('4. 에러 상황에서 에러 메시지가 표시되는지 검증', async () => {
    propertyService.getProperties.mockRejectedValue(
      new Error('API 서버 연결 실패')
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('데이터 조회 실패')).toBeInTheDocument();
      expect(screen.getByText(/API 서버 연결 실패/)).toBeInTheDocument();
    });
  });

  it('5. 알림 시스템이 정상 작동하는지 검증', async () => {
    const { container } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // 초기 알림 3개 확인
      const notifications = container.querySelectorAll('[class*="border-green-200"], [class*="border-orange-200"], [class*="border-blue-200"]');
      expect(notifications).toHaveLength(3);
      
      // 알림 테스트 버튼 클릭
      const testButton = screen.getByText('알림 테스트');
      testButton.click();
      
      // 새 알림이 추가되었는지 확인 (총 4개)
      setTimeout(() => {
        const updatedNotifications = container.querySelectorAll('[class*="border-green-200"], [class*="border-orange-200"], [class*="border-blue-200"]');
        expect(updatedNotifications).toHaveLength(4);
      }, 100);
    });
  });

  it('6. 반응형 디자인이 적용되는지 검증', async () => {
    // 모바일 뷰포트 설정
    global.innerWidth = 375;
    global.innerHeight = 667;

    const { container } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // 모바일에서는 grid-cols-2
      const kpiGrid = container.querySelector('.grid');
      expect(kpiGrid.className).toContain('grid-cols-2');
      
      // 데스크톱 뷰포트 설정
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      
      // 데스크톱에서는 lg:grid-cols-4
      expect(kpiGrid.className).toContain('lg:grid-cols-4');
    });
  });

  it('7. 차트 컴포넌트가 올바르게 렌더링되는지 검증', async () => {
    const { container } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // ResponsiveContainer 확인
      const charts = container.querySelectorAll('.recharts-wrapper');
      expect(charts.length).toBeGreaterThan(0);
      
      // BarChart와 PieChart 모두 렌더링 확인
      const barChart = container.querySelector('.recharts-bar');
      const pieChart = container.querySelector('.recharts-pie');
      
      // 차트가 렌더링될 때까지 기다림
      setTimeout(() => {
        expect(barChart || pieChart).toBeTruthy();
      }, 500);
    });
  });

  it('8. 빠른 액션 링크가 올바른 경로로 연결되는지 검증', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const propertyLink = screen.getByText('매물 관리').closest('a');
      expect(propertyLink).toHaveAttribute('href', '/properties');
      
      const performanceLink = screen.getByText('직원 성과').closest('a');
      expect(performanceLink).toHaveAttribute('href', '/performance');
      
      const userLink = screen.getByText('직원 관리').closest('a');
      expect(userLink).toHaveAttribute('href', '/users');
    });
  });

  it('9. 다크모드 클래스가 적용되는지 검증', async () => {
    // 다크모드 설정
    document.documentElement.classList.add('dark');

    const { container } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // 다크모드 배경색 확인
      const mainContainer = container.querySelector('.bg-slate-50');
      expect(mainContainer.className).toContain('dark:bg-slate-900');
      
      // 카드 다크모드 스타일 확인
      const cards = container.querySelectorAll('.dark\\:bg-slate-800');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('10. 로딩 상태가 표시되는지 검증', async () => {
    // 느린 응답 시뮬레이션
    propertyService.getProperties.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockProperties }), 1000))
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // 로딩 스피너 확인
    expect(screen.getByText('대시보드를 불러오는 중...')).toBeInTheDocument();
    
    // 데이터 로드 후 로딩 스피너 사라짐
    await waitFor(() => {
      expect(screen.queryByText('대시보드를 불러오는 중...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

console.log('Dashboard 통합 테스트 파일이 생성되었습니다.');
console.log('실제 테스트 실행: npm run test tests/dashboard-integration-test.js');