import { LocalStorageProvider } from './localStorageProvider.js';
import { S3StorageProvider } from './s3StorageProvider.js';
import { env } from '../../config/env.js';

let storageInstance = null;

export function getStorageProvider() {
  if (storageInstance) return storageInstance;

  if (env.STORAGE?.PROVIDER === 's3' || process.env.STORAGE_PROVIDER === 's3') {
    storageInstance = new S3StorageProvider();
  } else {
    storageInstance = new LocalStorageProvider();
  }
  return storageInstance;
}

export class StorageService {
  static async upload(file) {
    const provider = getStorageProvider();
    return provider.upload(file);
  }

  static async getSignedUrl(key) {
    const provider = getStorageProvider();
    return provider.getSignedUrl(key);
  }

  static getLocalFilePath(key) {
    const provider = getStorageProvider();
    if (typeof provider.getFilePath === 'function') {
      return provider.getFilePath(key);
    }
    return null;
  }
}
