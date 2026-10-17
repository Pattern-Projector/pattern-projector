import { useTranslations } from "next-intl";
import Modal from "@/_components/modal/modal";
import { ModalTitle } from "@/_components/modal/modal-title";
import ModalContent from "@/_components/modal/modal-content";
import { ModalActions } from "@/_components/modal/modal-actions";
import { Button } from "@/_components/buttons/button";
import ProjectList from "@/_components/project-list";
import { Project } from "@/_lib/projects";

/**
 * Switches between saved patterns while projecting. It never opens the file browser, which would leave full screen:
 * adding a new pattern goes back to the home screen instead.
 */
export default function ProjectsModal({
  open,
  setOpen,
  projects,
  currentFileName,
  onOpenProject,
  onGoHome,
  onRenameProject,
  onDeleteProject,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  projects: Project[];
  currentFileName: string | null;
  onOpenProject: (project: Project) => void;
  onGoHome: () => void;
  onRenameProject: (project: Project, name: string) => void;
  onDeleteProject: (project: Project) => void;
}) {
  const t = useTranslations("Projects");

  return (
    <Modal open={open}>
      <ModalTitle>{t("title")}</ModalTitle>
      <ModalContent>
        {/* Remount when reopened so a half finished rename or delete doesn't linger */}
        {open && (
          <ProjectList
            projects={projects}
            currentFileName={currentFileName}
            onOpenProject={(project) => {
              setOpen(false);
              onOpenProject(project);
            }}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
          />
        )}
        <p className="mt-3 text-xs text-gray-500">{t("addFromHome")}</p>
      </ModalContent>
      <ModalActions>
        <Button
          onClick={() => {
            setOpen(false);
            onGoHome();
          }}
        >
          {t("goHome")}
        </Button>
        <Button onClick={() => setOpen(false)}>{t("close")}</Button>
      </ModalActions>
    </Modal>
  );
}
