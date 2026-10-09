import { FolderChangeDetector } from "@/_lib/dxf/folder-change-detector";

const f = (name: string, lastModified: number, size = 100) => ({
  name,
  lastModified,
  size,
});

describe("FolderChangeDetector", () => {
  it("ignores files that were already there when watching started", () => {
    const d = new FolderChangeDetector();
    expect(d.update([f("old.dxf", 1)])).toBeNull();
    expect(d.update([f("old.dxf", 1)])).toBeNull();
    expect(d.update([f("old.dxf", 1)])).toBeNull();
  });

  it("reports a new file once it is stable across two polls", () => {
    const d = new FolderChangeDetector();
    d.update([]);
    expect(d.update([f("skirt.dxf", 5, 10)])).toBeNull(); // first seen
    expect(d.update([f("skirt.dxf", 6, 900)])).toBeNull(); // still being written
    expect(d.update([f("skirt.dxf", 6, 900)])).toBe("skirt.dxf");
    expect(d.update([f("skirt.dxf", 6, 900)])).toBeNull(); // only once
  });

  it("reports a file again when CLO overwrites it", () => {
    const d = new FolderChangeDetector();
    d.update([f("skirt.dxf", 1)]);
    d.update([f("skirt.dxf", 2)]);
    expect(d.update([f("skirt.dxf", 2)])).toBe("skirt.dxf");
    d.update([f("skirt.dxf", 3)]);
    expect(d.update([f("skirt.dxf", 3)])).toBe("skirt.dxf");
  });

  it("picks the newest when several files change at once", () => {
    const d = new FolderChangeDetector();
    d.update([]);
    const both = [f("a.dxf", 10), f("b.dxf", 20)];
    d.update(both);
    expect(d.update(both)).toBe("b.dxf");
    expect(d.update(both)).toBeNull();
  });

  it("does not report empty files", () => {
    const d = new FolderChangeDetector();
    d.update([]);
    d.update([f("x.dxf", 1, 0)]);
    expect(d.update([f("x.dxf", 1, 0)])).toBeNull();
  });
});
