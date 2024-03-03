import { useTranslations } from "next-intl";
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
import Tooltip from "@/_components/tooltip/tooltip";
import { IconButton } from "@/_components/buttons/icon-button";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <main className="m-4">
      <nav className="flex items-center gap-2">
        <PatternProjectorIcon ariaLabel="" />
        <span className="font-bold">{t("beta")}</span>
        <Tooltip description={t("github")} className="ml-auto">
          <IconButton href="https://github.com/Pattern-Projector/pattern-projector">
            <GithubIcon ariaLabel={t("github")} />
          </IconButton>
        </Tooltip>
        <Link
          className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          href="/calibrate"
        >
          {t("calibrate")}
        </Link>
      </nav>
      <article className="prose lg:prose-xl m-auto">
        <h1>{t("welcome.title")}</h1>
        <p>{t("welcome.description")}</p>
        <h2>{t("requirements.title")}</h2>
        <ul>
          <li>{t("requirements.projector")}</li>
          <li>{t("requirements.mat")}</li>
          <li>{t("requirements.mount")}</li>
          <li>{t("requirements.computer")}</li>
          <li>
            {t.rich("requirements.pattern", {
              pdfstitcher: (chunks) => (
                <a href={t("pdfstitcherHref")}>{chunks}</a>
              ),
            })}
          </li>
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
          <li>{t("calibration.start")}</li>
          <li>{t("calibration.input")}</li>
          <li>
            {t("calibration.fullscreen")}
            <FullscreenIcon ariaLabel="" />
          </li>
          <li>{t("calibration.drag")}</li>
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
                <GridOnIcon ariaLabel="" />
              </th>
              <td>{t("project.showGrid.title")}</td>
              <td>{t("project.showGrid.description")}</td>
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
                <FullscreenIcon ariaLabel="" />
              </th>
              <td>{t("project.fullscreen.title")}</td>
              <td>{t("project.fullscreen.description")}</td>
            </tr>
          </tbody>
        </table>

        <h2>{t("faq.title")}</h2>
        <ul>
          <li>
            <div>{t("faq.gridSize.question")}</div>
            {t("faq.gridSize.answer")}
          </li>
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
            <div>{t("faq.saveAsApp.question")}</div>
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
          <li>
            <div>{t("faq.annotationSupport.question")}</div>
            {t("faq.annotationSupport.answer")}
          </li>
          <li>
            <div>{t("faq.chromecastSupport.question")}</div>
            {t("faq.chromecastSupport.answer")}
          </li>
          <li>
            <div>{t("faq.mobileSupport.question")}</div>
            {t("faq.mobileSupport.answer")}
          </li>
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
        <p>{t("contribute.translate")}</p>
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

          <a
            href="mailto:courtney@patternprojector.com"
            className="hover:underline"
          >
            {t("contact")}
          </a>
        </div>
      </footer>
    </main>
  );
}
