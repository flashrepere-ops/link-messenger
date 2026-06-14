import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadConversations();
});

window.logout = async function() {
  if (confirm('Se déconnecter ?')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
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
}

window.searchUser = async function() {
  const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
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
    const color = getColor(userData.username);
    const initials = getInitials(userData.username);
    resultDiv.innerHTML = `
      <div class="user-result">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar" style="background:${color};width:40px;height:40px;font-size:16px">${initials}</div>
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

    const convs = [];
    for (const d of snap.docs) {
      const data = d.data();
      const otherUid = data.participants.find(p => p !== currentUser.uid);
      const userSnap = await getDoc(doc(db, 'users', otherUid));
      if (!userSnap.exists()) continue;
      convs.push({ id: d.id, ...data, otherUser: userSnap.data() });
    }

    convs.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

    list.innerHTML = '';
    for (const c of convs) {
      const color = getColor(c.otherUser.username);
      const initials = getInitials(c.otherUser.username);
      const item = document.createElement('div');
      item.className = 'conv-item';
      item.innerHTML = `
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="conv-info">
          <div class="conv-top">
            <span class="conv-name">${c.otherUser.username}</span>
            <span class="conv-time">${timeAgo(c.updatedAt)}</span>
          </div>
          <div class="conv-bottom">
            <span class="conv-last-msg">${c.lastMessage || 'Démarrer la discussion'}</span>
          </div>
        </div>
      `;
      item.onclick = () => window.startChat(c.otherUser.uid, c.otherUser.username);
      list.appendChild(item);
    }
  });
}