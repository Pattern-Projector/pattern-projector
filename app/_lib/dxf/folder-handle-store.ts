/**
 * Keeps the watched folder's handle in IndexedDB so the folder survives page reloads
 * (handles can't be stored in localStorage).
 */
const DB_NAME = "pattern-projector";
const STORE = "handles";
const KEY = "dxfWatchFolder";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function loadWatchFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (
      (await withStore<FileSystemDirectoryHandle | undefined>("readonly", (s) =>
        s.get(KEY),
      )) ?? null
    );
  } catch {
    return null;
  }
}

export async function saveWatchFolder(handle: FileSystemDirectoryHandle) {
  try {
    await withStore("readwrite", (s) => s.put(handle, KEY));
  } catch {
    // Not fatal: the user just has to pick the folder again next time
  }
}
