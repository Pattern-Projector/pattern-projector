"use client";

import dynamic from "next/dynamic";
import { useMessages, useTranslations } from "next-intl";
import Image from "next/image";

import FullscreenIcon from "@/_icons/fullscreen-icon";

import { Link } from "../../navigation";
import FlipHorizontalIcon from "../_icons/flip-horizontal-icon";
import FlipVerticalIcon from "../_icons/flip-vertical-icon";
import GithubIcon from "../_icons/github-icon";
import GridOnIcon from "../_icons/grid-on-icon";
import InvertColorIcon from "../_icons/invert-color-icon";
import PatternProjectorIcon from "../_icons/pattern-projector-icon";
import PdfIcon from "../_icons/pdf-icon";
import Rotate90DegreesCWIcon from "../_icons/rotate-90-degrees-cw-icon";
import RecenterIcon from "@/_icons/recenter-icon";
import LanguageSwitcher from "@/_components/language-switcher";
import { IconButton } from "@/_components/buttons/icon-button";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import MoveIcon from "@/_icons/move-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import LayersIcon from "@/_icons/layers-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import MarkAndMeasureIcon from "@/_icons/mark-and-measure-icon";

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
    <main className="m-4 bg-white">
      <nav className="flex items-center justify-between">
        <PatternProjectorIcon ariaLabel="" />

        <menu className="flex items-center gap-2">
          <DynamicInstallButton />
          <Link
            className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
            href="/calibrate"
          >
            {t("calibrate")}
          </Link>
          <LanguageSwitcher ariaLabel={t("choose-language")} />
        </menu>
      </nav>
      <article className="prose lg:prose-xl m-auto">
        <h1>{t("welcome.title")}</h1>
        <p>
          {t.rich("welcome.description", {
            changeLogLink: (chunks) => (
              <a href="https://github.com/Pattern-Projector/pattern-projector/blob/beta/CHANGELOG.md">
                {chunks}
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
        <h2>{t("requirements.title")}</h2>
        <ul>
          <li>{t("requirements.projector")}</li>
          <li>{t("requirements.mat")}</li>
          <li>{t("requirements.mount")}</li>
          <li>{t("requirements.computer")}</li>
          <li>{t("requirements.pattern")}</li>
        </ul>
        <h2>{t("setup.title")}</h2>
        <ol>
          <li>{t("setup.place")}</li>
          <li>{t("setup.connect")}</li>
          <li>{t("setup.focus")}</li>
          <li>{t("setup.keystone")}</li>
        </ol>

        <h2>{t("calibration.title")}</h2>
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
            {t("calibration.fullscreen")}
            <FullscreenIcon ariaLabel="" />
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
          <Image src="/demo.gif" width={640} height={260} alt=""></Image>
          <li>{t("calibration.project")}</li>
        </ol>

        <h2>{t("project.title")}</h2>

        <ol>
          <li>
            {t.rich("project.open", {
              pdficon: () => <PdfIcon fill="#000" ariaLabel="" />,
            })}
          </li>
          <li>{t("project.move")}</li>
          <li>{t("project.cut")}</li>
          <p>{t("project.tools")}</p>
        </ol>
        <table>
          <tbody>
            <tr>
              <th scope="row">
                <FullscreenIcon ariaLabel="" />
              </th>
              <td>{t("project.fullscreen.title")}</td>
              <td>{t("project.fullscreen.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <ExpandLessIcon ariaLabel="" />
              </th>
              <td>{t("project.showMenu.title")}</td>
              <td>{t("project.showMenu.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <InvertColorIcon ariaLabel="" />
              </th>
              <td>{t("project.invert.title")}</td>
              <td>{t("project.invert.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <MoveIcon ariaLabel="" />
              </th>
              <td>{t("project.moveTool.title")}</td>
              <td>{t("project.moveTool.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <GridOnIcon ariaLabel="" />
              </th>
              <td>{t("project.overlayOptions.title")}</td>
              <td>{t("project.overlayOptions.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <LineWeightIcon ariaLabel="" />
              </th>
              <td>{t("project.lineWeight.title")}</td>
              <td>{t("project.lineWeight.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <FlipVerticalIcon ariaLabel="" />
                <FlipHorizontalIcon ariaLabel="" />
              </th>
              <td>{t("project.flip.title")}</td>
              <td>{t("project.flip.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <Rotate90DegreesCWIcon ariaLabel="" />
              </th>
              <td>{t("project.rotate.title")}</td>
              <td>{t("project.rotate.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <RecenterIcon ariaLabel="" />
              </th>
              <td>{t("project.recenter.title")}</td>
              <td>{t("project.recenter.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <MarkAndMeasureIcon ariaLabel="" />
              </th>
              <td>{t("project.measure.title")}</td>
              <td>{t("project.measure.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <LayersIcon ariaLabel="" />
              </th>
              <td>{t("project.layers.title")}</td>
              <td>{t("project.layers.description")}</td>
            </tr>
            <tr>
              <th scope="row">
                <FlexWrapIcon ariaLabel="" />
              </th>
              <td>{t("project.stitch.title")}</td>
              <td>{t("project.stitch.description")}</td>
            </tr>
          </tbody>
        </table>
        <h2>{t("faq.title")}</h2>
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
            <div>{t("faq.annotationSupport.question")}</div>
            {t("faq.annotationSupport.answer")}
          </li>
          <li>
            <div>{t("faq.mobileSupport.question")}</div>
            {t("faq.mobileSupport.answer")}
          </li>
        </ul>
        <h2>{t("resources.title")}</h2>
        <ul>
          {keys.map((key) => (
            <li key={key}>
              <a href={t(`resources.links.${key}.link` as any)}>
                {t(`resources.links.${key}.title` as any)}
              </a>
            </li>
          ))}
        </ul>
        <h2>{t("contribute.title")}</h2>
        <p>
          {t.rich("contribute.donation", {
            donateLink: (chunk) => (
              <a href="https://www.buymeacoffee.com/patternprojector">
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
      <footer className="bg-white rounded-lg shadow m-4">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
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
            className="hover:underline"
          >
            {t("contact")}
          </a>
        </div>
        <script
          data-name="BMC-Widget"
          data-cfasync="false"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="patternprojector"
          data-description="Support me on Buy me a coffee!"
          data-message="If you would like to support the development of Pattern Projector, please consider buying me a coffee!"
          data-color="#BD5FFF"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        ></script>
      </footer>
    </main>
  );
}
