/**
 * Generate DRCCARS seller guide (French) as PDF.
 * Run: node docs/generate-seller-guide-fr.cjs
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = path.join(__dirname);
const OUT_DESKTOP = path.join(process.env.USERPROFILE || "", "Desktop", "DRCCARS-Guide-Vendeur.pdf");
const OUT_DOCS = path.join(ROOT, "DRCCARS-Guide-Vendeur.pdf");
const FONT = path.join(ROOT, "NotoSans-Regular.ttf");
const FONT_BOLD = path.join(ROOT, "NotoSans-Bold.ttf");

const GOLD = "#ca8a04";
const INK = "#18181b";
const MUTED = "#52525b";
const RULE = "#e4e4e7";
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 52;

function ensureFonts() {
  if (!fs.existsSync(FONT) || !fs.existsSync(FONT_BOLD)) {
    throw new Error("Missing Noto Sans fonts in docs/");
  }
}

function createDoc() {
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: MARGIN, bottom: MARGIN + 28, left: MARGIN, right: MARGIN },
    info: {
      Title: "DRCCARS — Guide vendeur (pas à pas)",
      Author: "DRCCARS",
      Subject: "Créer un compte vendeur, publier une annonce et gérer son tableau de bord",
      Keywords: "DRCCARS, vendeur, guide, RDC",
    },
  });
  doc.registerFont("Body", FONT);
  doc.registerFont("Bold", FONT_BOLD);
  return doc;
}

function stampFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const pageNum = i + 1;
    const y = PAGE_H - 34;
    doc.save();
    doc.strokeColor(RULE).lineWidth(0.6).moveTo(MARGIN, y - 10).lineTo(PAGE_W - MARGIN, y - 10).stroke();
    doc.fillColor(MUTED).font("Body").fontSize(8);
    doc.text("DRCCARS · Guide vendeur", MARGIN, y, { lineBreak: false });
    doc.text(`${pageNum} / ${range.count}`, PAGE_W - MARGIN - 80, y, { width: 80, align: "right", lineBreak: false });
    doc.restore();
  }
}

function h1(doc, text) {
  doc.moveDown(0.4);
  doc.fillColor(INK).font("Bold").fontSize(18).text(text, { paragraphGap: 6 });
  doc
    .strokeColor(GOLD)
    .lineWidth(2)
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + 56, doc.y)
    .stroke();
  doc.moveDown(0.8);
}

function h2(doc, text) {
  doc.moveDown(0.55);
  doc.fillColor(INK).font("Bold").fontSize(12.5).text(text, { paragraphGap: 4 });
  doc.moveDown(0.15);
}

function p(doc, text) {
  doc.fillColor(INK).font("Body").fontSize(10).text(text, {
    align: "justify",
    lineGap: 2.2,
    paragraphGap: 6,
  });
}

function tip(doc, text) {
  const x = MARGIN;
  const width = PAGE_W - MARGIN * 2;
  const pad = 10;
  doc.moveDown(0.25);
  const startY = doc.y;
  doc.fillColor(MUTED).font("Body").fontSize(9);
  const h = doc.heightOfString(text, { width: width - pad * 2 - 8, lineGap: 1.5 }) + pad * 2;
  doc.save();
  doc.roundedRect(x, startY, width, h, 4).fillAndStroke("#fafafa", RULE);
  doc.fillColor(GOLD).rect(x, startY, 3.5, h).fill();
  doc.restore();
  doc.fillColor(MUTED).font("Body").fontSize(9).text(text, x + pad + 6, startY + pad, {
    width: width - pad * 2 - 8,
    lineGap: 1.5,
  });
  doc.y = startY + h + 8;
  doc.x = MARGIN;
}

function bullet(doc, items) {
  doc.fillColor(INK).font("Body").fontSize(10);
  for (const item of items) {
    doc.text(`•  ${item}`, { indent: 6, paragraphGap: 3, lineGap: 1.8 });
  }
  doc.moveDown(0.25);
}

function stepBox(doc, num, title, bodyLines) {
  const width = PAGE_W - MARGIN * 2;
  const startY = doc.y;
  const titleH = 18;
  let body = "";
  // estimate height
  doc.font("Body").fontSize(9.5);
  const bodyText = bodyLines.join("\n");
  const bodyH = doc.heightOfString(bodyText, { width: width - 56, lineGap: 2 }) + 8;
  const h = Math.max(52, titleH + bodyH + 20);

  if (startY + h > PAGE_H - MARGIN - 40) {
    doc.addPage();
  }

  const y = doc.y;
  doc.save();
  doc.roundedRect(MARGIN, y, width, h, 5).fillAndStroke("#ffffff", RULE);
  doc.circle(MARGIN + 22, y + 24, 12).fill(GOLD);
  doc.fillColor("#09090b").font("Bold").fontSize(11).text(String(num), MARGIN + 14.5, y + 17, {
    width: 16,
    align: "center",
  });
  doc.fillColor(INK).font("Bold").fontSize(11).text(title, MARGIN + 44, y + 12, { width: width - 56 });
  doc
    .fillColor(MUTED)
    .font("Body")
    .fontSize(9.5)
    .text(bodyText, MARGIN + 44, y + 30, { width: width - 56, lineGap: 2 });
  doc.restore();
  doc.y = y + h + 10;
  doc.x = MARGIN;
}

function cover(doc) {
  // gold top bar
  doc.rect(0, 0, PAGE_W, 8).fill(GOLD);
  doc.moveDown(4);
  doc.fillColor(GOLD).font("Bold").fontSize(11).text("DRCCARS", { align: "left", characterSpacing: 2 });
  doc.moveDown(0.6);
  doc.fillColor(INK).font("Bold").fontSize(26).text("Guide vendeur", { lineGap: 4 });
  doc.fillColor(INK).font("Bold").fontSize(26).text("pas à pas", { lineGap: 2 });
  doc.moveDown(0.5);
  doc
    .strokeColor(GOLD)
    .lineWidth(2.5)
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + 72, doc.y)
    .stroke();
  doc.moveDown(1);
  doc
    .fillColor(MUTED)
    .font("Body")
    .fontSize(11)
    .text(
      "De la création du compte à la publication d’une annonce, puis à la navigation de votre tableau de bord — le parcours complet pour vendre ou louer sur DRCCARS en RDC.",
      { align: "left", lineGap: 3, width: PAGE_W - MARGIN * 2 - 40 }
    );
  doc.moveDown(1.4);
  doc.fillColor(INK).font("Bold").fontSize(10).text("Ce guide couvre");
  doc.moveDown(0.3);
  bullet(doc, [
    "Inscription vendeur et confirmation de l’email",
    "Compléter le profil (coordonnées, photo, marque)",
    "Créer, enregistrer en brouillon et soumettre une annonce",
    "Comprendre l’approbation admin",
    "Utiliser le tableau de bord (Aperçu, Annonces, Rendez-vous)",
    "Gérer, modifier et partager votre vitrine publique",
  ]);
  doc.moveDown(1.2);
  tip(
    doc,
    "Conseil : gardez ce PDF à portée de main lors de votre première session. Site : https://drccars.com — compte vendeur via Inscription → « Vendre des véhicules »."
  );
  doc.moveDown(2);
  doc.fillColor(MUTED).font("Body").fontSize(9).text("Version guide · Français · Parcours produit actuel");
}

function writeGuide(doc) {
  cover(doc);
  doc.addPage();

  h1(doc, "1. Vue d’ensemble du parcours");
  p(
    doc,
    "Sur DRCCARS, un vendeur crée un compte, confirme son email, complète ses coordonnées, publie une ou plusieurs annonces, puis suit l’intérêt des acheteurs (vues, favoris, rendez-vous) depuis son tableau de bord. Les annonces ne sont visibles au public qu’après validation par l’équipe DRCCARS."
  );
  tip(
    doc,
    "Ordre recommandé : Inscription → Confirmer l’email → Coordonnées → Première annonce → Tableau de bord. Ne déposez pas d’annonce avant d’avoir un téléphone valide et un email confirmé."
  );

  h1(doc, "2. Créer votre compte vendeur");
  h2(doc, "Étape A — Inscription");
  p(doc, "Allez sur https://drccars.com/signup (ou Inscription dans le menu).");
  bullet(doc, [
    "Sous « Je souhaite », choisissez « Vendre des véhicules ».",
    "Renseignez votre nom complet.",
    "Type de compte : « Vendeur particulier » ou « Entreprise / Concession ».",
    "Si entreprise : indiquez le nom de l’entreprise / marque (obligatoire).",
    "Ville (recommandée), numéro de téléphone RDC (obligatoire).",
    "Email et mot de passe (6 caractères minimum).",
    "Acceptez les Conditions générales et la Politique de confidentialité.",
    "Cliquez sur « Inscription ».",
  ]);

  h2(doc, "Étape B — Confirmer l’email");
  p(
    doc,
    "Vous arrivez souvent sur la page « Confirmez votre email ». Ouvrez la boîte mail, cliquez sur le lien de vérification Supabase, puis reconnectez-vous si besoin. Boutons utiles : « Renvoyer l’email de vérification » et « J’ai confirmé — se connecter »."
  );
  tip(
    doc,
    "Sans email confirmé, vous ne pourrez pas déposer une annonce. Le téléphone saisi à l’inscription sert aussi de base WhatsApp pour le contact acheteur."
  );

  doc.addPage();
  h1(doc, "3. Accueil vendeur & profil");
  h2(doc, "Page de bienvenue");
  p(
    doc,
    "Après connexion, les nouveaux vendeurs voient /dashboard/seller/welcome (« Bienvenue, vendeur ») avec 4 étapes : compléter le profil, vérifier l’email, déposer la première annonce, suivre l’intérêt et les rendez-vous."
  );
  bullet(doc, [
    "« Déposer mon premier véhicule » → création d’annonce",
    "« Vérifier mon profil » → page Coordonnées",
    "« Aller à mon tableau de bord » → vue vendeur",
  ]);

  h2(doc, "Coordonnées (profil)");
  p(doc, "Ouvrez « Modifier le profil » ou allez sur /dashboard/settings (titre : Coordonnées).");
  bullet(doc, [
    "Photo de profil : Choisir / Changer / Supprimer (JPG, PNG, WebP, max. 3 Mo) — enregistrée tout de suite.",
    "Nom complet (obligatoire).",
    "Type de compte + nom d’entreprise ou nom commercial.",
    "Ville, âge, bio (facultatifs mais utiles pour la confiance).",
    "Téléphone (obligatoire) et WhatsApp (sinon = téléphone).",
    "Cliquez sur « Enregistrer les modifications ».",
  ]);
  tip(
    doc,
    "Ces coordonnées s’appliquent à toutes vos annonces. Mettez un numéro joignable : c’est ce que les acheteurs utilisent après déblocage / rendez-vous validé."
  );

  h1(doc, "4. Publier une annonce");
  p(doc, "Menu / bouton « Ajouter un véhicule » → /dashboard/cars/new.");

  stepBox(doc, 1, "Choisir le type d’annonce", [
    "À vendre · À louer · Vente & location.",
    "Le type détermine les champs prix (vente et/ou location).",
  ]);
  stepBox(doc, 2, "Renseigner le véhicule", [
    "Titre accrocheur (obligatoire).",
    "Marque et modèle (obligatoires), année, kilométrage, type, boîte, carburant, options.",
    "État (neuf / occasion), devise, prix de vente si vente.",
    "Si location : au moins un tarif (heure / jour / semaine / mois) + éventuels types d’événements.",
  ]);
  stepBox(doc, 3, "Lieu, contact et photos", [
    "Ville / province (obligatoire pour la publication).",
    "Téléphone (prérempli depuis le profil si déjà saisi).",
    "Jusqu’à 4 photos (environ 3 Mo chacune) — photos nettes, plusieurs angles.",
    "Description et adresse (facultatives).",
  ]);
  stepBox(doc, 4, "Enregistrer ou soumettre", [
    "« Enregistrer le brouillon » : annonce non publique, à compléter plus tard.",
    "« Soumettre pour approbation » : envoi à l’équipe DRCCARS (statut En attente).",
    "Après enregistrement vous revenez au tableau de bord vendeur.",
  ]);

  tip(
    doc,
    "Une annonce n’apparaît dans « Voir les véhicules » qu’après approbation admin. Le statut « En attente d’approbation » est normal juste après l’envoi."
  );

  doc.addPage();
  h1(doc, "5. Après l’envoi : validation");
  bullet(doc, [
    "Brouillon : visible seulement dans votre espace, filtre « Brouillons ».",
    "En attente : soumise, pas encore en ligne.",
    "En ligne : approuvée, visible par les acheteurs.",
    "Vendu : retiré de la vente active (vous pouvez remettre en ligne).",
    "En cas de refus, un motif peut être indiqué ; utilisez « Nous contacter » si besoin.",
  ]);
  p(
    doc,
    "Astuce qualité : photos claires, prix réaliste, description honnête (état, options, historique) accélèrent souvent la validation et les contacts."
  );

  h1(doc, "6. Naviguer dans votre compte vendeur");
  p(doc, "Adresse : https://drccars.com/dashboard/seller (aussi via Tableau de bord après connexion).");

  h2(doc, "En-tête");
  bullet(doc, [
    "Nom, type de compte, ville, téléphone enregistré.",
    "« Ajouter un véhicule » — nouvelle annonce.",
    "« Modifier le profil » — coordonnées.",
    "« Voir ma vitrine » / « Partager la vitrine » (WhatsApp) — page publique /seller/…",
    "« Comment ça marche » — rappel des étapes d’accueil.",
  ]);

  h2(doc, "Onglet Aperçu");
  bullet(doc, [
    "Liste de contrôle de démarrage (email, téléphone, nom, première annonce).",
    "Messages éventuels de l’équipe DRCCARS.",
    "Stock : En ligne / En attente / Brouillons / Vendus.",
    "Performance : vues, favoris, contacts débloqués, rendez-vous.",
    "Meilleures performances de vos annonces.",
  ]);

  h2(doc, "Onglet Mes annonces");
  bullet(doc, [
    "Filtres : Toutes, En ligne, En attente, Brouillons, Vendus.",
    "Modifier → /dashboard/cars/[id]/edit.",
    "Marquer comme vendu / Remettre en ligne.",
    "Supprimer une annonce.",
    "Sur une annonce déjà en ligne, « Enregistrer les modifications » met à jour le contenu ; un brouillon soumis repasse en attente selon le flux d’édition.",
  ]);

  h2(doc, "Onglet Rendez-vous");
  bullet(doc, [
    "Vous y voyez les rendez-vous approuvés par l’admin (pas la file d’attente brute des demandes).",
    "Préparez le lieu/horaire communiqués et restez joignable sur le numéro du profil.",
    "Vous pouvez écarter localement une entrée affichée une fois traitée.",
  ]);

  tip(
    doc,
    "Les rendez-vous sont validés côté DRCCARS avant d’apparaître chez vous. Surveillez Aperçu + Rendez-vous après chaque annonce en ligne."
  );

  doc.addPage();
  h1(doc, "7. Votre vitrine publique");
  p(
    doc,
    "URL du type https://drccars.com/seller/VOTRE_ID. Elle liste vos véhicules approuvés (non brouillon). Partagez-la sur WhatsApp, Facebook ou avec vos clients. Les acheteurs ouvrent chaque fiche véhicule pour demander un rendez-vous ou débloquer le contact selon les règles de la plateforme."
  );

  h1(doc, "8. Checklist rapide (à imprimer)");
  bullet(doc, [
    "□ Compte créé avec le rôle vendeur",
    "□ Email confirmé",
    "□ Coordonnées + photo + téléphone enregistrés",
    "□ Première annonce soumise (pas seulement brouillon)",
    "□ Statut passé à « En ligne » après validation",
    "□ Vitrine partagée",
    "□ Habitude : vérifier Aperçu et Rendez-vous chaque jour",
  ]);

  h1(doc, "9. Aide & bonnes pratiques");
  bullet(doc, [
    "Mot de passe oublié : page Connexion → procédure de réinitialisation email.",
    "Email de confirmation absent : dossier spam + « Renvoyer l’email ».",
    "Annonce bloquée en attente : vérifiez photos, prix, champs obligatoires ; contactez le support si le délai est long.",
    "Ne partagez pas votre mot de passe ; DRCCARS ne vend pas les véhicules à votre place — la plateforme met en relation.",
    "Respectez la loi et la transparence (état du véhicule, documents, prix).",
  ]);

  doc.moveDown(1);
  tip(
    doc,
    "Support / FAQ : https://drccars.com/faq — Conditions : https://drccars.com/terms — Confidentialité : https://drccars.com/privacy"
  );
  doc.moveDown(1.2);
  doc.fillColor(INK).font("Bold").fontSize(11).text("Bonnes ventes sur DRCCARS.");
  doc.fillColor(MUTED).font("Body").fontSize(9).text("Marketplace automobile — République Démocratique du Congo.");
}

async function main() {
  ensureFonts();
  const doc = createDoc();
  const desktop = fs.createWriteStream(OUT_DESKTOP);
  const local = fs.createWriteStream(OUT_DOCS);
  doc.pipe(desktop);
  doc.pipe(local);

  writeGuide(doc);
  stampFooters(doc);
  doc.end();

  await Promise.all([
    new Promise((r) => desktop.on("finish", r)),
    new Promise((r) => local.on("finish", r)),
  ]);

  console.log("Wrote", OUT_DESKTOP);
  console.log("Wrote", OUT_DOCS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
