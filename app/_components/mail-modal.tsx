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
import { ModalList } from "./modal/modal-list";

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
            Hi! I’m Courtney Pattison, a longtime sewist and stay-at-home mom. I
            created Pattern Projector to make sewing with a projector easier—for
            myself and for anyone else who finds taping paper patterns a pain.
            It’s now a free tool used by thousands of people, and I’m always
            working to make it better.
          </ModalText>

          <ModalText>
            I’ve just released an update with some highly requested features:
          </ModalText>
          <ModalList>
            <ul className="list-disc list-inside">
              <li>
                <strong>Scale menu</strong> to change pattern scale directly
              </li>
              <li>
                New <strong>side menu</strong> for Stitch, Layers, and Scale
              </li>
              <li>
                <strong>&quot;Open With Pattern Projector&quot;</strong> for
                PDFs on desktop
              </li>
              <li>
                Support for <strong>SVG files</strong> with layer visibility
              </li>
              <li>Improved stitching tools: +/- page ranges, column order</li>
              <li>
                Lots of <strong>bug fixes</strong> and interface improvements
              </li>
            </ul>
          </ModalList>

          <ModalText>
            I also made a full <strong>walkthrough video</strong> with chapters
            so you can jump to what’s most relevant:
          </ModalText>
          <ModalList>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=0"
              >
                00:00 – Intro
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=20"
              >
                00:20 – How to Install Pattern Projector
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=46"
              >
                00:46 – Calibrating Your Projector
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=295"
              >
                04:55 – Stitching Together a PDF Pattern: Example 1
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=453"
              >
                07:33 – Tools to Make Projecting Easier
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=709"
              >
                11:49 – Using the Line Tool
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=866"
              >
                14:26 – Stitching Together a PDF Pattern: Example 2
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=987"
              >
                16:27 – Lengthen/Shorten Patterns
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://youtu.be/TH8tY9BoxfM?t=1070"
              >
                17:50 – Final Tips + Outro
              </Link>
            </li>
          </ModalList>

          <ModalText>
            I forgot to mention the new <strong>&quot;Open With&quot;</strong>{" "}
            feature in the video, but here’s a screenshot:
          </ModalText>
          <ModalFigure
            src="/open-with.png"
            caption="New 'Open With Pattern Projector' option on desktop"
          />

          <ModalText>
            Pattern Projector is free and always will be. If it’s been useful to
            you, you can support future updates by:
          </ModalText>
          <ModalList>
            <li>
              <Link
                className={linkClass}
                href="https://www.paypal.com/donate/?hosted_button_id=LF949PXS4RGYS"
              >
                Donating via PayPal
              </Link>
            </li>
            <li>
              <Link
                className={linkClass}
                href="https://buymeacoffee.com/patternprojector"
              >
                Buying me a coffee
              </Link>
            </li>
          </ModalList>

          <ModalText>
            <strong>Having trouble?</strong> If the new version isn’t working
            quite right for you, you can:
          </ModalText>
          <ModalList>
            <li>
              Try the{" "}
              <Link
                className={linkClass}
                href="https://beta.patternprojector.com"
              >
                beta site
              </Link>{" "}
              or the previous version at{" "}
              <Link
                className={linkClass}
                href="https://old.patternprojector.com"
              >
                old.patternprojector.com
              </Link>
            </li>
            <li>
              Test a different browser—<strong>Chrome</strong>,{" "}
              <strong>Edge</strong>, and <strong>Firefox</strong> are
              recommended
            </li>
            <li>
              Post in the{" "}
              <Link
                className={linkClass}
                href="https://www.facebook.com/groups/ProjectorsForSewing"
              >
                Projectors for Sewing Facebook group
              </Link>{" "}
              so we can troubleshoot together!
            </li>
          </ModalList>

          <ModalText>
            Thank you so much for using Pattern Projector and for helping it
            grow!
          </ModalText>
        </ModalContent>

        <ModalActions>
          <Button onClick={() => setOpen(false)}>{g("close")}</Button>
          <Button
            style={ButtonStyle.FILLED}
            href="https://buymeacoffee.com/patternprojector"
          >
            {t("donate")}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
