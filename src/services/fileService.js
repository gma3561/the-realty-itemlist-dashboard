import { supabase } from './supabase';

class FileService {
  constructor() {
    this.bucketName = 'property-files';
  }

  // 파일 업로드
  async uploadFile(file, propertyId) {
    try {
      // 파일명 생성 (중복 방지를 위해 타임스탬프 추가)
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${timestamp}_${file.name}`;

      // Supabase Storage에 파일 업로드
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 파일 메타데이터 DB에 저장
      const { data: fileRecord, error: dbError } = await supabase
        .from('property_files')
        .insert({
          property_id: propertyId,
          file_name: file.name,
          file_path: data.path,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return fileRecord;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // 파일 목록 조회
  async getPropertyFiles(propertyId) {
    try {
      const { data, error } = await supabase
        .from('property_files')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 각 파일의 다운로드 URL 생성
      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from(this.bucketName)
            .createSignedUrl(file.file_path, 3600); // 1시간 유효

          return {
            ...file,
            downloadUrl: urlData?.signedUrl,
            storage_path: file.file_path, // 컬럼명 변경 대응
            file_size: file.file_size || 0,
            file_type: file.file_type || 'application/octet-stream'
          };
        })
      );

      return filesWithUrls;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }

  // 파일 삭제
  async deleteFile(fileId, storagePath) {
    try {
      // Storage에서 파일 삭제
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (storageError) throw storageError;

      // DB에서 레코드 삭제
      const { error: dbError } = await supabase
        .from('property_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  // 파일 다운로드
  async downloadFile(storagePath, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(storagePath);

      if (error) throw error;

      // 브라우저에서 다운로드 트리거
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  }

  // 파일 크기 포맷팅
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 파일 타입별 아이콘 결정
  getFileIcon(fileType) {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('video')) return '🎥';
    return '📎';
  }
}

export default new FileService();