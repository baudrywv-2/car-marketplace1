import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `${SITE_URL}/seller/${id}`;
  return {
    alternates: { canonical },
    openGraph: { url: canonical },
    robots: { index: true, follow: true },
  };
}

export default function SellerStorefrontLayout({ children }: Props) {
  return children;
}
