import "./globals.css";

import { Inter } from "next/font/google";
import Link from "next/link";

import type { Metadata } from "next";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pattern Projector",
  description: "Calibrate your projector for sewing patterns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="flex items-center justify-between flex-wrap bg-indigo-500 p-6">
          <div className="flex items-center flex-shrink-0 text-white mr-6">
            <span className="font-semibold text-xl tracking-tight">
              Pattern Projector
            </span>
          </div>
          <div className="block lg:hidden">
            <button className="flex items-center px-3 py-2 border rounded text-indigo-200 border-indigo-400 hover:text-white hover:border-white">
              <svg
                className="fill-current h-3 w-3"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Menu</title>
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
              </svg>
            </button>
          </div>
          <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
            <div className="text-sm lg:flex-grow">
              <Link
                href="/about"
                className="block mt-4 lg:inline-block lg:mt-0 text-indigo-200 hover:text-white mr-4"
              >
                About
              </Link>
              <Link
                href="/blog"
                className="block mt-4 lg:inline-block lg:mt-0 text-indigo-200 hover:text-white"
              >
                Blog
              </Link>
            </div>
            <div>
              <Link
                href="/calibrate"
                className="inline-block text-sm mx-4 px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-indigo-500 hover:bg-white mt-4 lg:mt-0"
              >
                Calibrate
              </Link>
              <Link
                href="/project"
                className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-indigo-500 hover:bg-white mt-4 lg:mt-0"
              >
                Project
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
