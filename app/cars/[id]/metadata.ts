import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/constants";

type Params = { id: string };

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cars")
    .select("title, description, make, model, year, province, city, price, currency, images")
    .eq("id", params.id)
    .eq("is_approved", true)
    .eq("is_draft", false)
    .maybeSingle();

  if (!data) {
    return {
      title: "Car not found | DRCCARS",
      description: "This car listing could not be found on DRCCARS.",
    };
  }

  const titleParts: string[] = [];
  if (data.year) titleParts.push(String(data.year));
  if (data.make) titleParts.push(data.make);
  if (data.model) titleParts.push(data.model);

  const location =
    [data.city, data.province].filter(Boolean).join(", ") || "Democratic Republic of Congo";

  const title =
    (titleParts.length ? `${titleParts.join(" ")} – ` : "") +
    `Car for sale in ${location} | DRCCARS`;

  const baseDescription =
    data.description?.slice(0, 220) ||
    `Car for sale in ${location} on DRCCARS.`;

  const description = baseDescription;

  const image = Array.isArray(data.images) && data.images[0] ? data.images[0] : undefined;

  const canonical = `${SITE_URL}/cars/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

