/**
 * 실시간 부동산 실거래가 조회 컴포넌트 (저장 없이 바로 표시)
 */

import React, { useState } from 'react';

const RealTimePropertyData = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedArea, setSelectedArea] = useState('11680'); // 강남구
  const [selectedMonth, setSelectedMonth] = useState('202407');

  // 서울시 주요 지역 코드
  const areas = [
    { code: '11680', name: '강남구' },
    { code: '11650', name: '서초구' },
    { code: '11710', name: '송파구' },
    { code: '11560', name: '영등포구' },
    { code: '11440', name: '마포구' },
    { code: '11170', name: '용산구' },
    { code: '11110', name: '종로구' },
    { code: '11140', name: '중구' }
  ];

  // XML 파싱 함수
  const parseXmlResponse = (xmlText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // 에러 체크
    const errorElement = xmlDoc.querySelector('cmmMsgHeader');
    if (errorElement) {
      const errorCode = xmlDoc.querySelector('returnReasonCode')?.textContent;
      const errorMsg = xmlDoc.querySelector('returnAuthMsg')?.textContent;
      throw new Error(`API 오류 ${errorCode}: ${errorMsg}`);
    }

    const items = xmlDoc.querySelectorAll('item');
    return Array.from(items).map(item => {
      const result = {};
      for (const child of item.children) {
        result[child.tagName] = child.textContent;
      }
      return result;
    });
  };

  // 실시간 데이터 조회
  const fetchRealTimeData = async () => {
    if (!apiKey) {
      setError('API 키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = 'https://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev';
      const params = new URLSearchParams({
        serviceKey: apiKey,
        pageNo: '1',
        numOfRows: '100',
        LAWD_CD: selectedArea,
        DEAL_YMD: selectedMonth
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }

      const xmlText = await response.text();
      const parsedData = parseXmlResponse(xmlText);
      
      setData(parsedData);
      
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 거래금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return parseInt(amount.replace(/,/g, '')).toLocaleString() + '만원';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        📈 실시간 아파트 실거래가 조회
      </h2>

      {/* API 키 입력 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          공공데이터포털 API 키
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API 키를 입력하세요..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 검색 조건 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지역 선택
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {areas.map(area => (
              <option key={area.code} value={area.code}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            조회 년월
          </label>
          <input
            type="month"
            value={`${selectedMonth.slice(0,4)}-${selectedMonth.slice(4,6)}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedMonth(year + month);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchRealTimeData}
            disabled={isLoading || !apiKey}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? '조회 중...' : '실시간 조회'}
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {error}
        </div>
      )}

      {/* 데이터 표시 */}
      {data && (
        <div>
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            ✅ {data.length}건의 실거래 데이터를 조회했습니다.
          </div>

          {data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      아파트명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거래금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전용면적
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      층
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거래일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      법정동
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.아파트 || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(item.거래금액)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.전용면적 ? `${item.전용면적}㎡` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.층 ? `${item.층}층` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.년 && item.월 && item.일 ? `${item.년}.${item.월}.${item.일}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.법정동 || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 사용 안내</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 공공데이터포털에서 발급받은 API 키를 입력하세요.</li>
          <li>• 실시간으로 최신 실거래 데이터를 조회합니다.</li>
          <li>• 데이터는 저장되지 않고 조회할 때마다 새로 가져옵니다.</li>
          <li>• 최신 데이터는 보통 1-2개월 후에 업데이트됩니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default RealTimePropertyData;