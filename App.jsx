import { useEffect, useState } from "react";
import { Ic } from "./icons.jsx";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Admin } from "./admin.jsx";
import { auth, db } from "./firebase";
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { t, addMetiers } from "./data";
import { Splash, usePresence, InboxPro, ChatView } from "./lot3.jsx";
import { Panier, Commandes, ChatPro, Parametres, VoirTout, Notifications, Legal, CartFab, useBadges } from "./lot2.jsx";
import { Urgence, Taxi, Orders, Chat, Inbox, Settings, ThemeBtn, initTheme } from "./extra.jsx";
import { Home, ShopPage, Login, Profile, NewShop, Favorites } from "./pages.jsx";

const mref = location.hash.match(/ref=([\w-]+)/);
if (mref) localStorage.setItem("ref", mref[1]);
initTheme();
export default function App() {
  const [user, setUser] = useState(undefined);
  const loc = useLocation();
  const [, setTick] = useState(0);
  const bd = useBadges(user);
  usePresence(user);
  const [splash, setSplash] = useState(!sessionStorage.getItem("splash_done"));
  useEffect(() => { if (!splash) return undefined; const id = setTimeout(() => { sessionStorage.setItem("splash_done", "1"); setSplash(false); }, 2400); return () => clearTimeout(id); }, [splash]);
  useEffect(() => { getDoc(doc(db, "settings", "metiers")).then((d) => { if (d.exists()) { addMetiers(d.data().liste || []); setTick((x) => x + 1); } }).catch(() => {}); }, []);
  useEffect(() => {
    let n = 0;
    const h = (m) => { if (n++ > 4) return; addDoc(collection(db, "erreurs"), { msg: String(m).slice(0, 280), url: location.hash.slice(0, 80), uid: auth.currentUser?.uid || "", date: Date.now() }).catch(() => {}); };
    const e1 = (e) => h(e.message), e2 = (e) => h(e.reason?.message || e.reason);
    window.addEventListener("error", e1); window.addEventListener("unhandledrejection", e2);
    return () => { window.removeEventListener("error", e1); window.removeEventListener("unhandledrejection", e2); };
  }, []);
  const [prof, setProf] = useState({});
  useEffect(() => {
    const h = () => auth.currentUser && getDoc(doc(db, "users", auth.currentUser.uid)).then((d) => setProf(d.exists() ? d.data() : {})).catch(() => {});
    window.addEventListener("prof", h); return () => window.removeEventListener("prof", h);
  }, []);
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (u) setDoc(doc(db, "users", u.uid), { email: u.email || "", nom: u.displayName || "", creation: u.metadata.creationTime || "", dernier: serverTimestamp() }, { merge: true }).catch(() => {});
    if (u) getDoc(doc(db, "users", u.uid)).then((d) => setProf(d.exists() ? d.data() : {})).catch(() => {});
    const r = localStorage.getItem("ref");
    if (u && r && r !== u.uid && Date.now() - new Date(u.metadata.creationTime) < 864e5) {
      setDoc(doc(db, "referrals", u.uid), { parrainId: r, date: serverTimestamp() }).catch(() => {});
      localStorage.removeItem("ref");
    }
  }), []);
  const TABS = [["/", "home", "Accueil"], ["/commandes", "list", "Commandes"], ["/favoris", "heart", "Favoris"], ["/messages", "chat", "Chat"], ["/profil", "user", "Profil"]];
  const idx = TABS.findIndex(([to]) => (to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to)));
  const vu = user ? { uid: user.uid, email: user.email, displayName: prof.nom || user.displayName, photoURL: prof.photo || user.photoURL, metadata: user.metadata } : user;
  if (splash || user === undefined) return <Splash />;
  return (
    <div className="app">
      
      {prof.bloque && <div className="card err" style={{ margin: 16 }}>Ton compte est bloqué. Contacte l'administrateur.</div>}
      <Routes>
        <Route path="/" element={<Home user={vu} />} />
        <Route path="/boutique/:id" element={<ShopPage user={vu} />} />
        <Route path="/connexion" element={<Login user={vu} />} />
        <Route path="/profil" element={<Profile user={vu} />} />
        <Route path="/devenir-commercant" element={<NewShop user={vu} />} />
        <Route path="/favoris" element={<Favorites user={vu} />} />
        <Route path="/commandes" element={<Commandes user={vu} />} />
        <Route path="/panier" element={<Panier user={vu} />} />
        <Route path="/voir-tout" element={<VoirTout />} />
        <Route path="/notifications" element={<Notifications user={vu} />} />
        <Route path="/conditions" element={<Legal kind="conditions" />} />
        <Route path="/confidentialite" element={<Legal kind="confidentialite" />} />
        <Route path="/charte" element={<Legal kind="charte" />} />
        <Route path="/parametres" element={<Parametres user={vu} />} />
        <Route path="/taxi" element={<Taxi user={vu} />} />
        <Route path="/livraison" element={<Taxi kind="Livreur" user={vu} />} />
        <Route path="/chat/:shopId/:clientId" element={<ChatView user={vu} />} />
        <Route path="/messages" element={<InboxPro user={vu} />} />
        <Route path="/urgence" element={<Urgence user={vu} />} />
        <Route path="/admin" element={<Admin user={vu} />} />
      </Routes>
      <nav className="bar" style={{ "--i": idx }}>
        <i className="nav-bubble" style={{ opacity: idx < 0 ? 0 : 1 }} />
        {TABS.map(([to, ic, lb]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "on" : "")}><span><Ic n={ic} /></span>{t(lb)}{bd[to] > 0 && <i className="nbadge">{bd[to]}</i>}</NavLink>
        ))}
      </nav>
      <CartFab />
    </div>
  );
}
