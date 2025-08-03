import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';

export const useRealtimeProperties = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    // 매물 테이블 실시간 구독
    const channel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 구독
          schema: 'public',
          table: 'properties'
        },
        (payload) => {
          // console.log('실시간 변경 감지:', payload);
          
          // React Query 캐시 무효화
          queryClient.invalidateQueries(['properties']);
          queryClient.invalidateQueries(['dashboard-properties']);
          
          // 토스트 알림 표시
          if (payload.eventType === 'INSERT') {
            showToast('새 매물이 등록되었습니다', 'info');
          } else if (payload.eventType === 'UPDATE') {
            showToast('매물 정보가 수정되었습니다', 'info');
          } else if (payload.eventType === 'DELETE') {
            showToast('매물이 삭제되었습니다', 'info');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ 실시간 구독 활성화됨');
        }
      });

    // 사용자 테이블도 구독 (관리자 페이지용)
    const usersChannel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          queryClient.invalidateQueries(['users']);
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(usersChannel);
    };
  }, [queryClient, showToast]);
};

// 사용 예시:
// App.jsx 또는 MainLayout에서
// import { useRealtimeProperties } from './hooks/useRealtimeProperties';
// 
// function App() {
//   useRealtimeProperties(); // 앱 전체에서 실시간 구독 활성화
//   return ...
// }