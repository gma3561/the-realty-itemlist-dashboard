import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Plus, Edit, Trash, AlertTriangle, CheckCircle, X, User, UserPlus, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const UserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'user',
  });

  // 현재 사용자가 관리자인지 확인
  const { data: currentUserData } = useQuery(
    ['user', user?.id],
    async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!user,
    }
  );

  const isAdmin = currentUserData?.role === 'admin' || user?.role === 'admin';

  // 모든 사용자 조회
  const { data: users, isLoading } = useQuery(
    'users',
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data;
    },
    {
      enabled: !!isAdmin,
    }
  );

  // 사용자 추가 뮤테이션 (Auth 사용자 생성 후 Public 사용자 추가)
  const addUserMutation = useMutation(
    async (userData) => {
      // 1. auth.users에 먼저 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'defaultPassword123!', // 기본 비밀번호 (나중에 변경 가능)
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });
      
      if (authError) throw authError;
      
      // 2. public.users에 연결된 사용자 추가
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // auth.users의 ID 사용
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
          
      if (error) {
        // public.users 생성 실패 시 auth.users 정리
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }
      
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        resetForm();
        setSuccess('사용자가 성공적으로 추가되었습니다.');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err) => {
        setError(`사용자 추가 중 오류가 발생했습니다: ${err.message}`);
      },
    }
  );

  // 사용자 수정 뮤테이션
  const updateUserMutation = useMutation(
    async ({ id, ...userData }) => {
      // users 테이블 데이터만 업데이트 (비밀번호 제외)
      const updateData = {
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
      };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      return { id };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        resetForm();
        setSuccess('사용자 정보가 성공적으로 업데이트되었습니다.');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err) => {
        setError(`사용자 수정 중 오류가 발생했습니다: ${err.message}`);
      },
    }
  );

  // 사용자 상태 변경 뮤테이션
  const toggleUserStatusMutation = useMutation(
    async ({ id, status }) => {
      const newStatus = status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      return { id, newStatus };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setSuccess('사용자 상태가 변경되었습니다.');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err) => {
        setError(`사용자 상태 변경 중 오류가 발생했습니다: ${err.message}`);
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phone: '',
      role: 'user',
    });
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 입력 검증
    if (!formData.email && !editingId) {
      setError('이메일은 필수 입력사항입니다.');
      return;
    }
    
    if (!formData.name) {
      setError('이름은 필수 입력사항입니다.');
      return;
    }
    
    // 비밀번호 검증 제거 (users 테이블에만 저장)
    
    if (editingId) {
      // 수정
      updateUserMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      // 추가
      addUserMutation.mutate(formData);
    }
  };

  const handleEdit = (userData) => {
    setFormData({
      email: userData.email || '',
      name: userData.name || '',
      phone: userData.phone || '',
      role: userData.role || 'user',
    });
    setEditingId(userData.id);
    setIsAdding(true);
  };

  const handleToggleStatus = (user) => {
    if (user.id === currentUserData.id) {
      setError('자신의 계정 상태는 변경할 수 없습니다.');
      return;
    }
    
    if (window.confirm(`${user.name} 사용자의 상태를 ${user.status === 'active' ? '비활성화' : '활성화'} 하시겠습니까?`)) {
      toggleUserStatusMutation.mutate({ id: user.id, status: user.status });
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">사용자 관리</h2>
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          관리자 권한이 필요합니다. 관리자에게 문의하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <User className="w-6 h-6 mr-2 text-blue-600" />
        사용자 관리
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
      
      {!isAdding ? (
        <div className="mb-4">
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            새 사용자 추가
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-md bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? '사용자 정보 수정' : '새 사용자 추가'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required={!editingId}
              placeholder="예: user@example.com"
              disabled={!!editingId}
            />
            
            <Input
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="예: 홍길동"
            />
            
            <Input
              label="연락처"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="예: 010-1234-5678"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                권한
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="user">일반 사용자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={addUserMutation.isLoading || updateUserMutation.isLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              {editingId ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      )}
      
      <h3 className="text-lg font-medium mb-2">사용자 목록</h3>
      {isLoading ? (
        <div className="text-gray-500 flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-200 rounded-full animate-spin mr-2"></div>
          로딩 중...
        </div>
      ) : !users || users.length === 0 ? (
        <div className="text-gray-500 p-4 border rounded-md text-center">
          등록된 사용자가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.status === 'inactive' ? 'bg-gray-50 text-gray-400' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.phone || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? '관리자' : '일반 사용자'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`${user.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                        title={user.status === 'active' ? '비활성화' : '활성화'}
                        disabled={user.id === currentUserData?.id}
                      >
                        {user.status === 'active' ? 
                          <Trash className="w-4 h-4" /> : 
                          <CheckCircle className="w-4 h-4" />
                        }
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
  );
};

export default UserManagement;