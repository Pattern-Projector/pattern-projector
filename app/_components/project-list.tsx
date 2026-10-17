import { useTranslations } from "next-intl";
import { useState } from "react";
import { Project, formatFileSize } from "@/_lib/projects";

/**
 * The saved projects, most recently opened first, with rename and delete. Used on the home screen and in the
 * projects list shown while projecting.
 */
export default function ProjectList({
  projects,
  currentFileName,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
}: {
  projects: Project[];
  currentFileName: string | null;
  onOpenProject: (project: Project) => void;
  onRenameProject: (project: Project, name: string) => void;
  onDeleteProject: (project: Project) => void;
}) {
  const t = useTranslations("Projects");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function finishRename(project: Project) {
    onRenameProject(project, nameInput);
    setRenamingId(null);
  }

  if (projects.length === 0) {
    return <p className="text-sm text-gray-600">{t("empty")}</p>;
  }

  return (
    <ul
      data-testid="projects-list"
      className="flex flex-col divide-y divide-gray-200 max-h-[60vh] overflow-y-auto"
    >
      {projects.map((project) => {
        const isCurrent = project.fileName === currentFileName;
        return (
          <li
            key={project.id}
            data-testid="project"
            className="flex items-center gap-2 py-2 text-gray-900"
          >
            <div className="flex-1 min-w-0">
              {renamingId === project.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    finishRename(project);
                  }}
                >
                  <input
                    aria-label={t("name")}
                    autoFocus
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={() => finishRename(project)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  className="text-left w-full"
                  onClick={() => onOpenProject(project)}
                >
                  <span className="block font-medium truncate">
                    {project.name}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-purple-700">
                        {t("current")}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-gray-500 truncate">
                    {project.fileName} · {formatFileSize(project.fileSize)} ·{" "}
                    {t("lastOpened", { date: new Date(project.openedAt) })}
                  </span>
                </button>
              )}
            </div>
            {confirmDeleteId === project.id ? (
              <>
                <button
                  type="button"
                  className="text-sm text-red-700 underline"
                  onClick={() => {
                    onDeleteProject(project);
                    setConfirmDeleteId(null);
                  }}
                >
                  {t("confirmDelete")}
                </button>
                <button
                  type="button"
                  className="text-sm text-gray-600 underline"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  {t("cancel")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="text-sm text-gray-600 underline"
                  aria-label={t("renameProject", { name: project.name })}
                  onClick={() => {
                    setNameInput(project.name);
                    setRenamingId(project.id);
                  }}
                >
                  {t("rename")}
                </button>
                <button
                  type="button"
                  className="text-sm text-gray-600 underline"
                  aria-label={t("deleteProject", { name: project.name })}
                  onClick={() => setConfirmDeleteId(project.id)}
                >
                  {t("delete")}
                </button>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
