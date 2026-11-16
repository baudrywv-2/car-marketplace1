import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/compare` },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
