import { useTranslations } from "next-intl";
import Modal from "./modal/modal";
import { ModalTitle } from "./modal/modal-title";
import { ModalText } from "./modal/modal-text";
import { ModalActions } from "./modal/modal-actions";
import { Button } from "./buttons/button";
import TroubleshootingFigure from "./troubleshooting-image";
import { ModalSubtitle } from "./modal/modal-subtitle";
import { useState } from "react";

export default function TroubleshootingButton() {
  const t = useTranslations("Troubleshooting");
  const [troubleshooting, setTroubleshooting] = useState(false);

  return (
    <>
      <Button
        className="mt-2 absolute left-1/2 -translate-x-1/2"
        onClick={() => setTroubleshooting(true)}
      >
        {t("notMatching")}
      </Button>
      <Modal open={troubleshooting}>
        <ModalTitle>{t("title")}</ModalTitle>
        <ModalSubtitle>{t("dragCorners.title")}</ModalSubtitle>
        <div className="aspect-w-16 aspect-h-9 m-4">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/EonY04Uu6gI?si=KcOn05_Cx4QZtUcF"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          ></iframe>
        </div>
        <ModalText>{t("dragCorners.description")}</ModalText>
        <ModalText>{t("inputMeasurement")}</ModalText>
        <TroubleshootingFigure
          src="/correct.jpg"
          caption={t("dragCorners.caption")}
        />
        <ModalSubtitle>{t("offByOne.title")}</ModalSubtitle>
        <ModalText>{t("offByOne.description")}</ModalText>
        <TroubleshootingFigure
          src="/off-by-one.jpg"
          caption={t("offByOne.caption")}
        />
        <ModalSubtitle>{t("unevenSurface.title")}</ModalSubtitle>
        <ModalText>{t("unevenSurface.description")}</ModalText>
        <TroubleshootingFigure
          src="/uneven-surface.jpg"
          caption={t("unevenSurface.caption")}
        />
        <ModalSubtitle>{t("dimensionsSwapped.title")}</ModalSubtitle>
        <ModalText>{t("dimensionsSwapped.description")}</ModalText>
        <TroubleshootingFigure
          src="/dimensions-swapped.jpg"
          caption={t("dimensionsSwapped.caption")}
        />
        <ModalActions>
          <Button onClick={() => setTroubleshooting(false)}>
            {t("close")}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}