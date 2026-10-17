import {
  Project,
  cleanProjectName,
  defaultProjectName,
  findProjectForFile,
  formatFileSize,
  newProject,
  parseSavedTransform,
  perFileSettingKeys,
  settingKeysToRemove,
  sortProjects,
} from "@/_lib/projects";

const shirt = {
  name: "Shirt.pdf",
  type: "application/pdf",
  size: 1000,
  lastModified: 5,
};

function project(overrides: Partial<Project>): Project {
  return { ...newProject(shirt, "id", 1), ...overrides };
}

test("names a project after its file without the extension", () => {
  expect(defaultProjectName("Shirt.pdf")).toBe("Shirt");
  expect(defaultProjectName("my.pants.v2.svg")).toBe("my.pants.v2");
  expect(defaultProjectName(".pdf")).toBe(".pdf");
  expect(defaultProjectName("README")).toBe("README");
});

test("creates a project record from a file", () => {
  expect(newProject(shirt, "abc", 42)).toEqual({
    id: "abc",
    name: "Shirt",
    fileName: "Shirt.pdf",
    fileType: "application/pdf",
    fileSize: 1000,
    fileLastModified: 5,
    createdAt: 42,
    openedAt: 42,
  });
});

describe("findProjectForFile", () => {
  const projects = [project({ id: "a" })];

  test("finds the project for the same file opened again", () => {
    expect(findProjectForFile(projects, shirt)?.id).toBe("a");
  });

  test("treats a changed file with the same name as a new project", () => {
    expect(
      findProjectForFile(projects, { ...shirt, size: 2000 }),
    ).toBeUndefined();
    expect(
      findProjectForFile(projects, { ...shirt, lastModified: 6 }),
    ).toBeUndefined();
  });
});

test("lists the most recently opened project first", () => {
  const sorted = sortProjects([
    project({ id: "old", openedAt: 1 }),
    project({ id: "new", openedAt: 3 }),
    project({ id: "middle", openedAt: 2 }),
  ]);
  expect(sorted.map((p) => p.id)).toEqual(["new", "middle", "old"]);
});

test("keeps the old name when a rename is left empty", () => {
  expect(cleanProjectName("  Summer shirt ", "Shirt")).toBe("Summer shirt");
  expect(cleanProjectName("   ", "Shirt")).toBe("Shirt");
  expect(cleanProjectName("x".repeat(200), "Shirt").length).toBe(100);
});

describe("settingKeysToRemove", () => {
  test("removes all of a deleted pattern's settings", () => {
    const deleted = project({ id: "a" });
    expect(settingKeysToRemove(deleted, [deleted])).toEqual(
      perFileSettingKeys("Shirt.pdf"),
    );
    expect(perFileSettingKeys("Shirt.pdf")).toContain(
      "localTransform:Shirt.pdf",
    );
  });

  test("keeps settings another project with the same file name still uses", () => {
    const deleted = project({ id: "a" });
    const other = project({ id: "b", fileSize: 2000 });
    expect(settingKeysToRemove(deleted, [deleted, other])).toEqual([]);
  });
});

test("formats file sizes", () => {
  expect(formatFileSize(500)).toBe("500 B");
  expect(formatFileSize(2048)).toBe("2 KB");
  expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
});

test("reads a saved pattern position and ignores anything unreadable", () => {
  const saved = JSON.stringify([
    [0, -1, 100],
    [1, 0, 50],
    [0, 0, 1],
  ]);
  expect(parseSavedTransform(saved)?.to2DArray()).toEqual([
    [0, -1, 100],
    [1, 0, 50],
    [0, 0, 1],
  ]);
  expect(parseSavedTransform(null)).toBeNull();
  expect(parseSavedTransform("not json")).toBeNull();
  expect(parseSavedTransform("[[1,0],[0,1]]")).toBeNull();
  expect(parseSavedTransform('[[1,0,0],[0,1,0],[0,0,"x"]]')).toBeNull();
});
