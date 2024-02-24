import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import FullscreenIcon from "@/_icons/fullscreen-icon";

import FlipHorizontalIcon from "../_icons/flip-horizontal-icon";
import FlipVerticalIcon from "../_icons/flip-vertical-icon";
import GithubIcon from "../_icons/github-icon";
import GridOnIcon from "../_icons/grid-on-icon";
import InvertColorIcon from "../_icons/invert-color-icon";
import PatternProjectorIcon from "../_icons/pattern-projector-icon";
import PdfIcon from "../_icons/pdf-icon";
import Rotate90DegreesCWIcon from "../_icons/rotate-90-degrees-cw-icon";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <main className="m-4">
      <nav className="flex items-center">
        <PatternProjectorIcon />
        <span className="font-bold">beta</span>
        <Link
          href="https://github.com/Pattern-Projector/pattern-projector"
          className="ml-auto"
        >
          <GithubIcon ariaLabel={t("github")} />
        </Link>
        <Link
          className="ml-4 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
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
        <p>{t("calibration.start")}</p>
        <p>{t("calibration.input")}</p>
        <p className="flex mr-4 gap-4">
          {t("calibration.fullscreen")}
          <FullscreenIcon />
        </p>
        <p>{t("calibration.drag")}</p>
        <Image src="/demo.gif" width={640} height={260} alt=""></Image>
        <p>{t("calibration.project")}</p>
        <h2>Projecting a Pattern</h2>
        <p className="flex mr-4 gap-4">
          Click (or tap)
          <PdfIcon /> to load the PDF document.
        </p>
        <p>Cut along the projected design.</p>
        <p>In projection mode there are several tools provided:</p>
        <ul>
          <li>
            <p>
              Drag to move: move the PDF by clicking and dragging it around the
              screen.
            </p>
          </li>
          <li>
            <div className="flex gap-4">
              <GridOnIcon />
            </div>
            <p>
              Show/hide grid: when projecting, it shows/hides a faint grid to
              verify that your calibration is correct.
            </p>
          </li>
          <li>
            <div className="flex gap-4">
              <InvertColorIcon />
            </div>
            <p>
              Invert Colors: when projecting, it&apos;s usually easier to see
              white lines on black.
            </p>
          </li>
          <li>
            <div className="flex gap-4">
              <FlipVerticalIcon />
              <FlipHorizontalIcon />
            </div>

            <p>
              Flip Vertical/Horizontal: helpful to unwrap fold lines in
              patterns.
            </p>
          </li>
          <li>
            <div className="flex gap-4">
              <Rotate90DegreesCWIcon />
            </div>
            <p>Rotate: to change the orientation of the pattern.</p>
          </li>
          <li>
            <div className="flex gap-4">
              <FullscreenIcon />
            </div>
            <p>
              Fullscreen: it&apos;s generally easier to use the software in
              fullscreen mode.
            </p>
          </li>
        </ul>
        <h2 id="faq">FAQ</h2>
        <ul>
          <li>
            <div>
              Having trouble dragging the grid corners to the edge of your mat?
            </div>{" "}
            You don&apos;t have to calibrate using your entire mat, instead
            choose the largest area you can fit the calibration grid in and make
            sure your width and height inputs match the width and height of the
            grid.
          </li>
          <li>
            <div>Is your PDF projecting too small or large?</div>The Pattern
            Projector calibration tool has no zoom because the scale of the
            projection comes from the size information in the PDF. Make sure
            your pattern has the correct scale. A good way to check if the scale
            of your pattern is off is by projecting a{" "}
            <a href="https://www.mathed.page/puzzles/one-inch-graph-paper.pdf">
              one inch
            </a>{" "}
            or{" "}
            <a href="https://mathbits.com/MathBits/StudentResources/GraphPaper/CentimeterFullPage.pdf">
              one centimetre
            </a>{" "}
            grid to see if it matches your cutting mat.
          </li>
          <li>
            <div>Do you want to save Pattern Projector as an app?</div>Pattern
            Projector is a Progressive Web App (PWA) so it can be saved as an
            app. On a Desktop, you can install it using{" "}
            <a href="https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop">
              Chrome
            </a>{" "}
            or{" "}
            <a href="https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/ux#installing-a-pwa">
              Edge
            </a>
            . On a tablet, open the Share menu and tap Add to Home Screen.
          </li>
          <li>Layer Support: planned for upcoming release.</li>
          <li>Annotation Support: planned for upcoming release.</li>
          <li>
            Chromecast/Miracast: While it&apos;s possible to cast this webpage,
            the lag in the connection can be frustrating, especially when
            calibrating.
          </li>
          <li>
            Phones: While possible to visit and use the webpage on a Phone, the
            limited screen size makes it difficult to use.
          </li>
        </ul>
        <h2 id="support">Support</h2>
        <p>
          If you would like to support the development of this tool, please
          consider{" "}
          <Link href="https://www.buymeacoffee.com/patternprojector">
            buying me a coffee.
          </Link>
        </p>
        <p>Feedback and feature requests are welcome!</p>
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
            Contact
          </a>
        </div>
      </footer>
    </main>
  );
}
