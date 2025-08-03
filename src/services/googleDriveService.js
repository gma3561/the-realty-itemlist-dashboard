import { google } from 'googleapis';
import keychainManager from '../utils/keychainManager.js';

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initialized = false;
    this.config = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // 키체인에서 Google Drive 설정 가져오기
      this.config = await keychainManager.getGoogleDriveConfig();
      
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.config.client_email,
          private_key: this.config.private_key.replace(/\\n/g, '\n'),
          project_id: this.config.project_id
        },
        scopes: ['https://www.googleapis.com/auth/drive']
      });
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.initialized = true;
      // console.log('Google Drive service initialized successfully from keychain');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  async createPropertyFolder(propertyId, propertyName) {
    await this.initialize();
    
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const folderName = `${propertyName}_${propertyId}`.replace(/[/\\?%*:|"<>]/g, '-');
    
    try {
      // 년-월 폴더 확인/생성
      const yearMonthFolder = await this.findOrCreateFolder(
        `${year}-${month}`,
        this.config.root_folder_id || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      );
      
      // 매물 폴더 생성
      const propertyFolder = await this.findOrCreateFolder(
        folderName,
        yearMonthFolder.id
      );
      
      return propertyFolder;
    } catch (error) {
      console.error('Failed to create property folder:', error);
      throw error;
    }
  }

  async findOrCreateFolder(name, parentId) {
    try {
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
    } catch (error) {
      console.error(`Failed to find or create folder ${name}:`, error);
      throw error;
    }
  }

  async uploadImage(fileBuffer, fileName, folderId, mimeType) {
    await this.initialize();
    
    try {
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
    } catch (error) {
      console.error(`Failed to upload image ${fileName}:`, error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    await this.initialize();
    
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      // console.log(`File ${fileId} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete file ${fileId}:`, error);
      throw error;
    }
  }

  getImageUrl(fileId, size = 'original') {
    if (!fileId) return null;
    
    if (size === 'thumbnail') {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  async createShareFolder(propertyId, shareToken) {
    await this.initialize();
    
    try {
      const folderName = `share_${shareToken}`;
      const shareFolder = await this.findOrCreateFolder(
        folderName,
        this.config.share_folder_id || process.env.GOOGLE_DRIVE_SHARE_FOLDER_ID
      );
      
      return shareFolder;
    } catch (error) {
      console.error('Failed to create share folder:', error);
      throw error;
    }
  }

  async copyImageToShareFolder(originalFileId, shareFolderId) {
    await this.initialize();
    
    try {
      const response = await this.drive.files.copy({
        fileId: originalFileId,
        resource: {
          parents: [shareFolderId]
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to copy image to share folder:', error);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    await this.initialize();
    
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, size, mimeType, createdTime, modifiedTime'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get file info for ${fileId}:`, error);
      throw error;
    }
  }

  async listFolderContents(folderId) {
    await this.initialize();
    
    try {
      const response = await this.drive.files.list({
        q: `parents in '${folderId}'`,
        fields: 'files(id, name, mimeType, size, createdTime)',
        orderBy: 'createdTime desc'
      });
      
      return response.data.files;
    } catch (error) {
      console.error(`Failed to list folder contents for ${folderId}:`, error);
      throw error;
    }
  }
}

export default new GoogleDriveService();