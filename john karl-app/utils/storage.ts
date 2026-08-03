import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const APP_PREFIX = 'lineageai_';

/**
 * Production-level general purpose storage service (AsyncStorage wrapper)
 */
export const StorageService = {
  /**
   * Store a string value
   */
  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${APP_PREFIX}${key}`, value);
    } catch (error) {
      console.error(`Error setting string in AsyncStorage for key ${key}:`, error);
    }
  },

  /**
   * Retrieve a string value
   */
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${APP_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error getting string from AsyncStorage for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Store any JSON-serializable item
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`${APP_PREFIX}${key}`, jsonValue);
    } catch (error) {
      console.error(`Error setting item in AsyncStorage for key ${key}:`, error);
    }
  },

  /**
   * Retrieve and parse any JSON-serializable item
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${APP_PREFIX}${key}`);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (error) {
      console.error(`Error getting item from AsyncStorage for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove a key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${APP_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing key from AsyncStorage ${key}:`, error);
    }
  },

  /**
   * Clear all storage items belonging to this app
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith(APP_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};

/**
 * Production-level Secure Storage Service (Expo SecureStore wrapper)
 * Use this only for sensitive credentials like JWT Auth Tokens, API keys, etc.
 */
export const SecureStorageService = {
  /**
   * Check if SecureStore is available on the platform
   */
  async isAvailable(): Promise<boolean> {
    return await SecureStore.isAvailableAsync();
  },

  /**
   * Securely save a key-value pair
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(`${APP_PREFIX}${key}`, value, {
          keychainService: 'lineageai_keychain',
        });
      } else {
        // Fallback for unsupported platforms (e.g., Web) in development
        await StorageService.setString(key, value);
      }
    } catch (error) {
      console.error(`Error saving secure key ${key}:`, error);
    }
  },

  /**
   * Securely fetch a value
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        return await SecureStore.getItemAsync(`${APP_PREFIX}${key}`, {
          keychainService: 'lineageai_keychain',
        });
      } else {
        return await StorageService.getString(key);
      }
    } catch (error) {
      console.error(`Error fetching secure key ${key}:`, error);
      return null;
    }
  },

  /**
   * Securely delete a value
   */
  async removeItem(key: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(`${APP_PREFIX}${key}`, {
          keychainService: 'lineageai_keychain',
        });
      } else {
        await StorageService.removeItem(key);
      }
    } catch (error) {
      console.error(`Error deleting secure key ${key}:`, error);
    }
  },
};
