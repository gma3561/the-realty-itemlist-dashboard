// Browser-compatible version of KeychainManager
// Node.js modules are not available in browser environment

class KeychainManager {
  constructor() {
    this.serviceName = 'the-realty-dashboard';
  }

  async storeSecret(key, value) {
    try {
      // In browser, use localStorage as fallback
      localStorage.setItem(`${this.serviceName}_${key}`, value);
      // console.log(`Secret stored in localStorage: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to store secret: ${key}`, error);
      return false;
    }
  }

  async getSecret(key) {
    try {
      // In browser, use localStorage as fallback
      const value = localStorage.getItem(`${this.serviceName}_${key}`);
      return value || null;
    } catch (error) {
      // console.warn(`Secret not found: ${key}`);
      return null;
    }
  }

  async deleteSecret(key) {
    try {
      // In browser, use localStorage as fallback
      localStorage.removeItem(`${this.serviceName}_${key}`);
      // console.log(`Secret deleted: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete secret: ${key}`, error);
      return false;
    }
  }

  async hasSecret(key) {
    try {
      const value = await this.getSecret(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  async initializeGoogleDriveKeys() {
    const keys = {
      'GOOGLE_CLIENT_EMAIL': import.meta.env?.VITE_GOOGLE_CLIENT_EMAIL || '',
      'GOOGLE_PRIVATE_KEY': import.meta.env?.VITE_GOOGLE_PRIVATE_KEY || '',
      'GOOGLE_PROJECT_ID': import.meta.env?.VITE_GOOGLE_PROJECT_ID || '',
      'GOOGLE_DRIVE_ROOT_FOLDER_ID': import.meta.env?.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID || '',
      'GOOGLE_DRIVE_SHARE_FOLDER_ID': import.meta.env?.VITE_GOOGLE_DRIVE_SHARE_FOLDER_ID || ''
    };

    const results = {};
    for (const [key, value] of Object.entries(keys)) {
      if (value && value !== 'your-service-account@project.iam.gserviceaccount.com') {
        const stored = await this.storeSecret(key, value);
        results[key] = stored;
      }
    }

    return results;
  }

  async getGoogleDriveConfig() {
    try {
      const config = {
        client_email: await this.getSecret('GOOGLE_CLIENT_EMAIL'),
        private_key: await this.getSecret('GOOGLE_PRIVATE_KEY'),
        project_id: await this.getSecret('GOOGLE_PROJECT_ID'),
        root_folder_id: await this.getSecret('GOOGLE_DRIVE_ROOT_FOLDER_ID'),
        share_folder_id: await this.getSecret('GOOGLE_DRIVE_SHARE_FOLDER_ID')
      };

      // 필수 값 검증
      const requiredKeys = ['client_email', 'private_key', 'project_id'];
      const missing = requiredKeys.filter(key => !config[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required Google Drive configuration: ${missing.join(', ')}`);
      }

      return config;
    } catch (error) {
      console.error('Failed to get Google Drive config from keychain:', error);
      throw error;
    }
  }

  async getPublicDataApiKey() {
    try {
      const apiKey = await this.getSecret('PUBLIC_DATA_API_KEY');
      if (!apiKey) {
        throw new Error('공공데이터포털 API 키가 설정되지 않았습니다.');
      }
      return apiKey;
    } catch (error) {
      console.error('Failed to get Public Data API key from keychain:', error);
      throw error;
    }
  }

  async setPublicDataApiKey(apiKey) {
    try {
      const stored = await this.storeSecret('PUBLIC_DATA_API_KEY', apiKey);
      return stored;
    } catch (error) {
      console.error('Failed to store Public Data API key in keychain:', error);
      throw error;
    }
  }

  async setupInitialKeys() {
    // console.log('Setting up keychain for The Realty Dashboard...');
    
    const prompts = [
      'Google 서비스 계정 이메일을 입력하세요:',
      'Google Private Key를 입력하세요 (전체 키 포함):',
      'Google Project ID를 입력하세요:',
      'Google Drive 루트 폴더 ID를 입력하세요:',
      'Google Drive 공유 폴더 ID를 입력하세요:'
    ];

    const keys = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY', 
      'GOOGLE_PROJECT_ID',
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
      'GOOGLE_DRIVE_SHARE_FOLDER_ID'
    ];

    // In browser environment, this method is not supported
    // console.warn('setupInitialKeys is not supported in browser environment');
    return {};
  }

  async listStoredKeys() {
    const keys = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_PROJECT_ID', 
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
      'GOOGLE_DRIVE_SHARE_FOLDER_ID',
      'PUBLIC_DATA_API_KEY'
    ];

    const status = {};
    for (const key of keys) {
      status[key] = await this.hasSecret(key);
    }

    return status;
  }

  async clearAllKeys() {
    const keys = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_PROJECT_ID',
      'GOOGLE_DRIVE_ROOT_FOLDER_ID', 
      'GOOGLE_DRIVE_SHARE_FOLDER_ID',
      'PUBLIC_DATA_API_KEY'
    ];

    const results = {};
    for (const key of keys) {
      results[key] = await this.deleteSecret(key);
    }

    return results;
  }
}

export default new KeychainManager();