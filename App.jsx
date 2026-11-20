import { useEffect, useState } from "react";
import { Ic } from "./icons.jsx";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Admin } from "./admin.jsx";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { t } from "./data";
import { Urgence, Taxi, Orders, Chat, Inbox, Settings, ThemeBtn, initTheme } from "./extra.jsx";
import { Home, ShopPage, Login, Profile, NewShop, Favorites } from "./pages.jsx";

const mref = location.hash.match(/ref=([\w-]+)/);
if (mref) localStorage.setItem("ref", mref[1]);
initTheme();
export default function App() {
  const [user, setUser] = useState(undefined);
  const loc = useLocation();
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (u) setDoc(doc(db, "users", u.uid), { email: u.email || "", nom: u.displayName || "", creation: u.metadata.creationTime || "", dernier: serverTimestamp() }, { merge: true }).catch(() => {});
    const r = localStorage.getItem("ref");
    if (u && r && r !== u.uid && Date.now() - new Date(u.metadata.creationTime) < 864e5) {
      setDoc(doc(db, "referrals", u.uid), { parrainId: r, date: serverTimestamp() }).catch(() => {});
      localStorage.removeItem("ref");
    }
  }), []);
  const TABS = [["/", "home", "Accueil"], ["/commandes", "list", "Commandes"], ["/favoris", "heart", "Favoris"], ["/messages", "chat", "Chat"], ["/profil", "user", "Profil"]];
  const idx = TABS.findIndex(([to]) => (to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to)));
  if (user === undefined) return <div className="muted">Chargement…</div>;
  return (
    <div className="app">
      
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/boutique/:id" element={<ShopPage user={user} />} />
        <Route path="/connexion" element={<Login user={user} />} />
        <Route path="/profil" element={<Profile user={user} />} />
        <Route path="/devenir-commercant" element={<NewShop user={user} />} />
        <Route path="/favoris" element={<Favorites user={user} />} />
        <Route path="/commandes" element={<Orders user={user} />} />
        <Route path="/parametres" element={<Settings user={user} />} />
        <Route path="/taxi" element={<Taxi />} />
        <Route path="/livraison" element={<Taxi kind="Livreur" />} />
        <Route path="/chat/:shopId/:clientId" element={<Chat user={user} />} />
        <Route path="/messages" element={<Inbox user={user} />} />
        <Route path="/urgence" element={<Urgence user={user} />} />
        <Route path="/admin" element={<Admin user={user} />} />
      </Routes>
      <nav className="bar" style={{ "--i": idx }}>
        <i className="nav-bubble" style={{ opacity: idx < 0 ? 0 : 1 }} />
        {TABS.map(([to, ic, lb]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "on" : "")}><span><Ic n={ic} /></span>{t(lb)}</NavLink>
        ))}
      </nav>
    </div>
  );
}
