import { openDB } from 'idb';
import { api } from './api';

const DB_NAME = 'AnveshanaOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'queuedDeposits';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'clientTempId' });
          store.createIndex('queuedAt', 'queuedAt');
        }
      }
    });
  }
  return dbPromise;
}

export async function queueDepositLocally(depositData) {
  const db = await getDB();
  const entry = {
    clientTempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...depositData,
    queuedAt: new Date().toISOString(),
    status: 'QUEUED_OFFLINE'
  };
  await db.put(STORE_NAME, entry);
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
  return entry;
}

export async function getQueuedDeposits() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function getQueuedCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}

export async function removeQueuedDeposit(clientTempId) {
  const db = await getDB();
  await db.delete(STORE_NAME, clientTempId);
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}

export async function clearQueuedDeposits() {
  const db = await getDB();
  await db.clear(STORE_NAME);
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}

export async function syncOfflineQueue(centerId = 'CENT-EAST-04', onProgress = null) {
  const items = await getQueuedDeposits();
  if (items.length === 0) return { success: true, syncedCount: 0 };

  console.log(`📡 [Offline Sync] Attempting to sync ${items.length} queued records...`);
  
  try {
    const payload = {
      centerId,
      entries: items.map(item => ({
        clientTempId: item.clientTempId,
        farmerCustomId: item.farmerCustomId,
        volumeLiters: item.volumeLiters,
        qualityMetrics: item.qualityMetrics,
        queuedAt: item.queuedAt
      }))
    };

    const response = await api.syncBatch(payload);

    if (response.success && Array.isArray(response.processedIds)) {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      for (const id of response.processedIds) {
        await tx.store.delete(id);
      }
      await tx.done;
      window.dispatchEvent(new CustomEvent('offline-queue-updated'));
      if (onProgress) onProgress(response.syncedCount);
      console.log(`✅ [Offline Sync] Successfully synced ${response.syncedCount} records.`);
      return response;
    }
  } catch (error) {
    console.error('❌ [Offline Sync] Failed to sync batch:', error);
    throw error;
  }
}

// Auto-sync listener on window online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network restored! Triggering auto-sync...');
    setTimeout(() => {
      syncOfflineQueue().catch(err => console.warn('Background auto-sync failed:', err));
    }, 1000);
  });
}
