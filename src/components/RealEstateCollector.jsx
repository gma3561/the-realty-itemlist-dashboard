/**
 * 부동산 데이터 자동 수집 관리 컴포넌트
 */

import React, { useState } from 'react';
import { useRealEstateCollector } from '../hooks/useRealEstateCollector';

const RealEstateCollector = () => {
  const {
    collectorStatus,
    isLoading,
    error,
    collectionLogs,
    setApiKey,
    collectDataManually,
    startAutoCollection,
    stopAutoCollection,
    refreshCollectionLogs,
    formatNextCollectionTime,
    formatLastCollectionTime,
    getTimeUntilNext
  } = useRealEstateCollector();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSetApiKey = () => {
    if (setApiKey(apiKeyInput)) {
      setApiKeyInput('');
      alert('API 키가 설정되었습니다!');
    }
  };

  const handleStartCollection = () => {
    if (!collectorStatus.apiKeyConfigured) {
      alert('먼저 공공데이터포털 API 키를 설정해주세요.');
      return;
    }
    
    if (startAutoCollection()) {
      alert('자동 데이터 수집을 시작했습니다!');
    }
  };

  const handleStopCollection = () => {
    if (stopAutoCollection()) {
      alert('자동 데이터 수집을 중지했습니다.');
    }
  };

  const handleManualCollection = async () => {
    if (!collectorStatus.apiKeyConfigured) {
      alert('먼저 공공데이터포털 API 키를 설정해주세요.');
      return;
    }
    
    const success = await collectDataManually();
    if (success) {
      alert('데이터 수집이 완료되었습니다!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🏢 부동산 실거래가 자동 수집
      </h2>
      
      {/* API 키 설정 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          공공데이터포털 API 키 설정
        </h3>
        
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">
            📋 <a 
              href="https://www.data.go.kr/data/15057511/openapi.do" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              공공데이터포털
            </a>에서 "국토교통부_아파트매매 실거래 상세 자료" API 키를 발급받으세요.
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="API 키를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
          <button
            onClick={handleSetApiKey}
            disabled={!apiKeyInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            설정
          </button>
        </div>
        
        <div className="text-sm">
          상태: {collectorStatus.apiKeyConfigured ? 
            <span className="text-green-600 font-semibold">✅ 설정됨</span> : 
            <span className="text-red-600 font-semibold">❌ 미설정</span>
          }
        </div>
      </div>

      {/* 수집 상태 섹션 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📊 수집 상태
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">자동 수집 상태:</span>
            <span className={`ml-2 font-semibold ${
              collectorStatus.isRunning ? 'text-green-600' : 'text-gray-600'
            }`}>
              {collectorStatus.isRunning ? '🟢 실행 중' : '⚪ 중지됨'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">대상 지역:</span>
            <span className="ml-2">{collectorStatus.targetAreas}개 지역</span>
          </div>
          
          <div>
            <span className="font-medium">마지막 수집:</span>
            <span className="ml-2">{formatLastCollectionTime(collectorStatus.lastCollectionTime)}</span>
          </div>
          
          <div>
            <span className="font-medium">다음 수집:</span>
            <span className="ml-2">
              {collectorStatus.isRunning ? getTimeUntilNext() || '계산 중...' : '자동 수집 중지됨'}
            </span>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {error}
        </div>
      )}

      {/* 제어 버튼 섹션 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          🎮 수집 제어
        </h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleManualCollection}
            disabled={isLoading || !collectorStatus.apiKeyConfigured}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {isLoading ? '🔄' : '▶️'} 
            {isLoading ? '수집 중...' : '수동 수집'}
          </button>
          
          {!collectorStatus.isRunning ? (
            <button
              onClick={handleStartCollection}
              disabled={!collectorStatus.apiKeyConfigured}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              🚀 자동 수집 시작
            </button>
          ) : (
            <button
              onClick={handleStopCollection}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              ⏹️ 자동 수집 중지
            </button>
          )}
          
          <button
            onClick={refreshCollectionLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🔄 로그 새로고침
          </button>
        </div>
      </div>

      {/* 수집 로그 섹션 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📋 최근 수집 로그
        </h3>
        
        {collectionLogs.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {collectionLogs.map((log, index) => (
              <div 
                key={index}
                className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-green-600">
                      ✅ {log.collected_count}건 수집 완료
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      소요시간: {Math.round(log.duration_ms / 1000)}초
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.collected_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-md text-center text-gray-600">
            아직 수집 기록이 없습니다.
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 사용 안내</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 3시간마다 자동으로 서울시 주요 8개 지역의 아파트 실거래가 데이터를 수집합니다.</li>
          <li>• API 호출 제한을 준수하여 서버에 부하를 주지 않도록 설계되었습니다.</li>
          <li>• 중복 데이터는 자동으로 필터링되어 최신 데이터만 유지됩니다.</li>
          <li>• 공공데이터포털의 무료 API를 사용하므로 추가 비용이 발생하지 않습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default RealEstateCollector;