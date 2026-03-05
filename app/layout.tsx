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
  title: "DRCCARS | Buy & Sell Cars in Congo",
  description: "DRCCARS — your trusted marketplace for new and used cars in the Democratic Republic of Congo. Browse, list, and connect with sellers—no platform fees.",
  keywords: ["DRCCARS", "cars DRC", "used cars Congo", "car marketplace", "vehicles Kinshasa", "buy car DRC"],
  openGraph: {
    title: "DRCCARS",
    description: "Your trusted car marketplace in DRC. Browse and list vehicles—no platform fees.",
    type: "website",
    url: "/",
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
