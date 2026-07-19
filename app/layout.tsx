import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    "Sigillus e uma plataforma para conectar clientes e profissionais com seguranca, discricao, custodia financeira e experiencia premium.",
  applicationName: "Sigillus",
  keywords: ["sigillus", "plataforma", "anuncios verificados", "seguranca", "discricao"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sigillus",
    statusBarStyle: "black-translucent",
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
      <body className={`${manrope.variable} ${cormorant.variable} antialiased`}>{children}</body>
    </html>
  );
}
