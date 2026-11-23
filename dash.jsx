import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import L from "leaflet";
import { db } from "./firebase";
import { fmt, isPrem, DOM_OF } from "./data";
import { download, toCsv } from "./lot2.jsx";
import { Ic } from "./icons.jsx";

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const CITY = { "Lomé": [6.1375, 1.2123], "Kpalimé": [6.9, 0.63], "Atakpamé": [7.53, 1.13], "Sokodé": [8.98, 1.13], "Kara": [9.55, 1.19], "Dapaong": [10.86, 0.21], "Tsévié": [6.43, 1.21], "Aného": [6.23, 1.6], "Vogan": [6.33, 1.53], "Notsé": [6.95, 1.17], "Badou": [7.58, 0.6], "Bassar": [9.25, 0.78], "Bafilo": [9.35, 1.27], "Mango": [10.35, 0.47], "Sotouboua": [8.57, 0.98], "Tchamba": [9.03, 1.42], "Blitta": [8.32, 0.98], "Tabligbo": [6.58, 1.5] };
const COLORS = ["#7C3AED", "#FF6B35", "#2DD4BF", "#FACC15", "#EC4899", "#60A5FA"];
const ts = (x) => (x && x.seconds ? x.seconds * 1000 : 0);
const ym = (ms) => { const d = new Date(ms); return d.getFullYear() * 12 + d.getMonth(); };
const growth = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

// Visiteurs actifs : chaque visiteur envoie un signal toutes les minutes (collection presence).
export function useLive() {
  const [docs, setDocs] = useState([]); const [, tick] = useState(0);
  useEffect(() => {
    const un = onSnapshot(collection(db, "presence"), (s) => setDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
    const id = setInterval(() => tick((x) => x + 1), 15000);
    return () => { un(); clearInterval(id); };
  }, []);
  const act = docs.filter((d) => Date.now() - d.t < 120000);
  return { total: act.length, membres: act.filter((d) => d.uid).length, stale: docs.filter((d) => Date.now() - d.t > 600000) };
}

const Kpi = ({ ic, label, value, sub, bad, live }) => (
  <div className="kpi glass"><div className="kpi-ic"><Ic n={ic} /></div><div className="kpi-l">{label}{live && <span className="live-dot" />}</div><b>{value}</b><div className={"kpi-s" + (bad ? " bad" : "")}>{sub}</div></div>
);

function AreaChart({ a, b }) {
  const W = 640, H = 220, L0 = 44, B = 190, T = 14, n = a.length;
  const max = Math.max(1, ...a.map((x) => x.v), ...b.map((x) => x.v));
  const X = (i) => L0 + (i * (W - L0 - 12)) / (n - 1), Y = (v) => B - (v / max) * (B - T);
  const line = (s) => s.map((p, i) => (i ? "L" : "M") + X(i) + "," + Y(p.v)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} className="chart">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF6B35" stopOpacity=".55" /><stop offset="1" stopColor="#7C3AED" stopOpacity=".05" /></linearGradient></defs>
      {[0, 1, 2, 3].map((i) => <g key={i}><line x1={L0} x2={W - 12} y1={T + (i * (B - T)) / 3} y2={T + (i * (B - T)) / 3} stroke="rgba(255,255,255,.12)" /><text x="2" y={T + 4 + (i * (B - T)) / 3} fill="#CDBFF5" fontSize="10">{fmt(Math.round(max - (i * max) / 3))}</text></g>)}
      <path d={line(a) + " L" + X(n - 1) + "," + B + " L" + X(0) + "," + B + " Z"} fill="url(#ga)" />
      <path d={line(a)} fill="none" stroke="#FF8A50" strokeWidth="2.5" /><path d={line(b)} fill="none" stroke="#A78BFA" strokeWidth="2.5" />
      {a.map((p, i) => <text key={i} x={X(i)} y={B + 18} fill="#CDBFF5" fontSize="11" textAnchor="middle">{p.l}</text>)}
    </svg>
  );
}

function Donut({ items }) {
  const tot = items.reduce((x, i) => x + i.v, 0) || 1; let acc = 0;
  const stops = items.map((it, i) => { const s = (acc / tot) * 100; acc += it.v; return COLORS[i % 6] + " " + s + "% " + (acc / tot) * 100 + "%"; });
  return (
    <div className="donut-box"><div className="donut" style={{ background: items.length ? "conic-gradient(" + stops.join(",") + ")" : "rgba(255,255,255,.15)" }} />
      <div>{items.length === 0 && <div className="meta">Pas encore de données</div>}{items.map((it, i) => <div key={it.k} className="leg"><i style={{ background: COLORS[i % 6] }} />{it.k} <b>{Math.round((it.v / tot) * 100)}%</b></div>)}</div></div>
  );
}

function CityMap({ counts }) {
  const el = useRef(null);
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false }).setView([8.6, 1.0], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 9 }).addTo(m);
    Object.entries(counts).forEach(([v, n]) => { if (CITY[v]) L.circleMarker(CITY[v], { radius: 7 + Math.sqrt(n) * 3, color: "#fff", weight: 2, fillColor: "#FF6B35", fillOpacity: .85 }).bindTooltip(v + " • " + n, { permanent: true, direction: "right", className: "city-tip" }).addTo(m); });
    return () => m.remove();
  }, [JSON.stringify(counts)]);
  return <div ref={el} className="citymap darkmap" />;
}

function Heat({ ords }) {
  const g = Array.from({ length: 6 }, () => Array(7).fill(0));
  ords.forEach((o) => { if (!o.ms) return; const d = new Date(o.ms); g[Math.floor(d.getHours() / 4)][(d.getDay() + 6) % 7]++; });
  const mx = Math.max(1, ...g.flat());
  return (
    <div className="heat"><div />{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <span key={d}>{d}</span>)}
      {g.map((row, i) => [<span key={"h" + i}>{String(i * 4).padStart(2, "0")}-{String(i * 4 + 4).padStart(2, "0")}</span>, ...row.map((v, j) => <i key={i + "_" + j} style={{ background: "rgba(" + (124 + Math.round((131 * v) / mx)) + "," + (58 + Math.round((49 * v) / mx)) + "," + (237 - Math.round((184 * v) / mx)) + "," + (0.15 + (0.85 * v) / mx) + ")" }} title={v + " commande(s)"} />)])}
    </div>
  );
}

function Calendrier({ events }) {
  const now = new Date(), y = now.getFullYear(), mo = now.getMonth();
  const first = (new Date(y, mo, 1).getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: nd }, (_, i) => i + 1)];
  const week = events.filter((e) => e - Date.now() >= 0 && e - Date.now() < 7 * 864e5).length;
  return (
    <div><div className="cal">{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="cal-h">{d}</span>)}
      {cells.map((c, i) => { const ev = c && events.some((e) => { const d = new Date(e); return d.getFullYear() === y && d.getMonth() === mo && d.getDate() === c; }); return <span key={i} className={"cal-d" + (c === now.getDate() ? " today" : "")}>{c}{ev && <u />}</span>; })}</div>
      <div className="meta" style={{ marginTop: 8 }}>{week} événement(s) prévu(s) cette semaine (fins de Premium)</div></div>
  );
}

export function Dashboard({ shops, users, orders, pay, stats, rep, dem, errs, onSearch, onTab, user }) {
  const live = useLive(); const [lat, setLat] = useState(null); const [sq, setSq] = useState("");
  useEffect(() => { const t0 = performance.now(); getDoc(doc(db, "settings", "app")).then(() => setLat(Math.round(performance.now() - t0))).catch(() => setLat(-1)); }, []);
  useEffect(() => { live.stale.forEach((d) => deleteDoc(doc(db, "presence", d.id)).catch(() => {})); }, [live.stale.length]);
  const cur = ym(Date.now());
  const ords = orders.map((o) => ({ ...o, ms: ts(o.date) }));
  const livrees = ords.filter((o) => o.statut === "livree"), sum = (l) => l.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const volume = sum(livrees), panier = ords.length ? Math.round(sum(ords) / ords.length) : 0;
  const premTotal = pay.reduce((a, p) => a + (Number(p.montant) || 0), 0);
  const uNew = users.filter((u) => { const t = new Date(u.creation).getTime(); return !Number.isNaN(t) && ym(t) === cur; }).length;
  const sNew = shops.filter((s) => ts(s.date_creation) && ym(ts(s.date_creation)) === cur).length;
  const oNow = ords.filter((o) => o.ms && ym(o.ms) === cur).length, oPrev = ords.filter((o) => o.ms && ym(o.ms) === cur - 1).length;
  const total = Math.max(users.length, new Set(shops.map((s) => s.ownerId)).size);
  const buyers = new Set(ords.map((o) => o.clientId)).size, conv = total ? Math.round((1000 * buyers) / total) / 10 : 0;
  const months = Array.from({ length: 12 }, (_, i) => cur - 11 + i);
  const serie = (list, f) => months.map((m, i) => ({ l: MOIS[((m % 12) + 12) % 12], v: list.filter((x) => f(x) && ym(f(x)) === m).reduce((a, x) => a + (Number(x.montant ?? x.total) || 0), 0) }));
  const revPrem = serie(pay, (p) => ts(p.date)), revCmd = serie(livrees, (o) => o.ms);
  const ville = {}; const vOf = Object.fromEntries(shops.map((s) => [s.id, s.ville]));
  ords.forEach((o) => { const v = vOf[o.shopId]; if (v) ville[v] = (ville[v] || 0) + 1; });
  const villes = Object.entries(ville).sort((a, b) => b[1] - a[1]).slice(0, 6), vmax = Math.max(1, ...villes.map((x) => x[1]));
  const group = (arr, f) => Object.entries(arr.reduce((a, x) => { const k = f(x); return k ? { ...a, [k]: (a[k] || 0) + 1 } : a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ k, v }));
  const pays = group(ords, (o) => o.paiement || "Cash"), cats = group(shops, (s) => DOM_OF[s.categorie] || "Autre");
  const cityCount = { ...Object.fromEntries(Object.entries(ville)) }; shops.forEach((s) => { cityCount[s.ville] = (cityCount[s.ville] || 0) + 1; });
  const vues = stats.reduce((a, s) => a + (Number(s.vues) || 0), 0);
  const fun = [["Vues des boutiques", vues], ["Comptes créés", total], ["Commandes", ords.length]], fmx = Math.max(1, ...fun.map((x) => x[1]));
  const soon = shops.filter((s) => isPrem(s) && s.premium_fin && s.premium_fin - Date.now() < 3 * 864e5);
  const alerts = [];
  if (shops.filter((s) => s.statut === "en_attente").length) alerts.push(["warn", shops.filter((s) => s.statut === "en_attente").length + " boutique(s) à valider", "shops"]);
  if (rep.filter((r) => r.statut === "ouvert").length) alerts.push(["warn", rep.filter((r) => r.statut === "ouvert").length + " signalement(s) ouvert(s)", "rep"]);
  if (dem.filter((d) => d.statut === "ouverte").length) alerts.push(["info", dem.filter((d) => d.statut === "ouverte").length + " demande(s) d'essai ou de code", "dem"]);
  if (soon.length) alerts.push(["warn", soon.length + " Premium se terminent bientôt", "home"]);
  if (errs.length) alerts.push(["warn", errs.length + " erreur(s) de l'application", "jr"]);
  if (users.filter((u) => u.bloque).length) alerts.push(["info", users.filter((u) => u.bloque).length + " compte(s) bloqué(s)", "users"]);
  if (!alerts.length) alerts.push(["ok", "Tout est en ordre", ""]);
  const events = shops.filter((s) => s.premium_fin).map((s) => s.premium_fin);
  const exportPdf = () => { document.body.classList.add("print-dash"); window.print(); document.body.classList.remove("print-dash"); };

  return (
    <div className="ctrl">
      <div className="dash-top glass">
        <div className="dash-logo"><b>NOVA-TOGO</b><span>Admin Dashboard • Togo</span></div>
        <form className="dash-search" onSubmit={(e) => { e.preventDefault(); onSearch(sq); }}><Ic n="search" /><input placeholder="Rechercher utilisateurs, boutiques, commandes…" value={sq} onChange={(e) => setSq(e.target.value)} /></form>
        <div className="dash-user"><span className="nb" title="Alertes">{alerts.filter((a) => a[0] !== "ok").length}</span><Ic n="bell" /><span>{(user?.displayName || "Admin")} • Super Admin</span><i className="dash-av">AD</i></div>
      </div>
      <div className="kpis">
        <Kpi ic="user" label="Visiteurs actifs" value={live.total} sub={live.membres + " connecté(s) • en direct"} live />
        <Kpi ic="user" label="Utilisateurs" value={total} sub={"+" + growth(uNew, Math.max(total - uNew, 0)) + "% ce mois"} />
        <Kpi ic="store" label="Boutiques" value={shops.length} sub={"+" + sNew + " nouvelle(s)"} />
        <Kpi ic="box" label="Commandes" value={ords.length} sub={(growth(oNow, oPrev) >= 0 ? "+" : "") + growth(oNow, oPrev) + "% vs mois dernier"} bad={growth(oNow, oPrev) < 0} />
        <Kpi ic="crown" label="Revenus Premium" value={fmt(premTotal)} sub={"Volume commandes : " + fmt(volume)} />
        <Kpi ic="list" label="Panier moyen" value={fmt(panier)} sub={livrees.length + " commande(s) livrée(s)"} />
        <Kpi ic="star" label="Taux conversion" value={conv + "%"} sub={buyers + " acheteur(s)"} />
      </div>
      <div className="dg">
        <div className="card span2"><h2>Revenus — 12 mois</h2><div className="meta">Premium encaissé (orange) et volume des commandes livrées (violet)</div><AreaChart a={revPrem} b={revCmd} /></div>
        <div className="card"><h2>Commandes par ville</h2>{villes.length === 0 && <div className="meta">Pas encore de commandes</div>}<div className="bars">{villes.map(([v, n]) => <div key={v} className="bcol"><b>{n}</b><i style={{ height: Math.max(8, (n / vmax) * 120) }} /><span>{v}</span></div>)}</div></div>
        <div className="card"><h2>Méthodes de paiement</h2><Donut items={pays} /></div>
        <div className="card"><h2>Notifications & alertes</h2>{alerts.map(([k, tx, to], i) => <button key={i} className={"alert al-" + k} onClick={() => to && onTab(to)}><Ic n={k === "ok" ? "check" : "bell"} /> {tx}</button>)}</div>
        <div className="card"><h2>Catégories</h2><Donut items={cats} /></div>
        <div className="card"><h2>Entonnoir de conversion</h2>{fun.map(([l, v], i) => <div key={l} className="fun"><div className="row between"><span>{l}</span><b>{v}{i > 0 && fun[0][1] ? " (" + Math.round((v / fun[0][1]) * 1000) / 10 + "%)" : ""}</b></div><div className="fbar"><i style={{ width: Math.max(3, (v / fmx) * 100) + "%" }} /></div></div>)}</div>
        <div className="card"><h2>Carte en direct</h2><div className="meta">Boutiques et commandes par ville</div><CityMap counts={cityCount} /></div>
        <div className="card"><h2>Heures actives</h2><div className="meta">Commandes par jour et par tranche horaire</div><Heat ords={ords} /></div>
        <div className="card"><h2>Calendrier</h2><div className="meta">{MOIS[new Date().getMonth()]} {new Date().getFullYear()}</div><Calendrier events={events} /></div>
      </div>
      <div className="dash-foot glass">
        <span>NOVA-TOGO v3.5 • Données actualisées : {new Date().toLocaleString("fr-FR")}</span>
        <span className="row">Export : <button className="chip" onClick={() => download("boutiques.csv", toCsv([["Nom", "Catégorie", "Ville", "WhatsApp", "Statut"], ...shops.map((s) => [s.nom, s.categorie, s.ville, s.whatsapp, s.statut])]))}>Boutiques CSV</button><button className="chip" onClick={() => download("commandes.csv", toCsv([["Boutique", "Produit", "Total", "Statut", "Paiement"], ...orders.map((o) => [o.shopNom, o.produit, o.total, o.statut, o.paiement])]))}>Commandes CSV</button><button className="chip" onClick={exportPdf}>PDF / Rapport complet</button></span>
        <span className={lat === -1 ? "err" : "ok"}>Serveur : {lat === null ? "test…" : lat === -1 ? "injoignable" : "en ligne • latence " + lat + " ms"}</span>
      </div>
    </div>
  );
}
