"use client";

import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";
import { useLocale } from "@/app/contexts/LocaleContext";
import type { Locale } from "@/lib/translations";

type Section = { title: string; body: string };

const content: Record<
  Locale,
  { title: string; updated: string; home: string; sections: Section[] }
> = {
  en: {
    title: "Disclaimer",
    updated: "Last updated: March 2025",
    home: "← Home",
    sections: [
      {
        title: "Nature of the Platform",
        body: "DRCCARS at drccars.com is a listing and connection platform only. We do not own, sell, or guarantee any vehicles. We host advertisements posted by third-party sellers and help arrange meetings between buyers and sellers in the Democratic Republic of Congo.",
      },
      {
        title: "No Warranty on Listings",
        body: "We do not verify the accuracy of listings. Descriptions, images, prices, mileage, condition, and other details are provided by sellers. We do not conduct vehicle inspections or guarantee that listings are truthful, legal, or free of defects. You should inspect any vehicle in person before purchasing.",
      },
      {
        title: "Transactions Are Between Users",
        body: "All negotiations, payments, and transfers of vehicles occur directly between buyers and sellers, outside our platform. We are not a party to any sale. We do not handle payments, escrow, or delivery. We are not liable for disputes, fraud, misrepresentation, or any loss arising from a transaction.",
      },
      {
        title: "Your Responsibility",
        body: "You use the platform at your own risk. When meeting sellers, choose safe, public locations when possible. Verify vehicle documents, registration, and ownership before paying. Comply with local laws regarding vehicle sales and transfers in DRC.",
      },
      {
        title: "Availability",
        body: "We strive to keep the platform available, but we do not guarantee uninterrupted access. We may modify, suspend, or discontinue the service at any time.",
      },
      {
        title: "Contact",
        body: `For questions about this disclaimer, contact us at ${SUPPORT_EMAIL} or visit ${SITE_URL}.`,
      },
    ],
  },
  fr: {
    title: "Avertissement",
    updated: "Dernière mise à jour : mars 2025",
    home: "← Accueil",
    sections: [
      {
        title: "Nature de la plateforme",
        body: "DRCCARS sur drccars.com est uniquement une plateforme d'annonces et de mise en relation. Nous ne possédons, ne vendons ni ne garantissons aucun véhicule. Nous hébergeons des annonces publiées par des vendeurs tiers et facilitons les rendez-vous entre acheteurs et vendeurs en République Démocratique du Congo.",
      },
      {
        title: "Aucune garantie sur les annonces",
        body: "Nous ne vérifions pas l'exactitude des annonces. Descriptions, images, prix, kilométrage, état et autres détails sont fournis par les vendeurs. Nous n'effectuons pas d'inspections et ne garantissons pas que les annonces sont exactes, légales ou sans défaut. Vous devez inspecter tout véhicule en personne avant d'acheter.",
      },
      {
        title: "Les transactions sont entre utilisateurs",
        body: "Toutes les négociations, paiements et transferts de véhicules se font directement entre acheteurs et vendeurs, hors de notre plateforme. Nous ne sommes pas partie à une vente. Nous ne gérons pas les paiements, l'escrow ni la livraison. Nous ne sommes pas responsables des litiges, fraudes, fausses déclarations ou pertes liées à une transaction.",
      },
      {
        title: "Votre responsabilité",
        body: "Vous utilisez la plateforme à vos propres risques. Lors des rendez-vous, privilégiez des lieux publics et sûrs. Vérifiez les documents, l'immatriculation et la propriété avant de payer. Respectez les lois locales sur la vente et le transfert de véhicules en RDC.",
      },
      {
        title: "Disponibilité",
        body: "Nous nous efforçons de maintenir la plateforme disponible, sans garantir un accès ininterrompu. Nous pouvons modifier, suspendre ou arrêter le service à tout moment.",
      },
      {
        title: "Contact",
        body: `Pour toute question sur cet avertissement, contactez-nous à ${SUPPORT_EMAIL} ou visitez ${SITE_URL}.`,
      },
    ],
  },
  ln: {
    title: "Avertissement",
    updated: "Bobongwani ya suka: Mars 2025",
    home: "← Ebandeli",
    sections: [
      {
        title: "Ezaleli ya plateforme",
        body: "DRCCARS na drccars.com ezali kaka plateforme ya ba annonces mpe ya kosangisa bato. Tozali te ba propriétaires, totekaka te to togaranti te ba motuka. Tozali na ba annonces ya ba vendeurs mpe tosalisaka mpo na ba rendez-vous kati na ba acheteurs mpe ba vendeurs na République Démocratique du Congo.",
      },
      {
        title: "Garantie te na ba annonces",
        body: "Tozali te kotala soki ba annonces ezali ya solo. Ba descriptions, bilili, ntalo, kilométrage mpe ezaleli etindami na ba vendeurs. Tosala te inspection mpe togaranti te soki annonce ezali ya solo to malamu. Olingi otala motuka na miso liboso ya kosomba.",
      },
      {
        title: "Ba transactions ezali kati na basali",
        body: "Ba négociations, ba paiements mpe transfert ya motuka esalemi kati na acheteur mpe vendeur, libanda ya plateforme. Tozali te partie na vente. Togérer te paiement, escrow to livraison. Tozali te responsable ya ba litiges, fraude to perte.",
      },
      {
        title: "Mosala na yo",
        body: "Osali plateforme na risque na yo. Soki okutanaka na vendeur, pona esika ya luki mpe publique. Tala ba documents, immatriculation mpe propriété liboso ya kofuta. Landa mibeko ya RDC mpo na koteisa motuka.",
      },
      {
        title: "Disponibilité",
        body: "Tosalaka mpo plateforme ezala ouverte, kasi togaranti te accès sans interruption. Tokoki kobongola, kokanga to kotika service ntango nyonso.",
      },
      {
        title: "Contact",
        body: `Soki ozali na mituna na avertissement oyo, benga biso na ${SUPPORT_EMAIL} to tala ${SITE_URL}.`,
      },
    ],
  },
  sw: {
    title: "Kanusho",
    updated: "Ilisasishwa: Machi 2025",
    home: "← Nyumbani",
    sections: [
      {
        title: "Asili ya jukwaa",
        body: "DRCCARS kwenye drccars.com ni jukwaa la matangazo na kuunganisha tu. Hatumiliki, hatuuzi, wala hatuhakikishii magari yoyote. Tunaweka matangazo ya wauzaji wa tatu na kusaidia kupanga mikutano kati ya wanunuzi na wauzaji katika Jamhuri ya Kidemokrasia ya Kongo.",
      },
      {
        title: "Hakuna dhamana kwa matangazo",
        body: "Hatuthibitishi usahihi wa matangazo. Maelezo, picha, bei, kilomita, hali na maelezo mengine hutolewa na wauzaji. Hatufanyi ukaguzi wa magari wala hatuhakikishii kuwa matangazo ni ya kweli, halali au bila kasoro. Unapaswa kukagua gari mwenyewe kabla ya kununua.",
      },
      {
        title: "Miamala ni kati ya watumiaji",
        body: "Mazungumzo yote, malipo na uhamishaji wa magari hufanyika moja kwa moja kati ya wanunuzi na wauzaji, nje ya jukwaa letu. Sisi si sehemu ya mauzo yoyote. Hatushughulikii malipo, escrow wala uwasilishaji. Hatuwajibiki kwa migogoro, udanganyifu, uwakilishi potofu au hasara yoyote kutokana na muamala.",
      },
      {
        title: "Wajibu wako",
        body: "Unatumia jukwaa kwa hatari yako mwenyewe. Unapokutana na wauzaji, chagua maeneo salama ya umma inapowezekana. Thibitisha hati za gari, usajili na umiliki kabla ya kulipa. Fuata sheria za ndani kuhusu mauzo na uhamishaji wa magari nchini DRC.",
      },
      {
        title: "Upatikanaji",
        body: "Tunajitahidi kuweka jukwaa lipatikane, lakini hatuhakikishii ufikiaji usiokatizwa. Tunaweza kurekebisha, kusimamisha au kukomesha huduma wakati wowote.",
      },
      {
        title: "Wasiliana",
        body: `Kwa maswali kuhusu kanusho hili, wasiliana nasi kwa ${SUPPORT_EMAIL} au tembelea ${SITE_URL}.`,
      },
    ],
  },
};

export default function DisclaimerContent() {
  const { locale } = useLocale();
  const c = content[locale] ?? content.en;

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
          {c.home}
        </Link>
      </p>
    </div>
  );
}
