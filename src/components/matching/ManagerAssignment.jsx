import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';
import { AlertTriangle, Check, UserCheck } from 'lucide-react';

const ManagerAssignment = ({ propertyId, currentManagerId }) => {
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // 현재 매니저 정보 로딩
  useEffect(() => {
    if (currentManagerId) {
      setSelectedManagerId(currentManagerId);
    }
  }, [currentManagerId]);

  // 모든 사용자 조회
  const { data: users, isLoading: isUsersLoading } = useQuery(
    'users',
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('status', 'active')
        .order('name');
        
      if (error) throw error;
      return data;
    }
  );

  // 담당자 변경 이력 조회
  const { data: managerHistory, isLoading: isHistoryLoading } = useQuery(
    ['manager-history', propertyId],
    async () => {
      const { data, error } = await supabase
        .from('manager_history')
        .select(`
          id,
          changed_at,
          reason,
          previous_manager_id,
          new_manager_id,
          changed_by,
          previous_manager:previous_manager_id(name),
          new_manager:new_manager_id(name),
          changer:changed_by(name)
        `)
        .eq('property_id', propertyId)
        .order('changed_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!propertyId
    }
  );

  // 담당자 변경 뮤테이션
  const changeManagerMutation = useMutation(
    async ({ propertyId, managerId, reason }) => {
      const { data, error } = await supabase
        .from('properties')
        .update({ manager_id: managerId })
        .eq('id', propertyId);
        
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['property', propertyId]);
        queryClient.invalidateQueries(['manager-history', propertyId]);
        setIsModalOpen(false);
        setChangeReason('');
      },
      onError: (error) => {
        setError(`담당자 변경 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  );

  const handleManagerChange = (e) => {
    setSelectedManagerId(e.target.value);
  };

  const handleReasonChange = (e) => {
    setChangeReason(e.target.value);
  };

  const openModal = () => {
    if (selectedManagerId === currentManagerId) {
      setError('현재 담당자와 동일한 담당자를 선택했습니다.');
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    changeManagerMutation.mutate({
      propertyId,
      managerId: selectedManagerId,
      reason: changeReason
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!propertyId) {
    return <div className="text-gray-500">매물 ID가 필요합니다.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
        담당자 관리
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          담당자 선택
        </label>
        <div className="flex space-x-2">
          <select
            value={selectedManagerId}
            onChange={handleManagerChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUsersLoading}
          >
            <option value="">담당자 선택</option>
            {!isUsersLoading &&
              users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
          </select>
          <Button
            onClick={openModal}
            disabled={!selectedManagerId || selectedManagerId === currentManagerId}
          >
            변경
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium mb-2">담당자 변경 이력</h4>
        {isHistoryLoading ? (
          <div className="text-gray-500">로딩 중...</div>
        ) : !managerHistory || managerHistory.length === 0 ? (
          <div className="text-gray-500">변경 이력이 없습니다.</div>
        ) : (
          <div className="max-h-64 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경일시
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이전 담당자
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    새 담당자
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경자
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managerHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(history.changed_at)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {history.previous_manager?.name || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {history.new_manager?.name || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {history.changer?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 담당자 변경 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        담당자 변경
                      </h3>
                      <div className="mt-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            현재 담당자
                          </label>
                          <div className="bg-gray-100 p-2 rounded-md">
                            {users?.find(u => u.id === currentManagerId)?.name || '담당자 없음'}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            새 담당자
                          </label>
                          <div className="bg-blue-50 p-2 rounded-md text-blue-700">
                            {users?.find(u => u.id === selectedManagerId)?.name || '선택된 담당자 없음'}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            변경 사유
                          </label>
                          <textarea
                            value={changeReason}
                            onChange={handleReasonChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="담당자 변경 사유를 입력하세요"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto sm:ml-3"
                    disabled={changeManagerMutation.isLoading}
                  >
                    {changeManagerMutation.isLoading ? (
                      '처리 중...'
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        확인
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 w-full sm:w-auto sm:mt-0"
                    onClick={closeModal}
                    disabled={changeManagerMutation.isLoading}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerAssignment;