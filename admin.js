import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, getDocs, collection, query, orderBy, limit,
  addDoc, setDoc, deleteDoc, serverTimestamp, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
 
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
if (localStorage.getItem('powerSaver') === 'true') document.body.classList.add('power-saver');
const savedAccent = localStorage.getItem('accentColor');
if (savedAccent) document.documentElement.style.setProperty('--accent-color', savedAccent);
 
let me = null;
let usersCache = [];
let bannedSet = new Set();
 
// Tout texte venant de la base est échappé avant affichage
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
 
function toast(text, isError = false) {
  const el = document.getElementById('settings-msg');
  el.textContent = text;
  el.style.color = isError ? '#fda4af' : '#6ee7b7';
  setTimeout(() => { el.textContent = ''; }, 3000);
}
 
function fmtDate(ts) {
  try { return ts && ts.toDate ? ts.toDate().toLocaleString('fr-FR') : ''; } catch(e) { return ''; }
}
 
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  me = user;
 
  let isAdmin = false;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    isAdmin = snap.exists();
  } catch(e) { isAdmin = false; }
 
  document.getElementById('admin-loading').style.display = 'none';
 
  if (!isAdmin) {
    const box = document.getElementById('admin-denied');
    box.style.display = 'block';
    box.innerHTML = `
      <h3 style="margin-bottom:8px">Accès réservé</h3>
      <p style="font-size:14px;color:var(--text-muted)">Ce compte n'est pas administrateur. Pour le devenir :</p>
      <code>${esc(user.uid)}</code>
      <ol>
        <li>Copie l'identifiant ci-dessus.</li>
        <li>Ouvre la console Firebase, puis Firestore Database.</li>
        <li>Crée une collection nommée <b>admins</b>.</li>
        <li>Ajoute un document dont l'ID est ton identifiant, avec un champ <b>role</b> égal à <b>admin</b>.</li>
        <li>Reviens ici et recharge la page.</li>
      </ol>`;
    return;
  }
 
  document.getElementById('admin-content').style.display = 'block';
  loadDashboard();
});
 
window.showTab = function(name) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  if (name === 'dash') loadDashboard();
  if (name === 'users') loadUsers();
  if (name === 'news') loadAnnouncements();
  if (name === 'statuses') loadStatuses();
};
 
// ---------- Tableau de bord ----------
window.loadDashboard = async function() {
  const grid = document.getElementById('stat-grid');
  const defs = [
    ['users', 'Utilisateurs', '👥'],
    ['conversations', 'Discussions', '💬'],
    ['groups', 'Groupes', '👥'],
    ['statuses', 'Statuts', '🔵'],
    ['banned', 'Comptes suspendus', '🚫'],
    ['announcements', 'Annonces', '📢']
  ];
  const results = await Promise.all(defs.map(async ([col]) => {
    try { return (await getCountFromServer(collection(db, col))).data().count; }
    catch(e) { return '—'; }
  }));
  grid.innerHTML = defs.map((d, i) => `
    <div class="stat-tile">
      <div class="stat-num">${esc(results[i])}</div>
      <div class="stat-label">${d[2]} ${esc(d[1])}</div>
    </div>`).join('');
};
 
// ---------- Utilisateurs ----------
async function loadUsers() {
  const list = document.getElementById('users-list');
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const [usersSnap, bannedSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'banned'))
    ]);
    usersCache = usersSnap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    bannedSet = new Set(bannedSnap.docs.map(d => d.id));
    renderUsers();
  } catch(e) {
    list.innerHTML = '<p style="color:#fda4af">Impossible de charger les utilisateurs.</p>';
  }
}
 
window.renderUsers = function() {
  const list = document.getElementById('users-list');
  const q = document.getElementById('user-search').value.trim().toLowerCase();
  const rows = usersCache
    .filter(u => !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));
 
  if (!rows.length) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center">Aucun utilisateur.</p>'; return; }
 
  list.innerHTML = rows.map(u => {
    const banned = bannedSet.has(u.id);
    const isMe = u.id === me.uid;
    return `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">${esc(u.username || 'Sans nom')}${banned ? '<span class="tag-banned">Suspendu</span>' : ''}${isMe ? ' (moi)' : ''}</div>
          <div class="admin-row-sub">${esc(u.email || '')}</div>
          <div class="admin-row-sub">Inscrit : ${esc(fmtDate(u.createdAt) || '—')}</div>
        </div>
        ${isMe ? '' : `
          <button class="admin-btn ${banned ? 'ok' : 'danger'}" onclick="toggleBan('${esc(u.id)}')">${banned ? 'Réactiver' : 'Suspendre'}</button>
          <button class="admin-btn danger" onclick="deleteUserProfile('${esc(u.id)}')">🗑️</button>`}
      </div>`;
  }).join('');
};
 
window.toggleBan = async function(uid) {
  if (uid === me.uid) return;
  try {
    if (bannedSet.has(uid)) {
      await deleteDoc(doc(db, 'banned', uid));
      bannedSet.delete(uid);
      toast('✅ Compte réactivé');
    } else {
      const reason = prompt('Motif de la suspension (facultatif) :') || '';
      await setDoc(doc(db, 'banned', uid), { by: me.uid, reason, at: serverTimestamp() });
      bannedSet.add(uid);
      toast('🚫 Compte suspendu');
    }
    renderUsers();
  } catch(e) {
    toast('Action refusée (vérifie les règles Firestore).', true);
  }
};
 
window.deleteUserProfile = async function(uid) {
  const u = usersCache.find(x => x.id === uid);
  if (!confirm(`Supprimer le profil de « ${(u && u.username) || uid} » ?\n\nCela retire son profil de l'annuaire. Son compte de connexion existera encore : pour le supprimer vraiment, utilise Firebase > Authentication.`)) return;
  try {
    await deleteDoc(doc(db, 'users', uid));
    usersCache = usersCache.filter(x => x.id !== uid);
    renderUsers();
    toast('🗑️ Profil supprimé');
  } catch(e) {
    toast('Suppression refusée (vérifie les règles Firestore).', true);
  }
};
 
// ---------- Annonces ----------
window.publishAnnouncement = async function() {
  const input = document.getElementById('news-text');
  const text = input.value.trim();
  if (!text) { toast('Écris un message d\'abord.', true); return; }
  try {
    await addDoc(collection(db, 'announcements'), { text, by: me.uid, createdAt: serverTimestamp() });
    input.value = '';
    toast('📢 Annonce publiée !');
    loadAnnouncements();
  } catch(e) {
    toast('Publication refusée (vérifie les règles Firestore).', true);
  }
};
 
async function loadAnnouncements() {
  const list = document.getElementById('news-list');
  try {
    const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20)));
    if (snap.empty) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center">Aucune annonce.</p>'; return; }
    list.innerHTML = snap.docs.map(d => {
      const a = d.data();
      return `
        <div class="admin-row">
          <div class="admin-row-info">
            <div class="admin-row-title" style="white-space:normal">${esc(a.text)}</div>
            <div class="admin-row-sub">${esc(fmtDate(a.createdAt))}</div>
          </div>
          <button class="admin-btn danger" onclick="deleteAnnouncement('${esc(d.id)}')">🗑️</button>
        </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = '<p style="color:#fda4af">Impossible de charger les annonces.</p>';
  }
}
 
window.deleteAnnouncement = async function(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  try {
    await deleteDoc(doc(db, 'announcements', id));
    loadAnnouncements();
  } catch(e) {
    toast('Suppression refusée.', true);
  }
};
 
// ---------- Modération des statuts ----------
async function loadStatuses() {
  const list = document.getElementById('statuses-list');
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    if (!usersCache.length) {
      const us = await getDocs(collection(db, 'users'));
      usersCache = us.docs.map(d => Object.assign({ id: d.id }, d.data()));
    }
    const snap = await getDocs(query(collection(db, 'statuses'), orderBy('createdAt', 'desc'), limit(30)));
    if (snap.empty) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center">Aucun statut.</p>'; return; }
    list.innerHTML = snap.docs.map(d => {
      const s = d.data();
      const owner = usersCache.find(u => u.id === s.userId);
      const thumb = s.type === 'photo' && typeof s.image === 'string' && s.image.startsWith('data:image/')
        ? `<img class="admin-thumb" src="${esc(s.image)}" alt="">`
        : `<div class="admin-thumb" style="display:flex;align-items:center;justify-content:center">✏️</div>`;
      return `
        <div class="admin-row">
          ${thumb}
          <div class="admin-row-info">
            <div class="admin-row-title">${esc(owner ? owner.username : s.userId)}</div>
            <div class="admin-row-sub">${esc(s.type === 'photo' ? (s.caption || 'Photo') : s.text)}</div>
            <div class="admin-row-sub">${esc(fmtDate(s.createdAt))}</div>
          </div>
          <button class="admin-btn danger" onclick="deleteStatus('${esc(d.id)}')">🗑️</button>
        </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = '<p style="color:#fda4af">Impossible de charger les statuts.</p>';
  }
}
 
window.deleteStatus = async function(id) {
  if (!confirm('Supprimer ce statut ?')) return;
  try {
    await deleteDoc(doc(db, 'statuses', id));
    loadStatuses();
    toast('🗑️ Statut supprimé');
  } catch(e) {
    toast('Suppression refusée.', true);
  }
};
