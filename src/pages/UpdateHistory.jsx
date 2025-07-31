import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Info, Code, Database, Users, Settings } from 'lucide-react';

const UpdateHistory = () => {
  const updates = [
    {
      version: "v1.3.1",
      date: "2025-01-31",
      status: "완료",
      type: "fix",
      title: "사용자 관리 기능 단순화",
      description: "인증 시스템 대신 users 테이블 직접 관리 방식으로 변경",
      changes: [
        "비밀번호 필드 및 검증 로직 제거",
        "supabase.auth.signUp 대신 직접 테이블 삽입",
        "사용자 추가 프로세스 단순화",
        "양방향 데이터 동기화 완성"
      ],
      impact: "사용자 추가 시 'User not allowed' 오류 해결"
    },
    {
      version: "v1.3.0",
      date: "2025-01-31",
      status: "완료",
      type: "fix",
      title: "로그인 인증 문제 해결",
      description: "관리자 계정 재생성 및 인증 플로우 수정",
      changes: [
        "기존 admin 계정 삭제 후 재생성",
        "이메일 확인 자동 처리",
        "로그인 테스트 스크립트 추가",
        "public.users 테이블 동기화"
      ],
      impact: "'Invalid login credentials' 오류 해결"
    },
    {
      version: "v1.2.0",
      date: "2025-01-31",
      status: "완료",
      type: "feature",
      title: "데이터베이스 스키마 통합",
      description: "UUID 기반 외래키 구조로 전면 변경",
      changes: [
        "property_type, property_status, transaction_type을 별도 테이블로 분리",
        "UUID 기반 외래키 관계 설정",
        "JOIN 쿼리를 사용한 데이터 조회 방식 적용",
        "PropertyForm 및 PropertyList 컴포넌트 업데이트"
      ],
      impact: "매물 등록 시 'property_status column not found' 오류 해결"
    },
    {
      version: "v1.1.0",
      date: "2025-01-30",
      status: "완료",
      type: "feature",
      title: "Supabase 데이터베이스 연동",
      description: "PostgreSQL 기반 데이터베이스 구축 및 연동",
      changes: [
        "Supabase 프로젝트 설정",
        "테이블 스키마 설계 (properties, users, contacts)",
        "RLS 정책 설정",
        "더미 데이터 생성 스크립트 추가"
      ],
      impact: "실제 데이터 저장 및 조회 기능 구현"
    },
    {
      version: "v1.0.0",
      date: "2025-01-29",
      status: "완료",
      type: "feature",
      title: "초기 프로젝트 구축",
      description: "React 기반 부동산 관리 대시보드 기본 구조 구현",
      changes: [
        "React + Vite 프로젝트 초기화",
        "Tailwind CSS 스타일링 적용",
        "기본 컴포넌트 구조 설계",
        "라우팅 시스템 구축"
      ],
      impact: "프로젝트 기반 구조 완성"
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case '완료':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '진행중':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case '보류':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'feature':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'fix':
        return <Settings className="w-4 h-4 text-red-500" />;
      case 'database':
        return <Database className="w-4 h-4 text-purple-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'feature':
        return '기능';
      case 'fix':
        return '수정';
      case 'database':
        return 'DB';
      case 'user':
        return '사용자';
      default:
        return '기타';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-800';
      case 'fix':
        return 'bg-red-100 text-red-800';
      case 'database':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">업데이트 내역</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            <p className="text-yellow-800 text-sm">
              <strong>개발 진행 중:</strong> 현재 시스템을 지속적으로 개선하고 있습니다. 
              일부 기능이 변경되거나 임시적으로 동작하지 않을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {updates.map((update, index) => (
          <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(update.status)}
                  <span className="text-lg font-semibold text-gray-900">
                    {update.version}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(update.type)}`}>
                  {getTypeIcon(update.type)}
                  <span className="ml-1">{getTypeLabel(update.type)}</span>
                </span>
              </div>
              <span className="text-sm text-gray-500">{update.date}</span>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">{update.title}</h3>
            <p className="text-gray-600 mb-4">{update.description}</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">주요 변경사항:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {update.changes.map((change, changeIndex) => (
                  <li key={changeIndex}>{change}</li>
                ))}
              </ul>
            </div>

            {update.impact && (
              <div className="bg-gray-50 rounded-md p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">해결된 문제:</h4>
                <p className="text-sm text-gray-600">{update.impact}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">다음 계획</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Google 로그인 연동 (최종 단계)</li>
          <li>UI/UX 최적화</li>
          <li>모바일 반응형 개선</li>
          <li>성능 최적화</li>
          <li>보안 강화</li>
        </ul>
      </div>
    </div>
  );
};

export default UpdateHistory;