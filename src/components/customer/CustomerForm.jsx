import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

const CustomerForm = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  // 고객 상세 정보 조회 (수정 시)
  const { data: customer, isLoading: isCustomerLoading } = useQuery(
    ['customer', id],
    async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    },
    {
      enabled: isEditing && !!id,
      onError: (err) => {
        setError(`고객 정보를 불러오는데 실패했습니다: ${err.message}`);
      }
    }
  );

  // 전화번호 중복 확인
  const checkPhoneExists = async (phone) => {
    if (!phone || phone.trim() === '') return false;
    
    try {
      let query = supabase
        .from('customers')
        .select('id, phone')
        .eq('phone', phone);
      
      // 수정 시 자기 자신은 제외
      if (isEditing && id) {
        query = query.neq('id', id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('전화번호 중복 확인 오류:', error);
      return false;
    }
  };

  // 고객 등록/수정 Mutation
  const mutation = useMutation(
    async (values) => {
      if (isEditing) {
        // 수정
        const { data, error } = await supabase
          .from('customers')
          .update(values)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // 등록
        const { data, error } = await supabase
          .from('customers')
          .insert([{ ...values, user_id: user.id }])
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customers']);
        if (isEditing) {
          queryClient.invalidateQueries(['customer', id]);
        }
        setSuccess(true);
        
        // Navigate back to customer list after 2 seconds
        setTimeout(() => {
          navigate('/customers');
        }, 2000);
      },
      onError: (err) => {
        setError(`고객 ${isEditing ? '수정' : '등록'}에 실패했습니다: ${err.message}`);
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  // Formik 설정
  const formik = useFormik({
    initialValues: {
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      source: customer?.source || '',
      notes: customer?.notes || ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('고객명은 필수 입력사항입니다'),
      phone: Yup.string().test(
        'phone-exists',
        '이미 등록된 전화번호입니다',
        function(value) {
          if (!value) return true; // 전화번호 미입력 시 유효성 검사 통과
          return !phoneExists;
        }
      ),
      email: Yup.string().email('유효한 이메일 주소를 입력해주세요')
    }),
    onSubmit: handleSubmit,
    enableReinitialize: true
  });

  // 전화번호 변경 시 중복 체크
  useEffect(() => {
    const checkPhone = async () => {
      if (formik.values.phone && formik.values.phone.trim() !== '') {
        const exists = await checkPhoneExists(formik.values.phone);
        setPhoneExists(exists);
      } else {
        setPhoneExists(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      checkPhone();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [formik.values.phone]);

  async function handleSubmit(values) {
    setIsSubmitting(true);
    setError(null);
    
    // 전화번호 중복 체크
    if (values.phone && values.phone.trim() !== '') {
      const exists = await checkPhoneExists(values.phone);
      if (exists) {
        setPhoneExists(true);
        setIsSubmitting(false);
        return;
      }
    }
    
    mutation.mutate(values);
  }

  if (isEditing && isCustomerLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">
          고객 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0 flex items-center">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="mr-4 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isEditing ? '고객 정보 수정' : '신규 고객 등록'}
            </h2>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  오류가 발생했습니다
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  고객 정보가 성공적으로 {isEditing ? '수정' : '등록'}되었습니다
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>고객 목록 페이지로 이동합니다...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    고객명 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        formik.touched.name && formik.errors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="고객 이름"
                    />
                    {formik.touched.name && formik.errors.name && (
                      <p className="mt-2 text-sm text-red-600">{formik.errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    전화번호
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        (formik.touched.phone && formik.errors.phone) || phoneExists ? 'border-red-300' : ''
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="mt-2 text-sm text-red-600">{formik.errors.phone}</p>
                    )}
                    {phoneExists && (
                      <p className="mt-2 text-sm text-red-600">
                        이미 등록된 전화번호입니다
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="email"
                      id="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        formik.touched.email && formik.errors.email ? 'border-red-300' : ''
                      }`}
                      placeholder="example@email.com"
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                    유입 경로
                  </label>
                  <div className="mt-1">
                    <select
                      id="source"
                      name="source"
                      value={formik.values.source}
                      onChange={formik.handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">선택하세요</option>
                      <option value="direct">직접 방문</option>
                      <option value="referral">지인 소개</option>
                      <option value="phone">전화 문의</option>
                      <option value="portal">부동산 포털</option>
                      <option value="chat">채팅/메시지</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    메모
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows="4"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="고객 관련 메모사항을 입력하세요"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || phoneExists}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? (
                    <>처리 중...</>
                  ) : isEditing ? (
                    <>수정 완료</>
                  ) : (
                    <>등록 완료</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;