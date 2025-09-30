/**
 * IndexedDB Journal Cache
 * Mirror server-side journal to browser for offline access
 */

'use client';

const DB_NAME = 'keymaker_journal';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

interface JournalEntry {
  id: string;
  timestamp: string;
  event: string;
  runId?: string;
  data: any;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('runId', 'runId', { unique: false });
        store.createIndex('event', 'event', { unique: false });
      }
    };
  });
}

/**
 * Add entry to cache
 */
export async function cacheJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<void> {
  const db = await openDB();
  
  const fullEntry: JournalEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...entry,
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(fullEntry);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get recent entries
 */
export async function getRecentEntries(limit = 100): Promise<JournalEntry[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // Newest first
    
    const entries: JournalEntry[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      
      if (cursor && entries.length < limit) {
        entries.push(cursor.value);
        cursor.continue();
      } else {
        resolve(entries);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get entries by runId
 */
export async function getEntriesByRunId(runId: string): Promise<JournalEntry[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('runId');
    const request = index.getAll(runId);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear old entries (keep last N days)
 */
export async function cleanupOldEntries(daysToKeep = 7): Promise<number> {
  const db = await openDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffTimestamp = cutoffDate.toISOString();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTimestamp));
    
    let deleted = 0;
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      
      if (cursor) {
        store.delete(cursor.primaryKey);
        deleted++;
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}
