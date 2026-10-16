import { useTranslations } from "next-intl";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { Button } from "@/_components/buttons/button";
import { IconButton } from "@/_components/buttons/icon-button";
import { ButtonColor, getColorClasses } from "@/_components/theme/colors";
import { ButtonStyle, getButtonStyleClasses } from "@/_components/theme/styles";
import ProjectList from "@/_components/project-list";
import PatternProjectorIcon from "@/_icons/pattern-projector-icon";
import PdfIcon from "@/_icons/pdf-icon";
import InfoIcon from "@/_icons/info-icon";
import MailIcon from "@/_icons/mail-icon";
import MailModal from "@/_components/mail-modal";
import Tooltip from "@/_components/tooltip/tooltip";
import { acceptedMimeTypes } from "@/_lib/is-valid-file";
import { Project } from "@/_lib/projects";

/**
 * The first screen: saved patterns and a place to add new ones. It is a normal window, so the file browser works
 * here without breaking full screen. Opening a pattern is what goes full screen.
 */
export default function ProjectsHome({
  projects,
  currentFileName,
  notice,
  buttonColor,
  onOpenProject,
  onAddFile,
  onRenameProject,
  onDeleteProject,
  onCalibrate,
}: {
  projects: Project[];
  currentFileName: string | null;
  notice: string | null;
  buttonColor: ButtonColor;
  onOpenProject: (project: Project) => void;
  onAddFile: (file: File) => void;
  onRenameProject: (project: Project, name: string) => void;
  onDeleteProject: (project: Project) => void;
  onCalibrate: () => void;
}) {
  const t = useTranslations("ProjectsHome");
  const [dragging, setDragging] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailUnread, setMailUnread] = useState(false);

  // Mail counts as read if it was opened after the last release
  useEffect(() => {
    const mailRead = Number(localStorage.getItem("mailRead") ?? "0");
    setMailUnread(mailRead <= new Date("2025-04-22").getTime());
  }, [mailOpen]);

  function openMail() {
    setMailOpen(true);
    localStorage.setItem("mailRead", Date.now().toString());
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onAddFile(file);
    }
    // Allow adding the same file again
    e.target.value = "";
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onAddFile(file);
    }
  }

  return (
    <div
      data-testid="projects-home"
      className="absolute inset-0 z-[200] overflow-y-auto bg-white text-gray-900"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <nav className="flex items-center justify-between p-4">
        <div className="w-12 h-12 [&>svg]:w-full [&>svg]:h-full">
          <PatternProjectorIcon ariaLabel="" />
        </div>
        <div className="flex items-center gap-2">
          <Button color={buttonColor} onClick={onCalibrate}>
            {t("calibrate")}
          </Button>
          <Tooltip description={t("info")}>
            <IconButton href="/">
              <InfoIcon ariaLabel={t("info")} />
            </IconButton>
          </Tooltip>
          <Tooltip description={t("mail")}>
            <IconButton onClick={openMail} active={mailUnread}>
              <MailIcon ariaLabel={t("mail")} />
            </IconButton>
          </Tooltip>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 pb-8">
        <h1 className="text-2xl font-semibold mb-4">{t("title")}</h1>
        <div
          className={`flex flex-col sm:flex-row items-center gap-3 rounded-lg border-2 border-dashed p-6 mb-6 ${dragging ? "border-purple-700 bg-purple-50" : "border-gray-300"}`}
        >
          <p className="flex-1 text-sm text-gray-600">{t("dropHint")}</p>
          <label
            className={`flex gap-2 items-center cursor-pointer ${getButtonStyleClasses(ButtonStyle.FILLED)} ${getColorClasses(buttonColor, ButtonStyle.FILLED)}`}
          >
            <input
              accept={acceptedMimeTypes.join(",")}
              className="hidden"
              id="pdfFile"
              onChange={handleFileChange}
              type="file"
            />
            <PdfIcon ariaLabel="" fill="currentColor" />
            {t("add")}
          </label>
        </div>
        {notice && (
          <p
            role="status"
            className="mb-4 rounded bg-purple-50 px-3 py-2 text-sm text-purple-900"
          >
            {notice}
          </p>
        )}
        <ProjectList
          projects={projects}
          currentFileName={currentFileName}
          onOpenProject={onOpenProject}
          onRenameProject={onRenameProject}
          onDeleteProject={onDeleteProject}
        />
        <p className="mt-6 text-xs text-gray-500">{t("note")}</p>
      </main>
      <MailModal open={mailOpen} setOpen={setMailOpen} />
    </div>
  );
}
