import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/favorites" },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
