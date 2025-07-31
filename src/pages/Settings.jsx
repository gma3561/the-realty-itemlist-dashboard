import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { setupDatabase, testPropertyInsert, runFullSetupAndTest } from '../utils/setupDatabase';

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setResults(null);
  };

  const handleSetupDatabase = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    clearLogs();
    addLog('데이터베이스 셋업 시작...', 'info');
    
    try {
      // console.log을 가로채서 UI에 표시
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '), 'info');
        originalLog(...args);
      };

      const result = await setupDatabase();
      
      // console.log 복원
      console.log = originalLog;
      
      setResults(result);
      
      if (result.success) {
        addLog('✅ 데이터베이스 셋업 완료!', 'success');
      } else {
        addLog('❌ 데이터베이스 셋업 실패: ' + result.error, 'error');
      }
      
    } catch (error) {
      addLog('❌ 오류 발생: ' + error.message, 'error');
      setResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPropertyInsert = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    addLog('매물 등록 테스트 시작...', 'info');
    
    try {
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '), 'info');
        originalLog(...args);
      };

      const result = await testPropertyInsert();
      
      console.log = originalLog;
      
      if (result.success) {
        addLog('✅ 매물 등록 테스트 성공!', 'success');
        addLog(`등록된 매물 ID: ${result.property?.id}`, 'info');
      } else {
        addLog('❌ 매물 등록 테스트 실패: ' + result.error, 'error');
      }
      
    } catch (error) {
      addLog('❌ 오류 발생: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSetupAndTest = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    clearLogs();
    addLog('전체 셋업 및 테스트 시작...', 'info');
    
    try {
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '), 'info');
        originalLog(...args);
      };

      const result = await runFullSetupAndTest();
      
      console.log = originalLog;
      
      setResults(result);
      
      if (result.setupResult?.success && result.testResult?.success) {
        addLog('✅ 전체 셋업 및 테스트 완료!', 'success');
      } else {
        addLog('⚠️ 일부 작업이 실패했습니다. 로그를 확인하세요.', 'warning');
      }
      
    } catch (error) {
      addLog('❌ 오류 발생: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자가 아니면 접근 불가
  if (user?.role !== 'admin' && user?.email !== 'admin@the-realty.co.kr') {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">설정</h2>
        <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">시스템 설정</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">데이터베이스 설정</h3>
        <p className="text-gray-600 mb-4">
          시스템 사용에 필요한 기본 데이터를 설정합니다. (매물종류, 진행상태, 거래유형, 테스트 소유주)
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleSetupDatabase}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '기본 데이터 설정'}
          </button>
          
          <button
            onClick={handleTestPropertyInsert}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '매물 등록 테스트'}
          </button>
          
          <button
            onClick={handleFullSetupAndTest}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '전체 셋업 & 테스트'}
          </button>
          
          <button
            onClick={clearLogs}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            로그 지우기
          </button>
        </div>
      </div>

      {/* 결과 요약 */}
      {results && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">결과 요약</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {results.setupResult && (
              <div className="mb-2">
                <span className="font-medium">데이터베이스 셋업: </span>
                <span className={results.setupResult.success ? 'text-green-600' : 'text-red-600'}>
                  {results.setupResult.success ? '성공' : '실패'}
                </span>
                {results.setupResult.results && (
                  <div className="ml-4 mt-1 text-sm">
                    성공: {results.setupResult.results.filter(r => r.success).length}개 테이블,
                    실패: {results.setupResult.results.filter(r => !r.success).length}개 테이블
                  </div>
                )}
              </div>
            )}
            
            {results.testResult && (
              <div>
                <span className="font-medium">매물 등록 테스트: </span>
                <span className={results.testResult.success ? 'text-green-600' : 'text-red-600'}>
                  {results.testResult.success ? '성공' : '실패'}
                </span>
                {results.testResult.property && (
                  <div className="ml-4 mt-1 text-sm">
                    등록된 매물: {results.testResult.property.property_name} (ID: {results.testResult.property.id})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그 출력 */}
      {logs.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">실행 로그</h4>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                <span className={
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 className="text-md font-medium text-yellow-800 mb-2">💡 참고사항</h4>
        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>RLS(Row Level Security) 정책으로 인해 데이터 삽입이 실패할 수 있습니다.</li>
          <li>실패 시 Supabase 대시보드에서 수동으로 SQL을 실행하거나 서비스 역할 키를 설정하세요.</li>
          <li>SQL 파일들이 scripts/ 폴더에 준비되어 있습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;