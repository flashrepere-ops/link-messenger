const TG = ["Lomé","Kpalimé","Atakpamé","Kara","Sokodé","Dapaong","Tsévié","Aného","Vogan","Notsé","Badou","Bassar","Bafilo","Mango","Sotouboua","Tchamba","Blitta","Elavagnon","Kévé","Tabligbo","Agou","Amlamé","Autre ville"];
export const CATEGORIES = ["Taxi Moto","Taxi Voiture","Livreur","Hôtel","Restaurant","Pharmacie","Marché","Coiffure","Plombier","Électricien","Mécanicien","École","Immobilier","Supermarché","Boutique","Autre"];
export const fmt = (n) => Number(n || 0).toLocaleString("fr-FR").replace(/\u202f/g, " ") + (PAYS[localStorage.getItem("pays")]?.d || " F");

export const PAYS = {
  Togo: { d: " F", v: TG },
  "Bénin": { d: " F", v: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Autre ville"] },
  Ghana: { d: " GH₵", v: ["Accra", "Kumasi", "Tamale", "Takoradi", "Autre ville"] },
  Burkina: { d: " F", v: ["Ouagadougou", "Bobo-Dioulasso", "Autre ville"] },
  "Côte d'Ivoire": { d: " F", v: ["Abidjan", "Bouaké", "Yamoussoukro", "Autre ville"] },
};
export const VILLES = [...new Set(Object.values(PAYS).flatMap((p) => p.v))];
export const EQUIP = ["Clim", "Ventilateur", "WiFi", "Parking", "Petit-déjeuner"];
const EN = { "Accueil": "Home", "Taxi": "Taxi", "Ma boutique": "My shop", "Favoris": "Favorites", "Profil": "Profile", "Se connecter": "Log in", "Trouve tout près de chez toi": "Find everything near you" };
export const t = (s) => (localStorage.getItem("lang") === "en" && EN[s]) || s;

const T = (k, label, t = "text", req) => ({ k, label, t, req });
const S = (k, label, options) => ({ k, label, options });
const OUI = ["Oui", "Non"];
const ART = [T("tarif", "Tarif de départ (F)", "number"), S("domicile", "Déplacement à domicile", OUI), S("urgence", "Urgences 24h/24", OUI)];
const COM = [S("livraison", "Livraison", OUI), T("phares", "Produits phares")];
export const CHAMPS = {
  "Hôtel": [T("nb_chambres", "Nombre de chambres", "number"), S("petit_dej", "Petit-déjeuner inclus", OUI), S("annulation", "Annulation gratuite 24h", OUI)],
  "Restaurant": [T("cuisine", "Type de cuisine"), T("prix_moyen", "Prix moyen d'un plat (F)", "number"), S("livraison", "Livraison", OUI)],
  "Pharmacie": [S("garde", "Pharmacie de garde", OUI), S("h24", "Ouverte 24h/24", OUI), S("livraison", "Livraison", OUI)],
  "École": [S("niveau", "Niveau", ["Maternelle", "Primaire", "Collège", "Lycée", "Université"]), T("frais", "Frais annuels (F)", "number"), T("reussite", "Taux de réussite (%)", "number")],
  "Taxi Moto": [T("plaque", "Plaque d'immatriculation", "text", true), T("marque", "Marque et couleur de la moto"), S("casque", "Casque fourni", OUI)],
  "Taxi Voiture": [T("plaque", "Plaque d'immatriculation", "text", true), T("marque", "Marque et couleur"), S("clim", "Climatisation", OUI), S("bagages", "Bagages acceptés", OUI), T("places", "Nombre de places", "number")],
  "Livreur": [T("plaque", "Plaque de la moto", "text", true), T("permis", "Numéro de permis", "text", true), S("sac", "Sac NOVA", OUI), T("zone", "Zone de livraison")],
  "Immobilier": [S("type", "Type", ["Location", "Vente", "Les deux"]), T("prix", "Prix à partir de (F)", "number"), T("pieces", "Nombre de pièces", "number")],
  "Coiffure": [T("tarif", "Tarif de départ (F)", "number"), S("domicile", "À domicile", OUI), T("specialites", "Spécialités (tresses, coupe…)")],
  "Plombier": ART, "Électricien": ART, "Mécanicien": ART, "Marché": COM, "Supermarché": COM, "Boutique": COM,
};
