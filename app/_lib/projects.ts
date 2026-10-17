/**
 * Saved projects: every pattern file opened is kept in the browser (IndexedDB) with a small record, so people can
 * switch between patterns without opening the file again. The settings for each pattern (position, layers, stitching,
 * line weight, scale and measurements) are already saved in localStorage under keys that end with the file name, so
 * reopening the file brings them back.
 *
 * Calibration is not part of a project: it belongs to the table and projector, not the pattern.
 */
import Matrix from "ml-matrix";

export interface Project {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileLastModified: number;
  createdAt: number;
  openedAt: number;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

/** Prefixes of the localStorage keys that hold per pattern settings, each followed by the file name. */
export const perFileSettingPrefixes = [
  "localTransform:",
  "visibleLayers:",
  "stitchSettings:",
  "lineThickness:",
  "patternScale:",
  "lines:",
];

export function perFileSettingKeys(fileName: string): string[] {
  return perFileSettingPrefixes.map((prefix) => `${prefix}${fileName}`);
}

/** A readable default name: the file name without its extension. */
export function defaultProjectName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const name = dot > 0 ? fileName.slice(0, dot) : fileName;
  return name.trim() || fileName;
}

/** The saved project for a file, if the same file was opened before. */
export function findProjectForFile(
  projects: Project[],
  file: FileInfo,
): Project | undefined {
  return projects.find(
    (p) =>
      p.fileName === file.name &&
      p.fileSize === file.size &&
      p.fileLastModified === file.lastModified,
  );
}

export function newProject(file: FileInfo, id: string, now: number): Project {
  return {
    id,
    name: defaultProjectName(file.name),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileLastModified: file.lastModified,
    createdAt: now,
    openedAt: now,
  };
}

/** Most recently opened first. */
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => b.openedAt - a.openedAt);
}

/** Cleans up a name typed by the user, keeping the old one if the new one is empty. */
export function cleanProjectName(name: string, fallback: string): string {
  const trimmed = name.trim().slice(0, 100);
  return trimmed === "" ? fallback : trimmed;
}

/**
 * The per pattern settings to remove when a project is deleted. Settings are keyed by file name, so they are kept
 * while another project still uses a file with the same name.
 */
export function settingKeysToRemove(
  deleted: Project,
  remaining: Project[],
): string[] {
  const shared = remaining.some(
    (p) => p.id !== deleted.id && p.fileName === deleted.fileName,
  );
  return shared ? [] : perFileSettingKeys(deleted.fileName);
}

/** Size for showing in the projects list, e.g. "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Reads a saved pattern position (a 3×3 matrix stored as JSON), ignoring anything unreadable. */
export function parseSavedTransform(value: string | null): Matrix | null {
  try {
    const rows = JSON.parse(value ?? "null");
    const valid =
      Array.isArray(rows) &&
      rows.length === 3 &&
      rows.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 3 &&
          row.every((n) => typeof n === "number" && Number.isFinite(n)),
      );
    return valid ? new Matrix(rows) : null;
  } catch {
    return null;
  }
}
