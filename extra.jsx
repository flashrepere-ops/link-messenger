import { useEffect, useState } from "react";
import { Ic } from "./icons.jsx";
import { ART } from "./assets.js";
import { Link, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, serverTimestamp, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { deleteUser } from "firebase/auth";
import { ADMIN_EMAIL } from "./firebaseConfig";
import { VILLES, fmt } from "./data";

export const initTheme = () => {
  document.documentElement.style.fontSize = (localStorage.getItem("size") || "16") + "px";
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";
};
export function ThemeBtn() {
  const [t, setT] = useState(document.documentElement.dataset.theme);
  const go = () => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("theme", n); document.documentElement.dataset.theme = n; setT(n); };
  return <button className="heart" onClick={go} aria-label="Mode sombre ou clair"><Ic n={t === "dark" ? "sun" : "moon"} /></button>;
}
export const Avatar = ({ s }) => s.photo
  ? <img className="avatar" src={s.photo} alt="" />
  : <div className="avatar">{(s.nom || "?").trim().charAt(0).toUpperCase()}</div>;
export const compress = (file) => new Promise((res) => {
  const r = new FileReader();
  r.onload = () => { const i = new Image(); i.onload = () => {
    const k = Math.min(1, 480 / Math.max(i.width, i.height)); const c = document.createElement("canvas");
    c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    res(c.toDataURL("image/jpeg", 0.7)); }; i.src = r.result; };
  r.readAsDataURL(file);
});
const wa = (n, t) => "https://wa.me/" + String(n || "").replace(/\D/g, "") + (t ? "?text=" + encodeURIComponent(t) : "");
const DEF = { police: "117", pompiers: "118", hopital: "", pharmacie_garde: "" };

export function Urgence({ user }) {
  const [ville, setVille] = useState(localStorage.getItem("ville") || "Lomé");
  const [d, setD] = useState(DEF);
  const admin = user?.email === ADMIN_EMAIL;
  useEffect(() => { getDoc(doc(db, "emergencies", ville)).then((s) => setD({ ...DEF, ...(s.exists() ? s.data() : {}) })).catch(() => setD(DEF)); }, [ville]);
  const pos = () => gps((p) => window.open(wa("", "Au secours ! Ma position : https://maps.google.com/?q=" + p.coords.latitude + "," + p.coords.longitude)));
  const L = [["Police", "police"], ["Pompiers", "pompiers"], ["Hôpital", "hopital"], ["Pharmacie de garde", "pharmacie_garde"]];
  return (
    <div className="wrap">
      <h2>Urgence</h2>
      <select value={ville} onChange={(e) => setVille(e.target.value)}>{VILLES.map((v) => <option key={v}>{v}</option>)}</select>
      {L.map(([nom, k]) => (
        <div className="card row" key={k} style={{ justifyContent: "space-between" }}>
          <div><b>{nom}</b><div className="meta">{d[k] || "Non renseigné"}</div></div>
          {d[k] && <a className="btn red sm" href={"tel:" + d[k]}>Appeler</a>}
        </div>
      ))}
      <button className="btn big sos" onClick={pos}>PARTAGER MA POSITION</button>
      {admin && (
        <div className="card" style={{ marginTop: 14 }}>
          <b>Modifier les numéros de {ville}</b>
          {L.map(([nom, k]) => <input key={k} placeholder={nom} value={d[k] || ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} />)}
          <button className="btn" onClick={async () => { await setDoc(doc(db, "emergencies", ville), d); alert("Enregistré"); }}>Enregistrer</button>
        </div>
      )}
    </div>
  );
}

export function Taxi({ kind = "Taxi" }) {
  const [ville, setVille] = useState(localStorage.getItem("ville") || "Lomé");
  const [l, setL] = useState([]);
  const [f, setF] = useState({ depart: "", dest: "", pers: 1 });
  const [typ, setTyp] = useState("Taxi Moto");
  useEffect(() => {
    getDocs(query(collection(db, "shops"), where("statut", "==", "valide"), where("ville", "==", ville)))
      .then((s) => setL(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.categorie?.startsWith(kind)).sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0))))
      .catch(() => setL([]));
  }, [ville]);
  const msg = "Bonjour, " + (kind === "Taxi" ? "je veux un taxi" : "je veux une livraison") + " à " + ville + ". Départ : " + f.depart + ". Destination : " + f.dest + ". Personnes : " + f.pers + ". (NOVA-TOGO)";
  const ok = f.depart && f.dest;
  const shown = l.filter((y) => kind !== "Taxi" || typ === "Taxi" || y.categorie === typ);
  return (
    <div className="wrap">
      <h1 className="hello">{kind === "Taxi" ? "Où vas-tu ?" : "Je veux être livré"}</h1>
      <div className="sub" style={{ marginBottom: 12 }}>{ville}, Togo • Aujourd'hui</div>
      <img className="art map" src={ART.map} alt="" />
      <div className="glass panel">
        <select value={ville} onChange={(e) => setVille(e.target.value)}>{VILLES.map((v) => <option key={v}>{v}</option>)}</select>
        <input placeholder=" Où es-tu ? (quartier, repère)" value={f.depart} onChange={(e) => setF({ ...f, depart: e.target.value })} />
        <input placeholder=" Où vas-tu ?" value={f.dest} onChange={(e) => setF({ ...f, dest: e.target.value })} />
        {kind === "Taxi" && <div className="row">{[["Taxi Moto", "moto"], ["Taxi", "car"], ["Taxi Voiture", "car"]].map(([k, ic]) => <button key={k} className={"chip" + (typ === k ? " on" : "")} onClick={() => setTyp(k)}><Ic n={ic} /> {k}</button>)}</div>}
      </div>
      {shown.length === 0 && (
        <div className="center"><img className="art taxi-art" src={ART.taxi} alt="" />
          <h2>Aucun {kind === "Taxi" ? "taximan" : "livreur"} à {ville} pour le moment</h2>
          <div className="sub">Sois le premier à proposer tes trajets et rejoins nos conducteurs.</div>
          <Link className="btn big" to="/devenir-commercant" style={{ marginTop: 14 }}>Inscris-toi dans Ma boutique, catégorie {kind === "Taxi" ? "Taxi Moto ou Taxi Voiture" : "Livreur"}</Link></div>
      )}
      {shown.map((y) => (
        <div className="card" key={y.id}>
          <div className="shop"><Avatar s={y} /><div><b>{y.nom}</b> {y.premium && <span className="badge">PREMIUM</span>}<div className="meta">{y.categorie} • {y.quartier}</div></div></div>
          <div className="row" style={{ marginTop: 10 }}>
            <a className="btn sm" href={"tel:" + y.whatsapp}>Appeler</a>
            <a className="btn sm wa" style={ok ? {} : { opacity: .5, pointerEvents: "none" }} href={wa(y.whatsapp, msg)} target="_blank" rel="noreferrer">Demander par WhatsApp</a>
          </div>
        </div>
      ))}
    </div>
  );
}

export const voice = (set) => {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return alert("La recherche vocale n'est pas disponible sur ce navigateur.");
  const r = new R(); r.lang = "fr-FR"; r.onresult = (e) => set(e.results[0][0].transcript); r.start();
};

const promoOn = (x) => x.prix_promo && (!x.fin || x.fin > Date.now());
export const priceNow = (x) => (promoOn(x) ? x.prix_promo : x.prix);
export function Price({ x }) {
  if (!promoOn(x)) return <span className="prix">{fmt(x.prix)}</span>;
  const pct = Math.round(100 - (x.prix_promo * 100) / x.prix);
  const ms = x.fin ? x.fin - Date.now() : 0;
  return (
    <span><s className="meta">{fmt(x.prix)}</s> <span className="prix">{fmt(x.prix_promo)}</span>{" "}
      <span className="badge" style={{ background: "var(--rouge)", color: "#fff" }}>-{pct}%</span>
      {x.fin && <div className="meta">Il reste {Math.floor(ms / 36e5)}h {Math.floor((ms % 36e5) / 6e4)}min</div>}
    </span>
  );
}

export async function orderProduct(user, shop, x) {
  if (!user) return alert("Connecte-toi pour commander.");
  const liv = confirm("Livraison à domicile ?\nOK = Livrez-moi\nAnnuler = Je viens chercher");
  const adr = liv ? prompt("Ton adresse (quartier, repère) :") : "";
  if (liv && !adr) return;
  const total = priceNow(x);
  await addDoc(collection(db, "orders"), { clientId: user.uid, client: user.displayName || user.email, shopId: shop.id, shopOwnerId: shop.ownerId, shopNom: shop.nom, produit: x.nom, total, livraison: liv, adresse: adr, statut: "envoyee", date: serverTimestamp() });
  window.open(wa(shop.whatsapp, "Bonjour, je commande : " + x.nom + " (" + fmt(total) + "). " + (liv ? "Livraison à : " + adr : "Je viens chercher.") + " (NOVA-TOGO)"));
}

export function Orders({ user }) {
  const [mine, setMine] = useState([]);
  const [recv, setRecv] = useState([]);
  const [refs, setRefs] = useState(0);
  const load = () => {
    if (!user) return;
    const g = (f) => getDocs(query(collection(db, "orders"), where(f, "==", user.uid)))
      .then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
    g("clientId").then(setMine).catch(() => {}); g("shopOwnerId").then(setRecv).catch(() => {});
    getDocs(query(collection(db, "referrals"), where("parrainId", "==", user.uid))).then((s) => setRefs(s.size)).catch(() => {});
  };
  useEffect(load, [user?.uid]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour voir tes commandes.</div></div>;
  const pts = mine.filter((o) => o.statut === "livree").reduce((a, o) => a + Math.floor(o.total / 100), 0) + refs * 20;
  const niv = pts >= 500 ? "VIP OR" : pts >= 200 ? "VIP" : pts >= 50 ? "Fidèle" : "Nouveau";
  const set = async (id, statut) => { await updateDoc(doc(db, "orders", id), { statut }); load(); };
  return (
    <div className="wrap">
      <div className="hero"><h1>{pts} points NOVA</h1>Niveau : <b>{niv}</b> • {refs} ami(s) invité(s) (+20 points chacun)<div style={{ fontSize: 13, marginTop: 6 }}>100 F dépensés = 1 point (commande livrée). 100 points = 1 livraison offerte, 200 points = 1 plat offert chez un partenaire.</div></div>
      <h2>Mes commandes</h2>
      {mine.length === 0 && <div className="muted">Aucune commande pour le moment.</div>}
      {mine.map((o) => <div className="card" key={o.id}><b>{o.produit}</b> <span className="prix">{fmt(o.total)}</span><div className="meta">{o.shopNom} • {o.livraison ? "Livraison" : "Retrait"} • {o.statut === "livree" ? <><Ic n="check" /> Livrée</> : <><Ic n="clock" /> Envoyée</>}</div></div>)}
      {recv.length > 0 && <h2>Commandes reçues</h2>}
      {recv.map((o) => (
        <div className="card" key={o.id}><b>{o.produit}</b> <span className="prix">{fmt(o.total)}</span>
          <div className="meta">{o.client} • {o.livraison ? "Livraison : " + o.adresse : "Retrait"} • {o.statut === "livree" ? <><Ic n="check" /> Livrée</> : <><Ic n="clock" /> À livrer</>}</div>
          {o.statut !== "livree" && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => set(o.id, "livree")}>Marquer livrée</button>}
        </div>))}
    </div>
  );
}

export function Chat({ user }) {
  const { shopId, clientId } = useParams();
  const [msgs, setMsgs] = useState([]); const [t, setT] = useState(""); const [nom, setNom] = useState("");
  const cid = shopId + "_" + clientId;
  useEffect(() => {
    if (!user) return; let un;
    getDoc(doc(db, "shops", shopId)).then(async (s) => {
      const sh = s.data(); setNom(sh.nom);
      await setDoc(doc(db, "chats", cid), { clientId, ownerId: sh.ownerId, shopNom: sh.nom, shopId, ...(user.uid === clientId ? { clientNom: user.displayName || user.email } : {}) }, { merge: true });
      un = onSnapshot(query(collection(db, "chats", cid, "msgs"), orderBy("date")), (q) => setMsgs(q.docs.map((d) => ({ id: d.id, ...d.data() }))));
    }).catch(() => {});
    return () => un && un();
  }, [user?.uid, cid]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour écrire.</div></div>;
  const send = async (e) => { e.preventDefault(); if (!t.trim()) return; await addDoc(collection(db, "chats", cid, "msgs"), { from: user.uid, text: t, date: serverTimestamp() }); setT(""); };
  return (
    <div className="wrap"><h2><Ic n="chat" /> {nom}</h2>
      {msgs.map((m) => <div key={m.id} style={{ display: "flex", justifyContent: m.from === user.uid ? "flex-end" : "flex-start" }}><div className="card" style={{ maxWidth: "80%", marginBottom: 8, background: m.from === user.uid ? "var(--violet)" : "var(--card)", color: m.from === user.uid ? "#fff" : "var(--ink)" }}>{m.text}</div></div>)}
      <form className="row" onSubmit={send}><input style={{ flex: 1, marginBottom: 0 }} placeholder="Ton message" value={t} onChange={(e) => setT(e.target.value)} /><button className="btn">Envoyer</button></form>
    </div>
  );
}

export function Inbox({ user }) {
  const [l, setL] = useState([]);
  useEffect(() => { if (user) Promise.all(["clientId", "ownerId"].map((f) => getDocs(query(collection(db, "chats"), where(f, "==", user.uid))))).then((r) => setL(r.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))))).catch(() => {}); }, [user?.uid]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour voir tes messages.</div></div>;
  return (
    <div className="wrap"><h2>Mes messages</h2>
      {l.length === 0 && <div className="muted">Aucune conversation. Touche « Écrire » sur une boutique.</div>}
      {l.map((c) => <div className="card" key={c.id}><Link to={"/chat/" + c.shopId + "/" + c.clientId}><b>{c.ownerId === user.uid ? c.clientNom || "Client" : c.shopNom}</b></Link></div>)}
    </div>
  );
}

export function StoriesBar() {
  const [l, setL] = useState([]); const [o, setO] = useState(null);
  useEffect(() => { getDocs(query(collection(db, "stories"), where("expire", ">", Date.now()))).then((s) => setL(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {}); }, []);
  if (!l.length) return null;
  return (<>
    <div className="chips" style={{ marginBottom: 10 }}>{l.map((s) => <button key={s.id} className="chip" style={{ padding: 4, background: "none" }} onClick={() => setO(s)}><img src={s.photo} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--orange)" }} /><div className="meta" style={{ fontSize: 12, maxWidth: 64, overflow: "hidden" }}>{s.shopNom}</div></button>)}</div>
    {o && <div onClick={() => setO(null)} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 20, display: "grid", placeItems: "center", padding: 16, textAlign: "center", color: "#fff" }}><div><img src={o.photo} alt="" style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 16 }} /><p>{o.texte}</p><Link className="btn" to={"/boutique/" + o.shopId}>Voir la boutique</Link></div></div>}
  </>);
}

export function StoryAdd({ shop }) {
  const [t, setT] = useState("");
  return (
    <div className="card"><b>Story du jour (24 h)</b>
      <input placeholder="Texte (ex : Foufou -20 % aujourd'hui)" value={t} onChange={(e) => setT(e.target.value)} />
      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (!f) return; await addDoc(collection(db, "stories"), { shopId: shop.id, ownerId: shop.ownerId, shopNom: shop.nom, photo: await compress(f), texte: t, expire: Date.now() + 864e5 }); setT(""); alert("Story publiée pour 24 h."); }} />
    </div>
  );
}

export const km = (a, b) => {
  const r = (x) => (x * Math.PI) / 180, dl = r(b.lng - a.lng), dp = r(b.lat - a.lat);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dl / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

export function Settings({ user }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "fr");
  const [size, setSize] = useState(localStorage.getItem("size") || "16");
  return (
    <div className="wrap"><h2>Paramètres</h2>
      <div className="card"><b>Langue</b>
        <select value={lang} onChange={(e) => { setLang(e.target.value); localStorage.setItem("lang", e.target.value); location.reload(); }}><option value="fr">Français</option><option value="en">English</option></select>
        <div className="meta">Ewe, Kabyè, Fon, Twi, Mooré : bientôt.</div></div>
      <div className="card"><b>Taille du texte</b>
        <select value={size} onChange={(e) => { setSize(e.target.value); localStorage.setItem("size", e.target.value); document.documentElement.style.fontSize = e.target.value + "px"; }}><option value="14">Petit</option><option value="16">Moyen</option><option value="19">Grand</option><option value="22">Très grand</option></select></div>
      <div className="card row"><b>Mode clair / sombre</b> <ThemeBtn /></div>
      {user && <div className="card"><b>Supprimer mon compte</b><div className="meta">Action définitive.</div>
        <button className="btn red sm" style={{ marginTop: 8 }} onClick={async () => { if (!confirm("Supprimer définitivement ton compte ?")) return; try { await deleteUser(auth.currentUser); } catch { alert("Déconnecte-toi, reconnecte-toi, puis réessaie."); } }}>Supprimer</button></div>}
    </div>
  );
}

export const gps = (ok) => {
  if (!navigator.geolocation) return alert("Ce navigateur ne gère pas la localisation.");
  navigator.geolocation.getCurrentPosition(ok, (e) => alert(e.code === 1
    ? "La localisation est bloquée pour ce site. Touche le cadenas à côté de l'adresse > Autorisations > Position > Autoriser, puis recharge la page. Vérifie aussi que le GPS du téléphone est activé."
    : "Position introuvable. Active le GPS du téléphone (précision élevée), sors à l'air libre et réessaie."), { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 });
};

export const useSettings = () => {
  const [s, setS] = useState({ premium: 1000, whatsapp: "", email: ADMIN_EMAIL, flooz: "" });
  useEffect(() => { getDoc(doc(db, "settings", "app")).then((d) => d.exists() && setS((o) => ({ ...o, ...d.data() }))).catch(() => {}); }, []);
  return s;
};

export function PremiumCard({ shop }) {
  const cfg = useSettings();
  const msg = "Bonjour, je veux passer Premium (" + fmt(cfg.premium) + " / mois) pour ma boutique « " + shop.nom + " » à " + shop.ville + ". Comment puis-je payer ?";
  return (
    <div className="card gold-card">
      <b style={{ fontSize: 18 }}><Ic n="crown" /> Passe en Premium : {fmt(cfg.premium)} / mois</b>
      <ul className="adv"><li>Ta boutique en haut de la liste</li><li>Badge doré PREMIUM visible partout</li><li>10 produits au lieu de 3</li><li>Mise en avant dans les recherches</li></ul>
      <div className="row">
        <a className="btn gold" target="_blank" rel="noreferrer" href={cfg.whatsapp ? wa(cfg.whatsapp, msg) : "#"} onClick={(e) => { if (!cfg.whatsapp) { e.preventDefault(); alert("Le numéro WhatsApp n'est pas encore configuré. Utilise l'email."); } }}><Ic n="whatsapp" /> Payer le Premium</a>
        <a className="btn line" href={"mailto:" + cfg.email + "?subject=" + encodeURIComponent("Premium NOVA-TOGO") + "&body=" + encodeURIComponent(msg)}>Écrire par email</a>
      </div>
      {cfg.flooz && <div className="meta" style={{ marginTop: 8 }}>Paiement Flooz / Yas : {cfg.flooz}</div>}
    </div>
  );
}
