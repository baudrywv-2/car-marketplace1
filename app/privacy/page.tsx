import PrivacyContent from "./PrivacyContent";
import { SITE_URL } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy | DRCCARS",
  description:
    "Privacy policy for DRCCARS — how we collect, use, and protect your data when you use our car marketplace at drccars.com in the Democratic Republic of Congo.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
