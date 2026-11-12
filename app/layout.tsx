import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import JsonLd from "./components/JsonLd";
import { SITE_URL } from "@/lib/constants";
import { translations, type Locale } from "@/lib/translations";
import type { Currency } from "@/lib/constants";

/** Self-hosted — Google Fonts fetch fails intermittently on Vercel builds. */
const fontSans = localFont({
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const fontLogo = localFont({
  src: [{ path: "./fonts/bebas-neue-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-logo",
  display: "swap",
});

const fontDisplay = localFont({
  src: [
    { path: "./fonts/orbitron-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/orbitron-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  title: {
    default: "DRCCARS | Voitures à vendre en RDC — Acheter occasion (Kinshasa, Goma, Lubumbashi)",
    template: "%s | DRCCARS",
  },
  description:
    "Vente et achat de voitures d’occasion en RDC. Véhicules à vendre à Kinshasa, Goma, Lubumbashi, Bukavu et dans toutes les provinces. Marketplace DRCCARS — contactez les vendeurs.",
  keywords: [
    "DRCCARS",
    "voiture Kinshasa",
    "voiture Goma",
    "voiture Lubumbashi",
    "voiture d'occasion à vendre",
    "voiture occasion a vendre",
    "voiture à vendre RDC",
    "voitures à vendre en RDC",
    "vente voiture occasion RDC",
    "vente de voiture d'occasion en RDC",
    "acheter voiture RDC",
    "acheter voiture goma",
    "acheter voiture kinshasa",
    "véhicule à vendre",
    "agence vente voiture",
    "agence de vente voyage",
    "location voiture voyage",
    "voiture occasion kinshasa",
    "voiture occasion goma",
  ],
  openGraph: {
    title: "DRCCARS | Voitures à vendre en RDC",
    description:
      "Acheter et vendre des voitures d’occasion en RDC — Kinshasa, Goma, Lubumbashi et toutes les provinces.",
    type: "website",
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DRCCARS – Voitures d'occasion en RDC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DRCCARS | Voitures à vendre en RDC",
    description:
      "Acheter une voiture d’occasion en RDC. Annonces à Kinshasa, Goma, Lubumbashi et plus.",
    images: ["/og-image.png"],
  },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

function resolveLocale(raw: string | undefined): Locale {
  return raw && raw in translations ? (raw as Locale) : "fr";
}

function resolveCurrency(raw: string | undefined): Currency {
  return raw === "CDF" ? "CDF" : "USD";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get("car-mkt-locale")?.value);
  const initialCurrency = resolveCurrency(cookieStore.get("car-mkt-currency")?.value);
  const htmlLang =
    initialLocale === "ln" ? "ln" : initialLocale === "sw" ? "sw" : initialLocale;

  const supabaseOrigin = (() => {
    try {
      const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return u ? new URL(u).origin : null;
    } catch {
      return null;
    }
  })();

  return (
    <html lang={htmlLang}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontLogo.variable} ${fontDisplay.variable} font-sans antialiased`}
      >
        <JsonLd />
        <ClientLayout initialLocale={initialLocale} initialCurrency={initialCurrency}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
