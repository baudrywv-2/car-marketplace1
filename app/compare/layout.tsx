import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/compare" },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
