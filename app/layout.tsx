import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Shippori_Mincho_B1({
  weight: ["600", "800"],
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
});

const sans = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Shinobi no Sho · Fichas & Mesa", template: "%s · Shinobi no Sho" },
  description: "Fichas e mesa em grupo para o RPG Naruto: Shinobi no Sho 4.1b, com salas por código e NC até 30.",
  applicationName: "Shinobi no Sho",
};

export const viewport: Viewport = {
  themeColor: "#16120e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
