import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_EMAIL } from "./firebaseConfig";
import { fmt, isPrem, DOMAINES } from "./data";
import { Avatar, useSettings } from "./extra.jsx";
import { Dashboard } from "./dash.jsx";
import { download, toCsv } from "./lot2.jsx";
import { Ic } from "./icons.jsx";

const D = 864e5;
const day = (ms) => new Date(ms).toISOString().slice(0, 10);
const dd = (v) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? "" : day(t); };
const top = (shops, k) => Object.entries(shops.reduce((a, s) => ({ ...a, [s[k]]: (a[s[k]] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
const digits = (n) => String(n || "").replace(/\D/g, "");

export function Admin({ user }) {
  const cfg0 = useSettings();
  const [cfg, setCfg] = useState(cfg0);
  const [mods, setMods] = useState([]); const [modTxt, setModTxt] = useState("");
  const [shops, setShops] = useState([]); const [users, setUsers] = useState([]); const [dem, setDem] = useState([]); const [rep, setRep] = useState([]);
  const [orders, setOrders] = useState([]); const [stats, setStats] = useState([]);
  const [pay, setPay] = useState([]); const [spo, setSpo] = useState([]); const [jr, setJr] = useState([]); const [errs, setErrs] = useState([]);
  const [tab, setTab] = useState("ctrl"); const [q, setQ] = useState(""); const [err, setErr] = useState(""); const [res, setRes] = useState([]); const [sel, setSel] = useState([]);
  const [an, setAn] = useState({ texte: "", fin: "" }); const [mt, setMt] = useState({ domaine: Object.keys(DOMAINES)[0], nom: "" });
  const [ban, setBan] = useState({ titre: "", texte: "", lien: "", ville: "", fin: "" });
  const email = (user?.email || "").toLowerCase();
  const full = email === ADMIN_EMAIL.toLowerCase();
  const ok = full || mods.includes(email);

  const rd = (name, set) => getDocs(collection(db, name)).then((s) => { set(s.docs.map((d) => ({ id: d.id, ...d.data() }))); if (name === "users") setErr(""); }).catch((e) => { if (name === "users") setErr(e.code || "erreur"); });
  const load = () => { rd("shops", setShops); rd("reports", setRep); if (full) { rd("users", setUsers); rd("demandes", setDem); rd("paiements", setPay); rd("sponsors", setSpo); rd("journal", setJr); rd("erreurs", setErrs); rd("orders", setOrders); rd("stats", setStats); } };
  useEffect(() => { getDoc(doc(db, "settings", "roles")).then((d) => { const l = d.exists() ? d.data().mods || [] : []; setMods(l.map((x) => String(x).toLowerCase())); setModTxt(l.join(", ")); }).catch(() => {}); }, []);
  useEffect(() => { if (ok) load(); }, [user?.uid, ok]);
  useEffect(() => setCfg(cfg0), [JSON.stringify(cfg0)]);
  if (!ok) return <div className="wrap"><div className="card muted">Accès réservé à l'administrateur.</div></div>;

  const log = (texte) => addDoc(collection(db, "journal"), { texte, par: email, date: serverTimestamp() }).catch(() => {});
  const act = async (s, data, texte) => { try { await updateDoc(doc(db, "shops", s.id), data); log(texte + " : " + s.nom); load(); } catch (e) { alert("Action refusée (" + (e.code || "erreur") + ")."); } };
  const price = Number(cfg0.premium) || 1000, annuel = Number(cfg0.annuel) || price * 10;
  const activer = async (s, renew) => {
    const m = Number(prompt("Durée en mois (1 ou 12) :", "1")); if (!m) return;
    const moyen = prompt("Moyen de paiement (Flooz, Yas, Espèces) :", "Flooz"); if (moyen === null) return;
    const fin = (renew ? Math.max(Date.now(), s.premium_fin || 0) : Date.now()) + (m >= 12 ? 365 : 30 * m) * D;
    await addDoc(collection(db, "paiements"), { shopId: s.id, nom: s.nom, ownerId: s.ownerId, whatsapp: s.whatsapp, montant: m >= 12 ? annuel : price * m, mois: m, moyen, fin, date: serverTimestamp() });
    await act(s, { premium: true, premium_fin: fin }, (renew ? "Premium renouvelé (" : "Premium activé (") + m + " mois)");
  };
  const traiter = async (d, accept) => {
    try {
      if (accept) {
        const s = shops.find((x) => x.id === d.shopId); if (!s) return alert("Boutique introuvable.");
        let jours = 7;
        if (d.type === "code") { const f = (cfg0.codes || "").split("\n").map((x) => x.trim().split("=")).find((a) => a[0] && a[0].toUpperCase() === d.code); if (!f) return alert("Code inconnu. Ajoute-le dans Réglages (CODE=jours)."); jours = Number(f[1]) || 7; }
        await updateDoc(doc(db, "shops", s.id), { premium: true, premium_fin: Math.max(Date.now(), s.premium_fin || 0) + jours * D, ...(d.type === "essai" ? { essai_utilise: true } : {}) });
        log((d.type === "essai" ? "Essai accordé" : "Code " + d.code + " accordé") + " (" + jours + " j) : " + s.nom);
      }
      await updateDoc(doc(db, "demandes", d.id), { statut: accept ? "acceptee" : "refusee" }); load();
    } catch (e) { alert("Erreur : " + (e.code || e.message)); }
  };
  const diag = async () => {
    const out = []; const t = async (n, fn) => { try { await fn(); out.push("OK : " + n); } catch (e) { out.push("ERREUR : " + n + " (" + (e.code || e.message) + ")"); } };
    await t("enregistrer mon compte", () => setDoc(doc(db, "users", user.uid), { email: user.email, nom: user.displayName || "", dernier: new Date().toISOString() }, { merge: true }));
    await t("lire la liste des comptes", () => getDocs(collection(db, "users")));
    await t("lire les signalements", () => getDocs(collection(db, "reports")));
    await t("lire les paiements", () => getDocs(collection(db, "paiements")));
    await t("écrire le journal", () => addDoc(collection(db, "journal"), { texte: "Test base de données", par: email, date: serverTimestamp() }));
    await t("enregistrer les réglages", () => setDoc(doc(db, "settings", "test"), { ok: true }));
    setRes(out); load();
  };

  const wait = shops.filter((s) => s.statut === "en_attente");
  const prem = shops.filter(isPrem).length;
  const soon = shops.filter((s) => isPrem(s) && s.premium_fin && s.premium_fin - Date.now() < 3 * D);
  const owners = new Set(shops.map((s) => s.ownerId));
  const total = Math.max(users.length, owners.size), withShop = owners.size;
  const list = shops.filter((s) => !q || ((s.nom || "") + (s.categorie || "") + (s.ville || "") + (s.whatsapp || "")).toLowerCase().includes(q.toLowerCase()));
  const days = [...Array(7)].map((_, i) => day(Date.now() - (6 - i) * D));
  const cnt = (arr, f) => days.map((x) => arr.filter((a) => f(a) === x).length);
  const sh7 = cnt(shops, (s) => (s.date_creation?.seconds ? day(s.date_creation.seconds * 1000) : "")), us7 = cnt(users, (u) => dd(u.creation));
  const openDem = dem.filter((d) => d.statut === "ouverte"), openRep = rep.filter((r) => r.statut === "ouvert");
  const tabs = full ? [["ctrl", "Tableau de contrôle"], ["home", "Résumé"], ["shops", "Boutiques"], ["dem", "Demandes (" + openDem.length + ")"], ["rep", "Signalements (" + openRep.length + ")"], ["pay", "Paiements"], ["users", "Utilisateurs"], ["spo", "Bannières"], ["jr", "Journal"], ["cfg", "Réglages"]] : [["shops", "Boutiques"], ["rep", "Signalements (" + openRep.length + ")"]];
  const cur = full ? tab : (tab === "rep" ? "rep" : "shops");

  const Row = ({ s, batch }) => (
    <div className="card">
      <div className="row" style={{ flexWrap: "nowrap" }}>
        {batch && <input type="checkbox" style={{ width: "auto", marginBottom: 0 }} checked={sel.includes(s.id)} onChange={(e) => setSel(e.target.checked ? [...sel, s.id] : sel.filter((x) => x !== s.id))} />}
        <Avatar s={s} /><div><b style={{ fontSize: 20 }}>{s.nom}{s.verifie && <span className="verif"><Ic n="check" /></span>}</b><div className="meta">{s.categorie} · {s.quartier}, {s.ville}</div></div>
      </div>
      <div className="row" style={{ margin: "10px 0" }}>
        <span className={"chip" + (s.statut === "valide" ? " okc" : "")}>{s.statut === "valide" ? <><Ic n="check" /> Valide</> : <><Ic n="clock" /> En attente</>}</span>
        {isPrem(s) && <span className="chip gold"><Ic n="crown" /> Premium{s.premium_fin ? " jusqu'au " + new Date(s.premium_fin).toLocaleDateString("fr-FR") : ""}</span>}
        {s.premium && !isPrem(s) && <span className="chip">Premium expiré</span>}
        <span className="chip"><Ic n="phone" /> {s.whatsapp}</span>
      </div>
      <div className="row">
        {s.statut !== "valide" && <button className="btn sm" onClick={() => act(s, { statut: "valide" }, "Boutique validée")}>Valider</button>}
        <button className="btn sm line" onClick={() => act(s, { verifie: !s.verifie }, s.verifie ? "Badge Vérifié retiré" : "Badge Vérifié donné")}>{s.verifie ? "Retirer Vérifié" : "Marquer Vérifié"}</button>
        {full && (isPrem(s)
          ? <><button className="btn sm gold" onClick={() => activer(s, true)}>Renouveler</button><button className="btn sm line" onClick={() => act(s, { premium: false, premium_fin: null }, "Premium retiré")}>Retirer Premium</button></>
          : <button className="btn sm gold" onClick={() => activer(s, false)}><Ic n="plus" /> Mettre Premium</button>)}
        {full && <button className="btn sm line" onClick={async () => { if (confirm("Supprimer cette boutique ?")) { await deleteDoc(doc(db, "shops", s.id)); log("Boutique supprimée : " + s.nom); load(); } }}><Ic n="trash" /> Supprimer</button>}
      </div>
    </div>
  );

  return (
    <div className="wrap admin">
      <div className="center"><div className="sub">{full ? "Admin" : "Modérateur"} · NOVA-TOGO</div><h1 className="hello">Tableau de bord</h1></div>
      {err && <div className="card err">Impossible de lire la liste des comptes ({err}). Cause probable : les règles Firestore ne sont pas à jour. Ouvre Réglages puis « Tester la base de données ».</div>}
      <div className="admin-wrap"><div className="chips admin-tabs">{tabs.map(([k, l]) => <button key={k} className={"chip" + (cur === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div><div className="admin-main">
      {cur === "ctrl" && <Dashboard shops={shops} users={users} orders={orders} pay={pay} stats={stats} rep={rep} dem={dem} errs={errs} user={user} onTab={setTab} onSearch={(v) => { setQ(v); setTab("shops"); }} />}

      {cur === "home" && <>
        <div className="tiles t4">
          {[["store", shops.length, "Boutiques", "shops"], ["clock", wait.length, "En attente", "shops"], ["crown", prem, "Premium", "shops"], ["user", total, "Comptes créés", "users"], ["star", openDem.length, "Demandes", "dem"], ["shield", openRep.length, "Signalements", "rep"]].map(([ic, n, lb, to]) => (
            <button key={lb} className="glass tile" onClick={() => setTab(to)}><div style={{ fontSize: 28 }}><Ic n={ic} /></div><b>{n}</b>{lb}</button>))}
        </div>
        <div className="banner"><div className="crown"><Ic n="crown" /></div><div><span className="chip on">Revenu Premium estimé</span><div className="big">{fmt(prem * price)} / mois</div><div className="meta">{prem} boutique(s) × {fmt(price)}</div></div></div>
        {soon.length > 0 && <><h2>Premium bientôt expiré</h2>{soon.map((s) => <div className="card row between" key={s.id}><div><b>{s.nom}</b><div className="meta">Fin : {new Date(s.premium_fin).toLocaleDateString("fr-FR")}</div></div>
          <a className="btn sm wa" target="_blank" rel="noreferrer" href={"https://wa.me/" + digits(s.whatsapp) + "?text=" + encodeURIComponent("Bonjour, ton Premium NOVA-TOGO pour « " + s.nom + " » se termine le " + new Date(s.premium_fin).toLocaleDateString("fr-FR") + ". Veux-tu le renouveler ?")}>Relancer</a></div>)}</>}
        {wait.length > 0 && <><div className="row between"><h2>À valider ({wait.length})</h2>{sel.length > 0 && <button className="btn sm" onClick={async () => { for (const id of sel) { const s = shops.find((x) => x.id === id); if (s) await updateDoc(doc(db, "shops", id), { statut: "valide" }); } log(sel.length + " boutique(s) validée(s) en lot"); setSel([]); load(); }}>Valider la sélection ({sel.length})</button>}</div>{wait.map((s) => <Row key={s.id} s={s} batch />)}</>}
        <h2>7 derniers jours</h2>
        <div className="card">{days.map((x, i) => <div className="bar-row" key={x}><span>{x.slice(5)}</span><i style={{ width: Math.min(100, (sh7[i] + us7[i]) * 12) + "%" }} /><b>{sh7[i]} boutique(s) • {us7[i]} compte(s)</b></div>)}</div>
        <div className="two"><div className="card"><b>Top catégories</b>{top(shops, "categorie").map(([k, n]) => <div className="meta" key={k}>{k} : {n}</div>)}</div><div className="card"><b>Top villes</b>{top(shops, "ville").map(([k, n]) => <div className="meta" key={k}>{k} : {n}</div>)}</div></div>
      </>}

      {cur === "shops" && <>
        <input placeholder="Chercher une boutique (nom, ville, catégorie, numéro)" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row between"><h2>Boutiques ({list.length})</h2><div className="row">{full && <button className="btn sm line" onClick={() => download("boutiques.csv", toCsv([["Nom", "Catégorie", "Ville", "Quartier", "WhatsApp", "Statut", "Premium", "Vérifié"], ...shops.map((s) => [s.nom, s.categorie, s.ville, s.quartier, s.whatsapp, s.statut, isPrem(s) ? "oui" : "non", s.verifie ? "oui" : "non"])]))}>Exporter CSV</button>}<Link className="link" to="/devenir-commercant">+ Ajouter</Link></div></div>
        {list.map((s) => <Row key={s.id} s={s} />)}
      </>}

      {cur === "dem" && <><h2>Demandes des commerçants</h2>{dem.length === 0 && <div className="muted">Aucune demande.</div>}
        {[...dem].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map((d) => <div className="card" key={d.id}><b>{d.shopNom}</b> <span className="chip">{d.type === "essai" ? "Essai 7 jours" : "Code " + d.code}</span> <span className="meta">{d.statut}</span>
          {d.statut === "ouverte" && <div className="row" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => traiter(d, true)}>Accepter</button><button className="btn sm line" onClick={() => traiter(d, false)}>Refuser</button></div>}</div>)}</>}

      {cur === "rep" && <><h2>Signalements</h2>{rep.length === 0 && <div className="muted">Aucun signalement.</div>}
        {[...rep].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map((r) => <div className="card" key={r.id}><div className="row between"><b>{r.type}</b><span className={"chip" + (r.statut === "ouvert" ? " gold" : " okc")}>{r.statut}</span></div>
          <div className="meta">{r.motif}</div>
          <div className="row" style={{ marginTop: 8 }}><Link className="btn sm line" to={"/boutique/" + r.shopId}>Voir la boutique</Link>{r.statut === "ouvert" && <button className="btn sm" onClick={async () => { await updateDoc(doc(db, "reports", r.id), { statut: "traite" }); load(); }}>Marquer traité</button>}<button className="btn sm line" onClick={async () => { await deleteDoc(doc(db, "reports", r.id)); load(); }}><Ic n="trash" /></button></div></div>)}</>}

      {cur === "pay" && <><div className="row between"><h2>Paiements Premium</h2><button className="btn sm line" onClick={() => download("paiements.csv", toCsv([["Boutique", "Montant", "Mois", "Moyen", "Fin"], ...pay.map((p) => [p.nom, p.montant, p.mois, p.moyen, p.fin ? new Date(p.fin).toLocaleDateString("fr-FR") : ""])]))}>Exporter CSV</button></div>
        <div className="banner"><div className="crown"><Ic n="crown" /></div><div><span className="chip on">Total encaissé</span><div className="big">{fmt(pay.reduce((a, p) => a + (Number(p.montant) || 0), 0))}</div></div></div>
        {[...pay].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map((p) => <div className="card row between" key={p.id}><div><b>{p.nom}</b><div className="meta">{fmt(p.montant)} • {p.mois} mois • {p.moyen} • jusqu'au {p.fin ? new Date(p.fin).toLocaleDateString("fr-FR") : "?"}</div></div>
          <a className="btn sm wa" target="_blank" rel="noreferrer" href={"https://wa.me/" + digits(p.whatsapp) + "?text=" + encodeURIComponent("Reçu NOVA-TOGO : Premium « " + p.nom + " », " + fmt(p.montant) + " (" + p.moyen + "), valable jusqu'au " + (p.fin ? new Date(p.fin).toLocaleDateString("fr-FR") : "?") + ". Merci !")}>Reçu</a></div>)}</>}

      {cur === "users" && <>
        <div className="tiles"><div className="glass tile"><b>{total}</b>Comptes créés</div><div className="glass tile"><b>{withShop}</b>Avec boutique</div><div className="glass tile"><b>{Math.max(total - withShop, 0)}</b>Comptes simples</div></div>
        <div className="row between" style={{ margin: "8px 0" }}><div className="meta">Un compte est compté dès sa première connexion. Le total complet est dans Firebase › Authentication.</div><button className="btn sm line" onClick={() => download("comptes.csv", toCsv([["Nom", "Email", "Création", "Boutique", "Bloqué"], ...users.map((u) => [u.nom, u.email, u.creation, owners.has(u.id) ? "oui" : "non", u.bloque ? "oui" : "non"])]))}>Exporter CSV</button></div>
        {[...users].sort((a, b) => String(b.creation).localeCompare(String(a.creation))).map((u) => (
          <div className="card row between" key={u.id}><div><b>{u.nom || (u.email || "").split("@")[0] || "Sans nom"}</b><div className="meta">{u.email}</div></div>
            <div className="row"><span className={"chip" + (owners.has(u.id) ? " gold" : "")}>{owners.has(u.id) ? "Boutique" : "Simple"}</span>
              <button className={"btn sm " + (u.bloque ? "" : "line")} onClick={async () => { await updateDoc(doc(db, "users", u.id), { bloque: !u.bloque }); log((u.bloque ? "Compte débloqué : " : "Compte bloqué : ") + (u.email || u.id)); load(); }}>{u.bloque ? "Débloquer" : "Bloquer"}</button></div></div>))}
      </>}

      {cur === "spo" && <><h2>Bannières sponsorisées</h2>
        <div className="card"><input placeholder="Titre" value={ban.titre} onChange={(e) => setBan({ ...ban, titre: e.target.value })} /><input placeholder="Texte" value={ban.texte} onChange={(e) => setBan({ ...ban, texte: e.target.value })} /><input placeholder="Lien (https://…)" value={ban.lien} onChange={(e) => setBan({ ...ban, lien: e.target.value })} /><input placeholder="Ville (vide = toutes)" value={ban.ville} onChange={(e) => setBan({ ...ban, ville: e.target.value })} /><input type="date" value={ban.fin} onChange={(e) => setBan({ ...ban, fin: e.target.value })} />
          <button className="btn big" onClick={async () => { if (!ban.titre) return; await addDoc(collection(db, "sponsors"), { titre: ban.titre, texte: ban.texte, lien: ban.lien, ville: ban.ville, fin: ban.fin ? new Date(ban.fin + "T23:59:59").getTime() : null }); log("Bannière ajoutée : " + ban.titre); setBan({ titre: "", texte: "", lien: "", ville: "", fin: "" }); load(); }}>Ajouter la bannière</button></div>
        {spo.map((b) => <div className="card row between" key={b.id}><div><b>{b.titre}</b><div className="meta">{b.texte} {b.ville ? "• " + b.ville : ""}</div></div><button className="btn sm line" onClick={async () => { await deleteDoc(doc(db, "sponsors", b.id)); load(); }}><Ic n="trash" /></button></div>)}</>}

      {cur === "jr" && <><h2>Journal des actions</h2>{[...jr].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).slice(0, 60).map((j) => <div className="card" key={j.id}><b>{j.texte}</b><div className="meta">{j.par} • {j.date?.seconds ? new Date(j.date.seconds * 1000).toLocaleString("fr-FR") : ""}</div></div>)}
        <h2>Erreurs de l'application</h2>{errs.length === 0 && <div className="muted">Aucune erreur enregistrée.</div>}{errs.slice(0, 20).map((e) => <div className="card" key={e.id}><div className="meta">{e.msg}</div><div className="meta">{e.url}</div></div>)}
        {errs.length > 0 && <button className="btn sm line" onClick={async () => { for (const e of errs) await deleteDoc(doc(db, "erreurs", e.id)); load(); }}>Effacer les erreurs</button>}</>}

      {cur === "cfg" && <>
        <div className="card"><b>Réglages de l'app</b>
          <div className="meta" style={{ margin: "6px 0" }}>Prix mensuel du Premium (F)</div><input type="number" value={cfg.premium} onChange={(e) => setCfg({ ...cfg, premium: e.target.value })} />
          <div className="meta">Prix du Premium sur 12 mois (F)</div><input type="number" value={cfg.annuel} onChange={(e) => setCfg({ ...cfg, annuel: e.target.value })} />
          <div className="meta">WhatsApp de contact et de paiement</div><input value={cfg.whatsapp} onChange={(e) => setCfg({ ...cfg, whatsapp: e.target.value })} />
          <div className="meta">Email de contact</div><input value={cfg.email} onChange={(e) => setCfg({ ...cfg, email: e.target.value })} />
          <div className="meta">Numéro Flooz / Yas pour recevoir les paiements</div><input value={cfg.flooz} onChange={(e) => setCfg({ ...cfg, flooz: e.target.value })} />
          <div className="meta">Codes promo (un par ligne : CODE=jours offerts)</div><textarea rows={3} value={cfg.codes} onChange={(e) => setCfg({ ...cfg, codes: e.target.value })} />
          <div className="meta">Tarifs de taxi indicatifs (une ligne : Ville|Départ|Arrivée|Prix)</div><textarea rows={3} value={cfg.tarifs} onChange={(e) => setCfg({ ...cfg, tarifs: e.target.value })} />
          <div className="meta">Numéros interdits à l'inscription (séparés par des virgules)</div><input value={cfg.blacklist} onChange={(e) => setCfg({ ...cfg, blacklist: e.target.value })} />
          <button className="btn big" onClick={async () => { await setDoc(doc(db, "settings", "app"), { premium: Number(cfg.premium) || 1000, annuel: Number(cfg.annuel) || 10000, whatsapp: cfg.whatsapp, email: cfg.email, flooz: cfg.flooz, codes: cfg.codes || "", tarifs: cfg.tarifs || "", blacklist: cfg.blacklist || "" }); log("Réglages enregistrés"); alert("Réglages enregistrés."); }}>Enregistrer</button></div>
        <div className="card"><b>Annonce affichée à tous</b><input placeholder="Texte de l'annonce" value={an.texte} onChange={(e) => setAn({ ...an, texte: e.target.value })} /><input type="date" value={an.fin} onChange={(e) => setAn({ ...an, fin: e.target.value })} />
          <div className="row"><button className="btn" onClick={async () => { await setDoc(doc(db, "settings", "annonce"), { texte: an.texte, fin: an.fin ? new Date(an.fin + "T23:59:59").getTime() : null }); alert("Annonce publiée."); }}>Publier</button><button className="btn line" onClick={async () => { await setDoc(doc(db, "settings", "annonce"), { texte: "", fin: null }); setAn({ texte: "", fin: "" }); alert("Annonce retirée."); }}>Retirer</button></div></div>
        <div className="card"><b>Modérateurs</b><div className="meta" style={{ margin: "6px 0" }}>Emails séparés par des virgules. Ils peuvent valider les boutiques, donner le badge Vérifié et traiter les signalements.</div><input value={modTxt} onChange={(e) => setModTxt(e.target.value)} />
          <button className="btn" onClick={async () => { const l = modTxt.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean); await setDoc(doc(db, "settings", "roles"), { mods: l }); setMods(l); log("Modérateurs : " + l.join(", ")); alert("Modérateurs enregistrés."); }}>Enregistrer</button></div>
        <div className="card"><b>Ajouter un métier</b><select value={mt.domaine} onChange={(e) => setMt({ ...mt, domaine: e.target.value })}>{Object.keys(DOMAINES).map((d) => <option key={d}>{d}</option>)}</select><input placeholder="Nom du métier" value={mt.nom} onChange={(e) => setMt({ ...mt, nom: e.target.value })} />
          <button className="btn" onClick={async () => { if (!mt.nom.trim()) return; await setDoc(doc(db, "settings", "metiers"), { liste: arrayUnion({ domaine: mt.domaine, nom: mt.nom.trim() }) }, { merge: true }); log("Métier ajouté : " + mt.nom); setMt({ ...mt, nom: "" }); alert("Métier ajouté. Il apparaît après rechargement de l'app."); }}>Ajouter</button></div>
        <div className="card"><b>Maintenance</b>
          <div className="row" style={{ margin: "8px 0" }}><button className="btn line" onClick={async () => { const s = await getDocs(query(collection(db, "stories"), where("expire", "<", Date.now()))); for (const d of s.docs) await deleteDoc(d.ref); alert(s.size + " story(ies) expirée(s) supprimée(s)."); }}>Supprimer les stories expirées</button><button className="btn line" onClick={diag}>Tester la base de données</button></div>
          {res.map((r) => <div key={r} className={r.startsWith("OK") ? "ok" : "err"} style={{ marginTop: 6 }}>{r}</div>)}</div>
      </>}
    </div></div>
    </div>
  );
}
