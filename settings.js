import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

function showMsg(text, isError = false) {
  const msg = document.getElementById('settings-msg');
  msg.textContent = text;
  msg.style.color = isError ? '#f15c6d' : '#00a884';
  setTimeout(() => msg.textContent = '', 3000);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) {
    currentUserData = snap.data();
    loadProfile();
  }
  loadSettings();
});

function loadProfile() {
  const name = currentUserData.username || '?';
  const status = currentUserData.status || "Hey, j'utilise Link Messenger !";
  
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-status').textContent = status;
  document.getElementById('new-username').value = name;
  document.getElementById('new-status').value = status;

  const avatar = document.getElementById('profile-avatar');
  if (currentUserData.avatar) {
    avatar.style.backgroundImage = `url(${currentUserData.avatar})`;
    avatar.style.backgroundSize = 'cover';
    avatar.textContent = '';
  } else {
    avatar.textContent = name.charAt(0).toUpperCase();
    avatar.style.background = getColor(name);
  }
}

function loadSettings() {
  const dark = localStorage.getItem('darkMode') === 'true';
  if (dark) document.body.classList.add('dark-mode');
  const powerSaver = localStorage.getItem('powerSaver') === 'true';
  if (powerSaver) document.body.classList.add('power-saver');
  const accent = localStorage.getItem('accentColor') || '#00a884';
  document.documentElement.style.setProperty('--accent-color', accent);
  const fontSize = localStorage.getItem('fontSize') || '14';
  document.documentElement.style.setProperty('--msg-font-size', fontSize + 'px');
}

window.saveProfile = async function() {
  const username = document.getElementById('new-username').value.trim();
  const status = document.getElementById('new-status').value.trim();
  const avatarFile = document.getElementById('avatar-file').files[0];

  if (!username) {
    showMsg('Le nom ne peut pas être vide !', true);
    return;
  }

  try {
    let avatarUrl = currentUserData.avatar || '';

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        avatarUrl = e.target.result;
        await updateDoc(doc(db, 'users', currentUser.uid), {
          username, status, avatar: avatarUrl
        });
        showMsg('✅ Profil mis à jour !');
        document.getElementById('profile-name').textContent = username;
        document.getElementById('profile-status').textContent = status;
        const avatar = document.getElementById('profile-avatar');
        avatar.style.backgroundImage = `url(${avatarUrl})`;
        avatar.style.backgroundSize = 'cover';
        avatar.textContent = '';
      };
      reader.readAsDataURL(avatarFile);
    } else {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username, status
      });
      showMsg('✅ Profil mis à jour !');
      document.getElementById('profile-name').textContent = username;
      document.getElementById('profile-status').textContent = status;
    }
  } catch(e) {
    showMsg('Erreur : ' + e.message, true);
  }
}

window.changePassword = async function() {
  const newPass = document.getElementById('new-password').value;
  if (!newPass || newPass.length < 6) {
    showMsg('Le mot de passe doit avoir 6 caractères minimum !', true);
    return;
  }
  try {
    await updatePassword(currentUser, newPass);
    showMsg('✅ Mot de passe changé !');
    document.getElementById('new-password').value = '';
  } catch(e) {
    showMsg('Erreur : reconnecte-toi et réessaie !', true);
  }
}

window.deleteAccount = async function() {
  if (!confirm('Supprimer définitivement ton compte ? Cette action est irréversible !')) return;
  try {
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await deleteUser(currentUser);
    window.location.href = 'index.html';
  } catch(e) {
    showMsg('Erreur : reconnecte-toi et réessaie !', true);
  }
}

window.toggleTheme = function() {
  const dark = document.getElementById('dark-mode-toggle').checked;
  localStorage.setItem('darkMode', dark);
  if (dark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

window.toggleSound = function() {
  const sound = document.getElementById('sound-toggle').checked;
  localStorage.setItem('sound', sound);
  showMsg(sound ? '🔊 Sons activés' : '🔇 Sons désactivés');
}

window.selectWallpaper = function(name) {
  localStorage.setItem('wallpaper', name);
  localStorage.removeItem('wallpaperCustom');
  document.querySelectorAll('.wallpaper-swatch[data-wallpaper]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.wallpaper === name);
  });
  showMsg('🖼️ Fond d\'écran mis à jour !');
}

window.uploadWallpaper = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    localStorage.setItem('wallpaper', 'custom');
    localStorage.setItem('wallpaperCustom', e.target.result);
    document.querySelectorAll('.wallpaper-swatch[data-wallpaper]').forEach(btn => {
      btn.classList.remove('selected');
    });
    showMsg('🖼️ Fond d\'écran personnalisé appliqué !');
  };
  reader.readAsDataURL(file);
}

window.toggleNotif = function() {
  const notif = document.getElementById('notif-toggle').checked;
  localStorage.setItem('notif', notif);
  showMsg(notif ? '🔔 Alertes activées' : '🔕 Alertes désactivées');
}

// ============ MESSAGE D'ACCUEIL / ABSENCE ============

window.saveGreetingMsg = async function() {
  const enabled = document.getElementById('greeting-toggle').checked;
  const text = document.getElementById('greeting-text').value.trim();
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      greetingMsg: { enabled, text }
    });
    currentUserData.greetingMsg = { enabled, text };
    showMsg('✅ Message d\'accueil enregistré !');
  } catch(e) {
    showMsg('Erreur : ' + e.message, true);
  }
}

window.saveAwayMsg = async function() {
  const enabled = document.getElementById('away-toggle').checked;
  const text = document.getElementById('away-text').value.trim();
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      awayMsg: { enabled, text }
    });
    currentUserData.awayMsg = { enabled, text };
    showMsg(enabled ? '🌙 Mode absent activé !' : '✅ Mode absent désactivé !');
  } catch(e) {
    showMsg('Erreur : ' + e.message, true);
  }
}

// ============ RÉPONSES RAPIDES (gestion centralisée) ============

function getQuickReplies() {
  try {
    return JSON.parse(localStorage.getItem('quickReplies')) || [
      "Merci, à bientôt !",
      "Je te recontacte dès que possible.",
      "Disponible aujourd'hui ?",
      "Bien reçu 👍",
      "Pouvons-nous fixer un rendez-vous ?",
      "Désolé, je suis occupé là."
    ];
  } catch(e) {
    return [];
  }
}

function saveQuickReplies(list) {
  localStorage.setItem('quickReplies', JSON.stringify(list));
}

function loadQuickRepliesList() {
  const list = getQuickReplies();
  const container = document.getElementById('quick-replies-list');
  if (!container) return;
  container.innerHTML = list.map((r, i) => `
    <div class="qr-row">
      <span>${r}</span>
      <button onclick="removeQuickReply(${i})">🗑️</button>
    </div>
  `).join('');
}

window.addQuickReply = function() {
  const input = document.getElementById('new-quick-reply');
  const text = input.value.trim();
  if (!text) return;
  const list = getQuickReplies();
  list.push(text);
  saveQuickReplies(list);
  input.value = '';
  loadQuickRepliesList();
  showMsg('⚡ Réponse rapide ajoutée !');
}

window.removeQuickReply = function(index) {
  const list = getQuickReplies();
  list.splice(index, 1);
  saveQuickReplies(list);
  loadQuickRepliesList();
}

// ============ LISTES : FAVORIS ============

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favoriteContacts')) || [];
  } catch(e) { return []; }
}

async function loadFavorites() {
  const favIds = getFavorites();
  const container = document.getElementById('favorites-list');
  if (!container) return;

  if (!favIds.length) {
    container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucun favori. Ajoute-en depuis une conversation.</p>`;
    return;
  }

  let html = '';
  for (const uid of favIds) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) continue;
      const u = snap.data();
      html += `
        <div class="qr-row">
          <span>⭐ ${u.username || 'Utilisateur'}</span>
          <button onclick="removeFavorite('${uid}')">🗑️</button>
        </div>
      `;
    } catch(e) { console.error(e); }
  }
  container.innerHTML = html || `<p style="font-size:13px;color:#8696a0">Aucun favori.</p>`;
}

window.removeFavorite = function(uid) {
  const list = getFavorites().filter(id => id !== uid);
  localStorage.setItem('favoriteContacts', JSON.stringify(list));
  loadFavorites();
}

// ============ LISTES : GROUPES ============

window.openGroupCreator = async function() {
  const modalBody = document.getElementById('group-creator-body');
  modalBody.innerHTML = `<p style="font-size:13px;color:#8696a0">Chargement des utilisateurs...</p>`;
  document.getElementById('group-creator-overlay').style.display = 'flex';

  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = [];
    snap.forEach(d => {
      const u = d.data();
      if (u.uid !== currentUser.uid) users.push(u);
    });

    if (!users.length) {
      modalBody.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucun autre utilisateur disponible.</p>`;
      return;
    }

    modalBody.innerHTML = `
      <input type="text" id="group-name-input" placeholder="Nom du groupe" />
      <div class="group-member-list">
        ${users.map(u => `
          <label class="group-member-row">
            <input type="checkbox" value="${u.uid}" data-username="${(u.username || '').replace(/"/g, '&quot;')}" />
            <span>${u.username || 'Utilisateur'}</span>
          </label>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="modal-btn-secondary" onclick="closeGroupCreator()">Annuler</button>
        <button class="modal-btn-primary" onclick="createGroup()">Créer</button>
      </div>
    `;
  } catch(e) {
    console.error(e);
    modalBody.innerHTML = `<p style="font-size:13px;color:#f15c6d">Erreur de chargement.</p>`;
  }
}

window.closeGroupCreator = function() {
  document.getElementById('group-creator-overlay').style.display = 'none';
}

window.createGroup = async function() {
  const name = document.getElementById('group-name-input').value.trim();
  const checked = Array.from(document.querySelectorAll('.group-member-row input:checked'));

  if (!name) { alert('Le nom du groupe est requis !'); return; }
  if (checked.length < 2) { alert('Choisis au moins 2 membres !'); return; }

  const memberIds = checked.map(c => c.value);
  const memberNames = checked.map(c => c.dataset.username);

  try {
    const groupRef = await addDoc(collection(db, 'groups'), {
      name,
      members: [currentUser.uid, ...memberIds],
      memberNames: [currentUserData.username || 'Moi', ...memberNames],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });
    closeGroupCreator();
    showMsg('👥 Groupe créé !');
    loadGroups();
  } catch(e) {
    console.error(e);
    showMsg('Erreur lors de la création du groupe.', true);
  }
}

async function loadGroups() {
  const container = document.getElementById('groups-list');
  if (!container) return;

  try {
    const snap = await getDocs(query(collection(db, 'groups'), where('members', 'array-contains', currentUser.uid)));
    if (snap.empty) {
      container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucun groupe pour le moment.</p>`;
      return;
    }
    let html = '';
    snap.forEach(d => {
      const g = d.data();
      html += `
        <div class="qr-row" style="cursor:pointer" onclick="openGroup('${d.id}', '${(g.name || '').replace(/'/g, "\\'")}')">
          <span>👥 ${g.name} (${g.members.length})</span>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch(e) {
    console.error(e);
    container.innerHTML = `<p style="font-size:13px;color:#f15c6d">Erreur de chargement.</p>`;
  }
}

window.openGroup = function(groupId, groupName) {
  window.location.href = `group.html?id=${groupId}&name=${encodeURIComponent(groupName)}`;
}

// ============ CONFIDENTIALITÉ : BLOCAGE ============

function getBlockedUsers() {
  try {
    return JSON.parse(localStorage.getItem('blockedUsers')) || [];
  } catch(e) { return []; }
}

async function loadBlockedUsers() {
  const container = document.getElementById('blocked-list');
  if (!container) return;
  const ids = getBlockedUsers();

  if (!ids.length) {
    container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucun utilisateur bloqué.</p>`;
    return;
  }

  let html = '';
  for (const uid of ids) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) continue;
      const u = snap.data();
      html += `
        <div class="qr-row">
          <span>🚫 ${u.username || 'Utilisateur'}</span>
          <button onclick="unblockUser('${uid}')">Débloquer</button>
        </div>
      `;
    } catch(e) { console.error(e); }
  }
  container.innerHTML = html || `<p style="font-size:13px;color:#8696a0">Aucun utilisateur bloqué.</p>`;
}

window.unblockUser = function(uid) {
  const list = getBlockedUsers().filter(id => id !== uid);
  localStorage.setItem('blockedUsers', JSON.stringify(list));
  loadBlockedUsers();
  showMsg('✅ Utilisateur débloqué !');
}

window.toggleReadReceipts = function() {
  const enabled = document.getElementById('read-receipts-toggle').checked;
  localStorage.setItem('readReceipts', enabled);
  showMsg(enabled ? '✓✓ Accusés de lecture activés' : '✓✓ Accusés de lecture désactivés');
}

// ============ DOSSIERS D'ÉCHANGES : ÉPINGLÉS / ARCHIVÉS ============

function getPinned() {
  try { return JSON.parse(localStorage.getItem('pinnedConvs')) || []; } catch(e) { return []; }
}

function getArchived() {
  try { return JSON.parse(localStorage.getItem('archivedConvs')) || []; } catch(e) { return []; }
}

async function loadPinnedList() {
  const container = document.getElementById('pinned-list');
  if (!container) return;
  const ids = getPinned();
  if (!ids.length) {
    container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucune discussion épinglée.</p>`;
    return;
  }
  let html = '';
  for (const uid of ids) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) continue;
      html += `<div class="qr-row"><span>📌 ${snap.data().username || 'Utilisateur'}</span><button onclick="unpinConv('${uid}')">Retirer</button></div>`;
    } catch(e) { console.error(e); }
  }
  container.innerHTML = html || `<p style="font-size:13px;color:#8696a0">Aucune discussion épinglée.</p>`;
}

async function loadArchivedList() {
  const container = document.getElementById('archived-list');
  if (!container) return;
  const ids = getArchived();
  if (!ids.length) {
    container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucune discussion archivée.</p>`;
    return;
  }
  let html = '';
  for (const uid of ids) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) continue;
      html += `<div class="qr-row"><span>🗄️ ${snap.data().username || 'Utilisateur'}</span><button onclick="unarchiveConv('${uid}')">Restaurer</button></div>`;
    } catch(e) { console.error(e); }
  }
  container.innerHTML = html || `<p style="font-size:13px;color:#8696a0">Aucune discussion archivée.</p>`;
}

window.unpinConv = function(uid) {
  const list = getPinned().filter(id => id !== uid);
  localStorage.setItem('pinnedConvs', JSON.stringify(list));
  loadPinnedList();
}

window.unarchiveConv = function(uid) {
  const list = getArchived().filter(id => id !== uid);
  localStorage.setItem('archivedConvs', JSON.stringify(list));
  loadArchivedList();
  showMsg('✅ Discussion restaurée !');
}

// ============ NAVIGATION ENTRE VUES ============

window.openView = function(viewId) {
  document.getElementById('view-main').style.display = 'none';
  document.querySelectorAll('.settings-subview').forEach(v => v.style.display = 'none');
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = 'block';
    if (viewId === 'view-confidentialite') {
      loadBlockedUsers();
      document.getElementById('last-seen-select').value = currentUserData?.lastSeenPrivacy || 'everyone';
      document.getElementById('profile-visibility-select').value = currentUserData?.profileVisibility || 'everyone';
      document.getElementById('group-add-select').value = currentUserData?.groupAddPrivacy || 'everyone';
      document.getElementById('auto-delete-select').value = localStorage.getItem('autoDeleteTimer') || 'off';
      document.getElementById('read-receipts-toggle').checked = localStorage.getItem('readReceipts') !== 'false';
    }
    if (viewId === 'view-apparence') {
      document.getElementById('dark-mode-toggle').checked = localStorage.getItem('darkMode') === 'true';
      document.getElementById('theme-mode-select').value = localStorage.getItem('themeMode') || 'light';
      const accent = localStorage.getItem('accentColor') || '#00a884';
      document.querySelectorAll('.accent-swatch').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.accent === accent);
      });
      const fontSize = localStorage.getItem('fontSize') || '14';
      document.getElementById('font-size-slider').value = fontSize;
      document.getElementById('font-size-value').textContent = fontSize + 'px';
      document.getElementById('enter-sends-toggle').checked = localStorage.getItem('enterSends') !== 'false';
      document.getElementById('giant-emoji-toggle').checked = localStorage.getItem('giantEmoji') !== 'false';
      const savedWallpaper = localStorage.getItem('wallpaper') || 'default';
      document.querySelectorAll('.wallpaper-swatch[data-wallpaper]').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.wallpaper === savedWallpaper);
      });
    }
    if (viewId === 'view-notifications') {
      document.getElementById('sound-toggle').checked = localStorage.getItem('sound') !== 'false';
      document.getElementById('notif-toggle').checked = localStorage.getItem('notif') !== 'false';
    }
    if (viewId === 'view-donnees') {
      document.getElementById('power-saver-toggle').checked = localStorage.getItem('powerSaver') === 'true';
      estimateStorageUsage();
    }
    if (viewId === 'view-fonctionnalites') {
      loadFavorites();
      loadGroups();
      loadChatFolders();
      loadPinnedList();
      loadArchivedList();
      loadQuickRepliesList();
      const greeting = currentUserData?.greetingMsg || {};
      const away = currentUserData?.awayMsg || {};
      document.getElementById('greeting-toggle').checked = !!greeting.enabled;
      document.getElementById('greeting-text').value = greeting.text || '';
      document.getElementById('away-toggle').checked = !!away.enabled;
      document.getElementById('away-text').value = away.text || '';
    }
  }
}

window.closeView = function() {
  document.querySelectorAll('.settings-subview').forEach(v => v.style.display = 'none');
  document.getElementById('view-main').style.display = 'block';
}

// ============ STOCKAGE & AVANCÉ ============

function estimateStorageUsage() {
  const el = document.getElementById('storage-info');
  if (!el) return;
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    const kb = Math.round(total / 1024);
    el.textContent = `LocalStorage utilisé : environ ${kb} Ko`;
  } catch(e) {
    el.textContent = 'Impossible de calculer le stockage.';
  }
}

window.clearAppCache = function() {
  if (!confirm('Vider le cache ? Cela ne supprimera pas tes messages ni ton compte.')) return;
  const keepsake = ['darkMode', 'themeMode', 'accentColor', 'fontSize', 'wallpaper', 'wallpaperCustom', 'sound', 'notif', 'powerSaver', 'enterSends', 'giantEmoji', 'readReceipts', 'autoDeleteTimer', 'blockedUsers', 'favoriteContacts', 'pinnedConvs', 'archivedConvs', 'quickReplies', 'chatFolders'];
  const saved = {};
  keepsake.forEach(k => { if (localStorage.getItem(k)) saved[k] = localStorage.getItem(k); });
  localStorage.clear();
  Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
  showMsg('🗑️ Cache vidé !');
  estimateStorageUsage();
}

window.exportLogs = function() {
  const logs = {
    timestamp: new Date().toISOString(),
    settings: {},
    userAgent: navigator.userAgent
  };
  ['darkMode','themeMode','accentColor','fontSize','wallpaper','sound','notif','powerSaver','enterSends','giantEmoji','readReceipts','autoDeleteTimer'].forEach(k => {
    logs.settings[k] = localStorage.getItem(k);
  });
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'link-messenger-logs.json';
  a.click();
  showMsg('📤 Logs exportés !');
}

window.resetAllSettings = function() {
  if (!confirm('Réinitialiser TOUS les paramètres ? Cette action est irréversible.')) return;
  const keep = ['blockedUsers', 'favoriteContacts', 'pinnedConvs', 'archivedConvs', 'quickReplies', 'chatFolders'];
  const saved = {};
  keep.forEach(k => { if (localStorage.getItem(k)) saved[k] = localStorage.getItem(k); });
  localStorage.clear();
  Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
  showMsg('✅ Paramètres réinitialisés !');
  setTimeout(() => window.location.reload(), 1000);
}

// ============ CONFIDENTIALITÉ AVANCÉE ============

window.saveLastSeenSetting = async function() {
  const value = document.getElementById('last-seen-select').value;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { lastSeenPrivacy: value });
    currentUserData.lastSeenPrivacy = value;
    showMsg('✅ Préférence enregistrée !');
  } catch(e) { showMsg('Erreur : ' + e.message, true); }
}

window.saveProfileVisibility = async function() {
  const value = document.getElementById('profile-visibility-select').value;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { profileVisibility: value });
    currentUserData.profileVisibility = value;
    showMsg('✅ Préférence enregistrée !');
  } catch(e) { showMsg('Erreur : ' + e.message, true); }
}

window.saveGroupAddSetting = async function() {
  const value = document.getElementById('group-add-select').value;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { groupAddPrivacy: value });
    currentUserData.groupAddPrivacy = value;
    showMsg('✅ Préférence enregistrée !');
  } catch(e) { showMsg('Erreur : ' + e.message, true); }
}

window.saveAutoDeleteSetting = function() {
  const value = document.getElementById('auto-delete-select').value;
  localStorage.setItem('autoDeleteTimer', value);
  showMsg(value === 'off' ? '✅ Auto-suppression désactivée' : '⏱️ Auto-suppression activée');
}

window.sendVerificationEmail = async function() {
  try {
    const { sendEmailVerification } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    await sendEmailVerification(currentUser);
    showMsg('📧 Email de vérification envoyé !');
  } catch(e) {
    showMsg('Erreur : ' + e.message, true);
  }
}

// ============ THÈME, ACCENT, TAILLE DE TEXTE ============

window.saveThemeMode = function() {
  const mode = document.getElementById('theme-mode-select').value;
  localStorage.setItem('themeMode', mode);

  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    localStorage.setItem('darkMode', prefersDark);
    document.body.classList.toggle('dark-mode', prefersDark);
  } else if (mode === 'dark') {
    localStorage.setItem('darkMode', 'true');
    document.body.classList.add('dark-mode');
  } else {
    localStorage.setItem('darkMode', 'false');
    document.body.classList.remove('dark-mode');
  }
  document.getElementById('dark-mode-toggle').checked = document.body.classList.contains('dark-mode');
  showMsg('🎨 Thème mis à jour !');
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent-color', color);
}

window.selectAccentColor = function(color) {
  localStorage.setItem('accentColor', color);
  applyAccentColor(color);
  document.querySelectorAll('.accent-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.accent === color);
  });
  showMsg('🎨 Couleur d\'accent mise à jour !');
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--msg-font-size', size + 'px');
}

window.liveUpdateFontSize = function(size) {
  document.getElementById('font-size-value').textContent = size + 'px';
  applyFontSize(size);
}

window.saveFontSize = function(size) {
  localStorage.setItem('fontSize', size);
  showMsg('🔤 Taille du texte enregistrée !');
}

window.toggleEnterSends = function() {
  const enabled = document.getElementById('enter-sends-toggle').checked;
  localStorage.setItem('enterSends', enabled);
  showMsg(enabled ? '⏎ Entrée envoie le message' : '⏎ Entrée crée une nouvelle ligne');
}

window.toggleGiantEmoji = function() {
  const enabled = document.getElementById('giant-emoji-toggle').checked;
  localStorage.setItem('giantEmoji', enabled);
  showMsg(enabled ? '😀 Émojis géants activés' : '😀 Émojis géants désactivés');
}

// ============ DOSSIERS DE DISCUSSION ============

function getChatFolders() {
  try { return JSON.parse(localStorage.getItem('chatFolders')) || ['Personnel', 'Travail']; } catch(e) { return []; }
}

function loadChatFolders() {
  const container = document.getElementById('chat-folders-list');
  if (!container) return;
  const folders = getChatFolders();
  if (!folders.length) {
    container.innerHTML = `<p style="font-size:13px;color:#8696a0">Aucun dossier créé.</p>`;
    return;
  }
  container.innerHTML = folders.map((f, i) => `
    <div class="folder-row">
      <span>📁 ${f}</span>
      <button onclick="removeChatFolder(${i})" style="background:none;border:none;cursor:pointer">🗑️</button>
    </div>
  `).join('');
}

window.createChatFolder = function() {
  const input = document.getElementById('new-folder-name');
  const name = input.value.trim();
  if (!name) return;
  const folders = getChatFolders();
  folders.push(name);
  localStorage.setItem('chatFolders', JSON.stringify(folders));
  input.value = '';
  loadChatFolders();
  showMsg('📁 Dossier créé !');
}

window.removeChatFolder = function(index) {
  const folders = getChatFolders();
  folders.splice(index, 1);
  localStorage.setItem('chatFolders', JSON.stringify(folders));
  loadChatFolders();
}

// ============ ÉCONOMIE D'ÉNERGIE ============

window.togglePowerSaver = function() {
  const enabled = document.getElementById('power-saver-toggle').checked;
  localStorage.setItem('powerSaver', enabled);
  document.body.classList.toggle('power-saver', enabled);
  showMsg(enabled ? '🔋 Économie d\'énergie activée' : '✅ Économie d\'énergie désactivée');
}

window.logout = async function() {
  if (confirm('Se déconnecter ?')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
}
