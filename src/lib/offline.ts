const DB_NAME = "expense-vault-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export interface DraftTransaction {
  id?: number;
  data: Record<string, unknown>;
  createdAt: string;
}

// ── Open the IndexedDB database ─────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Save a draft transaction ────────────────────────────────────────────────
export async function saveDraft(
  data: Record<string, unknown>
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const draft: DraftTransaction = {
      data,
      createdAt: new Date().toISOString(),
    };
    const request = store.add(draft);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Load all draft transactions ─────────────────────────────────────────────
export async function loadDrafts(): Promise<DraftTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as DraftTransaction[]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Delete a single draft by id ─────────────────────────────────────────────
export async function deleteDraft(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Clear all drafts ────────────────────────────────────────────────────────
export async function clearDrafts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Sync all drafts to the server ───────────────────────────────────────────
export async function syncDrafts(): Promise<{
  synced: number;
  failed: number;
}> {
  const drafts = await loadDrafts();
  let synced = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.data),
      });

      if (response.ok) {
        if (draft.id !== undefined) {
          await deleteDraft(draft.id);
        }
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
