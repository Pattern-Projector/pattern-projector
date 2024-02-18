import Link from "next/link";

import FlipHorizontalIcon from "./_icons/flip-horizontal-icon";
import FlipVerticalIcon from "./_icons/flip-vertical-icon";
import MaximizeIcon from "./_icons/fullscreen-icon";
import GithubIcon from "./_icons/github-icon";
import InvertColorIcon from "./_icons/invert-color-icon";
import PatternProjectorIcon from "./_icons/pattern-projector-icon";
import Rotate90DegreesCWIcon from "./_icons/rotate-90-degrees-cw-icon";

export default function Home() {
  return (
    <main>
      <nav className="flex m-4 items-center">
        <PatternProjectorIcon />
        <Link
          className="ml-auto text-white bg-gray-800 border border-gray-600 focus:outline-none hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
          href="/calibrate"
        >
          Start Calibrating
        </Link>
      </nav>
      <h1>Hello, Welcome to Pattern Projector!</h1>
      <h2>How to use Pattern Projector</h2>
      <ol>
        <li>
          1. Connect the projector to a computer or tablet, either directly with
          an HDMI cable or with a casting device.
        </li>
        <li>
          2. Focus and keystone projector. Usually this process involves moving
          a dial on the projector until the picture looks clear and moving
          another dial until the output looks like a rectangle instead of a
          trapezoid.
        </li>
        <li>
          3. Go to the <Link href="/calibrate">Calibration page</Link> and drag
          the corners of the calibration rectangle to match the fathest corners
          of a cutting mat or another flat rectangle of known size (e.g. a piece
          of bristol board).
        </li>
        <li>
          4. Enter the width and height—in inches—of the rectangular object that
          the calibration rectangle is lined up with (e.g. width: 22.5 and
          height 28.5 for the bristol board).
        </li>
        <li>
          4. Click the Show Pattern button and choose a pattern file to project.
        </li>
        <li>5. Start cutting!</li>
        <li>
          6. Use pattern projector tools to help in the cutting process:{" "}
          <ul>
            <li>
              <InvertColorIcon /> Invert PDF colors to make projection easier to
              see
            </li>
            <li>
              <FlipVerticalIcon /> Flip vertically
            </li>
            <li>
              <FlipHorizontalIcon /> Flip horizontally
            </li>
            <li>
              <Rotate90DegreesCWIcon /> Rotate 90° Clockwise
            </li>
            <li>
              <MaximizeIcon /> Enter full screen mode (It is best to calibrate
              in full screen mode if cutting in full screen mode)
            </li>
          </ul>
        </li>
      </ol>
      <h2>About</h2>
      <p>
        Pattern Projector is an open source website that allows users to quickly
        calibrate projectors for sewing patterns.
      </p>
      <p></p>
      <footer className="flex flex-col items-center bg-neutral-900 text-center text-white gap-4 p-4">
        <Link href="https://github.com/Pattern-Projector/pattern-projector">
          <GithubIcon />
        </Link>

        <div>
          <form action="">
            <div className="grid-cols-1 grid items-center justify-center gap-4 md:grid-cols-3">
              <p className="">
                <strong>Sign up for the newsletter</strong>
              </p>

              <input
                type="text"
                className="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] text-neutral-200 outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
                id="email"
                placeholder="Email address"
              />
              <label htmlFor="email" className="font-bold text-white">
                Email address
              </label>
              <button
                type="submit"
                className="text-white bg-gray-800 border border-gray-600 focus:outline-none hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>

        <h2 className="font-bold uppercase">Contact</h2>
        <p>courtney@patternprojector.com</p>

        <div className="w-full p-4 text-center">© 2024 Courtney Pattison</div>
      </footer>
    </main>
  );
}
