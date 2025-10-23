/**
 * Offline Storage using IndexedDB
 * Stores dreams locally when offline, syncs when back online
 */

interface OfflineDream {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  date: string;
  time?: string;
  created_at: string;
  synced: boolean;
}

const DB_NAME = 'novakitz-offline';
const DB_VERSION = 1;
const STORE_NAME = 'dreams';

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('synced', 'synced', { unique: false });
          objectStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async saveDream(dream: Omit<OfflineDream, 'synced'>): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not available');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const dreamWithSyncFlag: OfflineDream = {
        ...dream,
        synced: false
      };

      const request = store.put(dreamWithSyncFlag);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedDreams(): Promise<OfflineDream[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDreams(): Promise<OfflineDream[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(dreamId: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not available');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(dreamId);

      request.onsuccess = () => {
        const dream = request.result;
        if (dream) {
          dream.synced = true;
          const updateRequest = store.put(dream);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteDream(dreamId: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not available');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(dreamId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedDreams(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not available');

    const syncedDreams = await this.getAllDreams();
    const syncedIds = syncedDreams.filter(d => d.synced).map(d => d.id);

    for (const id of syncedIds) {
      await this.deleteDream(id);
    }
  }

  async getUnsyncedCount(): Promise<number> {
    const unsynced = await this.getUnsyncedDreams();
    return unsynced.length;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Check if user is online
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Network status helpers
export const addOnlineListener = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', callback);
};

export const addOfflineListener = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('offline', callback);
};

export const removeOnlineListener = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('online', callback);
};

export const removeOfflineListener = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('offline', callback);
};
