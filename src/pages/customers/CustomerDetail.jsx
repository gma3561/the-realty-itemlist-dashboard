import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { supabase } from '../../services/supabase';
import { Calendar, Phone, Mail, User, Clock, Edit, ArrowLeft, Home, FileText } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  // 고객 상세 정보 조회
  const { data: customer, isLoading, error } = useQuery(
    ['customer', id],
    async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          user:user_id (
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  );

  // 고객 관심 매물 조회
  const { data: interests = [] } = useQuery(
    ['customerInterests', id],
    async () => {
      const { data, error } = await supabase
        .from('customer_interests')
        .select(`
          *,
          property_type:property_type_id (name),
          transaction_type:transaction_type_id (name)
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000
    }
  );

  // 고객 퍼널 이벤트 조회 (상담 이력)
  const { data: funnelEvents = [] } = useQuery(
    ['customerFunnelEvents', id],
    async () => {
      const { data, error } = await supabase
        .from('funnel_events')
        .select(`
          *,
          property:property_id (
            property_name,
            location
          ),
          stage:stage_id (
            name,
            color
          ),
          previous_stage:previous_stage_id (
            name
          ),
          user:user_id (
            name
          )
        `)
        .eq('customer_id', id)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!id && activeTab === 'history',
      staleTime: 5 * 60 * 1000
    }
  );

  // 고객과 연결된 매물 조회
  const { data: properties = [] } = useQuery(
    ['customerProperties', id],
    async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          property_name,
          location,
          property_type,
          property_status,
          transaction_type,
          price,
          created_at
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!id && activeTab === 'properties',
      staleTime: 5 * 60 * 1000
    }
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const handleEditClick = () => {
    navigate(`/customers/${id}/edit`);
  };

  const handleBackClick = () => {
    navigate('/customers');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
        <span className="ml-2">고객 정보 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                고객 정보를 불러오는 중 오류가 발생했습니다.
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                고객 정보를 찾을 수 없습니다.
              </h3>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const getPropertyTypeDisplay = (type) => {
    const types = {
      'apt': '아파트',
      'officetel': '오피스텔',
      'villa': '빌라/연립',
      'house': '단독주택',
      'commercial': '상가'
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'text-green-600',
      'reserved': 'text-yellow-600',
      'completed': 'text-blue-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      'available': '거래가능',
      'reserved': '거래보류',
      'completed': '거래완료'
    };
    return statuses[status] || status;
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBackClick}
            className="mr-4 text-gray-400 hover:text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {customer.name} 님 상세 정보
          </h1>
        </div>
        <button
          type="button"
          onClick={handleEditClick}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Edit className="w-4 h-4 mr-2" />
          정보 수정
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            고객 기본 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            개인 정보 및 연락처
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="w-4 h-4 mr-2" />
                이름
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                연락처
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.phone || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                이메일
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.email || '-'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="w-4 h-4 mr-2" />
                담당자
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.user?.name || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                등록일
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(customer.created_at)}
              </dd>
            </div>
            {customer.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  메모
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {customer.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => handleTabChange('info')}
              className={`${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              관심 정보
            </button>
            <button
              onClick={() => handleTabChange('properties')}
              className={`${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              연결 매물
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              상담 이력
            </button>
          </nav>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {/* 관심 정보 탭 */}
          {activeTab === 'info' && (
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                관심 매물 정보
              </h3>
              
              {interests.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  등록된 관심 정보가 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">매물종류</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">지역</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">거래유형</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">가격대</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">등록일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {interests.map((interest) => (
                        <tr key={interest.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {interest.property_type?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {interest.location || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {interest.transaction_type?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {interest.min_price || '0'} ~ {interest.max_price || '무제한'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(interest.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 연결 매물 탭 */}
          {activeTab === 'properties' && (
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                연결된 매물
              </h3>
              
              {properties.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  연결된 매물이 없습니다.
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.map(property => (
                    <div 
                      key={property.id}
                      onClick={() => navigate(`/properties/${property.id}`)}
                      className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {property.property_name}
                        </h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Home className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span className="truncate">{property.location}</span>
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getPropertyTypeDisplay(property.property_type)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.property_status)}`}>
                            {getStatusDisplay(property.property_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 상담 이력 탭 */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                상담 및 진행 이력
              </h3>
              
              {funnelEvents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  상담 이력이 없습니다.
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {funnelEvents.map((event, eventIdx) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== funnelEvents.length - 1 ? (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div>
                              <div className="relative px-1">
                                <div className="h-8 w-8 bg-blue-100 rounded-full ring-8 ring-white flex items-center justify-center">
                                  <Clock className="h-5 w-5 text-blue-500" />
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-1.5">
                              <div className="text-sm text-gray-500">
                                <div className="font-medium text-gray-900">
                                  {event.stage?.name || '상태 변경'} 
                                  {event.previous_stage?.name && ` (이전: ${event.previous_stage.name})`}
                                </div>
                                <span className="whitespace-nowrap">{formatDateTime(event.event_date)}</span>
                                {event.user?.name && <span> · 담당자: {event.user.name}</span>}
                              </div>
                              {event.property && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <span className="font-medium">{event.property.property_name}</span>
                                  {event.property.location && <span> · {event.property.location}</span>}
                                </div>
                              )}
                              {event.notes && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  {event.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;