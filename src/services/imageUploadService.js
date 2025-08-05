import googleDriveService from './googleDriveService';
import { supabase } from './supabase';

class ImageUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }

  validateFile(file) {
    if (!file) {
      throw new Error('파일이 선택되지 않았습니다.');
    }

    if (file.size > this.maxFileSize) {
      throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)');
    }

    return true;
  }

  async createThumbnail(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 썸네일 크기 설정 (400x300)
        const maxWidth = 400;
        const maxHeight = 300;
        
        let { width, height } = img;
        
        // 비율 유지하면서 크기 조정
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('썸네일 생성에 실패했습니다.'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async uploadPropertyImages(propertyId, propertyName, files, userId) {
    if (!propertyId || !propertyName || !files || files.length === 0) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    const results = [];
    let driveFolder = null;

    try {
      // Google Drive 폴더 생성 (한 번만)
      driveFolder = await googleDriveService.createPropertyFolder(propertyId, propertyName);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const displayOrder = i + 1;

        try {
          // 파일 유효성 검사
          this.validateFile(file);

          // 1. 썸네일 생성
          const thumbnailBlob = await this.createThumbnail(file);
          
          // 2. 원본을 Google Drive에 업로드
          const originalFileName = `${String(displayOrder).padStart(2, '0')}_${file.name}`;
          const fileBuffer = await file.arrayBuffer();
          
          const driveFile = await googleDriveService.uploadImage(
            Buffer.from(fileBuffer),
            originalFileName,
            driveFolder.id,
            file.type
          );


          // 3. 썸네일을 Supabase Storage에 업로드
          const thumbnailFileName = `${propertyId}/thumb_${displayOrder}_${file.name}`;
          const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();
          
          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('property-thumbnails')
            .upload(thumbnailFileName, thumbnailArrayBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '31536000' // 1년 캐시
            });

          if (thumbnailError) {
            console.error('Thumbnail upload error:', thumbnailError);
            throw thumbnailError;
          }


          // 4. 썸네일 public URL 생성
          const { data: publicUrlData } = supabase.storage
            .from('property-thumbnails')
            .getPublicUrl(thumbnailData.path);

          // 5. DB에 이미지 정보 저장
          const { data: imageRecord, error: dbError } = await supabase
            .from('property_images')
            .insert({
              property_id: propertyId,
              google_drive_id: driveFile.id,
              google_drive_url: googleDriveService.getImageUrl(driveFile.id),
              google_folder_id: driveFolder.id,
              thumbnail_path: thumbnailData.path,
              thumbnail_url: publicUrlData.publicUrl,
              original_filename: file.name,
              file_size: parseInt(driveFile.size || file.size),
              mime_type: file.type,
              display_order: displayOrder,
              is_primary: i === 0, // 첫 번째 이미지를 대표 이미지로
              uploaded_by: userId
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database insert error:', dbError);
            throw dbError;
          }

          results.push(imageRecord);

        } catch (error) {
          console.error(`이미지 업로드 실패 (${file.name}):`, error);
          // 실패한 파일은 건너뛰고 계속 진행
          results.push({
            error: error.message,
            filename: file.name
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Property images upload failed:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      // DB에서 이미지 정보 가져오기
      const { data: image, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error || !image) {
        throw new Error('이미지를 찾을 수 없습니다.');
      }

      // Google Drive에서 삭제
      try {
        await googleDriveService.deleteFile(image.google_drive_id);
      } catch (driveError) {
      }

      // Supabase 썸네일 삭제
      try {
        const { error: storageError } = await supabase.storage
          .from('property-thumbnails')
          .remove([image.thumbnail_path]);
        
        if (storageError) {
        } else {
        }
      } catch (supabaseError) {
      }

      // DB에서 삭제
      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        throw deleteError;
      }

      return true;

    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  }

  async reorderImages(imageIds) {
    try {
      const updates = imageIds.map((id, index) => ({
        id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('property_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) {
          throw error;
        }
      }

      return true;

    } catch (error) {
      console.error('Image reordering failed:', error);
      throw error;
    }
  }

  async setPrimaryImage(imageId, propertyId) {
    try {
      // 모든 이미지의 is_primary를 false로 설정
      await supabase
        .from('property_images')
        .update({ is_primary: false })
        .eq('property_id', propertyId);

      // 선택된 이미지만 is_primary를 true로 설정
      const { error } = await supabase
        .from('property_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      console.error('Setting primary image failed:', error);
      throw error;
    }
  }

  async getPropertyImages(propertyId) {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order');

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Getting property images failed:', error);
      throw error;
    }
  }

  async getPrimaryImage(propertyId) {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // 대표 이미지가 없으면 첫 번째 이미지 반환
      if (!data) {
        const { data: firstImage, error: firstError } = await supabase
          .from('property_images')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order')
          .limit(1)
          .single();

        if (firstError && firstError.code !== 'PGRST116') {
          throw firstError;
        }

        return firstImage;
      }

      return data;

    } catch (error) {
      console.error('Getting primary image failed:', error);
      throw error;
    }
  }
}

export default new ImageUploadService();