import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, increment, onSnapshot, orderBy, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { isPrem } from "./data";
import { compress, voice } from "./extra.jsx";
import { SPLASH_D, SPLASH_M } from "./assets2.js";
import { Ic } from "./icons.jsx";

// ---------- Écran d'ouverture : ordinateur ou mobile ----------
export function Splash() {
  const desk = typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;
  return (
    <div className="splash">
      <div className={"splash-img" + (desk ? " desk" : "")} style={{ backgroundImage: "url(" + (desk ? SPLASH_D : SPLASH_M) + ")" }} />
      <div className="splash-bar"><i /></div>
    </div>
  );
}

// ---------- Visiteurs actifs : un signal par minute tant que l'app est visible ----------
export function usePresence(user) {
  useEffect(() => {
    if (user === undefined) return undefined;
    let sid = sessionStorage.getItem("sid");
    if (!sid) { sid = Math.random().toString(36).slice(2, 14); sessionStorage.setItem("sid", sid); }
    const ref = doc(db, "presence", sid);
    const beat = () => { if (document.visibilityState === "visible") setDoc(ref, { t: Date.now(), uid: user?.uid || "", page: location.hash.slice(0, 40) }).catch(() => {}); };
    beat(); const id = setInterval(beat, 60000);
    const vis = () => { if (document.visibilityState === "visible") beat(); };
    const bye = () => deleteDoc(ref).catch(() => {});
    document.addEventListener("visibilitychange", vis); window.addEventListener("pagehide", bye);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); window.removeEventListener("pagehide", bye); };
  }, [user?.uid, user === undefined]);
}

const Initials = ({ name }) => <span className="conv-av">{String(name || "?").replace(/[^A-Za-zÀ-ÿ0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}</span>;
const hhmm = (ms) => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const when = (ms) => { if (!ms) return ""; const d = new Date(ms), n = new Date(); if (d.toDateString() === n.toDateString()) return hhmm(ms); if (new Date(n - 864e5).toDateString() === d.toDateString()) return "Hier"; return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }); };

// ---------- Liste des conversations ----------
export function InboxPro({ user }) {
  const [l, setL] = useState([]); const [q, setQ] = useState(""); const [k, setK] = useState(0);
  useEffect(() => {
    if (!user) return;
    Promise.all(["clientId", "ownerId"].map((f) => getDocs(query(collection(db, "chats"), where(f, "==", user.uid))))).then((r) => {
      const m = new Map(); r.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
      setL([...m.values()].sort((a, b) => (b.last?.t || 0) - (a.last?.t || 0)));
    }).catch(() => {});
  }, [user?.uid, k]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour voir tes messages.</div></div>;
  const title = (c) => (c.ownerId === user.uid ? c.clientNom || "Client" : [c.shopNom, c.shopCat, c.shopVille].filter(Boolean).join(" • "));
  const list = l.filter((c) => !q || title(c).toLowerCase().includes(q.toLowerCase()) || (c.last?.txt || "").toLowerCase().includes(q.toLowerCase()));
  const readAll = () => { l.forEach((c) => { localStorage.setItem("lu_" + c.id, String(Date.now())); updateDoc(doc(db, "chats", c.id), { ["nonlu." + user.uid]: 0 }).catch(() => {}); }); setK(k + 1); };
  return (
    <div className="wrap">
      <div className="row between" style={{ marginBottom: 14 }}>
        <button className="rb" title="Tout marquer comme lu" onClick={readAll}>•••</button>
        <h1 className="hello" style={{ margin: 0 }}>Messages</h1>
        <Link className="rb" style={{ display: "grid", placeItems: "center", textDecoration: "none" }} to="/" title="Trouver un prestataire"><Ic n="plus" /></Link>
      </div>
      <div className="glass pill"><span><Ic n="search" /></span><input placeholder="Rechercher une conversation" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 && <div className="muted">Aucune conversation. Touche « Écrire » sur la fiche d'une boutique.</div>}
      {list.map((c) => {
        const n = c.nonlu?.[user.uid] || (c.last && c.last.from !== user.uid && c.last.t > Number(localStorage.getItem("lu_" + c.id) || 0) ? 1 : 0);
        return (
          <Link key={c.id} className={"glass conv" + (n ? " unread" : "")} to={"/chat/" + c.shopId + "/" + c.clientId}>
            <Initials name={c.ownerId === user.uid ? c.clientNom : c.shopNom} />
            <div className="conv-body"><div className="conv-top"><b>{title(c)}</b>{c.prem && <span className="badge mini">PREMIUM</span>}</div><div className="meta">{c.last?.txt || "Nouvelle conversation"}</div></div>
            <div className="conv-side"><span className="meta">{when(c.last?.t)}</span>{n > 0 && <i className="conv-n">{n}</i>}</div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------- Conversation ----------
const QUICK = ["Bonjour, oui c'est disponible.", "Merci, je reviens vers vous rapidement.", "Quelle est votre adresse ?", "Votre commande est prête."];
export function ChatView({ user }) {
  const { shopId, clientId } = useParams(); const nav = useNavigate();
  const [msgs, setMsgs] = useState([]); const [t, setT] = useState(""); const [err, setErr] = useState(""); const [chat, setChat] = useState({}); const [sh, setSh] = useState(null);
  const last = useRef(0); const bottom = useRef(null); const cid = shopId + "_" + clientId;
  useEffect(() => {
    if (!user) return undefined; let un, un2;
    getDoc(doc(db, "shops", shopId)).then(async (s) => {
      const x = s.data(); setSh(x);
      await setDoc(doc(db, "chats", cid), { clientId, ownerId: x.ownerId, shopNom: x.nom, shopCat: x.categorie || "", shopVille: x.ville || "", prem: isPrem(x), shopId, ...(user.uid === clientId ? { clientNom: user.displayName || user.email } : {}) }, { merge: true });
      un = onSnapshot(query(collection(db, "chats", cid, "msgs"), orderBy("date")), (q) => {
        setMsgs(q.docs.map((d) => ({ id: d.id, ...d.data() }))); localStorage.setItem("lu_" + cid, String(Date.now()));
        updateDoc(doc(db, "chats", cid), { ["vu." + user.uid]: Date.now(), ["nonlu." + user.uid]: 0 }).catch(() => {});
      });
      un2 = onSnapshot(doc(db, "chats", cid), (d) => setChat(d.data() || {}));
    }).catch(() => {});
    return () => { if (un) un(); if (un2) un2(); };
  }, [user?.uid, cid]);
  useEffect(() => { if (bottom.current) bottom.current.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);
  if (!user) return <div className="wrap"><div className="card muted">Connecte-toi pour écrire.</div></div>;
  const isOwner = !!sh && sh.ownerId === user.uid;
  const other = isOwner ? clientId : sh?.ownerId;
  const online = Date.now() - (chat.vu?.[other] || 0) < 60000;
  const name = isOwner ? chat.clientNom || "Client" : sh?.nom || "…";
  const send = async (e, photo) => {
    if (e) e.preventDefault();
    const txt = t.trim(); if (!txt && !photo) return;
    if (Date.now() - last.current < 1200) return setErr("Doucement : attends une seconde entre deux messages.");
    last.current = Date.now(); setErr(""); setT("");
    try {
      await addDoc(collection(db, "chats", cid, "msgs"), { from: user.uid, ...(txt ? { text: txt } : {}), ...(photo ? { photo } : {}), date: serverTimestamp() });
      updateDoc(doc(db, "chats", cid), { last: { from: user.uid, t: Date.now(), txt: (txt || "Photo").slice(0, 60) }, ...(other ? { ["nonlu." + other]: increment(1) } : {}) }).catch(() => {});
    } catch (x) { setT(txt); setErr(x.code === "permission-denied" ? "Message refusé : règles Firestore pas à jour, ou compte bloqué." : "Message non envoyé (" + (x.code || "erreur") + "). Réessaie."); }
  };
  const vuAt = chat.vu?.[other] || 0;
  return (
    <div className="wrap chat">
      <div className="glass chat-head">
        <button className="rb" onClick={() => nav(-1)} aria-label="Retour"><Ic n="back" /></button>
        <Initials name={name} />
        <div className="chat-who"><b>{name}</b><span className="meta">{isOwner ? "Client" : [sh?.categorie, sh?.ville].filter(Boolean).join(" ")}</span><span className="meta">{online ? <><i className="dot" /> En ligne</> : "Hors ligne"}{sh && isPrem(sh) && !isOwner ? " • Premium" : ""}</span></div>
        {!isOwner && sh && <><a className="btn-g call" aria-label="Appeler" href={"tel:" + sh.whatsapp}><Ic n="phone" /><span className="lbl"> Appeler</span></a><a className="btn-g call wa" aria-label="WhatsApp" target="_blank" rel="noreferrer" href={"https://wa.me/" + String(sh.whatsapp || "").replace(/\D/g, "")}><Ic n="whatsapp" /><span className="lbl"> WhatsApp</span></a></>}
      </div>
      <div className="msgs">
        {msgs.map((m) => {
          const mine = m.from === user.uid, ms = m.date?.toMillis ? m.date.toMillis() : 0;
          return (
            <div key={m.id} className={"bub-row" + (mine ? " me" : "")}>
              <div className={"bub" + (mine ? " me" : "")}>
                {m.photo && <img src={m.photo} alt="" style={{ width: "100%", borderRadius: 14, marginBottom: 6 }} />}{m.text}
                <span className="bub-t">{ms ? hhmm(ms) : "…"}{mine && <b className={vuAt >= ms && ms ? "seen" : ""}> {vuAt >= ms && ms ? "✓✓" : "✓"}</b>}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {isOwner && <div className="chips">{QUICK.map((q) => <button key={q} type="button" className="chip" onClick={() => setT(q)}>{q}</button>)}</div>}
      {err && <div className="err" style={{ marginBottom: 6 }}>{err}</div>}
      <form className="composer" onSubmit={send}>
        <label className="rb big" style={{ cursor: "pointer" }}><Ic n="plus" /><input type="file" accept="image/*" hidden onChange={async (e) => { if (e.target.files[0]) send(null, await compress(e.target.files[0])); }} /></label>
        <div className="glass pill grow"><input placeholder="Écrire un message" value={t} onChange={(e) => setT(e.target.value)} /><button type="button" className="mic sm" onClick={() => voice(setT)} aria-label="Dicter"><Ic n="mic" /></button></div>
        <button className="rb big send" aria-label="Envoyer"><Ic n="send" /></button>
      </form>
    </div>
  );
}
