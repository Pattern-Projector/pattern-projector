import "./globals.css";

import { Inter } from "next/font/google";
import Link from "next/link";

import type { Metadata } from "next";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pattern Projector",
  description: "Calibrate your projector for sewing patterns",
  viewport:
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
