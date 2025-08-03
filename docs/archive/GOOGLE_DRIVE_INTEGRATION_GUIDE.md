# Google Drive 연동 구현 가이드

## 1. 구현 단계

### Step 1: Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Drive API 활성화
4. OAuth 2.0 클라이언트 ID 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 JavaScript 원본: `http://localhost:5174`, `https://gma3561.github.io`
   - 승인된 리디렉션 URI: `http://localhost:5174/auth/google/callback`

### Step 2: 필요한 패키지 설치
```bash
npm install @react-oauth/google gapi-script
```

### Step 3: Google Drive 서비스 구현
```javascript
// src/services/googleDriveService.js
class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
  }

  async initialize(clientId) {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            clientId: clientId,
            scope: this.SCOPES,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signIn() {
    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance.signIn();
  }

  async uploadFile(file, propertyId) {
    const metadata = {
      name: `property_${propertyId}_${file.name}`,
      mimeType: file.type,
      parents: ['root'] // 또는 특정 폴더 ID
    };

    const accessToken = window.gapi.auth.getToken().access_token;
    const form = new FormData();
    
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });

    return response.json();
  }

  async createPropertyFolder(propertyName) {
    const fileMetadata = {
      name: `매물_${propertyName}`,
      mimeType: 'application/vnd.google-apps.folder'
    };

    return window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });
  }

  async listPropertyFiles(folderId) {
    return window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
      pageSize: 100
    });
  }
}

export default new GoogleDriveService();
```

### Step 4: 매물 상세 페이지에 파일 업로드 기능 추가
```javascript
// src/components/property/PropertyFileUpload.jsx
import React, { useState } from 'react';
import { Upload, File, Trash2 } from 'lucide-react';
import googleDriveService from '../../services/googleDriveService';

const PropertyFileUpload = ({ propertyId, propertyName }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await googleDriveService.uploadFile(file, propertyId);
      setFiles([...files, uploadedFile]);
      alert('파일이 Google Drive에 업로드되었습니다!');
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">첨부 파일</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          파일을 드래그하거나 클릭하여 업로드
        </p>
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          {uploading ? '업로드 중...' : '파일 선택'}
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <File className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">{file.name}</span>
            </div>
            <button className="text-red-600 hover:text-red-800">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyFileUpload;
```

### Step 5: 환경변수 설정
```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## 2. 보안 고려사항

1. **폴더 구조**: 회사 전용 Drive 폴더 생성하여 권한 관리
2. **파일 명명**: 체계적인 파일명 규칙 적용
3. **접근 권한**: 매물 담당자만 해당 폴더 접근 가능하도록 설정
4. **백업**: 정기적인 Drive 백업 스케줄 설정

## 3. 추가 기능 제안

1. **자동 폴더 생성**: 매물 등록 시 자동으로 Google Drive 폴더 생성
2. **파일 미리보기**: Drive 파일 썸네일 표시
3. **일괄 다운로드**: 매물 관련 모든 파일 ZIP 다운로드
4. **버전 관리**: 계약서 등 중요 문서의 버전 관리

## 4. 구현 우선순위

1. 기본 업로드/다운로드 기능
2. 폴더 구조 관리
3. 권한 관리
4. 고급 기능 (미리보기, 버전 관리 등)