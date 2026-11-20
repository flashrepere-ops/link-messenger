import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_EMAIL } from "./firebaseConfig";
import { fmt } from "./data";
import { Avatar, useSettings } from "./extra.jsx";
import { Ic } from "./icons.jsx";

const J = 30 * 864e5;
const top = (shops, k) => Object.entries(shops.reduce((a, s) => ({ ...a, [s[k]]: (a[s[k]] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

export function Admin({ user }) {
  const cfg0 = useSettings();
  const [cfg, setCfg] = useState(cfg0);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("home");
  const [q, setQ] = useState("");
  const ok = user?.email === ADMIN_EMAIL;
  const load = () => {
    getDocs(collection(db, "shops")).then((s) => setShops(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
    getDocs(collection(db, "users")).then((s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
  };
  useEffect(() => { if (ok) load(); }, [user?.uid]);
  useEffect(() => setCfg(cfg0), [JSON.stringify(cfg0)]);
  if (!ok) return <div className="wrap"><div className="card muted">Accès réservé à l'administrateur.</div></div>;
  const act = async (id, data) => { await updateDoc(doc(db, "shops", id), data); load(); };
  const price = Number(cfg0.premium) || 1000;
  const wait = shops.filter((s) => s.statut === "en_attente");
  const prem = shops.filter((s) => s.premium).length;
  const owners = new Set(shops.map((s) => s.ownerId));
  const withShop = users.filter((u) => owners.has(u.id)).length;
  const list = shops.filter((s) => !q || (s.nom + s.categorie + s.ville + s.whatsapp).toLowerCase().includes(q.toLowerCase()));
  const tabs = [["home", "Tableau de bord"], ["shops", "Boutiques"], ["users", "Utilisateurs"], ["cfg", "Réglages"]];
  const Row = ({ s }) => (
    <div className="card">
      <div className="row" style={{ flexWrap: "nowrap" }}><Avatar s={s} /><div><b style={{ fontSize: 20 }}>{s.nom}</b><div className="meta">{s.categorie} · {s.quartier}, {s.ville}</div></div></div>
      <div className="row" style={{ margin: "10px 0" }}>
        <span className={"chip" + (s.statut === "valide" ? " okc" : "")}>{s.statut === "valide" ? <><Ic n="check" /> Valide</> : <><Ic n="clock" /> En attente</>}</span>
        {s.premium && <span className="chip gold"><Ic n="crown" /> Premium{s.premium_fin ? " jusqu'au " + new Date(s.premium_fin).toLocaleDateString("fr-FR") : ""}</span>}
        <span className="chip"><Ic n="phone" /> {s.whatsapp}</span>
      </div>
      <div className="row">
        {s.statut !== "valide" && <button className="btn sm" onClick={() => act(s.id, { statut: "valide" })}>Valider</button>}
        {s.premium
          ? <><button className="btn sm gold" onClick={() => act(s.id, { premium: true, premium_fin: Math.max(Date.now(), s.premium_fin || 0) + J })}>Renouveler +30 j</button><button className="btn sm line" onClick={() => act(s.id, { premium: false, premium_fin: null })}>Retirer Premium</button></>
          : <button className="btn sm gold" onClick={() => act(s.id, { premium: true, premium_fin: Date.now() + J })}><Ic n="plus" /> Mettre Premium</button>}
        <button className="btn sm line" onClick={async () => { if (confirm("Supprimer cette boutique ?")) { await deleteDoc(doc(db, "shops", s.id)); load(); } }}><Ic n="trash" /> Supprimer</button>
      </div>
    </div>
  );
  return (
    <div className="wrap">
      <div className="center"><div className="sub">Admin · NOVA-TOGO</div><h1 className="hello">Tableau de bord</h1></div>
      <div className="chips">{tabs.map(([k, l]) => <button key={k} className={"chip" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === "home" && <>
        <div className="tiles t4">
          {[["store", shops.length, "Boutiques", "shops"], ["clock", wait.length, "En attente", "shops"], ["crown", prem, "Premium", "shops"], ["user", users.length, "Comptes créés", "users"]].map(([ic, n, lb, to]) => (
            <button key={lb} className="glass tile" onClick={() => setTab(to)}><div style={{ fontSize: 28 }}><Ic n={ic} /></div><b>{n}</b>{lb}</button>))}
        </div>
        <div className="banner"><div className="crown"><Ic n="crown" /></div><div><span className="chip on">Revenu Premium estimé</span><div className="big">{fmt(prem * price)} / mois</div><div className="meta">{prem} boutique(s) × {fmt(price)}</div></div></div>
        {wait.length > 0 && <><h2>À valider</h2>{wait.map((s) => <Row key={s.id} s={s} />)}</>}
        <div className="two"><div className="card"><b>Top catégories</b>{top(shops, "categorie").map(([k, n]) => <div className="meta" key={k}>{k} : {n}</div>)}</div><div className="card"><b>Top villes</b>{top(shops, "ville").map(([k, n]) => <div className="meta" key={k}>{k} : {n}</div>)}</div></div>
      </>}

      {tab === "shops" && <>
        <input placeholder="Chercher une boutique (nom, ville, catégorie, numéro)" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row between"><h2>Boutiques ({list.length})</h2><Link className="link" to="/devenir-commercant">+ Ajouter</Link></div>
        {list.map((s) => <Row key={s.id} s={s} />)}
      </>}

      {tab === "users" && <>
        <div className="tiles"><div className="glass tile"><b>{users.length}</b>Comptes créés</div><div className="glass tile"><b>{withShop}</b>Avec boutique</div><div className="glass tile"><b>{Math.max(users.length - withShop, 0)}</b>Comptes simples</div></div>
        <div className="meta" style={{ marginBottom: 10 }}>Les comptes sont comptés dès leur première connexion après cette mise à jour. Le total complet est aussi visible dans Firebase > Authentication.</div>
        {[...users].sort((a, b) => String(b.creation).localeCompare(String(a.creation))).map((u) => (
          <div className="card row between" key={u.id}><div><b>{u.nom || (u.email || "").split("@")[0] || "Sans nom"}</b><div className="meta">{u.email}</div></div>
            <span className={"chip" + (owners.has(u.id) ? " gold" : "")}>{owners.has(u.id) ? "Boutique" : "Simple"}</span></div>))}
      </>}

      {tab === "cfg" && <div className="card">
        <b>Réglages de l'app</b>
        <div className="meta" style={{ margin: "6px 0" }}>Prix mensuel du Premium (F)</div><input type="number" value={cfg.premium} onChange={(e) => setCfg({ ...cfg, premium: e.target.value })} />
        <div className="meta">WhatsApp de contact et de paiement (ex : +22890000000)</div><input value={cfg.whatsapp} onChange={(e) => setCfg({ ...cfg, whatsapp: e.target.value })} />
        <div className="meta">Email de contact</div><input value={cfg.email} onChange={(e) => setCfg({ ...cfg, email: e.target.value })} />
        <div className="meta">Numéro Flooz / Yas pour recevoir les paiements</div><input value={cfg.flooz} onChange={(e) => setCfg({ ...cfg, flooz: e.target.value })} />
        <button className="btn big" onClick={async () => { await setDoc(doc(db, "settings", "app"), { premium: Number(cfg.premium) || 1000, whatsapp: cfg.whatsapp, email: cfg.email, flooz: cfg.flooz }); alert("Réglages enregistrés."); }}>Enregistrer</button>
      </div>}
    </div>
  );
}
