import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy | DRCCARS",
  description: "Privacy policy for DRCCARS — how we collect, use, and protect your data when you use our car marketplace at drccars.com in the Democratic Republic of Congo.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">Privacy Policy</h1>
      <p className="text-caption mb-6 text-[var(--muted-foreground)]">
        Last updated: March 2025
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--foreground)]">
        <section>
          <h2 className="text-subheading mb-2">1. Overview</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            DRCCARS (&quot;we&quot;, &quot;us&quot;) operates <strong className="text-[var(--foreground)]">drccars.com</strong> and respects your privacy. This policy explains what data we collect when you use our car marketplace in the Democratic Republic of Congo and how we use it.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">2. Data We Collect</h2>
          <ul className="list-inside list-disc space-y-2 text-body text-[var(--muted-foreground)]">
            <li><strong className="text-[var(--foreground)]">Account data:</strong> Email address, password, and optionally phone number when you sign up.</li>
            <li><strong className="text-[var(--foreground)]">Profile data:</strong> Name, phone, and WhatsApp for sellers; stored in your profile and used for listings.</li>
            <li><strong className="text-[var(--foreground)]">Listing data:</strong> Vehicle details, images, price, and seller contact information when you list a car.</li>
            <li><strong className="text-[var(--foreground)]">Meeting requests:</strong> Your message and requested date when you request a meeting with a seller.</li>
            <li><strong className="text-[var(--foreground)]">Usage data:</strong> Favorites, saved searches, recently viewed cars, and compare selections (stored locally or in your account).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-subheading mb-2">3. How We Use Data</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            We use your data to run the platform: to show listings, connect buyers and sellers, manage accounts, process pay-to-unlock contact fees, and improve the service. We do not sell your personal data to third parties for marketing.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">4. Data Storage</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            Data is stored using Supabase (database, authentication, and file storage). Payment processing for contact unlocks uses Stripe. Your data may be processed on servers in various locations. We take reasonable measures to keep your data secure.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">5. Sharing</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            When you request a meeting or unlock contact details, we share relevant information (e.g. your message, contact info) with the seller or our admin team so they can arrange the meeting. Listing information (including phone, WhatsApp, address if provided) is visible to buyers who unlock contact details.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">6. Cookies and Local Storage</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            We use cookies and local storage for authentication, language preference (EN/FR), currency (USD/CDF), favorites (for guests), saved searches, recently viewed cars, and compare selections. These help the site function correctly.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">7. Your Rights</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            You can update or delete your account data from your dashboard. You may also request access to, correction of, or deletion of your personal data by contacting us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--accent)] hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2 className="text-subheading mb-2">8. Changes</h2>
          <p className="text-body text-[var(--muted-foreground)]">
            We may update this policy. The &quot;Last updated&quot; date at the top will be revised. Continued use of the platform at {SITE_URL} after changes constitutes acceptance.
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
