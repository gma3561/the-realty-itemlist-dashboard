import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import propertyService from '../services/propertyService';

/**
 * 매물 관련 공통 액션을 관리하는 커스텀 훅
 * @returns {Object} 매물 액션 함수들
 */
export const usePropertyActions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 매물 상세보기
  const handleView = useCallback((propertyId) => {
    navigate(`/properties/${propertyId}`);
  }, [navigate]);

  // 매물 수정하기
  const handleEdit = useCallback((propertyId) => {
    navigate(`/properties/${propertyId}/edit`);
  }, [navigate]);

  // 매물 삭제하기
  const handleDelete = useCallback(async (propertyId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return false;
    
    try {
      const { error } = await propertyService.deleteProperty(propertyId);
      if (error) throw new Error(error);
      
      // 캐시 무효화
      queryClient.invalidateQueries('properties');
      queryClient.invalidateQueries(['property', propertyId]);
      
      return true;
    } catch (error) {
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  }, [queryClient]);

  // 즐겨찾기 토글
  const handleToggleFavorite = useCallback(async (propertyId, currentFavorite) => {
    try {
      // TODO: 즐겨찾기 API가 구현되면 연결
      // await propertyService.toggleFavorite(propertyId, !currentFavorite);
      
      // 캐시 무효화
      queryClient.invalidateQueries('properties');
      
      return !currentFavorite;
    } catch (error) {
      alert(`즐겨찾기 설정 중 오류가 발생했습니다: ${error.message}`);
      return currentFavorite;
    }
  }, [queryClient]);

  // 매물 상태 변경
  const handleStatusChange = useCallback(async (propertyId, newStatus) => {
    try {
      // TODO: 상태 변경 API가 구현되면 연결
      // await propertyService.updateStatus(propertyId, newStatus);
      
      // 캐시 무효화
      queryClient.invalidateQueries('properties');
      queryClient.invalidateQueries(['property', propertyId]);
      
      return true;
    } catch (error) {
      alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  }, [queryClient]);

  // 매물 복제하기
  const handleDuplicate = useCallback(async (property) => {
    try {
      // 원본 매물에서 ID와 생성일시 제외하고 복제
      const duplicateData = {
        ...property,
        property_name: `${property.property_name} (복사본)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      };

      // TODO: 복제 API가 구현되면 연결
      // const { data, error } = await propertyService.createProperty(duplicateData);
      // if (error) throw new Error(error);
      
      // 캐시 무효화
      queryClient.invalidateQueries('properties');
      
      // 복제된 매물로 이동
      // navigate(`/properties/${data.id}/edit`);
      
      return true;
    } catch (error) {
      alert(`복제 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  }, [navigate, queryClient]);

  // 매물 공유하기
  const handleShare = useCallback(async (propertyId) => {
    try {
      const shareUrl = `${window.location.origin}/properties/${propertyId}`;
      
      if (navigator.share) {
        // 네이티브 공유 API 사용
        await navigator.share({
          title: '매물 정보',
          url: shareUrl
        });
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        alert('링크가 클립보드에 복사되었습니다.');
      }
      
      return true;
    } catch (error) {
      alert(`공유 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  }, []);

  return {
    handleView,
    handleEdit,
    handleDelete,
    handleToggleFavorite,
    handleStatusChange,
    handleDuplicate,
    handleShare
  };
};

export default usePropertyActions;