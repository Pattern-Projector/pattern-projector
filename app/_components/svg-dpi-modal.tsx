import { useTranslations } from "next-intl";
import Modal from "@/_components/modal/modal";
import ModalContent from "@/_components/modal/modal-content";
import { ModalTitle } from "@/_components/modal/modal-title";
import { ModalText } from "@/_components/modal/modal-text";
import { ModalActions } from "@/_components/modal/modal-actions";
import { Button } from "@/_components/buttons/button";
import { ButtonStyle } from "@/_components/theme/styles";
import { SVG_DPI_OPTIONS } from "@/_lib/svg-size";

/**
 * Asks which DPI an SVG was exported at, for SVGs whose size has no units.
 * The suggested DPI is highlighted.
 */
export default function SvgDpiModal({
  open,
  suggestedDpi,
  onChoose,
}: {
  open: boolean;
  suggestedDpi: number;
  onChoose: (dpi: number) => void;
}) {
  const t = useTranslations("SvgDpiModal");

  return (
    <Modal open={open}>
      <ModalContent>
        <ModalTitle>{t("title")}</ModalTitle>
        <ModalText>{t("description")}</ModalText>
        <ModalText>{t("changeLater")}</ModalText>
      </ModalContent>
      <ModalActions>
        {/* Own row so the options read low to high (ModalActions reverses its children) */}
        <div className="flex flex-wrap justify-end gap-2">
          {SVG_DPI_OPTIONS.map((dpi) => (
            <Button
              key={dpi}
              style={
                dpi === suggestedDpi ? ButtonStyle.FILLED : ButtonStyle.OUTLINE
              }
              onClick={() => onChoose(dpi)}
            >
              {t("option", { dpi })}
            </Button>
          ))}
        </div>
      </ModalActions>
    </Modal>
  );
}
