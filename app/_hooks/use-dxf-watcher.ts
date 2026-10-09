import { useCallback, useEffect, useRef, useState } from "react";
import {
  FolderChangeDetector,
  FolderEntry,
} from "@/_lib/dxf/folder-change-detector";
import {
  loadWatchFolder,
  saveWatchFolder,
} from "@/_lib/dxf/folder-handle-store";

export enum WatchStatus {
  Unsupported = "unsupported",
  Off = "off",
  NeedsPermission = "needsPermission",
  Watching = "watching",
  FolderMissing = "folderMissing",
}

export interface DxfWatcher {
  status: WatchStatus;
  folderName: string | null;
  /** Turn watching on; must be called from a click so the browser can ask for access */
  start: () => Promise<void>;
  stop: () => void;
  /** Pick (or change) the watched folder; must be called from a click */
  chooseFolder: () => Promise<void>;
  /** Load the newest DXF in the folder right now */
  loadLatest: () => Promise<void>;
}

const POLL_MS = 1000;
const ENABLED_KEY = "dxfWatchEnabled";
const isDxfName = (name: string) => /\.dxf$/i.test(name);

async function listDxf(dir: FileSystemDirectoryHandle) {
  const files: { entry: FolderEntry; handle: FileSystemFileHandle }[] = [];
  for await (const handle of dir.values()) {
    if (handle.kind !== "file" || !isDxfName(handle.name)) continue;
    const file = await (handle as FileSystemFileHandle).getFile();
    files.push({
      entry: {
        name: handle.name,
        lastModified: file.lastModified,
        size: file.size,
      },
      handle: handle as FileSystemFileHandle,
    });
  }
  return files;
}

/**
 * Watches a local folder (File System Access API, Chrome/Edge) and calls onFile with
 * every DXF that is added or overwritten while watching is on.
 */
export default function useDxfWatcher(
  onFile: (file: File) => void,
): DxfWatcher {
  const supported =
    typeof window !== "undefined" && "showDirectoryPicker" in window;
  // Start as Off on both server and client render; the effect below corrects it
  const [status, setStatus] = useState<WatchStatus>(WatchStatus.Off);
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  const setEnabled = (enabled: boolean) => {
    try {
      localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
    } catch {}
  };

  // Restore the folder; resume watching if the browser still grants access
  useEffect(() => {
    if (!supported) {
      setStatus(WatchStatus.Unsupported);
      return;
    }
    let cancelled = false;
    (async () => {
      const handle = await loadWatchFolder();
      if (cancelled || !handle) return;
      setFolder(handle);
      if (localStorage.getItem(ENABLED_KEY) !== "1") return;
      const permission = await handle.queryPermission?.({ mode: "read" });
      if (cancelled) return;
      setStatus(
        permission === "granted"
          ? WatchStatus.Watching
          : WatchStatus.NeedsPermission,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const chooseFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return;
    try {
      const handle = await window.showDirectoryPicker({
        id: "pattern-projector-dxf",
        mode: "read",
        startIn: folder ?? "documents",
      });
      await saveWatchFolder(handle);
      setFolder(handle);
      setEnabled(true);
      setStatus(WatchStatus.Watching);
    } catch {
      // picker cancelled: keep the current state
    }
  }, [folder]);

  const start = useCallback(async () => {
    if (!folder) {
      await chooseFolder();
      return;
    }
    const permission =
      (await folder.requestPermission?.({ mode: "read" })) ?? "granted";
    if (permission === "granted") {
      setEnabled(true);
      setStatus(WatchStatus.Watching);
    } else {
      setStatus(WatchStatus.NeedsPermission);
    }
  }, [folder, chooseFolder]);

  const stop = useCallback(() => {
    setEnabled(false);
    setStatus(supported ? WatchStatus.Off : WatchStatus.Unsupported);
  }, [supported]);

  const loadLatest = useCallback(async () => {
    if (!folder) return;
    try {
      const files = await listDxf(folder);
      files.sort((a, b) => b.entry.lastModified - a.entry.lastModified);
      if (files[0]) onFileRef.current(await files[0].handle.getFile());
    } catch {
      setStatus(WatchStatus.FolderMissing);
    }
  }, [folder]);

  // Poll the folder while watching
  useEffect(() => {
    if (status !== WatchStatus.Watching || !folder) return;
    const detector = new FolderChangeDetector();
    let busy = false;
    let stopped = false;
    const tick = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const files = await listDxf(folder);
        const name = detector.update(files.map((f) => f.entry));
        const changed = files.find((f) => f.entry.name === name);
        if (changed && !stopped) {
          onFileRef.current(await changed.handle.getFile());
        }
      } catch (e) {
        if (!stopped) {
          const denied =
            e instanceof DOMException && e.name === "NotAllowedError";
          setStatus(
            denied ? WatchStatus.NeedsPermission : WatchStatus.FolderMissing,
          );
        }
      } finally {
        busy = false;
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [status, folder]);

  return {
    status,
    folderName: folder?.name ?? null,
    start,
    stop,
    chooseFolder,
    loadLatest,
  };
}
