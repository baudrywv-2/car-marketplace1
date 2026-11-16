import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/favorites` },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
