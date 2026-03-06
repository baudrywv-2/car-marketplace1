import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Inter, Orbitron } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import JsonLd from "./components/JsonLd";
import { SITE_URL } from "@/lib/constants";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontLogo = Bebas_Neue({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const fontDisplay = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  title: {
    default: "DRCCARS | Voitures d’occasion en RDC (Kinshasa, Goma, Lubumbashi)",
    template: "%s | DRCCARS",
  },
  description:
    "DRCCARS est une marketplace auto en République Démocratique du Congo (RDC). Trouvez des voitures d’occasion et véhicules à vendre à Kinshasa, Goma, Lubumbashi (et plus), comparez des annonces, et contactez les vendeurs.",
  keywords: [
    "DRCCARS",
    "voiture d'occasion rdc",
    "voitures d'occasion",
    "voiture occasion kinshasa",
    "voiture occasion lubumbashi",
    "voiture occasion goma",
    "drc cars for sale",
    "acheter voiture goma",
    "voiture à vendre goma",
    "voiture d'occasion à vendre lubumbashi",
    "vente voiture occasion rdc",
  ],
  openGraph: {
    title: "DRCCARS",
    description:
      "Marketplace auto en RDC. Voitures d’occasion à vendre à Kinshasa, Goma, Lubumbashi. Parcourez les annonces et contactez les vendeurs.",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "DRCCARS",
    description:
      "Voitures d’occasion à vendre en RDC (Kinshasa, Goma, Lubumbashi). Parcourez les annonces sur DRCCARS.",
  },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} ${fontLogo.variable} ${fontDisplay.variable} font-sans antialiased`}>
        <JsonLd />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
