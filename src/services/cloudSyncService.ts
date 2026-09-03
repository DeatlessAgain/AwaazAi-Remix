import { GeneratedAudioItem } from '../types';
import {
  saveLibraryToDB,
  getLibraryFromDB,
} from '../utils/audioStorage';
import {
  getActiveFirebaseConfig,
  pullLibraryFromFirestore,
  pushItemToFirestore,
} from './firebaseConfig';

const SYNC_KEY_STORAGE = 'awaaz_cloud_sync_key';
const AUTO_SYNC_STORAGE = 'awaaz_cloud_auto_sync';
const LAST_SYNCED_STORAGE = 'awaaz_cloud_last_synced';

/**
 * Generate a clean, human-friendly sync key (e.g. AWAAZ-7824-3910)
 */
export function generateRandomSyncKey(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `AWAAZ-${part1}-${part2}`;
}

export function getStoredSyncKey(): string {
  try {
    const existing = localStorage.getItem(SYNC_KEY_STORAGE);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const newKey = generateRandomSyncKey();
    localStorage.setItem(SYNC_KEY_STORAGE, newKey);
    return newKey;
  } catch {
    return 'AWAAZ-STUDIO-DEMO';
  }
}

export function setStoredSyncKey(key: string): void {
  try {
    localStorage.setItem(SYNC_KEY_STORAGE, key.trim());
  } catch (e) {
    console.warn('Failed to store sync key:', e);
  }
}

export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SYNC_STORAGE);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_STORAGE, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to store auto sync setting:', e);
  }
}

export function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNCED_STORAGE);
  } catch {
    return null;
  }
}

export function setLastSyncedAt(timestamp: string): void {
  try {
    localStorage.setItem(LAST_SYNCED_STORAGE, timestamp);
  } catch (e) {
    console.warn('Failed to store last synced at:', e);
  }
}

export interface SyncResult {
  success: boolean;
  items: GeneratedAudioItem[];
  addedCount: number;
  lastSyncedAt: string;
  source: 'firebase' | 'cloud_server';
  error?: string;
}

/**
 * Full bidirectional synchronization with Cloud
 * Pushes local library and pulls cloud items, merging without duplicates
 */
export async function synchronizeLibrary(
  localItems: GeneratedAudioItem[],
  customSyncKey?: string
): Promise<SyncResult> {
  const syncKey = customSyncKey || getStoredSyncKey();
  const firebaseConfig = getActiveFirebaseConfig();

  // 1. Try Firebase Firestore first if configured
  if (firebaseConfig) {
    try {
      const firestoreItems = await pullLibraryFromFirestore(syncKey);

      // Merge maps
      const mergedMap = new Map<string, GeneratedAudioItem>();
      firestoreItems.forEach((it) => mergedMap.set(it.id, it));
      localItems.forEach((it) => mergedMap.set(it.id, it));

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Push any local items not in firestore
      const firestoreIds = new Set(firestoreItems.map((i) => i.id));
      for (const item of localItems) {
        if (!firestoreIds.has(item.id)) {
          await pushItemToFirestore(syncKey, item);
        }
      }

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await saveLibraryToDB(mergedList);

      return {
        success: true,
        items: mergedList,
        addedCount: Math.max(0, mergedList.length - localItems.length),
        lastSyncedAt: now,
        source: 'firebase',
      };
    } catch (err: any) {
      console.warn('Firebase sync encountered error, trying cloud server:', err);
    }
  }

  // 2. High-speed Cloud Sync Server
  try {
    const res = await fetch('/api/sync/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        syncKey,
        items: localItems,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Sync failed: ${res.statusText}`);
    }

    const data = await res.json();
    const mergedList: GeneratedAudioItem[] = data.items || localItems;
    const now = data.lastSyncedAt || new Date().toISOString();
    setLastSyncedAt(now);
    await saveLibraryToDB(mergedList);

    return {
      success: true,
      items: mergedList,
      addedCount: Math.max(0, mergedList.length - localItems.length),
      lastSyncedAt: now,
      source: 'cloud_server',
    };
  } catch (error: any) {
    console.error('Cloud synchronization error:', error);
    return {
      success: false,
      items: localItems,
      addedCount: 0,
      lastSyncedAt: getLastSyncedAt() || new Date().toISOString(),
      source: 'cloud_server',
      error: error.message || 'Network error during cloud synchronization',
    };
  }
}

/**
 * Pull cloud library without pushing local items (e.g. initial load on new device)
 */
export async function pullCloudLibrary(syncKey: string): Promise<GeneratedAudioItem[]> {
  const firebaseConfig = getActiveFirebaseConfig();
  if (firebaseConfig) {
    try {
      const items = await pullLibraryFromFirestore(syncKey);
      if (items.length > 0) return items;
    } catch (e) {
      console.warn('Firestore pull failed:', e);
    }
  }

  try {
    const res = await fetch(`/api/sync/pull/${encodeURIComponent(syncKey)}`);
    if (res.ok) {
      const data = await res.json();
      return data.items || [];
    }
  } catch (e) {
    console.error('Failed to pull cloud library from server:', e);
  }
  return [];
}
