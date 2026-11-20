import { useEffect, useState } from "react";
import { Ic } from "./icons.jsx";
import { ART, ORB } from "./assets.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, updateDoc, increment, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db, google } from "./firebase";
import { ADMIN_EMAIL } from "./firebaseConfig";
import { VILLES, CATEGORIES, PAYS, EQUIP, CHAMPS, fmt, t } from "./data";
import { Avatar, compress, voice, Price, orderProduct, StoriesBar, StoryAdd, km, PremiumCard, gps } from "./extra.jsx";

const initial = (s) => (s || "?").trim().charAt(0).toUpperCase();
const waLink = (n) => "https://wa.me/" + String(n || "").replace(/\D/g, "");
const sorted = (l) => [...l].sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));

function ShopCard({ s }) {
  return (
    <div className="pro">
      <Link to={"/boutique/" + s.id} className="pro-img" style={s.photo ? { backgroundImage: "url(" + s.photo + ")" } : undefined}>
        {s.km != null && <span className="mini"><Ic n="pin" /> Autour de vous • {s.km.toFixed(1)} km</span>}
        {!s.photo && <span className="pro-letter">{initial(s.nom)}</span>}
        {s.premium && <span className="prem"><Ic n="crown" /> PREMIUM</span>}
        <div className="glass info"><b>{s.nom}{s.premium && " • PREMIUM"}</b>
          <div>{s.categorie} • {s.quartier}, {s.ville}</div>
          <div className="meta">{s.noteCount ? <span><Ic n="star" /> {(s.noteSum / s.noteCount).toFixed(1)} • {s.noteCount} avis</span> : "Nouveau"}{s.dispo && <span> <span className="dot" />Disponible maintenant</span>}</div></div>
      </Link>
      <div className="row"><a className="btn-g" href={"tel:" + s.whatsapp}><Ic n="phone" /> Appeler</a><a className="btn-g wa" href={waLink(s.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a></div>
    </div>
  );
}

export function Home({ user }) {
  const [ville, setVille] = useState(localStorage.getItem("ville") || "Lomé");
  const [cat, setCat] = useState("");
  const [pays, setPays] = useState(localStorage.getItem("pays") || "Togo");
  const [pos, setPos] = useState(null);
  const [equip, setEquip] = useState([]);
  const [maxp, setMaxp] = useState("");
  const [q, setQ] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    localStorage.setItem("ville", ville);
    setLoading(true); setErr("");
    getDocs(query(collection(db, "shops"), where("statut", "==", "valide"), where("ville", "==", ville)))
      .then((s) => setShops(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setErr("Impossible de charger. Vérifie ta connexion."))
      .finally(() => setLoading(false));
  }, [ville]);

  const withKm = shops.map((s) => (pos && s.lat != null ? { ...s, km: km(pos, s) } : s));
  const list = (pos ? [...withKm].sort((a, b) => (a.km ?? 9e9) - (b.km ?? 9e9)) : sorted(withKm)).filter((s) =>
    (!cat || s.categorie === cat) && equip.every((e) => s.equip?.includes(e)) && (!maxp || (Number(s.prix_min) || 0) <= Number(maxp)) &&
    (!q || (s.nom + " " + s.description + " " + s.categorie).toLowerCase().includes(q.toLowerCase())));

  const prenom = user ? user.displayName || user.email.split("@")[0] : "";
  return (
    <div className="wrap">
      <div className="row between">
        <div><h1 className="hello">Bonjour,<br />{prenom} 👋</h1><div className="sub"><Ic n="pin" /> {pays} • {ville}</div></div>
        <Link to={user ? "/profil" : "/connexion"} className="ava-ring"><span className="c">{user?.photoURL ? <img src={user.photoURL} alt="" /> : (prenom || "?")[0].toUpperCase()}</span><i className="bolt"><Ic n="bolt" /></i>{prenom || "Se connecter"}</Link>
      </div>
      <div className="glass pill"><span><Ic n="search" /></span><input placeholder="Rechercher un service…" value={q} onChange={(e) => setQ(e.target.value)} /><button className="mic" onClick={() => voice(setQ)}><Ic n="mic" /><small>Voix</small></button></div>
      <div className="orbs">{[["/taxi", "taxi", "Taxi"], ["/livraison", "box", "Livraison"], ["/urgence", "sos", "Urgence SOS"]].map(([to, k, l]) => <Link key={to} to={to} className="orb-img" aria-label={l}><img src={ORB[k]} alt={l} /></Link>)}</div>
      <StoriesBar />
      <h2>Catégories</h2>
      <div className="chips">
        <button className={"chip" + (!cat ? " on" : "")} onClick={() => setCat("")}>Tout</button>
        {CATEGORIES.map((c) => <button key={c} className={"chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <select style={{ width: "auto", marginBottom: 0 }} value={pays} onChange={(e) => { localStorage.setItem("pays", e.target.value); setPays(e.target.value); setVille(PAYS[e.target.value].v[0]); }}>{Object.keys(PAYS).map((x) => <option key={x}>{x}</option>)}</select>
        <select style={{ width: "auto", marginBottom: 0 }} value={ville} onChange={(e) => setVille(e.target.value)}>{PAYS[pays].v.map((v) => <option key={v}>{v}</option>)}</select>
        <button className="chip" onClick={() => gps((x) => setPos({ lat: x.coords.latitude, lng: x.coords.longitude }))}><Ic n="pin" /> Plus proches</button>
        {cat === "Hôtel" && EQUIP.map((e) => <button key={e} className={"chip" + (equip.includes(e) ? " on" : "")} onClick={() => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])}>{e}</button>)}
      </div>
      {cat === "Hôtel" && <input type="number" placeholder="Prix maximum (F)" value={maxp} onChange={(e) => setMaxp(e.target.value)} />}
      <div className="row between"><h2>Prestataires à proximité</h2><span className="link">Voir tout ›</span></div>
      {loading && <div className="muted">Chargement…</div>}
      {err && <div className="err">{err}</div>}
      {!loading && !err && list.length === 0 && <div className="muted">Aucun commerçant ici pour le moment.<br /><Link className="link" to="/devenir-commercant">Inscris ta boutique gratuitement</Link></div>}
      <div className="grid">{list.map((s) => <ShopCard key={s.id} s={s} />)}</div>
    </div>
  );
}

export function ShopPage({ user }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fav, setFav] = useState(false);
  const [p, setP] = useState({ nom: "", prix: "", promo: "", fin: "", description: "" });
  const [r, setR] = useState({ etoiles: 5, commentaire: "" });

  const load = async () => {
    const s = await getDoc(doc(db, "shops", id));
    setShop(s.exists() ? { id: s.id, ...s.data() } : false);
    setProducts((await getDocs(collection(db, "shops", id, "products"))).docs.map((d) => ({ id: d.id, ...d.data() })));
    setReviews((await getDocs(collection(db, "shops", id, "reviews"))).docs.map((d) => ({ id: d.id, ...d.data() })));
    if (user) setFav((await getDoc(doc(db, "users", user.uid, "favorites", id))).exists());
  };
  useEffect(() => { load().catch(() => setShop(false)); }, [id, user?.uid]);

  if (shop === null) return <div className="muted">Chargement…</div>;
  if (shop === false) return <div className="muted">Boutique introuvable.</div>;
  const mine = user && shop.ownerId === user.uid;
  const moy = reviews.length ? (reviews.reduce((a, x) => a + x.etoiles, 0) / reviews.length).toFixed(1) : null;

  const toggleFav = async () => {
    if (!user) return alert("Connecte-toi pour ajouter aux favoris.");
    const ref = doc(db, "users", user.uid, "favorites", id);
    if (fav) await deleteDoc(ref); else await setDoc(ref, { shopId: id, nom: shop.nom, date: serverTimestamp() });
    setFav(!fav);
  };
  const addProduct = async (e) => {
    e.preventDefault();
    const max = shop.premium ? 10 : 3;
    if (products.length >= max) return alert("Limite de " + max + " produits. Passe en Premium pour en ajouter plus.");
    await addDoc(collection(db, "shops", id, "products"), { nom: p.nom, prix: Number(p.prix), prix_promo: p.promo ? Number(p.promo) : null, fin: p.fin ? new Date(p.fin + "T23:59:59").getTime() : null, description: p.description });
    setP({ nom: "", prix: "", promo: "", fin: "", description: "" }); load();
  };
  const addReview = async (e) => {
    e.preventDefault();
    if (!user) return alert("Connecte-toi pour donner ton avis.");
    const ver = !(await getDocs(query(collection(db, "orders"), where("clientId", "==", user.uid), where("shopId", "==", id), where("statut", "==", "livree")))).empty;
    await addDoc(collection(db, "shops", id, "reviews"), { userId: user.uid, auteur: user.displayName || "Client", verifie: ver, etoiles: Number(r.etoiles), commentaire: r.commentaire, date: serverTimestamp() });
    try { await updateDoc(doc(db, "shops", id), { noteSum: increment(Number(r.etoiles)), noteCount: increment(1) }); } catch {}
    setR({ etoiles: 5, commentaire: "" }); load();
  };

  return (
    <div className="wrap">
      <div className="cover" style={shop.photo ? { backgroundImage: "url(" + shop.photo + ")" } : undefined}>
        <div className="topbar"><button className="rb" onClick={() => nav(-1)}><Ic n="back" /></button><span className="glass titlebar">Boutique</span><button className="rb" onClick={() => (navigator.share ? navigator.share({ title: shop.nom, url: location.href }) : navigator.clipboard?.writeText(location.href))}><Ic n="share" /></button></div>
      </div>
      <div className="shop-head">
        <Avatar s={shop} />
        <div className="glass head-info"><h2>{shop.nom}</h2>{shop.premium && <span className="badge"><Ic n="sparkle" /> PREMIUM</span>}<div className="meta"><Ic n="pin" /> {shop.quartier} • {shop.ville} • {shop.categorie}</div></div>
      </div>
      <div className="row three">
        <a className="btn-g" href={"tel:" + shop.whatsapp}><Ic n="phone" /> Appeler</a>
        <a className="btn-g wa" href={waLink(shop.whatsapp)} target="_blank" rel="noreferrer"><Ic n="whatsapp" /> WhatsApp</a>
        {!mine && user ? <Link className="btn-g" to={"/chat/" + id + "/" + user.uid}><Ic n="chat" /> Écrire</Link> : <button className="btn-g" onClick={toggleFav}><Ic n="heart" fill={fav} /> Favori</button>}
      </div>
      <div className="card">
        <div className="row between">
          <div>{moy && <b><span className="star">★</span> {moy} • {reviews.length} avis</b>} {shop.dispo && <span className="meta"><span className="dot" />Disponible maintenant</span>}</div>
          {!mine && <button className={"heart" + (fav ? " on" : "")} onClick={toggleFav} aria-label="Favori"><Ic n="heart" fill={fav} /></button>}
        </div>
        <p>{shop.description}</p>
        <div className="chips">{(CHAMPS[shop.categorie] || []).filter((c) => shop.extra?.[c.k]).map((c) => <span className="chip" key={c.k}>{c.label} : {shop.extra[c.k]}</span>)}</div>
        {shop.horaires && <div className="meta">Horaires : {shop.horaires}</div>}
        {mine && <button className={"chip" + (shop.dispo ? " on" : "")} style={{ marginTop: 10 }} onClick={async () => { await updateDoc(doc(db, "shops", id), { dispo: !shop.dispo }); load(); }}>Disponible maintenant : {shop.dispo ? "OUI" : "NON"}</button>}
      </div>
      {mine && !shop.premium && <PremiumCard shop={shop} />}
      {mine && <StoryAdd shop={shop} />}
      <h2>Produits et services</h2>
      {products.length === 0 && <div className="card center"><img className="art pipe" src={ART.pipe} alt="" /><b>Aucun produit pour le moment</b><div className="meta">Ce commerçant n'a pas encore ajouté de produits ou services. Revenez bientôt !</div></div>}
      {products.map((x) => (
        <div className="card" key={x.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <b>{x.nom}</b><Price x={x} />
          </div>
          <div className="meta">{x.description}</div>
          {!mine && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => orderProduct(user, shop, x)}>Commander</button>}
          {mine && <button className="btn red sm" style={{ marginTop: 8 }} onClick={async () => { await deleteDoc(doc(db, "shops", id, "products", x.id)); load(); }}>Supprimer</button>}
        </div>
      ))}
      {mine && (
        <form className="card" onSubmit={addProduct}>
          <b>Ajouter un produit</b>
          <input required placeholder="Nom (ex : Chambre climatisée)" value={p.nom} onChange={(e) => setP({ ...p, nom: e.target.value })} />
          <input required type="number" min="0" placeholder="Prix en F" value={p.prix} onChange={(e) => setP({ ...p, prix: e.target.value })} />
          <input type="number" min="0" placeholder="Prix promo en F (facultatif)" value={p.promo} onChange={(e) => setP({ ...p, promo: e.target.value })} />
          <input type="date" value={p.fin} onChange={(e) => setP({ ...p, fin: e.target.value })} />
          <input placeholder="Description" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} />
          <button className="btn">Ajouter</button>
        </form>
      )}

      <h2>Avis</h2>
      {reviews.map((x) => (
        <div className="card" key={x.id}><b>{x.auteur}</b>{x.verifie && <span className="ok"> <Ic n="check" /> Vérifié</span>} <span className="star">{"★".repeat(x.etoiles)}</span><div className="meta">{x.commentaire}</div></div>
      ))}
      <div className="card">
        <div className="row between"><span className="chip">Évaluation globale</span><b className="star">{moy || "—"} {[1, 2, 3, 4, 5].map((n) => <Ic key={n} n="star" fill={n <= Math.round(moy || 0)} />)}</b></div>
        <form onSubmit={addReview}>
          <div className="center"><b>Donnez votre avis</b><div>{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={"star-btn" + (r.etoiles >= n ? " on" : "")} onClick={() => setR({ ...r, etoiles: n })}><Ic n="star" fill={r.etoiles >= n} /></button>)}</div></div>
          <input placeholder="Ton avis" value={r.commentaire} onChange={(e) => setR({ ...r, commentaire: e.target.value })} />
          <button className="btn big">Publier mon avis</button>
        </form>
      </div>
    </div>
  );
}

export function Login({ user }) {
  const nav = useNavigate();
  const [mode, setMode] = useState("connexion");
  const [f, setF] = useState({ nom: "", email: "", mdp: "" });
  const [err, setErr] = useState(""); const [info, setInfo] = useState("");
  useEffect(() => { if (user) nav("/profil"); }, [user]);

  const go = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (mode === "inscription") {
        const c = await createUserWithEmailAndPassword(auth, f.email, f.mdp);
        if (f.nom) await updateProfile(c.user, { displayName: f.nom });
      } else await signInWithEmailAndPassword(auth, f.email, f.mdp);
    } catch { setErr("Email ou mot de passe incorrect. Réessaie."); }
  };
  const reset = async () => {
    if (!f.email) return setErr("Écris ton email d'abord.");
    await sendPasswordResetEmail(auth, f.email); setInfo("Email envoyé. Vérifie ta boîte.");
  };
  return (
    <div className="wrap">
      <h2>{mode === "connexion" ? "Se connecter" : "Créer un compte gratuit"}</h2>
      <button className="btn line" style={{ width: "100%", marginBottom: 12 }} onClick={() => signInWithPopup(auth, google).catch(() => setErr("Connexion Google impossible."))}>Continuer avec Google</button>
      <form className="card" onSubmit={go}>
        {mode === "inscription" && <input required placeholder="Nom complet" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />}
        <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input required type="password" minLength={6} placeholder="Mot de passe (6 caractères min.)" value={f.mdp} onChange={(e) => setF({ ...f, mdp: e.target.value })} />
        {err && <div className="err">{err}</div>}{info && <div className="ok">{info}</div>}
        <button className="btn big">{mode === "connexion" ? "SE CONNECTER" : "CRÉER MON COMPTE"}</button>
      </form>
      <div className="row">
        <button className="chip" onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}>{mode === "connexion" ? "Créer un compte" : "J'ai déjà un compte"}</button>
        {mode === "connexion" && <button className="chip" onClick={reset}>Mot de passe oublié ?</button>}
      </div>
    </div>
  );
}

export function Profile({ user }) {
  const [mes, setMes] = useState([]);
  const [cmd, setCmd] = useState({ n: 0, pts: 0 });
  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "shops"), where("ownerId", "==", user.uid))).then((s) => setMes(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
    getDocs(query(collection(db, "orders"), where("clientId", "==", user.uid))).then((s) => { const o = s.docs.map((d) => d.data()); setCmd({ n: o.length, pts: o.filter((x) => x.statut === "livree").reduce((a, x) => a + Math.floor(x.total / 100), 0) }); }).catch(() => {});
  }, [user?.uid]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour voir ton profil.<br /><br /><Link className="btn" to="/connexion">Se connecter</Link></div></div>;
  const nom = user.displayName || user.email.split("@")[0];
  const row = (to, ico, bg, txt) => <Link key={to} className="glass rowlink" to={to}><span className="ico" style={{ background: bg }}><Ic n={ico} /></span><b>{txt}</b><span>›</span></Link>;
  return (
    <div className="wrap">
      <div className="row between" style={{ marginBottom: 14 }}><span style={{ width: 90 }} /><b style={{ letterSpacing: ".15em" }}>NOVA-TOGO</b>
        <span className="row" style={{ flexWrap: "nowrap" }}><Link className="rb" style={{ display: "grid", placeItems: "center", textDecoration: "none" }} to="/messages"><Ic n="bell" /></Link><Link className="rb" style={{ display: "grid", placeItems: "center", textDecoration: "none" }} to="/parametres"><Ic n="gear" /></Link></span></div>
      <div className="glass panel" style={{ position: "relative" }}>
        <div className="row" style={{ flexWrap: "nowrap" }}><div className="avatar" style={{ width: 84, height: 84, fontSize: 38 }}>{nom[0].toUpperCase()}</div><div><b style={{ fontSize: 22 }}>{nom}</b><div className="meta">{user.email}</div></div></div>
        <span className="badge" style={{ position: "absolute", top: 14, right: 14 }}><Ic n="sparkle" /> {cmd.pts} POINTS NOVA</span>
        <div className="glass stats"><div>Commandes<b><Ic n="box" /> {cmd.n}</b></div><div>Points<b><Ic n="star" /> {cmd.pts}</b></div><div>Boutiques<b><Ic n="store" /> {mes.length}</b></div></div>
      </div>
      <div className="sub" style={{ margin: "6px 4px" }}>Mon compte</div>
      {row("/commandes", "box", "linear-gradient(135deg,#7C3AED,#3B82F6)", "Mes commandes et points NOVA")}
      {row("/messages", "chat", "linear-gradient(135deg,#6366F1,#7C3AED)", "Mes messages")}
      {row("/parametres", "gear", "linear-gradient(135deg,#16A34A,#4ADE80)", "Paramètres")}
      <a className="glass rowlink" target="_blank" rel="noreferrer" href={"https://wa.me/?text=" + encodeURIComponent("Télécharge NOVA-TOGO, l'app pour trouver tout au Togo : taxi, hôtel, pharmacie, marché, livraison. " + location.href.split("#")[0] + "#/?ref=" + user.uid)}><span className="ico" style={{ background: "#22C55E" }}><Ic n="whatsapp" /></span><b>Inviter un ami sur WhatsApp</b><span>›</span></a>
      <div className="sub" style={{ margin: "10px 4px 6px" }}>Boutique</div>
      <div className="dash">
        <div className="row"><span className="ico" style={{ background: "linear-gradient(135deg,#EF4444,#FF6B35)" }}><Ic n="store" /></span><div><b style={{ fontSize: 19 }}>Mes boutiques</b>{mes.length === 0 && <div className="meta">Pas encore de boutique</div>}</div></div>
        {mes.map((s) => <div key={s.id} style={{ margin: "8px 0" }}><Link className="link" to={"/boutique/" + s.id}>{s.nom}</Link> <span className="meta">{s.statut === "valide" ? <><Ic n="check" /> Visible</> : <><Ic n="clock" /> En attente (24 h)</>}</span></div>)}
        {mes.filter((s) => s.statut === "valide" && !s.premium).slice(0, 1).map((s) => <PremiumCard key={s.id} shop={s} />)}
        <Link className="btn big" to="/devenir-commercant" style={{ marginTop: 10 }}>+ En créer une</Link>
      </div>
      {user.email === ADMIN_EMAIL && <><div className="sub" style={{ margin: "6px 4px" }}>Administration</div>{row("/admin", "shield", "linear-gradient(135deg,#7C3AED,#A78BFA)", "Panneau admin")}</>}
      <button className="btn red big" style={{ marginTop: 14 }} onClick={() => signOut(auth)}>Se déconnecter</button>
    </div>
  );
}

export function NewShop({ user }) {
  const nav = useNavigate();
  const [f, setF] = useState({ nom: "", categorie: CATEGORIES[0], whatsapp: "", quartier: "", ville: localStorage.getItem("ville") || "Lomé", description: "", horaires: "", photo: "", equip: [], prix_min: "", lat: null, lng: null, extra: {}, ok: false });
  const [err, setErr] = useState("");
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour inscrire ta boutique (gratuit).<br /><br /><Link className="btn" to="/connexion">Se connecter</Link></div></div>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    if (!f.ok) return setErr("Coche la case pour afficher ton numéro.");
    try {
      const { ok, ...data } = f;
      data.extra = Object.fromEntries((CHAMPS[f.categorie] || []).map((c) => [c.k, f.extra[c.k] || ""]));
      await addDoc(collection(db, "shops"), { ...data, ownerId: user.uid, pays: "Togo", statut: "en_attente", premium: false, date_creation: serverTimestamp() });
      alert("Félicitations ! Ta boutique est en attente de validation. Tu seras visible dans 24 h.");
      nav("/profil");
    } catch { setErr("Enregistrement impossible. Réessaie."); }
  };
  return (
    <form className="wrap" onSubmit={save}>
      <h2>Inscrire ma boutique</h2>
      <div className="meta" style={{ marginBottom: 10 }}>Inscription gratuite, 1 minute.</div>
      <input required placeholder="Nom de la boutique" value={f.nom} onChange={set("nom")} />
      <select value={f.categorie} onChange={set("categorie")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <input required placeholder="WhatsApp (ex : +22890000000)" value={f.whatsapp} onChange={set("whatsapp")} />
      <select value={f.ville} onChange={set("ville")}>{VILLES.map((v) => <option key={v}>{v}</option>)}</select>
      <input required placeholder="Quartier" value={f.quartier} onChange={set("quartier")} />
      <textarea rows={3} placeholder="Description" value={f.description} onChange={set("description")} />
      <input placeholder="Horaires (ex : 8h - 18h)" value={f.horaires} onChange={set("horaires")} />
      <button type="button" className="btn line" style={{ marginBottom: 10 }} onClick={() => gps((p) => setF({ ...f, lat: p.coords.latitude, lng: p.coords.longitude }))}>{f.lat ? <><Ic n="check" /> Position enregistrée</> : <><Ic n="pin" /> Enregistrer la position de ma boutique</>}</button>
      {f.categorie === "Hôtel" && <div className="card"><b>Hôtel</b><input type="number" placeholder="Prix de la chambre la moins chère (F)" value={f.prix_min} onChange={set("prix_min")} /><div className="chips">{EQUIP.map((e) => <button type="button" key={e} className={"chip" + (f.equip.includes(e) ? " on" : "")} onClick={() => setF({ ...f, equip: f.equip.includes(e) ? f.equip.filter((x) => x !== e) : [...f.equip, e] })}>{e}</button>)}</div></div>}
      {(CHAMPS[f.categorie] || []).length > 0 && <div className="card"><b>Informations pour {f.categorie}</b>{CHAMPS[f.categorie].map((c) => c.options
        ? <select key={c.k} value={f.extra[c.k] || ""} onChange={(e) => setF({ ...f, extra: { ...f.extra, [c.k]: e.target.value } })}><option value="">{c.label}…</option>{c.options.map((o) => <option key={o}>{o}</option>)}</select>
        : <input key={c.k} type={c.t || "text"} required={c.req} placeholder={c.label + (c.req ? " *" : "")} value={f.extra[c.k] || ""} onChange={(e) => setF({ ...f, extra: { ...f.extra, [c.k]: e.target.value } })} />)}</div>}
      <label className="meta">Photo de la boutique (facultatif)<input type="file" accept="image/*" onChange={async (e) => e.target.files[0] && setF({ ...f, photo: await compress(e.target.files[0]) })} /></label>
      {f.photo && <img src={f.photo} alt="" style={{ width: 90, borderRadius: 12, marginBottom: 10 }} />}
      <label className="meta"><input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={f.ok} onChange={(e) => setF({ ...f, ok: e.target.checked })} />J'accepte que mon numéro soit affiché</label>
      {err && <div className="err">{err}</div>}
      <button className="btn big" style={{ marginTop: 10 }}>INSCRIRE MA BOUTIQUE</button>
    </form>
  );
}

export function Favorites({ user }) {
  const [l, setL] = useState([]);
  const [d, setD] = useState([]);
  const ville = localStorage.getItem("ville") || "Lomé";
  useEffect(() => {
    if (user) getDocs(collection(db, "users", user.uid, "favorites")).then((s) => setL(s.docs.map((x) => ({ id: x.id, ...x.data() })))).catch(() => {});
    getDocs(query(collection(db, "shops"), where("statut", "==", "valide"), where("ville", "==", ville))).then((s) => setD(s.docs.slice(0, 2).map((x) => ({ id: x.id, ...x.data() })))).catch(() => {});
  }, [user?.uid]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour voir tes favoris.<br /><br /><Link className="btn" to="/connexion">Se connecter</Link></div></div>;
  const nom = user.displayName || user.email.split("@")[0];
  return (
    <div className="wrap">
      <div className="sub">Bonjour, {nom} ✨</div><div className="sub">Découvrez et sauvegardez vos boutiques préférées</div>
      <h1 className="hello big">Mes favoris</h1>
      {l.length === 0 ? (
        <div className="center">
          <img className="art heart-art" src={ART.heart} alt="" />
          <h2>Aucun favori</h2><div className="sub">Touche le cœur sur une boutique pour l'ajouter ici</div>
        </div>
      ) : l.map((x) => <Link key={x.id} className="glass rowlink" to={"/boutique/" + x.id}><b>{x.nom}</b><span>›</span></Link>)}
      {d.length > 0 && <div className="glass panel"><div className="eyebrow"><Ic n="sparkle" /> À DÉCOUVRIR À {ville.toUpperCase()} <Ic n="sparkle" /></div>
        <div className="two">{d.map((s) => <Link key={s.id} className="glass mini-card" to={"/boutique/" + s.id}><Avatar s={s} /><b style={{ display: "block", marginTop: 8 }}>{s.nom}</b><div className="meta">{s.categorie} • {s.quartier}</div></Link>)}</div></div>}
      <Link className="btn big" to="/" style={{ marginTop: 14 }}><Ic n="sparkle" /> Explorer les boutiques</Link>
    </div>
  );
}

export function Admin({ user }) {
  const [shops, setShops] = useState([]);
  const load = () => getDocs(collection(db, "shops")).then((s) => setShops(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  useEffect(() => { if (user?.email === ADMIN_EMAIL) load(); }, [user?.uid]);
  if (user?.email !== ADMIN_EMAIL) return <div className="wrap"><div className="card muted">Accès réservé à l'administrateur.</div></div>;
  const act = async (id, data) => { await updateDoc(doc(db, "shops", id), data); load(); };
  const wait = shops.filter((s) => s.statut === "en_attente").length, prem = shops.filter((s) => s.premium).length;
  return (
    <div className="wrap">
      <div className="center"><div className="sub">Admin · NOVA-TOGO</div><h1 className="hello">Tableau de bord</h1></div>
      <div className="tiles">{[["store", shops.length, "Boutiques"], ["clock", wait, "En attente"], ["crown", prem, "Premium"]].map(([ic, n, lb]) => <div className="glass tile" key={lb}><div style={{ fontSize: 28 }}><Ic n={ic} /></div><b>{n}</b>{lb}</div>)}</div>
      <div className="banner"><div className="crown"><Ic n="crown" /></div><div><span className="chip on">Revenu Premium estimé</span><div className="big">{fmt(prem * 5000)} / mois</div></div></div>
      <div className="row between"><h2>Boutiques</h2><Link className="link" to="/devenir-commercant">+ Ajouter</Link></div>
      {shops.map((s, i) => (
        <div className="card" key={s.id}>
          <div className="row" style={{ flexWrap: "nowrap" }}><Avatar s={s} /><div><b style={{ fontSize: 20 }}>Boutique {i + 1}</b><div className="meta">{s.nom} — {s.categorie} · {s.ville}</div></div></div>
          <div className="row" style={{ margin: "10px 0" }}><span className={"chip" + (s.statut === "valide" ? " okc" : "")}>{s.statut === "valide" ? <><Ic n="check" /> Valide</> : <><Ic n="clock" /> En attente</>}</span>{s.premium && <span className="chip gold"><Ic n="crown" /> Premium</span>}<span className="chip"><Ic n="phone" /> {s.whatsapp}</span></div>
          <div className="row">
            {s.statut !== "valide" && <button className="btn sm" onClick={() => act(s.id, { statut: "valide" })}>Valider</button>}
            <button className={"btn sm" + (s.premium ? " gold" : "")} onClick={() => act(s.id, { premium: !s.premium })}>{s.premium ? <><Ic n="star" fill /> Retirer Premium</> : <><Ic n="plus" /> Mettre Premium</>}</button>
            <button className="btn sm line" onClick={async () => { if (confirm("Supprimer ?")) { await deleteDoc(doc(db, "shops", s.id)); load(); } }}><Ic n="trash" /> Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
