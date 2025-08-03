import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from 'react-query';
import { supabase } from '../services/supabase';
import { bulkUploadProperties } from '../services/propertyService';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';

const CSVImport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // 관리자만 접근 가능
  if (!user || (user.email !== 'admin' && user.role !== 'admin')) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-600">관리자만 CSV 파일을 업로드할 수 있습니다.</p>
      </div>
    );
  }

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('CSV 파일을 선택해주세요.');
      setFile(null);
    }
  };

  const normalizePropertyStatus = (status) => {
    const statusMap = {
      '거래가능': 'available',
      '거래중': 'available',
      '판매중': 'available',
      '임대가능': 'available',
      '거래완료': 'completed',
      '계약완료': 'completed',
      '판매완료': 'completed',
      '임대완료': 'completed',
      '거래보류': 'reserved',
      '보류': 'reserved',
      '일시정지': 'reserved'
    };
    return statusMap[status] || 'available';
  };

  const normalizePropertyType = (type) => {
    const typeMap = {
      '아파트': 'apt',
      '오피스텔': 'officetel',
      '빌라': 'villa',
      '연립': 'villa',
      '빌라/연립': 'villa',
      '단독주택': 'house',
      '상가': 'commercial',
      '사무실': 'commercial',
      '점포': 'commercial'
    };
    return typeMap[type] || 'apt';
  };

  const normalizeTransactionType = (type) => {
    const typeMap = {
      '매매': 'sale',
      '전세': 'lease',
      '월세': 'rent',
      '매매/전세': 'sale', // 기본값으로 매매
      '전세/월세': 'lease' // 기본값으로 전세
    };
    return typeMap[type] || 'sale';
  };

  const parsePrice = (priceText, transactionType) => {
    if (!priceText) return { sale_price: 0, lease_price: 0, price: 0 };
    
    // 쉼표와 공백 제거
    const cleanPrice = priceText.replace(/[,\s]/g, '');
    
    if (transactionType === 'sale') {
      // 매매: 단일 가격
      const price = parseInt(cleanPrice) || 0;
      return { sale_price: price, lease_price: 0, price: 0 };
    } else if (transactionType === 'lease') {
      // 전세: 보증금만
      const deposit = parseInt(cleanPrice) || 0;
      return { sale_price: 0, lease_price: deposit, price: 0 };
    } else if (transactionType === 'rent') {
      // 월세: 보증금/월세 형태
      if (cleanPrice.includes('/')) {
        const [deposit, monthly] = cleanPrice.split('/');
        return {
          sale_price: 0,
          lease_price: parseInt(deposit) || 0,
          price: parseInt(monthly) || 0
        };
      } else {
        // 월세만 있는 경우
        return { sale_price: 0, lease_price: 0, price: parseInt(cleanPrice) || 0 };
      }
    }
    
    return { sale_price: 0, lease_price: 0, price: 0 };
  };

  const processCSV = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV 파일이 비어있습니다.');
      }
      
      // 첫 번째 라인은 헤더로 가정
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1);
      
      const processedProperties = [];
      const errors = [];
      
      data.forEach((line, index) => {
        try {
          const values = line.split(',').map(v => v.trim());
          const row = {};
          
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          
          // 필수 필드 검증
          if (!row['매물명'] || !row['소재지'] || !row['거래유형']) {
            errors.push(`${index + 2}행: 필수 필드가 누락되었습니다`);
            return;
          }
          
          const transactionType = normalizeTransactionType(row['거래유형']);
          const priceData = parsePrice(row['가격'] || row['금액'], transactionType);
          
          const property = {
            property_name: row['매물명'],
            location: row['소재지'],
            property_type: normalizePropertyType(row['매물종류'] || row['종류']),
            transaction_type: transactionType,
            property_status: normalizePropertyStatus(row['상태'] || row['진행상태']),
            ...priceData,
            building: row['동'] || '',
            unit: row['호'] || '',
            supply_area_sqm: parseFloat(row['공급면적']) || 0,
            private_area_sqm: parseFloat(row['전용면적']) || 0,
            floor_info: row['층수'] || '',
            rooms_bathrooms: row['방수'] || '',
            direction: row['향'] || '',
            maintenance_fee: row['관리비'] || '',
            parking: row['주차'] || '',
            move_in_date: row['입주일'] || '',
            approval_date: row['사용승인일'] || '',
            special_notes: row['특이사항'] || '',
            manager_memo: row['메모'] || '',
            is_commercial: (row['상가여부'] === '예' || row['상가여부'] === 'Y'),
            manager_id: user.id || 'admin-hardcoded'
          };
          
          processedProperties.push(property);
        } catch (err) {
          errors.push(`${index + 2}행: ${err.message}`);
        }
      });
      
      setResults({
        total: data.length,
        processed: processedProperties.length,
        errors: errors,
        properties: processedProperties
      });
      
    } catch (err) {
      setError(`CSV 처리 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadProcessedData = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // console.log('처리된 CSV 데이터를 Supabase에 업로드 시작...');
      
      // processed_properties.json 파일에서 데이터 로드
      const response = await fetch('/processed_properties.json');
      if (!response.ok) {
        throw new Error('처리된 데이터 파일을 찾을 수 없습니다. CSV 처리를 먼저 실행해주세요.');
      }
      
      const processedData = await response.json();
      // console.log(`${processedData.length}개의 처리된 매물 데이터를 로드했습니다`);
      
      // propertyService를 사용하여 일괄 업로드
      const result = await bulkUploadProperties(processedData, user?.id || 'admin');
      
      // 업로드 완료 후 캐시 무효화
      queryClient.invalidateQueries(['properties']);
      
      setResults({
        total: result.totalCount,
        processed: result.uploadedCount,
        errors: result.errors,
        properties: processedData.slice(0, 5) // 처음 5개만 미리보기로 표시
      });
      
      if (result.success && result.uploadedCount > 0) {
        // console.log(`✅ 업로드 완료! 총 ${result.uploadedCount}개 매물이 성공적으로 업로드되었습니다.`);
      } else if (!result.success) {
        throw new Error(`업로드 실패: ${result.errors.join(', ')}`);
      }
      
    } catch (err) {
      console.error('업로드 오류:', err);
      setError(`데이터 업로드 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = () => {
    const sampleData = [
      '매물명,소재지,매물종류,거래유형,가격,상태,동,호,공급면적,전용면적,층수,방수,향,관리비,주차,입주일,사용승인일,특이사항,메모,상가여부',
      '래미안 아파트 101동 1503호,서울시 강남구 삼성동,아파트,매매,2500000000,거래가능,101동,1503호,84.56,59.82,15층/25층,3개/2개,남향,15만원,2대,즉시입주,2020.05.15,신축,관리자 확인 필요,아니오',
      '힐스테이트 오피스텔 A동 205호,서울시 서초구 서초동,오피스텔,전세,800000000,거래가능,A동,205호,32.15,25.48,2층/15층,1개/1개,동향,8만원,1대,즉시입주,2019.03.10,,투자용,아니오',
      '신축 빌라 3층,서울시 마포구 합정동,빌라/연립,월세,50000000/500000,거래완료,,3층,65.23,52.31,3층/3층,2개/1개,남서향,5만원,1대,즉시입주,2021.08.20,신축 빌라,계약 완료,아니오'
    ];
    
    const csvContent = sampleData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'property_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CSV 매물 데이터 가져오기</h1>
        <p className="text-gray-600">CSV 파일을 업로드하여 매물 데이터를 일괄 등록할 수 있습니다.</p>
      </div>

      {/* 샘플 다운로드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">CSV 템플릿 다운로드</h3>
            <p className="text-sm text-blue-700">올바른 형식의 CSV 파일을 작성하기 위한 템플릿을 다운로드하세요.</p>
          </div>
          <button
            onClick={downloadSample}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            템플릿 다운로드
          </button>
        </div>
      </div>

      {/* 파일 업로드 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">CSV 파일 업로드</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </label>
            <p className="text-sm text-gray-500">CSV 파일을 선택하세요</p>
          </div>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-500 mr-2" />
              <span className="font-medium">{file.name}</span>
              <span className="ml-2 text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={uploadProcessedData}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '업로드 중...' : '처리된 데이터 업로드'}
          </button>
          <button
            onClick={processCSV}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '처리 중...' : 'CSV 처리하기'}
          </button>
        </div>
      </div>

      {/* 처리 결과 */}
      {results && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">처리 결과</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-gray-600">총 라인 수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.processed}</div>
              <div className="text-sm text-gray-600">처리 성공</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
              <div className="text-sm text-gray-600">처리 실패</div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">오류 목록</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1">{error}</div>
                ))}
              </div>
            </div>
          )}

          {results.processed > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-medium text-green-600">
                  {results.processed}개의 매물이 성공적으로 처리되었습니다!
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                처리된 데이터는 Mock 환경에서 확인용으로만 표시됩니다. 실제 운영 환경에서는 데이터베이스에 저장됩니다.
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="font-medium mb-2">처리된 매물 미리보기 (처음 5개)</h4>
                {results.properties.slice(0, 5).map((property, index) => (
                  <div key={index} className="border-b border-gray-200 py-2 last:border-b-0">
                    <div className="font-medium">{property.property_name}</div>
                    <div className="text-sm text-gray-600">
                      {property.location} | {property.transaction_type} | 
                      {property.transaction_type === 'sale' && property.sale_price > 0 && ` ${property.sale_price.toLocaleString()}원`}
                      {property.transaction_type === 'lease' && property.lease_price > 0 && ` ${property.lease_price.toLocaleString()}원`}
                      {property.transaction_type === 'rent' && ` ${property.lease_price.toLocaleString()}/${property.price.toLocaleString()}원`}
                    </div>
                  </div>
                ))}
                {results.properties.length > 5 && (
                  <div className="text-sm text-gray-500 mt-2">
                    ... 그 외 {results.properties.length - 5}개 매물
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CSVImport;