import DisclaimerContent from "./DisclaimerContent";
import { SITE_URL } from "@/lib/constants";

export const metadata = {
  title: "Disclaimer | DRCCARS",
  description:
    "Disclaimer for DRCCARS at drccars.com — we are a listing platform only. We do not guarantee vehicles, transactions, or seller representations.",
  alternates: { canonical: `${SITE_URL}/disclaimer` },
};

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
