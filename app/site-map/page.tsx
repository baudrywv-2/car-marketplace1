import SiteMapContent from "./SiteMapContent";
import { SITE_URL } from "@/lib/constants";

export const metadata = {
  title: "Site Map | DRCCARS",
  description:
    "Complete site map for DRCCARS — find all pages for browsing cars, listings, account, and legal information in the Democratic Republic of Congo.",
  alternates: { canonical: `${SITE_URL}/site-map` },
};

export default function SiteMapPage() {
  return <SiteMapContent />;
}
