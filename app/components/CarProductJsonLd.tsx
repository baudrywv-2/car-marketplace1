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
  condition?: string | null;
  is_sold?: boolean | null;
};

function itemCondition(condition?: string | null): string {
  return condition === "new"
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";
}

export default function CarProductJsonLd({ car }: { car: Car }) {
  const images = car.images?.filter(Boolean) || [];
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: car.title,
    description:
      car.description ||
      `${car.make} ${car.model}${car.year ? ` (${car.year})` : ""} for sale on DRCCARS`,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: car.make },
    sku: car.id,
    ...(car.model ? { model: car.model } : {}),
    ...(car.year ? { productionDate: String(car.year) } : {}),
    itemCondition: itemCondition(car.condition),
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: car.currency === "CDF" ? "CDF" : "USD",
      url: `${SITE_URL}/cars/${car.id}`,
      availability: car.is_sold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      itemCondition: itemCondition(car.condition),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
    />
  );
}
