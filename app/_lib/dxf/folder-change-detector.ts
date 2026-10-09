export interface FolderEntry {
  name: string;
  lastModified: number;
  size: number;
}

const signature = (e: FolderEntry) => `${e.lastModified}:${e.size}`;

/**
 * Decides which file in a polled folder should be loaded next.
 *
 * - Files already in the folder when watching starts are ignored.
 * - A new or changed file is only reported once it looks the same on two polls in a
 *   row, so a file CAD software is still writing isn't read half-finished.
 * - If several files become ready at once, only the newest is reported.
 */
export class FolderChangeDetector {
  private seen = new Map<string, string>();
  private pending = new Map<string, string>();
  private primed = false;

  update(entries: FolderEntry[]): string | null {
    const names = new Set(entries.map((e) => e.name));
    for (const name of Array.from(this.seen.keys())) {
      if (!names.has(name)) this.seen.delete(name);
    }
    for (const name of Array.from(this.pending.keys())) {
      if (!names.has(name)) this.pending.delete(name);
    }

    if (!this.primed) {
      this.primed = true;
      for (const e of entries) this.seen.set(e.name, signature(e));
      return null;
    }

    const ready: FolderEntry[] = [];
    for (const e of entries) {
      const sig = signature(e);
      if (this.seen.get(e.name) === sig) {
        this.pending.delete(e.name);
        continue;
      }
      if (this.pending.get(e.name) === sig && e.size > 0) {
        ready.push(e);
      } else {
        this.pending.set(e.name, sig);
      }
    }
    if (ready.length === 0) return null;

    for (const e of ready) {
      this.seen.set(e.name, signature(e));
      this.pending.delete(e.name);
    }
    ready.sort((a, b) => b.lastModified - a.lastModified);
    return ready[0].name;
  }
}
