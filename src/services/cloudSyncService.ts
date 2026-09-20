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
 * Prepare and strip redundant duplicate data before cloud sync
 */
function prepareItemForSync(item: GeneratedAudioItem): GeneratedAudioItem {
  const clean: any = { ...item };
  // If rawVoiceBase64 is identical to audioBase64, omit it to cut payload size by 50%
  if (clean.rawVoiceBase64 === clean.audioBase64) {
    delete clean.rawVoiceBase64;
  }
  // If audioBase64 alone is very large (> 2.5MB), also omit rawVoiceBase64
  if (clean.audioBase64 && clean.audioBase64.length > 2.5 * 1024 * 1024) {
    delete clean.rawVoiceBase64;
  }
  return clean as GeneratedAudioItem;
}

/**
 * Split items into batches based on actual payload byte size (max 3.5MB per request)
 * to safely stay within reverse proxy and network payload limits even for full-length songs
 */
function chunkItemsByPayloadSize(
  items: GeneratedAudioItem[],
  maxBytesPerBatch = 3.5 * 1024 * 1024
): GeneratedAudioItem[][] {
  const batches: GeneratedAudioItem[][] = [];
  let currentBatch: GeneratedAudioItem[] = [];
  let currentBatchBytes = 0;

  for (const rawItem of items) {
    const item = prepareItemForSync(rawItem);
    const itemBytes = (item.audioBase64?.length || 0) + (item.text?.length || 0);

    // If adding this item exceeds max batch size or batch already has 4 items, start new batch
    if (currentBatch.length > 0 && (currentBatchBytes + itemBytes > maxBytesPerBatch || currentBatch.length >= 4)) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchBytes = 0;
    }

    currentBatch.push(item);
    currentBatchBytes += itemBytes;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  return batches;
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
    // If no local items, simply query cloud library via merge endpoint with empty list
    if (localItems.length === 0) {
      const res = await fetch('/api/sync/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncKey,
          items: [],
        }),
      });

      if (!res.ok) {
        let errMsg = '';
        try {
          const text = await res.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              if (json.error) errMsg = json.error;
            } catch {
              if (text.length < 200) errMsg = text;
            }
          }
        } catch {}

        if (!errMsg) {
          errMsg = `HTTP ${res.status}${res.statusText ? ` (${res.statusText})` : ''}`;
        }
        throw new Error(`Sync failed: ${errMsg}`);
      }

      const data = await res.json();
      const mergedList: GeneratedAudioItem[] = data.items || [];
      const now = data.lastSyncedAt || new Date().toISOString();
      setLastSyncedAt(now);
      await saveLibraryToDB(mergedList);

      return {
        success: true,
        items: mergedList,
        addedCount: mergedList.length,
        lastSyncedAt: now,
        source: 'cloud_server',
      };
    }

    // When local items exist, chunk them dynamically by payload size (max 3.5MB per batch)
    // to safely stay well beneath server/proxy limits (32M) even with long full songs
    const batches = chunkItemsByPayloadSize(localItems);
    let latestMergedList: GeneratedAudioItem[] = localItems;
    let lastSyncedTimestamp = new Date().toISOString();

    for (const chunk of batches) {
      const res = await fetch('/api/sync/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncKey,
          items: chunk,
        }),
      });

      if (!res.ok) {
        let errMsg = '';
        try {
          const text = await res.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              if (json.error) errMsg = json.error;
            } catch {
              if (text.length < 200) errMsg = text;
            }
          }
        } catch {}

        if (!errMsg) {
          if (res.status === 413) {
            errMsg = 'Audio clip payload too large for cloud sync (HTTP 413)';
          } else {
            errMsg = `HTTP ${res.status}${res.statusText ? ` (${res.statusText})` : ''}`;
          }
        }
        throw new Error(`Sync failed: ${errMsg}`);
      }

      const data = await res.json();
      if (Array.isArray(data.items)) {
        latestMergedList = data.items;
      }
      if (data.lastSyncedAt) {
        lastSyncedTimestamp = data.lastSyncedAt;
      }
    }

    setLastSyncedAt(lastSyncedTimestamp);
    await saveLibraryToDB(latestMergedList);

    return {
      success: true,
      items: latestMergedList,
      addedCount: Math.max(0, latestMergedList.length - localItems.length),
      lastSyncedAt: lastSyncedTimestamp,
      source: 'cloud_server',
    };
  } catch (error: any) {
    console.warn('Cloud synchronization notice:', error?.message || error);
    return {
      success: false,
      items: localItems,
      addedCount: 0,
      lastSyncedAt: getLastSyncedAt() || new Date().toISOString(),
      source: 'cloud_server',
      error: error?.message || 'Network notice during cloud synchronization',
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
    console.warn('Notice: Could not pull cloud library from server:', e);
  }
  return [];
}
