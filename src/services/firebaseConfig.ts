import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { GeneratedAudioItem } from '../types';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'awaaz_firebase_custom_config';

/**
 * Retrieve saved Firebase config from localStorage or Vite environment variables
 */
export function getActiveFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    // 1. Check user custom config in localStorage
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.apiKey && parsed?.projectId) {
        return parsed;
      }
    }

    // 2. Check environment variables
    const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
    const envAppId = (import.meta as any).env?.VITE_FIREBASE_APP_ID;

    if (envApiKey && envProjectId) {
      return {
        apiKey: envApiKey,
        authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        projectId: envProjectId,
        storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
        appId: envAppId || '1:1234567890:web:default',
      };
    }
  } catch (err) {
    console.warn('Error reading Firebase config:', err);
  }
  return null;
}

export function saveActiveFirebaseConfig(config: FirebaseCustomConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save Firebase config to storage:', e);
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreDbInstance: Firestore | null = null;

/**
 * Initialize or retrieve the Firestore instance
 */
export function getFirebaseFirestore(): Firestore | null {
  const config = getActiveFirebaseConfig();
  if (!config) return null;

  try {
    if (!firebaseAppInstance) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        firebaseAppInstance = existingApps[0];
      } else {
        firebaseAppInstance = initializeApp(config);
      }
    }
    if (!firestoreDbInstance && firebaseAppInstance) {
      firestoreDbInstance = getFirestore(firebaseAppInstance);
    }
    return firestoreDbInstance;
  } catch (err) {
    console.warn('Firebase Firestore initialization warning:', err);
    return null;
  }
}

/**
 * Push an audio item to Firebase Firestore
 */
export async function pushItemToFirestore(userId: string, item: GeneratedAudioItem): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    const itemRef = doc(db, 'users', userId, 'audio_items', item.id);
    await setDoc(itemRef, {
      ...item,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Firestore push failed:', err);
    return false;
  }
}

/**
 * Pull all audio items from Firebase Firestore for a user
 */
export async function pullLibraryFromFirestore(userId: string): Promise<GeneratedAudioItem[]> {
  const db = getFirebaseFirestore();
  if (!db) return [];

  try {
    const itemsCol = collection(db, 'users', userId, 'audio_items');
    const q = query(itemsCol, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    const items: GeneratedAudioItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as GeneratedAudioItem);
    });
    return items;
  } catch (err) {
    console.error('Firestore pull failed:', err);
    return [];
  }
}
