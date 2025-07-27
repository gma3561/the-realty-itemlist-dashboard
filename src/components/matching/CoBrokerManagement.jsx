import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';
import Input from '../common/Input';
import { Plus, Trash, Users, AlertTriangle, Edit, Check, X } from 'lucide-react';

const CoBrokerManagement = ({ propertyId }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    broker_name: '',
    broker_contact: '',
    share_percentage: ''
  });
  const [error, setError] = useState(null);

  // 공동중개사 목록 조회
  const { data: coBrokers, isLoading } = useQuery(
    ['co-brokers', propertyId],
    async () => {
      const { data, error } = await supabase
        .from('co_brokers')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!propertyId
    }
  );

  // 공동중개사 추가 뮤테이션
  const addCoBrokerMutation = useMutation(
    async (newBroker) => {
      const { data, error } = await supabase
        .from('co_brokers')
        .insert([{ ...newBroker, property_id: propertyId }]);
        
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['co-brokers', propertyId]);
        resetForm();
      },
      onError: (error) => {
        setError(`공동중개사 추가 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  );

  // 공동중개사 수정 뮤테이션
  const updateCoBrokerMutation = useMutation(
    async ({ id, ...updateData }) => {
      const { data, error } = await supabase
        .from('co_brokers')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['co-brokers', propertyId]);
        resetForm();
      },
      onError: (error) => {
        setError(`공동중개사 수정 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  );

  // 공동중개사 삭제 뮤테이션
  const deleteCoBrokerMutation = useMutation(
    async (id) => {
      const { data, error } = await supabase
        .from('co_brokers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['co-brokers', propertyId]);
      },
      onError: (error) => {
        setError(`공동중개사 삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      broker_name: '',
      broker_contact: '',
      share_percentage: ''
    });
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 입력 검증
    if (!formData.broker_name.trim()) {
      setError('중개사 이름은 필수 입력사항입니다');
      return;
    }
    
    if (formData.share_percentage && isNaN(parseFloat(formData.share_percentage))) {
      setError('배분율은 숫자로 입력해주세요');
      return;
    }
    
    const submitData = { ...formData };
    if (submitData.share_percentage) {
      submitData.share_percentage = parseFloat(submitData.share_percentage);
    }
    
    if (editingId) {
      // 수정
      updateCoBrokerMutation.mutate({
        id: editingId,
        ...submitData
      });
    } else {
      // 추가
      addCoBrokerMutation.mutate(submitData);
    }
  };

  const handleEdit = (broker) => {
    setFormData({
      broker_name: broker.broker_name || '',
      broker_contact: broker.broker_contact || '',
      share_percentage: broker.share_percentage ? broker.share_percentage.toString() : ''
    });
    setEditingId(broker.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('이 공동중개사를 삭제하시겠습니까?')) {
      deleteCoBrokerMutation.mutate(id);
    }
  };

  if (!propertyId) {
    return <div className="text-gray-500">매물 ID가 필요합니다.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-blue-600" />
        공동중개사 관리
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {!isAdding ? (
        <div className="mb-4">
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            공동중개사 추가
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-md bg-gray-50">
          <h4 className="text-md font-medium mb-2">
            {editingId ? '공동중개사 수정' : '새 공동중개사 추가'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="중개사 이름"
              name="broker_name"
              value={formData.broker_name}
              onChange={handleInputChange}
              required
              placeholder="중개사 이름"
            />
            <Input
              label="중개사 연락처"
              name="broker_contact"
              value={formData.broker_contact}
              onChange={handleInputChange}
              placeholder="연락처"
            />
            <Input
              label="배분율 (%)"
              name="share_percentage"
              type="number"
              value={formData.share_percentage}
              onChange={handleInputChange}
              placeholder="예: 50"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetForm}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={addCoBrokerMutation.isLoading || updateCoBrokerMutation.isLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              {editingId ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-md font-medium mb-2">공동중개사 목록</h4>
        {isLoading ? (
          <div className="text-gray-500">로딩 중...</div>
        ) : !coBrokers || coBrokers.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded-md text-center">
            등록된 공동중개사가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    중개사 이름
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    배분율
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coBrokers.map((broker) => (
                  <tr key={broker.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {broker.broker_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {broker.broker_contact || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {broker.share_percentage ? `${broker.share_percentage}%` : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(broker)}
                          className="text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(broker.id)}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoBrokerManagement;