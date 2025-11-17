const STORAGE_KEYS = {
  USER_SCRIPT: 'userScript',
  USER_IMAGE: 'userImage',
} as const;

export const localStorageUtils = {
  get: <T>(key: string, defaultValue: T | null = null): T | null => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

export const gameStorage = {
  getScript: (): string | null => {
    const item = localStorage.getItem(STORAGE_KEYS.USER_SCRIPT);
    return item || null;
  },

  setScript: (script: string): void => {
    localStorage.setItem(STORAGE_KEYS.USER_SCRIPT, script);
  },

  getImage: (): string | null => {
    const item = localStorage.getItem(STORAGE_KEYS.USER_IMAGE);
    return item || null;
  },

  setImage: (image: string | null): void => {
    if (image) {
      localStorage.setItem(STORAGE_KEYS.USER_IMAGE, image);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_IMAGE);
    }
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER_SCRIPT);
    localStorage.removeItem(STORAGE_KEYS.USER_IMAGE);
  },
};

