const sharp = require("sharp");
const path = require("path");

const dir = path.join(__dirname, "guide-screens");

async function panel(file, title, lines) {
  const rows = lines
    .map(
      (l, i) =>
        `<text x="28" y="${78 + i * 22}" fill="#d4d4d8" font-family="Segoe UI, Arial" font-size="13">${l
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</text>`
    )
    .join("");
  const svg = `<svg width="900" height="280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
    </defs>
    <rect width="900" height="280" rx="14" fill="url(#g)"/>
    <rect x="0" y="0" width="900" height="4" fill="#eab308"/>
    <circle cx="36" cy="36" r="10" fill="#eab308"/>
    <text x="56" y="41" fill="#fafafa" font-family="Segoe UI, Arial" font-size="16" font-weight="700">${title}</text>
    ${rows}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, file));
  console.log("wrote", file);
}

(async () => {
  await panel("03-dashboard.png", "Tableau de bord vendeur", [
    "Onglets : Aperçu  ·  Mes annonces  ·  Rendez-vous",
    "Aperçu : stock (En ligne / En attente / Brouillons / Vendus) + performances",
    "Actions : Ajouter un véhicule  ·  Modifier le profil  ·  Voir ma vitrine",
    "Astuce : commencez par vérifier email + téléphone dans Coordonnées",
  ]);
  await panel("04-publier.png", "Publier une annonce", [
    "Type : À vendre / À louer / Vente & location",
    "Obligatoire : titre, marque, modèle, ville, téléphone, prix (selon type)",
    "Photos : jusqu’à 4 images (max. 3 Mo)",
    "Brouillon = non public  ·  Soumettre pour approbation = en attente admin",
  ]);
  await panel("05-rdv.png", "Rendez-vous (onglet)", [
    "Les RDV affichés ici sont ceux déjà approuvés par DRCCARS",
    "Préparez lieu / horaire et restez joignable sur votre numéro",
    "Surveillez aussi Aperçu pour les messages de l’équipe",
    "Après le RDV, vous pouvez écarter l’entrée une fois traitée",
  ]);
  await panel("06-profil.png", "Coordonnées / profil", [
    "Photo de profil : Choisir / Changer / Supprimer (sauvegarde immédiate)",
    "Nom, type de compte, entreprise, ville, âge, bio",
    "Téléphone obligatoire + WhatsApp (sinon = téléphone)",
    "Enregistrer les modifications pour appliquer le reste du profil",
  ]);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
