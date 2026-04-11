"use client";

import dynamic from "next/dynamic";
import { useMessages, useTranslations } from "next-intl";

import FullScreenIcon from "@/_icons/full-screen-icon";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import GithubIcon from "@/_icons/github-icon";
import GridOnIcon from "@/_icons/grid-on-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import PatternProjectorIcon from "@/_icons/pattern-projector-icon";
import PdfIcon from "@/_icons/pdf-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import RecenterIcon from "@/_icons/recenter-icon";
import LanguageSwitcher from "@/_components/language-switcher";
import { IconButton } from "@/_components/buttons/icon-button";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import MoveIcon from "@/_icons/move-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import LayersIcon from "@/_icons/layers-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import MarkAndMeasureIcon from "@/_icons/mark-and-measure-icon";
import DeleteIcon from "@/_icons/delete-icon";
import RotateToHorizontalIcon from "@/_icons/rotate-to-horizontal";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import ShiftIcon from "@/_icons/shift-icon";
import OverlayBorderIcon from "@/_icons/overlay-border-icon";
import FlippedPatternIcon from "@/_icons/flipped-pattern-icon";
import FlipCenterOnIcon from "@/_icons/flip-center-on-icon";
import OverlayPaperIcon from "@/_icons/overlay-paper-icon";
import { ReactNode } from "react";
import ZoomOutIcon from "@/_icons/zoom-out-icon";
import { Button } from "@/_components/buttons/button";
import { ButtonStyle } from "@/_components/theme/styles";
import ZoomInIcon from "@/_icons/zoom-in-icon";
import TuneIcon from "@/_icons/tune-icon";
import InlineInput from "@/_components/inline-input";

const DynamicInstallButton = dynamic(
  () => import("@/_components/buttons/install-button"),
  { ssr: false },
);

export default function Home() {
  const t = useTranslations("HomePage");
  const messages = useMessages() as IntlMessages;
  const keys = Object.keys(
    messages.HomePage.resources.links ? messages.HomePage.resources.links : {},
  );

  return (
    <main className="p-4 bg-white !overflow-y-scroll h-full overflow-x-hidden">
      <nav className="flex items-center justify-between">
        <PatternProjectorIcon ariaLabel="" />

        <menu className="flex items-center gap-2">
          <DynamicInstallButton />
          <Button
            href="/calibrate"
            style={ButtonStyle.FILLED}
            className="py-3.5"
          >
            {t("calibrate")}
          </Button>
          <LanguageSwitcher ariaLabel={t("choose-language")} />
        </menu>
      </nav>
      <article className="prose lg:prose-xl m-auto">
        <h1 data-testid="welcome-title">{t("welcome.title")}</h1>
        <p>
          {t.rich("welcome.description", {
            changeLogLink: (chunks) => (
              <a href="https://github.com/Pattern-Projector/pattern-projector/blob/beta/CHANGELOG.md">
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>
          {t.rich("contribute.donation", {
            donateLink: (chunk) => (
              <a href="https://www.buymeacoffee.com/patternprojector">
                {chunk}
              </a>
            ),
            payPalLink: (chunk) => (
              <a href="https://www.paypal.com/donate/?hosted_button_id=LF949PXS4RGYS">
                {chunk}
              </a>
            ),
          })}
        </p>
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            src={t("youTubeSrc")}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <a href="#requirements">
          <h2 id="requirements">{t("requirements.title")} #</h2>
        </a>
        <ul>
          <li>{t("requirements.projector")}</li>
          <li>{t("requirements.mat")}</li>
          <li>{t("requirements.mount")}</li>
          <li>{t("requirements.computer")}</li>
          <li>{t("requirements.pattern")}</li>
        </ul>
        <a href="#setup">
          <h2 id="setup">{t("setup.title")} #</h2>
        </a>
        <ol>
          <li>{t("setup.place")}</li>
          <li>{t("setup.connect")}</li>
          <li>{t("setup.focus")}</li>
          <li>{t("setup.keystone")}</li>
        </ol>

        <a href="#calibration">
          <h2 id="calibration">{t("calibration.title")} #</h2>
        </a>
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/EonY04Uu6gI?si=KcOn05_Cx4QZtUcF"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          ></iframe>
        </div>
        <ol>
          <li>
            {t.rich("faq.saveAsApp.answer", {
              googleChromeLink: (chunks) => (
                <a href="https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop">
                  {chunks}
                </a>
              ),
              microsoftEdgeLink: (chunks) => (
                <a href="https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/ux#installing-a-pwa">
                  {chunks}
                </a>
              ),
            })}
          </li>
          <li>{t("calibration.start")}</li>
          <li>
            {t.rich("calibration.fullscreen", {
              fullscreenIcon: () => (
                <FullScreenIcon
                  className="inline-block align-middle"
                  ariaLabel=""
                />
              ),
            })}
          </li>
          <li>{t("calibration.drag")}</li>
          <li>
            {t.rich("calibration.size", {
              inchGridLink: (chunks) => (
                <a href="https://www.mathed.page/puzzles/one-inch-graph-paper.pdf">
                  {chunks}
                </a>
              ),
              cmGridLink: (chunks) => (
                <a href="https://mathbits.com/MathBits/StudentResources/GraphPaper/CentimeterFullPage.pdf">
                  {chunks}
                </a>
              ),
            })}
          </li>
          <li>{t("calibration.project")}</li>
        </ol>

        <a href="#project">
          <h2 id="project">{t("project.title")} #</h2>
        </a>
        <ol>
          <li>
            {t.rich("project.open", {
              pdficon: () => (
                <PdfIcon
                  fill="#000"
                  ariaLabel=""
                  className="inline-block align-middle"
                />
              ),
            })}
          </li>
          <li>{t("project.move")}</li>
          <li>{t("project.cut")}</li>
        </ol>
        <a href="#tools">
          <h2 id="tools">{t("tools")} #</h2>
        </a>
        <p>{t("project.tools")}</p>
        <dl>
          <Definition
            icon={<FullScreenIcon ariaLabel="" />}
            title={t("project.fullscreen.title")}
          >
            {t("project.fullscreen.description")}
          </Definition>

          <Definition
            icon={<ExpandLessIcon ariaLabel="" />}
            title={t("project.showMenu.title")}
          >
            {t("project.showMenu.description")}
          </Definition>

          <Definition
            icon={<InvertColorIcon ariaLabel="" />}
            title={t("project.invert.title")}
          >
            {t("project.invert.description")}
          </Definition>

          <Definition
            icon={<MoveIcon ariaLabel="" />}
            title={t("project.moveTool.title")}
          >
            {t("project.moveTool.description")}
          </Definition>

          <Definition
            icon={<GridOnIcon ariaLabel="" />}
            title={t("project.overlayOptions.title")}
          >
            {t.rich("project.overlayOptions.description", {
              overlayOptionsLink: (chunk) => (
                <a href="#overlay-options">{chunk}</a>
              ),
            })}
          </Definition>

          <Definition
            icon={<LineWeightIcon ariaLabel="" />}
            title={t("project.lineWeight.title")}
          >
            {t("project.lineWeight.description")}
          </Definition>

          <Definition
            icon={
              <>
                <FlipVerticalIcon ariaLabel="" />
                <FlipHorizontalIcon ariaLabel="" />
              </>
            }
            title={t("project.flip.title")}
          >
            {t("project.flip.description")}
          </Definition>

          <Definition
            icon={<Rotate90DegreesCWIcon ariaLabel="" />}
            title={t("project.rotate.title")}
          >
            {t("project.rotate.description")}
          </Definition>

          <Definition
            icon={<RecenterIcon ariaLabel="" />}
            title={t("project.recenter.title")}
          >
            {t("project.recenter.description")}
          </Definition>

          <Definition
            icon={<ZoomInIcon ariaLabel="" />}
            title={t("project.magnify.title")}
          >
            {t("project.magnify.description")}
          </Definition>

          <Definition
            icon={<ZoomOutIcon ariaLabel="" />}
            title={t("project.zoomOut.title")}
          >
            {t("project.zoomOut.description")}
          </Definition>

          <Definition
            icon={<MarkAndMeasureIcon ariaLabel="" />}
            title={t("project.measure.title")}
          >
            {t.rich("project.measure.description", {
              lineToolLink: (chunk) => <a href="#line-tool">{chunk}</a>,
            })}
          </Definition>

          <Definition
            icon={<FlexWrapIcon ariaLabel="" />}
            title={t("project.stitch.title")}
          >
            {t("project.stitch.description")}
          </Definition>

          <Definition
            icon={<LayersIcon ariaLabel="" />}
            title={t("project.layers.title")}
          >
            {t("project.layers.description")}
          </Definition>

          <Definition
            icon={<TuneIcon ariaLabel="" />}
            title={t("project.scale.title")}
          >
            {t("project.scale.description")}
          </Definition>
        </dl>

        <a href="#overlay-options">
          <h3 id="overlay-options">{t("overlayOptions.title")} #</h3>
        </a>
        <p>{t("overlayOptions.description")}</p>
        <dl>
          <Definition
            icon={<OverlayBorderIcon ariaLabel="" />}
            title={t("overlayOptions.border.title")}
          >
            {t("overlayOptions.border.description")}
          </Definition>

          <Definition
            icon={<GridOnIcon ariaLabel="" />}
            title={t("overlayOptions.grid.title")}
          >
            {t("overlayOptions.grid.description")}
          </Definition>

          <Definition
            icon={<OverlayPaperIcon ariaLabel="" />}
            title={t("overlayOptions.paper.title")}
          >
            {t("overlayOptions.paper.description")}
          </Definition>

          <Definition
            icon={<FlipCenterOnIcon ariaLabel="" />}
            title={t("overlayOptions.flipLines.title")}
          >
            {t("overlayOptions.flipLines.description")}
          </Definition>

          <Definition
            icon={<FlippedPatternIcon ariaLabel="" />}
            title={t("overlayOptions.flippedPattern.title")}
          >
            {t("overlayOptions.flippedPattern.description")}
          </Definition>
        </dl>

        <a href="#line-tool">
          <h3 id="line-tool">{t("lineTool.title")} #</h3>
        </a>
        <p>{t("lineTool.description")}</p>
        <dl>
          <Definition
            icon={<DeleteIcon ariaLabel="" />}
            title={t("lineTool.delete.title")}
          >
            {t("lineTool.delete.description")}
          </Definition>
          <Definition
            icon={<RotateToHorizontalIcon ariaLabel="" />}
            title={t("lineTool.rotate.title")}
          >
            {t("lineTool.rotate.description")}
            <p>{t("lineTool.rotate.use")}</p>
          </Definition>
          <Definition
            icon={
              <>
                <KeyboardArrowLeftIcon ariaLabel="" />
                <KeyboardArrowRightIcon ariaLabel="" />
              </>
            }
            title={t("lineTool.previousNext.title")}
          >
            {t("lineTool.previousNext.description")}
            <p>{t("lineTool.previousNext.use")}</p>
          </Definition>
          <Definition
            icon={<FlipHorizontalIcon ariaLabel="" />}
            title={t("lineTool.flip.title")}
          >
            {t("lineTool.flip.description")}
            <p>{t("lineTool.flip.use")}</p>
          </Definition>
          <Definition
            icon={<ShiftIcon ariaLabel="" />}
            title={t("lineTool.move.title")}
          >
            {t("lineTool.move.description")}
            <p>{t("lineTool.move.use")}</p>
          </Definition>
          <Definition
            icon={
              <InlineInput
                className="relative flex flex-col w-20"
                disabled={true}
                handleChange={() => {}}
                inputClassName="pl-1.5 pr-7 !border-2 !border-black dark:!border-white"
                id="distance"
                labelRight={"in"}
                name="distance"
                value={"10"}
                type="string"
              />
            }
            title={t("lineTool.length.title")}
          >
            {t("lineTool.length.description")}
            <p>
              {t.rich("lineTool.length.use", {
                lineToolVideoLink: (chunks) => (
                  <a href="https://youtu.be/TH8tY9BoxfM?si=VTC1QRnNzBfG555Z&t=709">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </Definition>
          <Definition
            icon={
              <InlineInput
                className="relative flex flex-col w-20"
                disabled={true}
                handleChange={() => {}}
                inputClassName="pl-1.5 pr-7 !border-2 !border-black dark:!border-white"
                id="distance"
                labelRight={"°"}
                name="distance"
                value={"45"}
                type="string"
              />
            }
            title={t("lineTool.angle.title")}
          >
            {t("lineTool.angle.description")}
            <p>
              {t.rich("lineTool.angle.use", {
                alignIcon: () => (
                  <RotateToHorizontalIcon
                    className="inline-block align-middle"
                    ariaLabel=""
                  />
                ),
              })}
            </p>
          </Definition>
        </dl>

        <a href="#faq">
          <h2 id="faq">{t("faq.title")} #</h2>
        </a>
        <ul>
          <li>
            <div>{t("faq.wrongSizePdf.question")}</div>
            {t.rich("faq.wrongSizePdf.answer", {
              inchGridLink: (chunks) => (
                <a href="https://www.mathed.page/puzzles/one-inch-graph-paper.pdf">
                  {chunks}
                </a>
              ),
              cmGridLink: (chunks) => (
                <a href="https://mathbits.com/MathBits/StudentResources/GraphPaper/CentimeterFullPage.pdf">
                  {chunks}
                </a>
              ),
            })}
          </li>
          <li>
            <div>{t("faq.mobileSupport.question")}</div>
            {t("faq.mobileSupport.answer")}
          </li>
        </ul>
        <a href="#resources">
          <h2 id="resources">{t("resources.title")} #</h2>
        </a>
        <ul>
          {keys.map((key) => (
            <li key={key}>
              <a href={t(`resources.links.${key}.link` as any)}>
                {t(`resources.links.${key}.title` as any)}
              </a>
            </li>
          ))}
        </ul>

        <a href="#contribute">
          <h2 id="contribute">{t("contribute.title")} #</h2>
        </a>
        <p>
          {t.rich("contribute.donation", {
            donateLink: (chunk) => (
              <a href="https://www.buymeacoffee.com/patternprojector">
                {chunk}
              </a>
            ),
            payPalLink: (chunk) => (
              <a href="https://www.paypal.com/donate/?hosted_button_id=LF949PXS4RGYS">
                {chunk}
              </a>
            ),
          })}
        </p>
        <p>
          {t.rich("contribute.develop", {
            githubLink: (chunk) => (
              <a href="https://github.com/Pattern-Projector/pattern-projector">
                {chunk}
              </a>
            ),
          })}
        </p>
        <p>
          {t.rich("contribute.translate", {
            weblateLink: (chunk) => (
              <a href="https://hosted.weblate.org/projects/pattern-projector/pattern-projector/">
                {chunk}
              </a>
            ),
          })}
        </p>
        <p>{t("contribute.feedback")}</p>
      </article>
      <footer className="bg-white rounded-lg shadow m-4 w-full flex justify-between items-center">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400 p-4">
          © 2024{" "}
          <a href="https://courtneypattison.com/" className="hover:underline">
            Courtney Pattison
          </a>
        </span>

        <IconButton href="https://github.com/Pattern-Projector/pattern-projector">
          <GithubIcon ariaLabel={t("github")} />
        </IconButton>
        <a
          href="mailto:courtney@patternprojector.com"
          className="hover:underline pr-24"
        >
          {t("contact")}
        </a>
      </footer>
      <script
        data-name="BMC-Widget"
        data-cfasync="false"
        src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
        data-id="patternprojector"
        data-description="Support me on Buy me a coffee!"
        data-color="#BD5FFF"
        data-position="Right"
        data-x_margin="18"
        data-y_margin="18"
      ></script>
    </main>
  );
}

function Definition({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="flex gap-2">
        {icon}
        {title}
      </dt>
      <dd>{children}</dd>
    </>
  );
}
