import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

let currentUser = null;

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

function getInitials(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'maintenant';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (days < 7) return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][date.getDay()];
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function createAvatar(user) {
  if (user.avatar) {
    return `<div class="avatar" style="background-image:url('${user.avatar}');background-size:cover;background-position:center"></div>`;
  }
  const color = getColor(user.username);
  const initials = getInitials(user.username);
  return `<div class="avatar" style="background:${color}">${initials}</div>`;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) {
      if (userData.avatar) {
        headerAvatar.style.backgroundImage = `url('${userData.avatar}')`;
        headerAvatar.style.backgroundSize = 'cover';
        headerAvatar.style.backgroundPosition = 'center';
        headerAvatar.textContent = '';
      } else {
        headerAvatar.textContent = getInitials(userData.username);
        headerAvatar.style.background = getColor(userData.username);
      }
    }
  }

  loadConversations();
});

window.openSettings = function() {
  window.location.href = 'settings.html';
}

window.showSearch = function() {
  const box = document.getElementById('search-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  if (box.style.display === 'block') {
    document.getElementById('search-input').focus();
  }
}

window.switchTab = function(btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterConversations(tab);
}

window.goToTab = function(btn, tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (tab === 'home') {
    // déjà sur home, rien à faire
  } else if (tab === 'calls') {
    window.location.href = 'calls.html';
  } else if (tab === 'status') {
    window.location.href = 'status.html';
  } else if (tab === 'settings') {
    window.location.href = 'settings.html';
  }
}

let allConvs = [];

function filterConversations(tab) {
  let filtered = allConvs;

  if (tab === 'unread') {
    filtered = allConvs.filter(c => c.unread > 0);
  } else if (tab === 'favorites') {
    filtered = allConvs.filter(c => c.favorite);
  }

  if (filtered.length === 0) {
    const list = document.getElementById('conversations-list');
    let msg = 'Aucune conversation';
    if (tab === 'unread') msg = 'Aucun message non lu';
    if (tab === 'favorites') msg = 'Aucun favori';
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:#8696a0">
        <div style="font-size:48px;margin-bottom:16px">💬</div>
        <p style="font-size:16px">${msg}</p>
      </div>
    `;
    return;
  }

  renderConversations(filtered);
}

function renderConversations(convs) {
  const list = document.getElementById('conversations-list');
  list.innerHTML = '';
  for (const c of convs) {
    const item = document.createElement('div');
    item.className = 'conv-item';
    const unreadCount = c.unread || 0;
    item.innerHTML = `
      ${createAvatar(c.otherUser)}
      <div class="conv-info">
        <div class="conv-top">
          <span class="conv-name">${c.otherUser.username}</span>
          <span class="conv-time">${timeAgo(c.updatedAt)}</span>
        </div>
        <div class="conv-bottom">
          <span class="conv-last-msg">${c.lastMessage || 'Démarrer la discussion'}</span>
          ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}
        </div>
      </div>
    `;
    item.onclick = () => window.startChat(c.otherUser.uid, c.otherUser.username);
    list.appendChild(item);
  }
}

window.searchUser = async function() {
  const input = document.getElementById('search-input').value.trim();
  const resultDiv = document.getElementById('search-result');
  resultDiv.innerHTML = '<p style="color:#8696a0;padding:8px">Recherche...</p>';

  if (!input) {
    resultDiv.innerHTML = '<p style="color:#f15c6d;padding:8px">Entre un email ou username !</p>';
    return;
  }

  try {
    let snap = await getDocs(query(collection(db, 'users'), where('email', '==', input)));
    if (snap.empty) {
      snap = await getDocs(query(collection(db, 'users'), where('username', '==', input)));
    }
    if (snap.empty) {
      resultDiv.innerHTML = '<p style="color:#f15c6d;padding:8px">Utilisateur introuvable !</p>';
      return;
    }
    const userData = snap.docs[0].data();
    if (userData.uid === currentUser.uid) {
      resultDiv.innerHTML = '<p style="color:#f15c6d;padding:8px">C\'est toi-même !</p>';
      return;
    }
    resultDiv.innerHTML = `
      <div class="user-result">
        <div style="display:flex;align-items:center;gap:10px">
          ${createAvatar(userData)}
          <div>
            <div style="color:#e9edef;font-weight:600">${userData.username}</div>
            <div style="color:#8696a0;font-size:12px">${userData.email}</div>
          </div>
        </div>
        <button onclick="startChat('${userData.uid}', '${userData.username}')">
          Démarrer
        </button>
      </div>
    `;
  } catch(e) {
    resultDiv.innerHTML = '<p style="color:#f15c6d;padding:8px">Erreur !</p>';
  }
}

window.startChat = function(otherUid, otherUsername) {
  const ids = [currentUser.uid, otherUid].sort();
  const convId = ids.join('_');
  window.location.href = `chat.html?conv=${convId}&user=${otherUid}&name=${otherUsername}`;
}

function loadConversations() {
  const list = document.getElementById('conversations-list');

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUser.uid)
  );

  onSnapshot(q, async (snap) => {
    if (snap.empty) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px;color:#8696a0">
          <div style="font-size:48px;margin-bottom:16px">💬</div>
          <p style="font-size:16px;margin-bottom:8px">Aucune conversation</p>
          <p style="font-size:13px">Appuie sur ✏️ pour démarrer une discussion</p>
        </div>
      `;
      return;
    }

    allConvs = [];
    for (const d of snap.docs) {
      const data = d.data();
      const otherUid = data.participants.find(p => p !== currentUser.uid);
      const userSnap = await getDoc(doc(db, 'users', otherUid));
      if (!userSnap.exists()) continue;
      const unread = data[`unreadCount_${currentUser.uid}`] || 0;
      allConvs.push({ id: d.id, ...data, unread, otherUser: userSnap.data() });
    }

    allConvs.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    renderConversations(allConvs);
  });
}
