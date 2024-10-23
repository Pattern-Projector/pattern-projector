import InstallDesktopIcon from "@/_icons/install-desktop";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import Modal from "../modal/modal";
import { ModalTitle } from "../modal/modal-title";
import { ModalText } from "../modal/modal-text";
import { ModalActions } from "../modal/modal-actions";
import IosShareIcon from "@/_icons/ios-share-icon";
import MoreVertIcon from "@/_icons/more-vert-icon";
import AddToHomeScreenIcon from "@/_icons/add-to-home-screen-icon";
import AddBoxIcon from "@/_icons/add-box-icon";
import { Button } from "./button";

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations("InstallButton");
  const [iosInstalled, setIosInstalled] = useState(false);
  const [chromeInstalled, setChromeInstalled] = useState(false);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  function createDescription() {
    if (
      (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ||
        // @ts-expect-error - iOS specific property
        typeof navigator.standalone !== "undefined") &&
      !navigator.userAgent.match(/Android/g)
    ) {
      return t.rich("descriptionIOS", {
        shareIcon: () => (
          <IosShareIcon className="inline-block" ariaLabel={""} />
        ),
        addBoxIcon: () => (
          <AddBoxIcon className="inline-block" ariaLabel={""} />
        ),
      });
    }

    if (navigator.userAgent.match(/Android/g)) {
      return t.rich("descriptionAndroid", {
        moreIcon: () => (
          <MoreVertIcon className="inline-block" ariaLabel={""} />
        ),
        addToHomeScreenIcon: () => (
          <AddToHomeScreenIcon className="inline-block" ariaLabel={""} />
        ),
      });
    }

    return t.rich("description", {
      chromeLink: (chunks) => (
        <a
          href="https://support.google.com/chrome/answer/95346?hl=en&co=GENIE.Platform%3DDesktop"
          className="font-medium text-purple-700 dark:text-purple-600 hover:underline"
        >
          {chunks}
        </a>
      ),
      installIcon: () => (
        <span className="inline-block">
          <InstallDesktopIcon ariaLabel={""} />
        </span>
      ),
    });
  }

  useEffect(() => {
    // @ts-expect-error - iOS specific property
    setIosInstalled(window.navigator.standalone === true);

    // Check if the browser supports PWA installation
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setChromeInstalled(true);
      localStorage.setItem("installed", "true");
    });

    const installed = localStorage.getItem("installed");
    if (installed) {
      setChromeInstalled(true);
    }

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
      window.removeEventListener("appinstalled", () => {});
    };
  }, []);

  return (
    !chromeInstalled &&
    !iosInstalled && (
      <>
        <Button onClick={handleInstall}>
          <InstallDesktopIcon ariaLabel={t("title")} />
          {t("title")}
        </Button>
        <Modal open={showModal}>
          <ModalTitle>{t("title")}</ModalTitle>
          <ModalText>{createDescription()}</ModalText>
          <ModalActions>
            <Button
              onClick={() => {
                setShowModal(false);
              }}
            >
              {t("ok")}
            </Button>
          </ModalActions>
        </Modal>
      </>
    )
  );
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
