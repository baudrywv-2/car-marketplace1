import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ | DRCCARS",
  description:
    "Frequently asked questions about DRCCARS — how to contact sellers, list your car, browse for free, and more.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
