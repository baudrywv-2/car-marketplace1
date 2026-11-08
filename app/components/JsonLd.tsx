import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";

/** Rich schema aimed at marketplace + local RDC car queries (vs Motukanayo / Kivu / Julisha). */
export default function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": ["Organization", "AutoDealer"],
    name: "DRCCARS",
    alternateName: ["DRC Cars", "DRCCARS Marketplace", "Marketplace auto RDC"],
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/og-image.png`,
    email: SUPPORT_EMAIL,
    description:
      "Marketplace automobile en RDC : voitures à vendre, véhicule d'occasion, location pour mariage, voyage, tourisme et ONG à Kinshasa, Goma, Lubumbashi, Bukavu et partout en République Démocratique du Congo.",
    areaServed: [
      { "@type": "Country", name: "Democratic Republic of the Congo" },
      { "@type": "City", name: "Kinshasa" },
      { "@type": "City", name: "Goma" },
      { "@type": "City", name: "Lubumbashi" },
      { "@type": "City", name: "Bukavu" },
      { "@type": "City", name: "Kisangani" },
      { "@type": "City", name: "Beni" },
      { "@type": "City", name: "Kolwezi" },
    ],
    knowsAbout: [
      "voiture à vendre RDC",
      "voiture Goma",
      "voiture Kinshasa",
      "voiture d'occasion à vendre",
      "location voiture mariage",
      "location véhicule ONG",
      "vente voiture occasion RDC",
    ],
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: SUPPORT_EMAIL,
      contactType: "customer support",
      areaServed: "CD",
      availableLanguage: ["fr", "en", "ln", "sw"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DRCCARS",
    alternateName: "Voitures à vendre en RDC",
    url: SITE_URL,
    inLanguage: ["fr", "en", "ln", "sw"],
    description:
      "Acheter et vendre des voitures d'occasion en RDC. Annonces à Goma, Kinshasa, Lubumbashi — alternative locale aux petites annonces automobiles.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/cars?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Marketplace voitures & location en RDC",
    provider: { "@type": "Organization", name: "DRCCARS", url: SITE_URL },
    areaServed: "CD",
    serviceType: ["Vente automobile", "Achat voiture occasion", "Location de véhicule"],
    url: SITE_URL,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }} />
    </>
  );
}
