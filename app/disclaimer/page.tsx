import DisclaimerContent from "./DisclaimerContent";

export const metadata = {
  title: "Disclaimer | DRCCARS",
  description:
    "Disclaimer for DRCCARS at drccars.com — we are a listing platform only. We do not guarantee vehicles, transactions, or seller representations.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
