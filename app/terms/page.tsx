import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Terms & Conditions | DRCCARS",
  description: "Terms and conditions of use for DRCCARS — the car listing and marketplace platform in the Democratic Republic of Congo. Operated at drccars.com.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">Terms & Conditions</h1>
      <p className="text-caption mb-6 text-[var(--muted-foreground)]">
        Last updated: March 2025
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--foreground)]">
        <section>
          <h2 className="text-subheading mb-2">1. Acceptance</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            By using DRCCARS (&quot;the platform&quot;) at <strong className="text-[var(--foreground)]">drccars.com</strong>, you agree to these terms. The platform connects buyers and sellers of vehicles in the Democratic Republic of Congo. We do not sell cars ourselves; we host listings and facilitate meeting requests.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">2. Use of the Platform</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            You may browse listings, save favorites, compare vehicles, and request meetings with sellers. Sellers may list vehicles for sale or rent after registration. All listings are subject to approval. You must provide accurate information and not misuse the platform (e.g. spam, fake listings, or misleading content).
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">3. Pay-to-Unlock Contact</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            Certain seller contact details may be unlocked by paying a fee through our platform. This fee is charged by DRCCARS and is separate from the vehicle purchase. All vehicle transactions occur directly between buyers and sellers, off-platform.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">4. No In-Platform Payments for Vehicles</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            DRCCARS does not process payments for vehicles. All vehicle transactions take place directly between buyers and sellers, off-platform. We are not responsible for payment disputes, fraud, or delivery of vehicles.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">5. Meeting Requests</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            When you request a meeting, we connect you with the seller or their representative. The actual visit, inspection, negotiation, and sale are your responsibility. Meet in safe, public places when possible.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">6. Listing Rules</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            Sellers must list only vehicles they have the right to sell or rent. Descriptions and images must be accurate. We reserve the right to remove listings that violate these rules or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">7. Account</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            You are responsible for keeping your account secure. Do not share your credentials. We may suspend or terminate accounts that breach these terms.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">8. Contact</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            For questions about these terms, contact us at{" "}
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
