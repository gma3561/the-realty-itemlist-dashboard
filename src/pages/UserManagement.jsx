import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import propertyService from '../services/propertyService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Plus, Edit, Trash, AlertTriangle, CheckCircle, X, User, UserPlus, Check, Mail, Phone, Shield, Activity, BarChart3, Users, TrendingUp, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isHardcodedAdmin } from '../data/hardcodedAdmins';

const UserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'performance'
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
  const isAdmin = isHardcodedAdmin(user?.email);

  // 모든 사용자 조회
  const { data: users = [], isLoading } = useQuery(
    'users',
    async () => {
      const { data, error } = await userService.getUsers();
      if (error) throw error;
      return data;
    },
    {
      enabled: !!isAdmin,
    }
  );

  // 사용자 추가 뮤테이션
  const addUserMutation = useMutation(
    async (userData) => {
      const { data, error } = await userService.createUser(userData);
      if (error) throw new Error(error);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        resetForm();
        setSuccess('사용자가 성공적으로 추가되었습니다.');
        setTimeout(() => setSuccess(null), 5000);
      },
      onError: (err) => {
        setError(`사용자 추가 중 오류가 발생했습니다: ${err.message}`);
      },
    }
  );

  // 사용자 수정 뮤테이션
  const updateUserMutation = useMutation(
    async ({ id, ...userData }) => {
      const { data, error } = await userService.updateUser(id, userData);
      if (error) throw new Error(error);
      return data;
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
      const { error } = await userService.updateUser(id, { status });
      if (error) throw new Error(error);
      return true;
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

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMessage = `${targetUser.name}님의 권한을 ${newRole === 'admin' ? '관리자' : '일반'}로 변경하시겠습니까?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const { error } = await userService.updateUser(targetUser.id, { role: newRole });
        if (error) throw new Error(error);
        
        setSuccess(`${targetUser.name}님의 권한이 변경되었습니다.`);
        queryClient.invalidateQueries('users');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        setError(`권한 변경 실패: ${error.message}`);
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleToggleStatus = (userData) => {
    if (userData.id === user?.id) {
      setError('자신의 계정 상태는 변경할 수 없습니다.');
      return;
    }
    
    const newStatus = userData.status === 'active' ? 'inactive' : 'active';
    if (window.confirm(`${userData.name} 사용자의 상태를 ${newStatus === 'inactive' ? '비활성화' : '활성화'} 하시겠습니까?`)) {
      toggleUserStatusMutation.mutate({ id: userData.id, status: newStatus });
    }
  };

  // 비밀번호 재설정 함수
  const handleResetPassword = async (targetUser) => {
    if (!window.confirm(`${targetUser.name}님의 비밀번호를 재설정하시겠습니까?\n새로운 임시 비밀번호가 해당 이메일로 전송됩니다.`)) {
      return;
    }

    try {
      // 랜덤 비밀번호 생성
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let newPassword = '';
      for (let i = 0; i < 12; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Supabase Admin API를 통한 비밀번호 재설정
      const { error } = await userService.resetUserPassword(targetUser.id, newPassword);
      
      if (error) {
        throw new Error(error);
      }

      // 성공 메시지
      setSuccess(`${targetUser.name}님의 비밀번호가 재설정되었습니다.\n임시 비밀번호: ${newPassword}\n\n이 정보를 안전하게 전달해주세요.`);
      
      // 클립보드에 복사
      navigator.clipboard.writeText(`${targetUser.email}의 임시 비밀번호: ${newPassword}`);
      
      setTimeout(() => setSuccess(null), 10000);
    } catch (error) {
      setError(`비밀번호 재설정 실패: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // 실제 데이터에서 사용자별 매물 수 계산
  const { data: properties = [] } = useQuery(
    ['properties-count'],
    async () => {
      const { data, error } = await propertyService.getProperties({}, { isAdmin: true });
      if (error) throw error;
      return data || [];
    }
  );

  const getUserPropertyCount = (userId) => {
    return properties.filter(p => p.manager_id === userId || p.manager_id === userId).length;
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <User className="w-8 h-8 mr-2 text-blue-600" />
          직원 관리
        </h2>
        
        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              직원 목록
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline-block mr-2" />
              직원별 성과
            </button>
          </nav>
        </div>
        
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
      </div>
      
      {/* 탭 콘텐츠 */}
      {activeTab === 'list' ? (
        <div className="bg-white shadow rounded-lg p-6">
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
                  담당 매물
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
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
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role === 'admin' ? '관리자' : '일반'}
                      </span>
                      <button
                        onClick={() => handleToggleRole(user)}
                        className="text-xs text-gray-600 hover:text-gray-800 underline"
                        title="권한 변경"
                      >
                        변경
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{getUserPropertyCount(user.id)}건</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link
                        to={`/performance/${user.id}`}
                        className="text-purple-600 hover:text-purple-800"
                        title="성과 보기"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="비밀번호 재설정"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`${user.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                        title={user.status === 'active' ? '비활성화' : '활성화'}
                        disabled={user.id === user?.id}
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
      ) : (
        /* 성과 탭 */
        <StaffPerformanceTab />
      )}
    </div>
  );
};

// 직원별 성과 탭 컴포넌트
const StaffPerformanceTab = () => {
  const { data: users = [] } = useQuery('users', async () => {
    const { data, error } = await userService.getUsers();
    if (error) throw error;
    return data;
  });

  const { data: properties = [] } = useQuery('all-properties', async () => {
    const { data, error } = await propertyService.getProperties({}, { isAdmin: true });
    if (error) throw error;
    return data || [];
  });

  const { data: lookupData = {} } = useQuery(
    'lookupTables',
    async () => {
      const data = await propertyService.getLookupTables();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // 직원별 통계 계산
  const calculateUserStats = (userId) => {
    const userProperties = properties.filter(p => p.manager_id === userId);
    
    const stats = {
      totalProperties: userProperties.length,
      completedDeals: 0,
      activeDeals: 0,
      monthlyDeals: 0
    };

    userProperties.forEach(property => {
      const status = lookupData.propertyStatuses?.find(s => s.id === property.property_status_id);
      if (status?.name === '거래완료') {
        stats.completedDeals++;
      } else if (status?.name === '거래가능') {
        stats.activeDeals++;
      }

      const createdDate = new Date(property.created_at);
      const now = new Date();
      if (createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()) {
        stats.monthlyDeals++;
      }
    });

    return stats;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">직원별 성과 현황</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const stats = calculateUserStats(user.id);
          const performanceRate = stats.totalProperties > 0 
            ? Math.round((stats.completedDeals / stats.totalProperties) * 100) 
            : 0;
          
          return (
            <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <Link
                  to={`/performance/${user.id}`}
                  className="text-blue-600 hover:text-blue-800"
                  title="상세 성과 보기"
                >
                  <BarChart3 className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">총 매물</span>
                  <span className="font-semibold">{stats.totalProperties}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">거래완료</span>
                  <span className="font-semibold text-green-600">{stats.completedDeals}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">진행중</span>
                  <span className="font-semibold text-blue-600">{stats.activeDeals}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">이번달 등록</span>
                  <span className="font-semibold">{stats.monthlyDeals}건</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">성과율</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${performanceRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{performanceRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserManagement;