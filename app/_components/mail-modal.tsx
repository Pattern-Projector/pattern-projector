import { useTranslations } from "next-intl";
import Modal from "./modal/modal";
import { ModalTitle } from "./modal/modal-title";
import { ModalActions } from "./modal/modal-actions";
import { Button } from "./buttons/button";
import { Dispatch, SetStateAction } from "react";
import { ModalText } from "./modal/modal-text";
import ModalContent from "./modal/modal-content";
import { Link } from "navigation";
import ModalFigure from "./modal/modal-figure";
import { ButtonStyle } from "./theme/styles";

export default function MailModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const t = useTranslations("Mail");
  const g = useTranslations("General");
  const linkClass =
    "font-medium text-purple-600 dark:text-purple-500 hover:underline";

  return (
    <>
      <Modal open={open}>
        <ModalTitle>{t("title")}</ModalTitle>
        <ModalContent>
          <ModalText>
            Hi! I’m Courtney Pattison, the creator of Pattern Projector. After
            six years as a stay-at-home mom, I developed Pattern Projector as
            both a project for my job search and a tool to improve my own
            sewing. While it hasn’t led to a job yet, it has truly transformed
            the way I sew, and I’m thrilled to see it helping others as well.
          </ModalText>
          <ModalText>
            Pattern Projector will always be free, but with your support, I can
            continue improving it with new features and bug fixes. If it’s been
            useful to you, even a small contribution—
            <Link
              className={linkClass}
              href="https://buymeacoffee.com/patternprojector"
            >
              like $2 a month or a one-time donation
            </Link>
            —would make a big difference to me.
          </ModalText>
          <ModalText>
            I’d also love to hear your thoughts on which updates you’d like me
            to focus on, so feel free to{" "}
            <Link
              className={linkClass}
              href="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAO__oXPy8tUQk8yT1hISFNYQ0Q1REVZR1JVQ1YzTDBHQS4u"
            >
              rank or request features you would like to see added
            </Link>
            .
          </ModalText>
          <ModalText>
            Thank you for being part of this journey with me!
          </ModalText>
          <ModalFigure src="/courtney.jpg" caption="" />
        </ModalContent>
        <ModalActions>
          <Button onClick={() => setOpen(false)}>{g("close")}</Button>
          <Button
            style={ButtonStyle.FILLED}
            href="https://buymeacoffee.com/patternprojector"
          >
            {t("donate")}
          </Button>
          <Button
            style={ButtonStyle.FILLED}
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAO__oXPy8tUQk8yT1hISFNYQ0Q1REVZR1JVQ1YzTDBHQS4u"
          >
            Rank Features
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
