# Google Drive 하이브리드 이미지 관리 시스템

## 1. 시스템 아키텍처

### 1.1 저장 전략
```
사용자 업로드
    ↓
┌─ 썸네일(400x300) → Supabase Storage (빠른 로딩용)
└─ 원본 이미지 → Google Drive (무제한 저장)
    ↓
DB에 양쪽 URL 저장
```

### 1.2 폴더 구조
```
Google Drive: 팀 매물장
├── 2024-08/
│   ├── 청담파라곤2_201-502/
│   │   ├── 01_거실.jpg
│   │   ├── 02_방1.jpg
│   │   └── 03_주방.jpg
│   └── 해운대엘시티_A-1001/
├── 2024-09/
└── shared-links/  (외부 공유용 폴더)
```

## 2. Supabase 스키마 변경

### 2.1 기존 property_media 테이블 수정
```sql
-- 기존 테이블 삭제
DROP TABLE IF EXISTS property_media;

-- 새로운 이미지 관리 테이블
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Google Drive 정보
  google_drive_id TEXT NOT NULL,
  google_drive_url TEXT NOT NULL,
  google_folder_id TEXT,
  
  -- Supabase 썸네일
  thumbnail_path TEXT,
  thumbnail_url TEXT,
  
  -- 파일 정보
  original_filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  
  -- 표시 정보
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,
  
  -- 메타데이터
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_display_order ON property_images(property_id, display_order);
```

### 2.2 외부 공유를 위한 테이블 수정
```sql
-- 공유 링크 테이블 확장
ALTER TABLE property_shares ADD COLUMN share_folder_id TEXT; -- Google Drive 공유 폴더
ALTER TABLE property_shares ADD COLUMN include_high_quality BOOLEAN DEFAULT false;
```

## 3. Google Drive API 설정

### 3.1 환경변수 설정
```env
# Google Drive API
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# Google Drive 폴더 구조
GOOGLE_DRIVE_ROOT_FOLDER_ID=1234567890abcdef
GOOGLE_DRIVE_SHARE_FOLDER_ID=abcdef1234567890
```

### 3.2 Google Drive 서비스 설정
```javascript
// src/services/googleDriveService.js
import { google } from 'googleapis';

class GoogleDriveService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
      },
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // 매물별 폴더 생성
  async createPropertyFolder(propertyId, propertyName) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const folderName = `${propertyName}_${propertyId}`.replace(/[/\\?%*:|"<>]/g, '-');
    
    // 년-월 폴더 확인/생성
    const yearMonthFolder = await this.findOrCreateFolder(
      `${year}-${month}`,
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    );
    
    // 매물 폴더 생성
    const propertyFolder = await this.findOrCreateFolder(
      folderName,
      yearMonthFolder.id
    );
    
    return propertyFolder;
  }

  // 폴더 찾기 또는 생성
  async findOrCreateFolder(name, parentId) {
    // 기존 폴더 검색
    const query = `name='${name}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`;
    const response = await this.drive.files.list({ q: query });
    
    if (response.data.files.length > 0) {
      return response.data.files[0];
    }
    
    // 새 폴더 생성
    const folderMetadata = {
      name: name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink'
    });
    
    return folder.data;
  }

  // 이미지 업로드
  async uploadImage(fileBuffer, fileName, folderId, mimeType) {
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType: mimeType,
      body: fileBuffer
    };
    
    const response = await this.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, size'
    });
    
    // 파일을 누구나 볼 수 있도록 권한 설정
    await this.drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    return response.data;
  }

  // 이미지 URL 생성
  getImageUrl(fileId, size = 'original') {
    if (size === 'thumbnail') {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // 공유 폴더 생성 (외부 공유용)
  async createShareFolder(propertyId, shareToken) {
    const folderName = `share_${shareToken}`;
    const shareFolder = await this.findOrCreateFolder(
      folderName,
      process.env.GOOGLE_DRIVE_SHARE_FOLDER_ID
    );
    
    return shareFolder;
  }
}

export default new GoogleDriveService();
```

## 4. 이미지 업로드 서비스 수정

### 4.1 파일 업로드 서비스
```javascript
// src/services/imageUploadService.js
import googleDriveService from './googleDriveService';
import { supabase } from './supabase';
import sharp from 'sharp';

class ImageUploadService {
  // 이미지 업로드 (썸네일 + 원본)
  async uploadPropertyImages(propertyId, propertyName, files) {
    const results = [];
    
    // Google Drive 폴더 생성
    const driveFolder = await googleDriveService.createPropertyFolder(
      propertyId, 
      propertyName
    );
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const displayOrder = i + 1;
      
      try {
        // 1. 썸네일 생성 (400x300)
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(400, 300, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        // 2. 썸네일을 Supabase에 업로드
        const thumbnailFileName = `${propertyId}/thumb_${displayOrder}_${file.originalname}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('property-thumbnails')
          .upload(thumbnailFileName, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '31536000' // 1년 캐시
          });
        
        if (thumbnailError) throw thumbnailError;
        
        // 3. 원본을 Google Drive에 업로드
        const originalFileName = `${String(displayOrder).padStart(2, '0')}_${file.originalname}`;
        const driveFile = await googleDriveService.uploadImage(
          file.buffer,
          originalFileName,
          driveFolder.id,
          file.mimetype
        );
        
        // 4. DB에 이미지 정보 저장
        const { data: imageRecord, error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            google_drive_id: driveFile.id,
            google_drive_url: googleDriveService.getImageUrl(driveFile.id),
            google_folder_id: driveFolder.id,
            thumbnail_path: thumbnailData.path,
            thumbnail_url: supabase.storage.from('property-thumbnails').getPublicUrl(thumbnailData.path).data.publicUrl,
            original_filename: file.originalname,
            file_size: parseInt(driveFile.size),
            mime_type: file.mimetype,
            display_order: displayOrder,
            is_primary: i === 0, // 첫 번째 이미지를 대표 이미지로
            uploaded_by: user.id
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        results.push(imageRecord);
        
      } catch (error) {
        console.error(`이미지 업로드 실패 (${file.originalname}):`, error);
        // 실패한 파일은 건너뛰고 계속 진행
      }
    }
    
    return results;
  }

  // 이미지 삭제
  async deleteImage(imageId) {
    // DB에서 이미지 정보 가져오기
    const { data: image, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('id', imageId)
      .single();
    
    if (error || !image) throw new Error('이미지를 찾을 수 없습니다.');
    
    // Google Drive에서 삭제
    try {
      await googleDriveService.drive.files.delete({
        fileId: image.google_drive_id
      });
    } catch (driveError) {
      console.warn('Google Drive 파일 삭제 실패:', driveError);
    }
    
    // Supabase 썸네일 삭제
    try {
      await supabase.storage
        .from('property-thumbnails')
        .remove([image.thumbnail_path]);
    } catch (supabaseError) {
      console.warn('Supabase 썸네일 삭제 실패:', supabaseError);
    }
    
    // DB에서 삭제
    await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);
  }

  // 이미지 순서 변경
  async reorderImages(imageIds) {
    const updates = imageIds.map((id, index) => ({
      id,
      display_order: index + 1
    }));
    
    for (const update of updates) {
      await supabase
        .from('property_images')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  }
}

export default new ImageUploadService();
```

## 5. 프론트엔드 컴포넌트 수정

### 5.1 이미지 업로드 컴포넌트
```jsx
// src/components/property/PropertyImageUpload.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageUploadService from '../../services/imageUploadService';

const PropertyImageUpload = ({ propertyId, propertyName, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!propertyId || !propertyName) {
      alert('매물 정보를 먼저 저장해주세요.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const results = await imageUploadService.uploadPropertyImages(
        propertyId,
        propertyName,
        acceptedFiles
      );

      setProgress(100);
      onUploadComplete(results);
      
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [propertyId, propertyName, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="image-upload">
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
            <p>업로드 중... {progress}%</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyImageUpload;
```

### 5.2 이미지 갤러리 컴포넌트
```jsx
// src/components/property/PropertyImageGallery.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import imageUploadService from '../../services/imageUploadService';

const PropertyImageGallery = ({ propertyId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadImages();
  }, [propertyId]);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('이미지 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const newImages = Array.from(images);
    const [reorderedItem] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedItem);

    setImages(newImages);

    // 서버에 순서 업데이트
    const imageIds = newImages.map(img => img.id);
    await imageUploadService.reorderImages(imageIds);
  };

  const deleteImage = async (imageId) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    try {
      await imageUploadService.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      onImagesChange?.(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">이미지를 불러오는 중...</div>;
  }

  return (
    <div className="image-gallery">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative group cursor-pointer ${
                        snapshot.isDragging ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-lg border">
                        {/* 썸네일 표시 */}
                        <img
                          src={image.thumbnail_url}
                          alt={image.alt_text || `매물 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedImage(image)}
                        />
                        
                        {/* 순서 번호 */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        
                        {/* 대표 이미지 표시 */}
                        {image.is_primary && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            대표
                          </div>
                        )}
                        
                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(image.id);
                          }}
                          className="absolute bottom-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 이미지 상세 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              {/* 원본 이미지 표시 */}
              <img
                src={selectedImage.google_drive_url}
                alt={selectedImage.alt_text}
                className="max-w-full max-h-screen object-contain"
              />
              
              {/* 닫기 버튼 */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGallery;
```

## 6. 외부 공유 시스템 수정

### 6.1 공유 링크 생성 시 Google Drive 연동
```javascript
// src/services/shareService.js
import googleDriveService from './googleDriveService';
import { supabase } from './supabase';

class ShareService {
  async createShareLink(propertyId, options = {}) {
    const shareToken = this.generateSecureToken();
    
    // 공유용 Google Drive 폴더 생성 (고화질 이미지 포함 시)
    let shareFolderId = null;
    if (options.includeHighQuality) {
      const shareFolder = await googleDriveService.createShareFolder(
        propertyId,
        shareToken
      );
      shareFolderId = shareFolder.id;
      
      // 원본 이미지들을 공유 폴더에 복사
      await this.copyImagesToShareFolder(propertyId, shareFolderId);
    }
    
    const shareData = {
      property_id: propertyId,
      share_token: shareToken,
      share_folder_id: shareFolderId,
      include_high_quality: options.includeHighQuality || false,
      expires_at: options.expiresIn ? this.addDays(new Date(), options.expiresIn) : null,
      view_limit: options.viewLimit || null,
      hide_contact: options.hideContact !== false,
      hide_price: options.hidePrice || false,
      created_by: options.userId
    };
    
    const { data } = await supabase
      .from('property_shares')
      .insert(shareData)
      .select()
      .single();
    
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    return { shareUrl, shareData: data };
  }
  
  async copyImagesToShareFolder(propertyId, shareFolderId) {
    const { data: images } = await supabase
      .from('property_images')
      .select('google_drive_id')
      .eq('property_id', propertyId)
      .order('display_order');
    
    for (const image of images) {
      await googleDriveService.drive.files.copy({
        fileId: image.google_drive_id,
        resource: {
          parents: [shareFolderId]
        }
      });
    }
  }
}

export default new ShareService();
```

## 7. 패키지 설치 및 설정

### 7.1 필요한 패키지 설치
```bash
npm install googleapis sharp react-dropzone react-beautiful-dnd
```

### 7.2 package.json 업데이트
```json
{
  "dependencies": {
    "googleapis": "^118.0.0",
    "sharp": "^0.32.0",
    "react-dropzone": "^14.2.3",
    "react-beautiful-dnd": "^13.1.1"
  }
}
```

## 8. 배포 시 주의사항

### 8.1 환경변수 설정
Vercel/Netlify 배포 시 환경변수 등록:
```
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_PROJECT_ID
GOOGLE_DRIVE_ROOT_FOLDER_ID
GOOGLE_DRIVE_SHARE_FOLDER_ID
```

### 8.2 Supabase Storage Bucket 생성
```sql
-- Supabase 대시보드에서 버킷 생성
-- Bucket name: property-thumbnails
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
```

이렇게 구현하면 **5TB Google Drive + Supabase 조합**으로 무제한 이미지 관리가 가능합니다!