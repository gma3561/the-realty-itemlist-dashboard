import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageUploadService from '../../services/imageUploadService';
import { useAuth } from '../../contexts/AuthContext';

const PropertyImageUpload = ({ propertyId, propertyName, onUploadComplete, className = '' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!propertyId || !propertyName) {
      alert('매물 정보를 먼저 저장해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (acceptedFiles.length === 0) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadStatus('업로드 준비 중...');

    try {
      setUploadStatus('이미지 업로드 중...');
      setProgress(30);

      const results = await imageUploadService.uploadPropertyImages(
        propertyId,
        propertyName,
        acceptedFiles,
        user.id
      );

      setProgress(80);
      setUploadStatus('업로드 완료 처리 중...');

      // 성공한 결과와 실패한 결과 분리
      const successResults = results.filter(result => !result.error);
      const errorResults = results.filter(result => result.error);

      setProgress(100);
      setUploadStatus('업로드 완료!');

      // 결과 알림
      if (successResults.length > 0) {
        const message = `${successResults.length}개 이미지가 성공적으로 업로드되었습니다.`;
        if (errorResults.length > 0) {
          alert(`${message}\n${errorResults.length}개 파일 업로드에 실패했습니다.`);
        } else {
          setUploadStatus(message);
        }
      } else {
        alert('모든 파일 업로드에 실패했습니다.');
      }

      // 부모 컴포넌트에 결과 전달
      if (onUploadComplete) {
        onUploadComplete(successResults);
      }

    } catch (error) {
      console.error('업로드 실패:', error);
      alert(`이미지 업로드에 실패했습니다: ${error.message}`);
      setUploadStatus('업로드 실패');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setUploadStatus('');
      }, 3000);
    }
  }, [propertyId, propertyName, user, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  });

  // 파일 거부 메시지 표시
  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.path} className="text-red-600 text-sm mt-2">
      {file.path} - {file.size > 10 * 1024 * 1024 ? '파일이 너무 큽니다 (최대 10MB)' : '지원되지 않는 파일 형식입니다'}
    </div>
  ));

  return (
    <div className={`image-upload ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900 mb-2">{uploadStatus}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{progress}%</p>
          </div>
        ) : (
          <div>
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? '여기에 파일을 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, WebP 파일 지원 (최대 10MB)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              여러 파일을 한 번에 선택할 수 있습니다
            </p>
          </div>
        )}
      </div>

      {/* 파일 거부 메시지 표시 */}
      {fileRejectionItems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-red-600 mb-2">업로드할 수 없는 파일:</h4>
          {fileRejectionItems}
        </div>
      )}

      {/* 업로드 가이드 */}
      {!uploading && (
        <div className="mt-4 text-xs text-gray-500">
          <p>• 첫 번째로 업로드되는 이미지가 대표 이미지로 설정됩니다</p>
          <p>• 이미지는 자동으로 썸네일이 생성되며, 원본은 Google Drive에 안전하게 저장됩니다</p>
          <p>• 업로드 후 이미지 순서 변경 및 대표 이미지 설정이 가능합니다</p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageUpload;