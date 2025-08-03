/**
 * 부동산 데이터 수집 관리 훅
 */

import { useState, useEffect, useRef } from 'react';
import RealEstateDataCollector from '../services/realEstateDataCollector';

export const useRealEstateCollector = () => {
  const [collectorStatus, setCollectorStatus] = useState({
    isRunning: false,
    lastCollectionTime: null,
    nextCollectionTime: null,
    targetAreas: 0,
    apiKeyConfigured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collectionLogs, setCollectionLogs] = useState([]);
  
  const collectorRef = useRef(null);

  // 컴포넌트 마운트 시 수집기 초기화
  useEffect(() => {
    if (!collectorRef.current) {
      collectorRef.current = new RealEstateDataCollector();
      updateStatus();
    }

    // 컴포넌트 언마운트 시 자동 수집 중지
    return () => {
      if (collectorRef.current?.isRunning) {
        collectorRef.current.stopAutoCollection();
      }
    };
  }, []);

  // 상태 업데이트
  const updateStatus = () => {
    if (collectorRef.current) {
      setCollectorStatus(collectorRef.current.getStatus());
    }
  };

  // API 키 설정
  const setApiKey = (apiKey) => {
    try {
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('API 키를 입력해주세요.');
      }
      
      collectorRef.current.setApiKey(apiKey.trim());
      updateStatus();
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // 수동 데이터 수집
  const collectDataManually = async () => {
    if (!collectorRef.current) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await collectorRef.current.collectAllData();
      updateStatus();
      
      // 수집 완료 후 로그 새로고침
      await refreshCollectionLogs();
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 수집 시작
  const startAutoCollection = () => {
    if (!collectorRef.current) return false;
    
    try {
      collectorRef.current.startAutoCollection();
      updateStatus();
      
      // 3초 후 상태 업데이트 (자동 수집 시작 확인)
      setTimeout(updateStatus, 3000);
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // 자동 수집 중지
  const stopAutoCollection = () => {
    if (!collectorRef.current) return false;
    
    try {
      collectorRef.current.stopAutoCollection();
      updateStatus();
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // 수집 로그 새로고침
  const refreshCollectionLogs = async () => {
    try {
      const { data, error } = await collectorRef.current.supabase
        .from('collection_logs')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setCollectionLogs(data || []);
    } catch (err) {
      console.error('수집 로그 조회 실패:', err);
    }
  };

  // 실시간 상태 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      updateStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 초기 로그 로드
  useEffect(() => {
    refreshCollectionLogs();
  }, []);

  return {
    // 상태
    collectorStatus,
    isLoading,
    error,
    collectionLogs,
    
    // 액션
    setApiKey,
    collectDataManually,
    startAutoCollection,
    stopAutoCollection,
    refreshCollectionLogs,
    updateStatus,
    
    // 헬퍼
    formatNextCollectionTime: (time) => {
      if (!time) return '예정 없음';
      return new Date(time).toLocaleString('ko-KR');
    },
    
    formatLastCollectionTime: (time) => {
      if (!time) return '수집 기록 없음';
      return new Date(time).toLocaleString('ko-KR');
    },
    
    getTimeUntilNext: () => {
      if (!collectorStatus.nextCollectionTime) return null;
      const now = new Date();
      const next = new Date(collectorStatus.nextCollectionTime);
      const diff = next - now;
      
      if (diff <= 0) return '곧 실행';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}시간 ${minutes}분 후`;
    }
  };
};