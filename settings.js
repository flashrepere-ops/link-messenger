import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

window.logout = async function() {
  if (confirm('Se déconnecter ?')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
}
