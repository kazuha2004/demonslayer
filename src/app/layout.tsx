import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho, Yuji_Boku } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

const bloodCrow = localFont({
  src: "../../font/bloodcrow.ttf",
  variable: "--font-bloodcrow",
  display: "swap",
});

const boku = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-boku",
  display: "swap",
});

const mincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mincho",
  display: "swap",
});

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Demon Slayer — The Taisho Archive",
  description:
    "An illustrated field guide to the swordsmen, demons, and Nichirin blades of the Taisho era.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bloodCrow.variable} ${boku.variable} ${mincho.variable} ${notoSans.variable}`}
    >
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
