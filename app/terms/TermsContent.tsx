"use client";

import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";
import { useLocale } from "@/app/contexts/LocaleContext";

type Section = { title: string; body: string };

const content = {
  en: {
    title: "Terms & Conditions",
    updated: "Last updated: March 2025",
    home: "← Home",
    sections: [
      {
        title: "1. Acceptance",
        body:
          'By using DRCCARS ("the platform") at drccars.com, you agree to these terms. The platform connects buyers and sellers of vehicles in the Democratic Republic of Congo. We do not sell cars ourselves; we host listings and facilitate meeting requests.',
      },
      {
        title: "2. Use of the Platform",
        body:
          "You may browse listings, save favorites, compare vehicles, and request meetings with sellers. Sellers may list vehicles for sale or rent after registration. All listings are subject to approval. You must provide accurate information and not misuse the platform (e.g. spam, fake listings, or misleading content).",
      },
      {
        title: "3. Pay-to-Unlock Contact",
        body:
          "Certain seller contact details may be unlocked by paying a fee through our platform. This fee is charged by DRCCARS and is separate from the vehicle purchase. All vehicle transactions occur directly between buyers and sellers, off-platform.",
      },
      {
        title: "4. No In-Platform Payments for Vehicles",
        body:
          "DRCCARS does not process payments for vehicles. All vehicle transactions take place directly between buyers and sellers, off-platform. We are not responsible for payment disputes, fraud, or delivery of vehicles.",
      },
      {
        title: "5. Meeting Requests",
        body:
          "When you request a meeting, we connect you with the seller or their representative. The actual visit, inspection, negotiation, and sale are your responsibility. Meet in safe, public places when possible.",
      },
      {
        title: "6. Listing Rules",
        body:
          "Sellers must list only vehicles they have the right to sell or rent. Descriptions and images must be accurate. We reserve the right to remove listings that violate these rules or applicable law.",
      },
      {
        title: "7. Account",
        body:
          "You are responsible for keeping your account secure. Do not share your credentials. We may suspend or terminate accounts that breach these terms.",
      },
      {
        title: "8. Contact",
        body: `For questions about these terms, contact us at ${SUPPORT_EMAIL} or visit ${SITE_URL}.`,
      },
    ] as Section[],
  },
  fr: {
    title: "Conditions générales",
    updated: "Dernière mise à jour : mars 2025",
    home: "← Accueil",
    sections: [
      {
        title: "1. Acceptation",
        body:
          'En utilisant DRCCARS ("la plateforme") sur drccars.com, vous acceptez ces conditions. La plateforme met en relation acheteurs et vendeurs de véhicules en République Démocratique du Congo. Nous ne vendons pas de véhicules nous-mêmes ; nous hébergeons des annonces et facilitons les demandes de rendez-vous.',
      },
      {
        title: "2. Utilisation de la plateforme",
        body:
          "Vous pouvez consulter les annonces, enregistrer des favoris, comparer des véhicules et demander des rendez-vous avec les vendeurs. Les vendeurs peuvent publier des véhicules à vendre ou à louer après inscription. Toutes les annonces sont soumises à validation. Vous devez fournir des informations exactes et ne pas abuser de la plateforme (ex. spam, fausses annonces, contenu trompeur).",
      },
      {
        title: "3. Déblocage des coordonnées (payant)",
        body:
          "Certaines coordonnées vendeur peuvent être débloquées via le paiement d’un frais. Ce frais est facturé par DRCCARS et est distinct de l’achat du véhicule. Toutes les transactions se font directement entre acheteurs et vendeurs, hors plateforme.",
      },
      {
        title: "4. Pas de paiement des véhicules sur la plateforme",
        body:
          "DRCCARS ne traite pas les paiements des véhicules. Les transactions ont lieu directement entre acheteurs et vendeurs, hors plateforme. Nous ne sommes pas responsables des litiges de paiement, fraudes ou livraisons.",
      },
      {
        title: "5. Demandes de rendez-vous",
        body:
          "Lorsque vous demandez un rendez-vous, nous vous mettons en relation avec le vendeur (ou son représentant). La visite, l’inspection, la négociation et la vente relèvent de votre responsabilité. Privilégiez des lieux publics et sûrs.",
      },
      {
        title: "6. Règles de publication",
        body:
          "Les vendeurs doivent publier uniquement des véhicules qu’ils ont le droit de vendre ou louer. Les descriptions et images doivent être exactes. Nous pouvons retirer des annonces qui violent ces règles ou la loi applicable.",
      },
      {
        title: "7. Compte",
        body:
          "Vous êtes responsable de la sécurité de votre compte. Ne partagez pas vos identifiants. Nous pouvons suspendre ou supprimer des comptes en cas de violation de ces conditions.",
      },
      {
        title: "8. Contact",
        body: `Pour toute question, contactez-nous à ${SUPPORT_EMAIL} ou visitez ${SITE_URL}.`,
      },
    ] as Section[],
  },
} as const;

export default function TermsContent() {
  const { locale, t } = useLocale();
  const lang = locale === "fr" ? "fr" : "en";
  const c = content[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">{c.title}</h1>
      <p className="text-caption mb-6 text-[var(--muted-foreground)]">{c.updated}</p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--foreground)]">
        {c.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-subheading mb-2">{s.title}</h2>
            <p className="text-body text-[var(--muted-foreground)]">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-8">
        <Link href="/" className="text-[10px] font-medium text-[var(--foreground)] hover:underline">
          {locale === "fr" ? c.home : t("backToHome")}
        </Link>
      </p>
    </div>
  );
}

