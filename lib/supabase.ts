import 'react-native-url-polyfill/auto';

import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

const memoryStorage = new Map<string, string>();

const webStorage: SupportedStorage = {
  getItem: async (key) => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

const nativeStorage: SupportedStorage = {
  getItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ?? memoryStorage.get(key) ?? null;
    } catch (error) {
      console.log('supabase.nativeStorage.getItem error', error);
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    memoryStorage.set(key, value);

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.log('supabase.nativeStorage.setItem error', error);
    }
  },
  removeItem: async (key) => {
    memoryStorage.delete(key);

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.log('supabase.nativeStorage.removeItem error', error);
    }
  },
};

const storage = Platform.OS === 'web' ? webStorage : nativeStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
