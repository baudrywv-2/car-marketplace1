import TermsContent from "./TermsContent";
import { SITE_URL } from "@/lib/constants";

export const metadata = {
  title: "Terms & Conditions | DRCCARS",
  description:
    "Terms and conditions of use for DRCCARS — the car listing and marketplace platform in the Democratic Republic of Congo. Operated at drccars.com.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return <TermsContent />;
}
