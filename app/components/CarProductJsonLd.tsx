import { SITE_URL } from "@/lib/constants";

type Car = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  make: string;
  model: string;
  year: number | null;
  images: string[];
  currency?: string | null;
};

export default function CarProductJsonLd({ car }: { car: Car }) {
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: car.title,
    description: car.description || `${car.make} ${car.model}${car.year ? ` (${car.year})` : ""} for sale on DRCCARS`,
    image: car.images?.filter(Boolean) || [],
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: car.currency === "CDF" ? "CDF" : "USD",
      url: `${SITE_URL}/cars/${car.id}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
    />
  );
}
