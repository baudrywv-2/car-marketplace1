"use client";

import Link from "next/link";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants";
import { useLocale } from "@/app/contexts/LocaleContext";

type Section = { title: string; body?: string; bullets?: { label: string; text: string }[] };

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 2025",
    home: "← Home",
    sections: [
      {
        title: "1. Overview",
        body:
          'DRCCARS ("we", "us") operates drccars.com and respects your privacy. This policy explains what data we collect when you use our car marketplace in the Democratic Republic of Congo and how we use it.',
      },
      {
        title: "2. Data We Collect",
        bullets: [
          { label: "Account data", text: "Email address, password, and optionally phone number when you sign up." },
          { label: "Profile data", text: "Name, phone, and WhatsApp for sellers; stored in your profile and used for listings." },
          { label: "Listing data", text: "Vehicle details, images, price, and seller contact information when you list a car." },
          { label: "Meeting requests", text: "Your message and requested date when you request a meeting with a seller." },
          { label: "Usage data", text: "Favorites, saved searches, recently viewed cars, and compare selections (stored locally or in your account)." },
        ],
      },
      {
        title: "3. How We Use Data",
        body:
          "We use your data to run the platform: to show listings, connect buyers and sellers, manage accounts, process pay-to-unlock contact fees, and improve the service. We do not sell your personal data to third parties for marketing.",
      },
      {
        title: "4. Data Storage",
        body:
          "Data is stored using Supabase (database, authentication, and file storage). Payment processing for contact unlocks uses Stripe. Your data may be processed on servers in various locations. We take reasonable measures to keep your data secure.",
      },
      {
        title: "5. Sharing",
        body:
          "When you request a meeting or unlock contact details, we share relevant information (e.g. your message, contact info) with the seller or our admin team so they can arrange the meeting. Listing information (including phone, WhatsApp, address if provided) is visible to buyers who unlock contact details.",
      },
      {
        title: "6. Cookies and Local Storage",
        body:
          "We use cookies and local storage for authentication, language preference (EN/FR), currency (USD/CDF), favorites (for guests), saved searches, recently viewed cars, and compare selections. These help the site function correctly.",
      },
      {
        title: "7. Your Rights",
        body:
          `You can update or delete your account data from your dashboard. You may also request access to, correction of, or deletion of your personal data by contacting us at ${SUPPORT_EMAIL}.`,
      },
      {
        title: "8. Changes",
        body:
          `We may update this policy. The "Last updated" date at the top will be revised. Continued use of the platform at ${SITE_URL} after changes constitutes acceptance.`,
      },
    ] as Section[],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : mars 2025",
    home: "← Accueil",
    sections: [
      {
        title: "1. Aperçu",
        body:
          'DRCCARS ("nous") exploite drccars.com et respecte votre vie privée. Cette politique explique quelles données nous collectons lorsque vous utilisez notre marketplace automobile en République Démocratique du Congo et comment nous les utilisons.',
      },
      {
        title: "2. Données collectées",
        bullets: [
          { label: "Données de compte", text: "Adresse email, mot de passe et éventuellement numéro de téléphone lors de l’inscription." },
          { label: "Données de profil", text: "Nom, téléphone et WhatsApp pour les vendeurs ; stockés dans votre profil et utilisés pour les annonces." },
          { label: "Données d’annonce", text: "Détails du véhicule, images, prix et informations de contact du vendeur lors du dépôt d’une annonce." },
          { label: "Demandes de rendez-vous", text: "Votre message et la date proposée lorsque vous demandez un rendez-vous avec un vendeur." },
          { label: "Données d’usage", text: "Favoris, recherches enregistrées, véhicules récemment consultés et comparaisons (stockés localement ou dans votre compte)." },
        ],
      },
      {
        title: "3. Utilisation des données",
        body:
          "Nous utilisons vos données pour faire fonctionner la plateforme : afficher les annonces, mettre en relation acheteurs et vendeurs, gérer les comptes, traiter les frais de déblocage de contact et améliorer le service. Nous ne vendons pas vos données personnelles à des tiers à des fins marketing.",
      },
      {
        title: "4. Stockage des données",
        body:
          "Les données sont stockées via Supabase (base de données, authentification et stockage de fichiers). Le paiement pour le déblocage des contacts utilise Stripe. Vos données peuvent être traitées sur des serveurs situés dans différentes régions. Nous prenons des mesures raisonnables pour protéger vos données.",
      },
      {
        title: "5. Partage",
        body:
          "Lorsque vous demandez un rendez-vous ou débloquez des coordonnées, nous partageons les informations pertinentes (ex. votre message, vos coordonnées) avec le vendeur ou notre équipe admin afin d’organiser le rendez-vous. Les informations d’annonce (y compris téléphone, WhatsApp, adresse si fournie) sont visibles aux acheteurs qui débloquent les coordonnées.",
      },
      {
        title: "6. Cookies et stockage local",
        body:
          "Nous utilisons des cookies et le stockage local pour l’authentification, la langue, la devise (USD/CDF), les favoris (invités), les recherches enregistrées, l’historique des véhicules vus et les comparaisons. Cela permet au site de fonctionner correctement.",
      },
      {
        title: "7. Vos droits",
        body:
          `Vous pouvez mettre à jour ou supprimer vos données depuis votre tableau de bord. Vous pouvez aussi demander l’accès, la correction ou la suppression de vos données personnelles en nous contactant à ${SUPPORT_EMAIL}.`,
      },
      {
        title: "8. Modifications",
        body:
          `Nous pouvons mettre à jour cette politique. La date de "dernière mise à jour" sera modifiée. L’utilisation continue de la plateforme à ${SITE_URL} vaut acceptation.`,
      },
    ] as Section[],
  },
  ln: {
    title: "Politiki ya kobatela makambo ya moto",
    updated: "Ebandeli ya nsuka: Mars 2025",
    home: "← Accueil",
    sections: [
      {
        title: "1. Na mokuse",
        body:
          'DRCCARS ("biso") esalaka na drccars.com mpe ebatelaka makambo ya moto. Politiki oyo elobaka makambo nini tozali kosangisa tango ozali kosalela marketplace ya motuka na RDC mpe ndenge nini tosalelaka yango.',
      },
      {
        title: "2. Makambo oyo tozali kosangisa",
        bullets: [
          { label: "Makambo ya compte", text: "Email, mot de passe, mpe (soki olingi) numero ya telefone tango okomisa compte." },
          { label: "Makambo ya profil", text: "Kombo, telefone, mpe WhatsApp (mpo na bavendeur) — ebombami na profil mpe esalelami na ba annonces." },
          { label: "Makambo ya annonce", text: "Ba détails ya motuka, bilili, prix, mpe ba contacts ya vendeur tango okotisi motuka." },
          { label: "Kosenga rendez-vous", text: "Message na yo mpe mokolo oyo osengi tango osengi kokutana na vendeur." },
          { label: "Makambo ya bosaleli", text: "Favoris, recherches ebombami, motuka oyo otalaki, mpe comparaison (na appareil to na compte)." },
        ],
      },
      {
        title: "3. Ndenge tosalelaka makambo",
        body:
          "Tosalelaka makambo na yo mpo na kosalisa plateforme: kolakisa ba annonces, kokangisa acheteur na vendeur, kobatela ba comptes, kosala frais ya débloquer contact, mpe kobongisa service. Totesaka te makambo na yo epai ya bato mosusu mpo na marketing.",
      },
      {
        title: "4. Esika ebombami",
        body:
          "Makambo ebombami na Supabase (database, authentification, stockage ya bilili). Paiement mpo na débloquer contact esalelaka Stripe. Makambo ekoki kosalema na ba serveurs ya bisika ndenge na ndenge. Tozwaka matambe mpo na kobatela makambo na yo.",
      },
      {
        title: "5. Kopesa/partager",
        body:
          "Tango osengi rendez-vous to obongoli contact, topesaka makambo ya ntina (ndakisa message, contact) epai ya vendeur to équipe admin mpo na kobongisa rendez-vous. Makambo ya annonce (telefone, WhatsApp, adresse soki epesami) ekoki komonana na acheteur oyo abongoli contact.",
      },
      {
        title: "6. Cookies mpe stockage local",
        body:
          "Tosalelaka cookies mpe stockage local mpo na authentification, lokota, devise (USD/CDF), favoris (invités), recherches ebombami, histoire ya motuka, mpe comparaison. Ezali mpo site esala malamu.",
      },
      {
        title: "7. Makoki na yo",
        body:
          `Okoki kobongola to kolongola makambo ya compte na yo na dashboard. Okoki mpe kosenga access, correction to suppression ya makambo na yo na email: ${SUPPORT_EMAIL}.`,
      },
      {
        title: "8. Mbongwana",
        body:
          `Tokoki kobongola politiki oyo. Mokolo ya "Ebandeli ya nsuka" ekobongwana. Kosalela platforme na ${SITE_URL} sima ya mbongwana elakisi o ndimi.`,
      },
    ] as Section[],
  },
  sw: {
    title: "Sera ya Faragha",
    updated: "Imesasishwa mwisho: Machi 2025",
    home: "← Nyumbani",
    sections: [
      {
        title: "1. Muhtasari",
        body:
          'DRCCARS ("sisi") inaendesha drccars.com na kuheshimu faragha yako. Sera hii inaeleza data tunazokusanya unapotumia soko letu la magari nchini DRC na jinsi tunavyotumia data hiyo.',
      },
      {
        title: "2. Data tunazokusanya",
        bullets: [
          { label: "Data ya akaunti", text: "Barua pepe, nenosiri, na (hiari) nambari ya simu unapojisajili." },
          { label: "Data ya profaili", text: "Jina, simu, na WhatsApp kwa wauzaji; huhifadhiwa kwenye profaili na hutumika kwa matangazo." },
          { label: "Data ya tangazo", text: "Maelezo ya gari, picha, bei, na mawasiliano ya muuzaji unapo-orodhesha gari." },
          { label: "Maombi ya mkutano", text: "Ujumbe wako na tarehe unayopendekeza unapoomba mkutano na muuzaji." },
          { label: "Data ya matumizi", text: "Vipendwa, utafutaji uliohifadhiwa, magari uliyotazama, na ulinganisho (kwenye kifaa au akaunti)." },
        ],
      },
      {
        title: "3. Jinsi tunavyotumia data",
        body:
          "Tunatumia data yako kuendesha jukwaa: kuonyesha matangazo, kuunganisha wanunuzi na wauzaji, kusimamia akaunti, kuchakata ada ya kufungua mawasiliano, na kuboresha huduma. Hatuuzi data yako binafsi kwa uuzaji wa matangazo.",
      },
      {
        title: "4. Uhifadhi wa data",
        body:
          "Data huhifadhiwa kupitia Supabase (hifadhidata, uthibitishaji, na hifadhi ya picha). Malipo ya kufungua mawasiliano hutumia Stripe. Data inaweza kuchakatwa kwenye seva zilizo maeneo tofauti. Tunachukua hatua za msingi kulinda data yako.",
      },
      {
        title: "5. Kushiriki",
        body:
          "Unapoomba mkutano au kufungua mawasiliano, tunashiriki taarifa muhimu (mf. ujumbe, mawasiliano) na muuzaji au timu ya admin ili kupanga mkutano. Taarifa za tangazo (ikiwemo simu, WhatsApp, anwani ikiwa imetolewa) zinaweza kuonekana kwa wanunuzi wanaofungua mawasiliano.",
      },
      {
        title: "6. Cookies na hifadhi ya ndani",
        body:
          "Tunatumia cookies na hifadhi ya ndani kwa uthibitishaji, lugha, sarafu (USD/CDF), vipendwa (wageni), utafutaji uliohifadhiwa, magari uliyotazama, na ulinganisho. Hizi husaidia tovuti kufanya kazi vizuri.",
      },
      {
        title: "7. Haki zako",
        body:
          `Unaweza kusasisha au kufuta data ya akaunti yako kwenye dashibodi. Unaweza pia kuomba ufikiaji, marekebisho, au ufutaji wa data yako binafsi kwa kuwasiliana nasi kupitia ${SUPPORT_EMAIL}.`,
      },
      {
        title: "8. Mabadiliko",
        body:
          `Tunaweza kusasisha sera hii. Tarehe ya "imesasishwa mwisho" itawekwa upya. Kuendelea kutumia jukwaa kwenye ${SITE_URL} baada ya mabadiliko kunamaanisha umekubali.`,
      },
    ] as Section[],
  },
} as const;

export default function PrivacyContent() {
  const { locale, t } = useLocale();
  const lang = (locale === "fr" || locale === "ln" || locale === "sw") ? locale : "en";
  const c = content[lang as "en" | "fr" | "ln" | "sw"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">{c.title}</h1>
      <p className="text-caption mb-6 text-[var(--muted-foreground)]">{c.updated}</p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--foreground)]">
        {c.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-subheading mb-2">{s.title}</h2>
            {s.body && <p className="text-body text-[var(--muted-foreground)]">{s.body}</p>}
            {s.bullets && (
              <ul className="list-inside list-disc space-y-2 text-body text-[var(--muted-foreground)]">
                {s.bullets.map((b) => (
                  <li key={b.label}>
                    <strong className="text-[var(--foreground)]">{b.label}:</strong> {b.text}
                  </li>
                ))}
              </ul>
            )}
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

