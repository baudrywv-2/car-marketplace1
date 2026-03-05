import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | DRCCARS",
  description: "Frequently asked questions about DRCCARS — how to contact sellers, list your car, browse for free, and more.",
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
