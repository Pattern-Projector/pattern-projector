import {
  Project,
  cleanProjectName,
  findProjectForFile,
  newProject,
  settingKeysToRemove,
  sortProjects,
} from "@/_lib/projects";

const dbName = "pattern-projector";
const dbVersion = 1;
const projectStore = "projects";
const fileStore = "files";

// The file's bytes are stored as an ArrayBuffer: Safari can refuse to store Blobs in IndexedDB, for example in
// private browsing
interface StoredFile {
  id: string;
  data: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(projectStore)) {
        db.createObjectStore(projectStore, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(fileStore)) {
        db.createObjectStore(fileStore, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function withStores<T>(
  mode: IDBTransactionMode,
  work: (projects: IDBObjectStore, files: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction([projectStore, fileStore], mode);
    const done = transactionDone(tx);
    const result = await work(
      tx.objectStore(projectStore),
      tx.objectStore(fileStore),
    );
    await done;
    return result;
  } finally {
    db.close();
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isProjectStoreAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function listProjects(): Promise<Project[]> {
  return withStores("readonly", async (projects) =>
    sortProjects(
      await requestToPromise(projects.getAll() as IDBRequest<Project[]>),
    ),
  );
}

/**
 * Saves a file that was just opened as a project, or marks its existing project as opened now.
 * Returns the project.
 */
export async function saveOpenedFile(file: File): Promise<Project> {
  // Read the file before the transaction starts: transactions close when they wait on anything but IndexedDB
  const data = await file.arrayBuffer();
  return withStores("readwrite", async (projects, files) => {
    const all = await requestToPromise(
      projects.getAll() as IDBRequest<Project[]>,
    );
    const now = Date.now();
    const existing = findProjectForFile(all, file);
    if (existing) {
      const updated = { ...existing, openedAt: now };
      projects.put(updated);
      return updated;
    }
    const project = newProject(file, newId(), now);
    projects.put(project);
    files.put({ id: project.id, data } as StoredFile);
    return project;
  });
}

/** Loads a project's pattern file and marks the project as opened now. */
export async function openProject(id: string): Promise<File> {
  return withStores("readwrite", async (projects, files) => {
    const project = await requestToPromise(
      projects.get(id) as IDBRequest<Project | undefined>,
    );
    const stored = await requestToPromise(
      files.get(id) as IDBRequest<StoredFile | undefined>,
    );
    if (!project || !stored) {
      throw new Error("Project not found");
    }
    projects.put({ ...project, openedAt: Date.now() });
    return new File([stored.data], project.fileName, {
      type: project.fileType,
      lastModified: project.fileLastModified,
    });
  });
}

export async function renameProject(id: string, name: string): Promise<void> {
  await withStores("readwrite", async (projects) => {
    const project = await requestToPromise(
      projects.get(id) as IDBRequest<Project | undefined>,
    );
    if (project) {
      projects.put({ ...project, name: cleanProjectName(name, project.name) });
    }
  });
}

/** Deletes a project, its stored file and, unless another project shares the file name, its settings. */
export async function deleteProject(id: string): Promise<void> {
  const keys = await withStores("readwrite", async (projects, files) => {
    const all = await requestToPromise(
      projects.getAll() as IDBRequest<Project[]>,
    );
    const project = all.find((p) => p.id === id);
    projects.delete(id);
    files.delete(id);
    return project ? settingKeysToRemove(project, all) : [];
  });
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
