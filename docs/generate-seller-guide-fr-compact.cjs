/**
 * DRCCARS seller guide (FR) — dense 3-page layout (minimal whitespace).
 * Run: node docs/generate-seller-guide-fr-compact.cjs
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = __dirname;
const SCREENS = path.join(ROOT, "guide-screens");
const LOGO = path.join(SCREENS, "logo-mark.png");
const OUT_DESKTOP = path.join(process.env.USERPROFILE || "", "Desktop", "DRCCARS-Guide-Vendeur.pdf");
const OUT_DOCS = path.join(ROOT, "DRCCARS-Guide-Vendeur.pdf");
const OUT_PUBLIC = path.join(ROOT, "..", "public", "DRCCARS-Guide-Vendeur.pdf");
const FONT = "C:\\Windows\\Fonts\\calibri.ttf";
const FONT_BOLD = "C:\\Windows\\Fonts\\calibrib.ttf";

const GOLD = "#eab308";
const INK = "#18181b";
const MUTED = "#52525b";
const RULE = "#e4e4e7";
const TIP_BG = "#fafafa";
const WARN_BG = "#fffbeb";
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 32;
const W = PAGE_W - M * 2;
const BODY = 9;
const SUPPORT = "support@drccars.com";
const SITE = "https://drccars.com";
const FOOTER_Y = PAGE_H - 20;
const CONTENT_BOTTOM = FOOTER_Y - 10;

function createDoc() {
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    autoFirstPage: false,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: "DRCCARS — Guide vendeur",
      Author: "DRCCARS",
      Subject: "Guide vendeur complet (FR) — dense",
    },
  });
  doc.registerFont("Calibri", FONT);
  doc.registerFont("Calibri-Bold", FONT_BOLD);
  return doc;
}

function footers(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = FOOTER_Y;
    doc.save();
    doc.strokeColor(RULE).lineWidth(0.4).moveTo(M, y - 5).lineTo(PAGE_W - M, y - 5).stroke();
    doc.fillColor(MUTED).font("Calibri").fontSize(7.5);
    doc.text("DRCCARS · Guide vendeur", M, y, { lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, PAGE_W - M - 36, y, { width: 36, align: "right", lineBreak: false });
    doc.restore();
  }
}

function paintChrome(doc) {
  doc.rect(0, 0, PAGE_W, 4).fill(GOLD);
  if (fs.existsSync(LOGO)) doc.image(LOGO, M, 10, { width: 22, height: 22 });
  doc.fillColor(INK).font("Calibri-Bold").fontSize(12).text("DRCCARS", M + 28, 10, { lineBreak: false });
  doc.fillColor(MUTED).font("Calibri").fontSize(8).text("Guide vendeur — Complet (FR)", M + 28, 23, {
    lineBreak: false,
  });
  doc.strokeColor(RULE).lineWidth(0.5).moveTo(M, 38).lineTo(PAGE_W - M, 38).stroke();
}

function textH(doc, text, width, size = BODY) {
  doc.font("Calibri").fontSize(size);
  return doc.heightOfString(text, { width, lineGap: 0.85 });
}

function img(doc, file, x, y, w, h) {
  const p = path.join(SCREENS, file);
  if (!fs.existsSync(p)) return false;
  doc.save();
  doc.lineWidth(0.5).strokeColor(RULE).roundedRect(x, y, w, h, 2).stroke();
  doc.restore();
  doc.image(p, x + 0.5, y + 0.5, { fit: [w - 1, h - 1], align: "center", valign: "center" });
  return true;
}

function numTitle(doc, x, y, n, title, width) {
  doc.save();
  doc.roundedRect(x, y, 12, 12, 2).fill(GOLD);
  doc.fillColor("#09090b").font("Calibri-Bold").fontSize(7.5).text(String(n), x, y + 2, {
    width: 12,
    align: "center",
    lineBreak: false,
  });
  doc.restore();
  doc.fillColor(INK).font("Calibri-Bold").fontSize(9.5).text(title, x + 15, y + 0.5, {
    width: width - 15,
    lineBreak: false,
  });
  return y + 14;
}

function p(doc, text, x, y, width, size = BODY) {
  const h = textH(doc, text, width, size);
  doc.fillColor(INK).font("Calibri").fontSize(size).text(text, x, y, { width, lineGap: 0.85 });
  return y + h;
}

function callout(doc, x, y, width, text, warn = false) {
  const padX = 7;
  const padY = 5;
  const h = textH(doc, text, width - padX * 2 - 2, 8) + padY * 2;
  doc.save();
  doc.roundedRect(x, y, width, h, 2).fillAndStroke(warn ? WARN_BG : TIP_BG, RULE);
  doc.fillColor(GOLD).rect(x, y, 2.5, h).fill();
  doc.restore();
  doc.fillColor(MUTED).font("Calibri").fontSize(8).text(text, x + padX + 1, y + padY, {
    width: width - padX * 2 - 2,
    lineGap: 0.7,
  });
  return y + h;
}

function bullets(doc, x, y, width, lines, size = 8.5) {
  let yy = y;
  for (const line of lines) {
    const text = `•  ${line}`;
    const h = textH(doc, text, width, size);
    doc.fillColor(INK).font("Calibri").fontSize(size).text(text, x, yy, { width, lineGap: 0.7 });
    yy += h + 1.2;
  }
  return yy;
}

function hrule(doc, y) {
  doc.strokeColor(RULE).lineWidth(0.4).moveTo(M, y).lineTo(PAGE_W - M, y).stroke();
  return y + 6;
}

function page1(doc) {
  doc.addPage({ size: "A4", margin: 0 });
  paintChrome(doc);
  let y = 44;

  doc.fillColor(INK).font("Calibri-Bold").fontSize(12).text("Bien démarrer en tant que vendeur", M, y, {
    lineBreak: false,
  });
  y = 58;
  y =
    p(
      doc,
      "Parcours complet : compte → email → profil → annonce → validation → contacts / RDV → vente & partage. " +
        SITE +
        "  ·  App : FR / EN / LN / SW.",
      M,
      y,
      W,
      8.5
    ) + 4;

  y =
    callout(
      doc,
      M,
      y,
      W,
      "Gratuit : pas de commission DRCCARS. Publier et gérer vos annonces est gratuit. Paiement & contrat hors plateforme entre vous et l’acheteur."
    ) + 6;

  // Two-col: signup + login screenshots
  const gap = 10;
  const colW = (W - gap) / 2;
  const left = M;
  const right = M + colW + gap;

  let yL = numTitle(doc, left, y, 1, "Créer un compte vendeur", colW);
  yL =
    p(
      doc,
      "Inscription → « Vendre des véhicules » (particulier ou entreprise). Nom, téléphone RDC, email, mot de passe ; CGU → Inscription.",
      left,
      yL,
      colW,
      8.5
    ) + 3;
  img(doc, "01-inscription-vendeur-sm.png", left, yL, colW, 95);
  yL += 98;

  let yR = numTitle(doc, right, y, 2, "Confirmer l’email (obligatoire)", colW);
  yR =
    p(
      doc,
      "Ouvrez le lien reçu par email (vérifiez les spams). Sans confirmation, impossible de publier.",
      right,
      yR,
      colW,
      8.5
    ) + 3;
  yR =
    callout(
      doc,
      right,
      yR,
      colW,
      "Bloquant : « Ajouter un véhicule » reste verrouillé tant que l’email n’est pas confirmé.",
      true
    ) + 5;
  yR = numTitle(doc, right, yR, 3, "Se connecter", colW);
  yR =
    p(
      doc,
      "Email + mot de passe. « Mot de passe oublié ? » si besoin → tableau de bord vendeur.",
      right,
      yR,
      colW,
      8.5
    ) + 3;
  img(doc, "02-connexion-sm.png", right, yR, colW, 78);
  yR += 81;

  y = Math.max(yL, yR) + 4;
  y = hrule(doc, y);

  // Profile + publish side by side
  yL = numTitle(doc, left, y, 4, "Compléter le profil", colW);
  yL =
    p(
      doc,
      "Photo, nom, type (particulier / entreprise), nom commercial, ville, bio, téléphone et WhatsApp → Enregistrer.",
      left,
      yL,
      colW,
      8.5
    ) + 2;
  yL = bullets(doc, left, yL, colW, [
    "Téléphone + WhatsApp à jour = RDV plus rapides.",
    "La photo renforce la confiance des acheteurs.",
  ]);
  yL += 3;
  img(doc, "06-profil.png", left, yL, colW, 58);

  yR = numTitle(doc, right, y, 5, "Publier une annonce", colW);
  yR =
    p(
      doc,
      "Ajouter un véhicule → vente / location / les deux. Titre, marque, modèle, année, ville, prix, devise, contact.",
      right,
      yR,
      colW,
      8.5
    ) + 2;
  yR = bullets(doc, right, yR, colW, [
    "Max. 4 photos (≤ 3 Mo chacune).",
    "Brouillon = privé ; Soumettre = attente admin.",
    "Public seulement si statut « En ligne ».",
  ]);
  yR += 3;
  img(doc, "04-publier.png", right, yR, colW, 58);
}

function page2(doc) {
  doc.addPage({ size: "A4", margin: 0 });
  paintChrome(doc);
  let y = 44;
  const gap = 10;
  const colW = (W - gap) / 2;
  const left = M;
  const right = M + colW + gap;

  let yL = numTitle(doc, left, y, 6, "Photos qui convertissent", colW);
  yL = bullets(doc, left, yL, colW, [
    "Jour / lumière naturelle ; voiture propre.",
    "3/4 avant, profil, arrière, intérieur / compteur.",
    "Évitez flou, doigts, filtres, logos parasites.",
    "La 1re photo = image principale de la carte.",
  ]);
  yL += 5;

  yL = numTitle(doc, left, yL, 7, "Prix, devise, vente / location", colW);
  yL =
    p(
      doc,
      "Prix réaliste pour votre marché (Kinshasa, Lubumbashi, Goma…). Devise affichée. Location : tarifs jour / semaine / mois si proposés. « Les deux » = vente + location sur la même fiche.",
      left,
      yL,
      colW,
      8.5
    ) + 5;

  yL = numTitle(doc, left, yL, 8, "Validation admin", colW);
  yL =
    p(
      doc,
      "Après soumission, l’annonce n’est pas publique. DRCCARS vérifie contenu, photos et contact. Délai habituel : souvent le jour même ou sous 24–48 h. « En ligne » = visible. Si refus → corrigez et renvoyez.",
      left,
      yL,
      colW,
      8.5
    ) + 3;
  yL =
    callout(
      doc,
      left,
      yL,
      colW,
      "Rien n’apparaît sur le marketplace tant que le statut n’est pas « En ligne ».",
      true
    ) + 5;

  yL = numTitle(doc, left, yL, 9, "Tableau de bord", colW);
  yL =
    p(
      doc,
      "Onglets : Aperçu · Mes annonces · Rendez-vous. En-tête : Ajouter, Profil, Comment ça marche, Guide PDF, Voir / Partager ma vitrine.",
      left,
      yL,
      colW,
      8.5
    ) + 3;
  img(doc, "03-dashboard.png", left, yL, colW, 70);
  yL += 74;
  yL = p(
    doc,
    "Aperçu : checklist, stock, vues, favoris, contacts débloqués, RDV. Mes annonces : filtres, Modifier, Marquer vendu / Remettre en ligne, Supprimer.",
    left,
    yL,
    colW,
    8.5
  );

  let yR = numTitle(doc, right, y, 10, "Après publication", colW);
  yR = bullets(doc, right, yR, colW, [
    "Modifier : prix, texte, photos.",
    "Marquer vendu : retire l’intérêt acheteur.",
    "Remettre en ligne : si à nouveau dispo.",
    "Supprimer : définitif — prudence.",
  ]);
  yR += 5;

  yR = numTitle(doc, right, yR, 11, "Contacts débloqués vs RDV", colW);
  yR =
    p(
      doc,
      "Deux chemins acheteurs :",
      right,
      yR,
      colW,
      8.5
    ) + 2;
  yR = bullets(doc, right, yR, colW, [
    "Déblocage de contact : l’acheteur débloque téléphone, WhatsApp, adresse → stats « Contacts débloqués ».",
    "Demande de RDV : visite demandée → validation admin → vos coordonnées partagées → onglet Rendez-vous.",
  ]);
  yR += 3;
  img(doc, "05-rdv.png", right, yR, colW, 68);
  yR += 72;
  yR =
    callout(
      doc,
      right,
      yR,
      colW,
      "Restez joignable. Préparez un lieu public et un créneau clair."
    ) + 5;

  yR = numTitle(doc, right, yR, 12, "Partager votre vitrine", colW);
  yR = p(
    doc,
    "« Voir / Partager ma vitrine » → lien public de tous vos véhicules. Envoyez-le sur WhatsApp, Facebook ou SMS pour attirer des acheteurs hors recherche.",
    right,
    yR,
    colW,
    8.5
  );

  // Fill leftover bottom of page with safety preview if space
  const bottom = Math.max(yL, yR) + 8;
  if (bottom < CONTENT_BOTTOM - 40) {
    let yB = hrule(doc, bottom);
    yB = numTitle(doc, M, yB, 13, "Sécurité (aperçu) — détail page suivante", W);
    yB = bullets(doc, M, yB, W, [
      "Rencontre en lieu public · Pas de paiement avant visite · Vérifier papiers & identité · Signaler à " + SUPPORT + ".",
    ]);
  }
}

function page3(doc) {
  doc.addPage({ size: "A4", margin: 0 });
  paintChrome(doc);
  let y = 44;

  y = numTitle(doc, M, y, 13, "Sécurité & bonnes pratiques", W);
  y =
    p(
      doc,
      "Ventes et locations hors plateforme. DRCCARS met en relation ; paiement et documents entre vous et l’acheteur.",
      M,
      y,
      W,
      8.5
    ) + 3;
  y = bullets(doc, M, y, W, [
    "Lieu public fréquenté pour le premier contact (pas seul chez vous).",
    "Jamais les clés / documents avant paiement vérifié (et inversement : pas de paiement avant visite).",
    "Vérifier pièce d’identité et papiers du véhicule avant transfert.",
    "Méfiance envers acomptes « urgents » ou virements douteux.",
    "Comportement suspect → " + SUPPORT + ".",
  ]);
  y += 4;
  y =
    callout(
      doc,
      M,
      y,
      W,
      "Annonce claire + photos nettes + WhatsApp réactif = plus de RDV sérieux."
    ) + 7;

  y = numTitle(doc, M, y, 14, "Frais & rôle de DRCCARS", W);
  y = bullets(doc, M, y, W, [
    "Pas de commission sur la vente ou la location.",
    "Pas de paiement obligatoire pour publier.",
    "DRCCARS ne garde pas l’argent et n’est pas partie au contrat de vente.",
    "La validation admin sert à la qualité du catalogue, pas à garantir le véhicule.",
  ]);
  y += 7;

  y = numTitle(doc, M, y, 15, "Aide & support", W);
  y =
    p(
      doc,
      "FAQ : " +
        SITE +
        "/faq   ·   Support : " +
        SUPPORT +
        "   ·   Dans l’app : tableau de bord → Comment ça marche, ou retéléchargez ce PDF.",
      M,
      y,
      W,
      8.5
    ) + 7;

  y =
    callout(
      doc,
      M,
      y,
      W,
      "Ordre recommandé : Inscription vendeur → Confirmer email → Profil (tél. + WhatsApp + photo) → Annonce (3–4 bonnes photos) → Attendre « En ligne » → Surveiller Aperçu, contacts & RDV → Partager la vitrine → Marquer vendu une fois conclu."
    ) + 8;

  // Fill remaining page with two smaller screenshots side by side
  const remain = CONTENT_BOTTOM - y;
  if (remain > 90) {
    const gap = 10;
    const colW = (W - gap) / 2;
    const h = Math.min(150, remain - 18);
    img(doc, "03-dashboard.png", M, y, colW, h);
    img(doc, "05-rdv.png", M + colW + gap, y, colW, h);
    doc
      .fillColor(MUTED)
      .font("Calibri")
      .fontSize(7)
      .text("Tableau de bord", M, y + h + 2, { width: colW, align: "center", lineBreak: false });
    doc
      .fillColor(MUTED)
      .font("Calibri")
      .fontSize(7)
      .text("Rendez-vous approuvés", M + colW + gap, y + h + 2, {
        width: colW,
        align: "center",
        lineBreak: false,
      });
  }
}

async function main() {
  for (const f of [FONT, FONT_BOLD]) {
    if (!fs.existsSync(f)) throw new Error("Missing font: " + f);
  }
  const doc = createDoc();
  const streams = [OUT_DESKTOP, OUT_DOCS, OUT_PUBLIC].map((p) => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    return fs.createWriteStream(p);
  });
  streams.forEach((s) => doc.pipe(s));
  page1(doc);
  page2(doc);
  page3(doc);
  footers(doc);
  doc.end();
  await Promise.all(streams.map((s) => new Promise((r) => s.on("finish", r))));
  const { PDFDocument: PDFLib } = require("pdf-lib");
  const pdf = await PDFLib.load(fs.readFileSync(OUT_PUBLIC));
  console.log("pages", pdf.getPageCount(), "KB", Math.round(fs.statSync(OUT_PUBLIC).size / 1024));
  console.log("Wrote", OUT_PUBLIC);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
