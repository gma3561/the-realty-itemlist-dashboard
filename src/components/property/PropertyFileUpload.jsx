import React, { useState, useEffect } from 'react';
import { Upload, File, Download, Trash2, Loader } from 'lucide-react';
import fileService from '../../services/fileService';
import { useToast } from '../../context/ToastContext';

const PropertyFileUpload = ({ propertyId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // 파일 목록 불러오기
  useEffect(() => {
    loadFiles();
  }, [propertyId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await fileService.getPropertyFiles(propertyId);
      setFiles(fileList);
    } catch (error) {
      showToast('파일 목록을 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('파일 크기는 10MB 이하여야 합니다', 'error');
      return;
    }

    setUploading(true);
    try {
      await fileService.uploadFile(file, propertyId);
      showToast('파일이 업로드되었습니다', 'success');
      await loadFiles(); // 목록 새로고침
    } catch (error) {
      showToast('파일 업로드에 실패했습니다', 'error');
    } finally {
      setUploading(false);
      // 입력 초기화
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileId, storagePath, fileName) => {
    if (!window.confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) return;

    try {
      await fileService.deleteFile(fileId, storagePath);
      showToast('파일이 삭제되었습니다', 'success');
      await loadFiles();
    } catch (error) {
      showToast('파일 삭제에 실패했습니다', 'error');
    }
  };

  const handleFileDownload = async (storagePath, fileName) => {
    try {
      await fileService.downloadFile(storagePath, fileName);
    } catch (error) {
      showToast('파일 다운로드에 실패했습니다', 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">첨부 파일</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          파일을 클릭하여 업로드하세요
        </p>
        <p className="text-xs text-gray-500 mt-1">
          최대 10MB, 이미지/문서 파일 지원
        </p>
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={uploading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              업로드 중...
            </>
          ) : (
            '파일 선택'
          )}
        </label>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Loader className="animate-spin h-6 w-6 mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">파일 목록을 불러오는 중...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">업로드된 파일이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-2xl mr-3">
                  {fileService.getFileIcon(file.file_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleFileDownload(file.storage_path, file.file_name)}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleFileDelete(file.id, file.storage_path, file.file_name)}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyFileUpload;