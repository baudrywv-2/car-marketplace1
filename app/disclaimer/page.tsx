import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Disclaimer | DRCCARS",
  description: "Disclaimer for DRCCARS at drccars.com — we are a listing platform only. We do not guarantee vehicles, transactions, or seller representations.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">Disclaimer</h1>
      <p className="text-caption mb-6 text-[var(--muted-foreground)]">
        Last updated: March 2025
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--foreground)]">
        <section>
          <h2 className="text-subheading mb-2">Nature of the Platform</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            DRCCARS at <strong className="text-[var(--foreground)]">drccars.com</strong> is a <strong className="text-[var(--foreground)]">listing and connection platform only</strong>. We do not own, sell, or guarantee any vehicles. We host advertisements posted by third-party sellers and help arrange meetings between buyers and sellers in the Democratic Republic of Congo.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">No Warranty on Listings</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            We do not verify the accuracy of listings. Descriptions, images, prices, mileage, condition, and other details are provided by sellers. We do not conduct vehicle inspections or guarantee that listings are truthful, legal, or free of defects. <strong className="text-[var(--foreground)]">You should inspect any vehicle in person before purchasing.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">Transactions Are Between Users</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            All negotiations, payments, and transfers of vehicles occur directly between buyers and sellers, outside our platform. We are not a party to any sale. We do not handle payments, escrow, or delivery. We are not liable for disputes, fraud, misrepresentation, or any loss arising from a transaction.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">Your Responsibility</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            You use the platform at your own risk. When meeting sellers, choose safe, public locations when possible. Verify vehicle documents, registration, and ownership before paying. Comply with local laws regarding vehicle sales and transfers in DRC.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">Availability</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            We strive to keep the platform available, but we do not guarantee uninterrupted access. We may modify, suspend, or discontinue the service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">Contact</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            For questions about this disclaimer, contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--accent)] hover:underline">{SUPPORT_EMAIL}</a>
            {" "}or visit <a href={SITE_URL} className="text-[var(--accent)] hover:underline">{SITE_URL}</a>.
          </p>
        </section>
      </div>

      <p className="mt-8">
        <Link href="/" className="text-[10px] font-medium text-[var(--foreground)] hover:underline">
          ← Home
        </Link>
      </p>
    </div>
  );
}
