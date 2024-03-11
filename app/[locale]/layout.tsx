import "./globals.css";

import { NextIntlClientProvider, useMessages } from "next-intl";
import { Inter } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import type { Metadata } from "next";
const inter = Inter({ subsets: ["latin"] });

const APP_TITLE = "Pattern Projector";
const APP_DESCRIPTION =
  "Calibrates projectors for projecting sewing patterns with accurate scaling and without perspective distortion";
const APP_URL = "https://www.patternprojector.com/";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  description: "Calibrate your projector for sewing patterns",
  viewport:
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no",
  applicationName: APP_TITLE,
  title: APP_TITLE,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_TITLE,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  themeColor: "#000",
};

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = useMessages();
  return (
    <html lang={locale}>
      <body className={inter.className} style={{ overscrollBehavior: "none" }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
