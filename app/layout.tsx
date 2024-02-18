import "./globals.css";

import { Inter } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import type { Metadata } from "next";
const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "Pattern Projector";
const APP_DEFAULT_TITLE = "Pattern Projector";
const APP_TITLE_TEMPLATE = "%s - Pattern Projector";
const APP_DESCRIPTION =
  "Calibrates projectors for projecting sewing patterns with accurate scaling and without perspective distortion";

export const metadata: Metadata = {
  description: "Calibrate your projector for sewing patterns",
  viewport:
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no",
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  themeColor: "#000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
