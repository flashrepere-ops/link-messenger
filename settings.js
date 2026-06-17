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
  const sound = localStorage.getItem('sound') !== 'false';
  const notif = localStorage.getItem('notif') !== 'false';

  document.getElementById('dark-mode-toggle').checked = dark;
  document.getElementById('sound-toggle').checked = sound;
  document.getElementById('notif-toggle').checked = notif;

  if (dark) document.body.classList.add('dark-mode');

  const savedWallpaper = localStorage.getItem('wallpaper') || 'default';
  document.querySelectorAll('.wallpaper-swatch[data-wallpaper]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.wallpaper === savedWallpaper);
  });

  const greeting = currentUserData.greetingMsg || {};
  const away = currentUserData.awayMsg || {};
  document.getElementById('greeting-toggle').checked = !!greeting.enabled;
  document.getElementById('greeting-text').value = greeting.text || "Salut ! Merci de m'avoir contacté, je te réponds dès que possible 🙂";
  document.getElementById('away-toggle').checked = !!away.enabled;
  document.getElementById('away-text').value = away.text || "Je suis absent pour le moment, je reviens bientôt !";

  loadQuickRepliesList();
  loadFavorites();
  loadGroups();
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

window.logout = async function() {
  if (confirm('Se déconnecter ?')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
}
