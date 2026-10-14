import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AgeGateGate } from "@/components/layout/age-gate-gate";
import { MobileNavHost } from "@/components/layout/mobile-nav-host";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  style: "normal",
  display: "swap",
});

const cormorant = localFont({
  src: "./fonts/cormorant-garamond-latin-variable.woff2",
  variable: "--font-cormorant",
  weight: "500 700",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafa",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sigillus.app"),
  title: {
    default: "Sigillus | Plataforma premium com seguranca e discricao",
    template: "%s",
  },
  description:
    "Sigillus e uma plataforma de anuncios onde cada profissional monta e publica o proprio perfil, com seguranca e discricao.",
  applicationName: "Sigillus",
  keywords: ["sigillus", "plataforma", "anuncios verificados", "seguranca", "discricao"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sigillus",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [{ url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${manrope.variable} ${cormorant.variable} antialiased`}>
        <AgeGateGate>
          {children}
          <MobileNavHost />
        </AgeGateGate>
      </body>
    </html>
  );
}
