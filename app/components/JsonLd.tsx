import { SITE_URL } from "@/lib/constants";

export default function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DRCCARS",
    url: SITE_URL,
    description: "Your trusted car marketplace in the Democratic Republic of Congo. Browse and list new and used vehicles—no platform fees.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DRCCARS",
    url: SITE_URL,
    description: "Buy and sell cars in DRC. Browse listings in Kinshasa, Lubumbashi, Goma and beyond.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/cars?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
