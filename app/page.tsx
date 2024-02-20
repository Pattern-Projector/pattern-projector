import Link from "next/link";

import FullscreenIcon from "@/_icons/fullscreen-icon";

import FlipHorizontalIcon from "./_icons/flip-horizontal-icon";
import FlipVerticalIcon from "./_icons/flip-vertical-icon";
import GithubIcon from "./_icons/github-icon";
import InvertColorIcon from "./_icons/invert-color-icon";
import PatternProjectorIcon from "./_icons/pattern-projector-icon";
import PdfIcon from "./_icons/pdf-icon";
import Rotate90DegreesCWIcon from "./_icons/rotate-90-degrees-cw-icon";

export default function Home() {
  return (
    <main className="m-4">
      <nav className="flex items-center">
        <PatternProjectorIcon />
        <span className="font-bold">beta</span>
        <Link
          href="https://github.com/Pattern-Projector/pattern-projector"
          className="ml-auto"
        >
          <GithubIcon />
        </Link>
        <Link
          className="ml-4 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          href="/calibrate"
        >
          Start Calibrating
        </Link>
      </nav>
      <article className="prose lg:prose-xl m-auto">
        <h1 id="welcome-to-pattern-projector">Welcome to Pattern Projector!</h1>
        <p>
          Pattern projector is a free and open source web app that helps users
          quickly calibrate projectors for sewing patterns. This project is
          currently in beta, so expect large changes and new features to be
          added as we iterate.
        </p>
        <h2 id="what-youll-need">What You’ll Need</h2>
        <ul>
          <li>Projector: at least 720p recommended</li>
          <li>Cutting mat: ideally with grid lines at every inch</li>
          <li>Tripod or wall/shelf/table mount for projector</li>
          <li>Computer or tablet to connect to the projector</li>
          <li>
            A PDF sewing pattern: consider using{" "}
            <a href="https://www.pdfstitcher.org/">PDFStitcher</a> if your
            pattern has layers or multiple pages
          </li>
        </ul>
        <h2 id="setup">Setup</h2>
        <p>
          Place the projector above the cutting mat, pointing at the cutting
          mat. Try to place the projector directly above the cutting mat and
          pointing directly at it.
        </p>
        <p>
          Connect your computer or tablet to the projector and either mirror or
          extend the display.
        </p>
        <p>
          Adjust the focus on the projector, until text is crisp in the centre
          of the projection. If you cannot get a clear image, ensure the
          distance between the projector and cutting mat is within the
          functional range recommended by the manufacturer.
        </p>
        <p>
          If your projector has a keystone, adjust it so that projection is
          close to rectangular and focus near the edges improves.
        </p>
        <h2 id="calibration">Calibration</h2>
        <p>Click (or tap) “Start Calibrating.”</p>
        <p>Input the width and height of your mat.</p>
        <p className="flex mr-4 gap-4">
          Enter fullscreen mode by clicking (or tapping) <FullscreenIcon />
        </p>
        <p>
          Drag the corners of the grid to align with your mat. With your eyes on
          the mat, adjust the corners on your tablet or computer. Adjust the
          placement of the corners until the projected grid matches your
          mat&apos;s grid.
        </p>
        <p>
          When the projected grid is aligned with your mat, click (or tap)
          “Project.”
        </p>
        <h2 id="projecting-a-pattern">Projecting a Pattern</h2>
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
