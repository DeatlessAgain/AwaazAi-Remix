import { GeneratedAudioItem } from '../types';

const DB_NAME = 'awaaz_ai_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_library';
const LEGACY_STORAGE_KEY = 'awaaz_ai_audio_library_v1';

let inMemoryBackup: GeneratedAudioItem[] = [];

// Open or initialize the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('IndexedDB open failed, falling back to memory/storage', request.error);
      reject(request.error);
    };
  });
}

/**
 * Fetch all audio items from IndexedDB sorted by newest first
 */
export async function getLibraryFromDB(): Promise<GeneratedAudioItem[]> {
  try {
    const db = await openDB();
    const items: GeneratedAudioItem[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve((request.result || []).reverse());
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    if (items.length > 0) {
      inMemoryBackup = items;
      return items;
    }

    // Attempt migration from legacy localStorage if IndexedDB was empty
    const migrated = migrateFromLegacyLocalStorage();
    if (migrated.length > 0) {
      await saveLibraryToDB(migrated);
      return migrated;
    }

    return inMemoryBackup;
  } catch (err) {
    console.warn('Could not read from IndexedDB, trying fallback:', err);
    return inMemoryBackup.length > 0 ? inMemoryBackup : migrateFromLegacyLocalStorage();
  }
}

/**
 * Persist an entire list of audio items to IndexedDB
 */
export async function saveLibraryToDB(items: GeneratedAudioItem[]): Promise<void> {
  inMemoryBackup = items;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing records in transaction
      store.clear();

      // Put all items
      items.forEach((item) => {
        store.put(item);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });

    // Clean up legacy localStorage to free up browser quota
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  } catch (err) {
    console.warn('Failed to save library to IndexedDB, fallback stored in memory:', err);
  }
}

/**
 * Add or update a single item in IndexedDB
 */
export async function saveSingleItemToDB(item: GeneratedAudioItem): Promise<void> {
  // Update memory backup
  inMemoryBackup = [item, ...inMemoryBackup.filter((i) => i.id !== item.id)];

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(item);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.warn('Failed to save single item to IndexedDB:', err);
  }
}

/**
 * Delete a single item by id from IndexedDB
 */
export async function deleteItemFromDB(id: string): Promise<void> {
  inMemoryBackup = inMemoryBackup.filter((item) => item.id !== id);

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.warn('Failed to delete item from IndexedDB:', err);
  }
}

/**
 * Clear all items from IndexedDB
 */
export async function clearLibraryDB(): Promise<void> {
  inMemoryBackup = [];

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }
}

/**
 * Migrate and clean up any legacy items stored in localStorage
 */
function migrateFromLegacyLocalStorage(): GeneratedAudioItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Free localStorage space immediately
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      inMemoryBackup = parsed;
      return parsed;
    }
  } catch (e) {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return [];
}
