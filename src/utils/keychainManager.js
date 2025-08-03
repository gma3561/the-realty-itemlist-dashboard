import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class KeychainManager {
  constructor() {
    this.serviceName = 'the-realty-dashboard';
  }

  async storeSecret(key, value) {
    try {
      const command = `security add-generic-password -a "${key}" -s "${this.serviceName}" -w "${value}" -U`;
      await execAsync(command);
      console.log(`Secret stored in keychain: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to store secret in keychain: ${key}`, error);
      return false;
    }
  }

  async getSecret(key) {
    try {
      const command = `security find-generic-password -a "${key}" -s "${this.serviceName}" -w`;
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      console.warn(`Secret not found in keychain: ${key}`);
      return null;
    }
  }

  async deleteSecret(key) {
    try {
      const command = `security delete-generic-password -a "${key}" -s "${this.serviceName}"`;
      await execAsync(command);
      console.log(`Secret deleted from keychain: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete secret from keychain: ${key}`, error);
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
      'GOOGLE_CLIENT_EMAIL': process.env.GOOGLE_CLIENT_EMAIL,
      'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY,
      'GOOGLE_PROJECT_ID': process.env.GOOGLE_PROJECT_ID,
      'GOOGLE_DRIVE_ROOT_FOLDER_ID': process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      'GOOGLE_DRIVE_SHARE_FOLDER_ID': process.env.GOOGLE_DRIVE_SHARE_FOLDER_ID
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

  async setupInitialKeys() {
    console.log('Setting up keychain for The Realty Dashboard...');
    
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

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question + ' ', resolve);
      });
    };

    try {
      const values = {};
      for (let i = 0; i < prompts.length; i++) {
        const value = await askQuestion(prompts[i]);
        if (value.trim()) {
          values[keys[i]] = value.trim();
        }
      }

      rl.close();

      // 키체인에 저장
      const results = {};
      for (const [key, value] of Object.entries(values)) {
        results[key] = await this.storeSecret(key, value);
      }

      console.log('Keychain setup completed:', results);
      return results;

    } catch (error) {
      rl.close();
      console.error('Keychain setup failed:', error);
      throw error;
    }
  }

  async listStoredKeys() {
    const keys = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_PROJECT_ID', 
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
      'GOOGLE_DRIVE_SHARE_FOLDER_ID'
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
      'GOOGLE_DRIVE_SHARE_FOLDER_ID'
    ];

    const results = {};
    for (const key of keys) {
      results[key] = await this.deleteSecret(key);
    }

    return results;
  }
}

export default new KeychainManager();