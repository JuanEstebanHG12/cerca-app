import * as SecureStoreExpo from 'expo-secure-store';
import { SecureStore } from '../../application/ports/SecureStore';

export class ExpoSecureStoreAdapter implements SecureStore {
  async get(key: string): Promise<string | null> {
    return await SecureStoreExpo.getItemAsync(key);
  }

  async set(key: string, value: string): Promise<void> {
    await SecureStoreExpo.setItemAsync(key, value);
  }

  async delete(key: string): Promise<void> {
    await SecureStoreExpo.deleteItemAsync(key);
  }
}