import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}
if (localStorage.getItem('powerSaver') === 'true') {
  document.body.classList.add('power-saver');
}

// Durée de vie d'un statut en heures. Modifiable facilement ici.
const STATUS_LIFETIME_HOURS = 24;

let currentUser = null;
let composerMode = 'photo';
let pendingPhotoData = null;
let viewedStatuses = [];
let viewerIndex = 0;

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

function createAvatarHtml(user) {
  if (user.avatar) {
    return `<div class="avatar" style="background-image:url('${user.avatar}');background-size:cover;background-position:center"></div>`;
  }
  const name = user.username || '?';
  return `<div class="avatar" style="background:${getColor(name)}">${name.charAt(0).toUpperCase()}</div>`;
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const diffMins = Math.floor((new Date() - date) / 60000);
  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  return `il y a ${diffHours} h`;
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadStatuses();
});

function loadStatuses() {
  const list = document.getElementById('status-list');
  const cutoff = Timestamp.fromMillis(Date.now() - STATUS_LIFETIME_HOURS * 3600 * 1000);

  const q = query(collection(db, 'statuses'), where('createdAt', '>', cutoff));

  onSnapshot(q, async (snap) => {
    if (snap.empty) {
      list.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:#8696a0">
          <div style="font-size:48px;margin-bottom:16px">🔵</div>
          <p style="font-size:16px;margin-bottom:8px">Aucun statut</p>
          <p style="font-size:13px">Appuie sur 📷 pour publier le premier !</p>
        </div>
      `;
      return;
    }

    const byUser = {};
    snap.forEach(d => {
      const data = d.data();
      if (!byUser[data.userId]) byUser[data.userId] = [];
      byUser[data.userId].push({ id: d.id, ...data });
    });

    const userIds = Object.keys(byUser);
    const items = [];

    for (const uid of userIds) {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) continue;
      const userData = userSnap.data();
      const statuses = byUser[uid].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      items.push({ uid, userData, statuses });
    }

    items.sort((a, b) => {
      const aLast = a.statuses[a.statuses.length - 1].createdAt?.seconds || 0;
      const bLast = b.statuses[b.statuses.length - 1].createdAt?.seconds || 0;
      return bLast - aLast;
    });

    list.innerHTML = items.map(item => {
      const last = item.statuses[item.statuses.length - 1];
      const isMine = item.uid === currentUser.uid;
      return `
        <div class="status-item" onclick='openStatusViewerFor(${JSON.stringify(item.uid)})'>
          <div class="status-ring">
            ${createAvatarHtml(item.userData)}
          </div>
          <div class="status-info">
            <div class="status-username">${isMine ? 'Mon statut' : (item.userData.username || 'Utilisateur')}</div>
            <div class="status-meta">${timeAgo(last.createdAt)} · ${item.statuses.length} statut${item.statuses.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    window.__statusGroups = items;
  });
}

// ============ COMPOSITEUR ============

window.openStatusComposer = function() {
  document.getElementById('status-composer-overlay').style.display = 'flex';
  setComposerMode('photo');
}

window.closeStatusComposer = function() {
  document.getElementById('status-composer-overlay').style.display = 'none';
  pendingPhotoData = null;
  document.getElementById('status-photo-preview').innerHTML = `
    <button class="status-pick-photo-btn" onclick="document.getElementById('status-photo-input').click()">
      📷 Choisir une photo
    </button>
  `;
  document.getElementById('status-caption').value = '';
  document.getElementById('status-text-content').value = '';
}

window.setComposerMode = function(mode) {
  composerMode = mode;
  document.getElementById('mode-tab-photo').classList.toggle('active', mode === 'photo');
  document.getElementById('mode-tab-text').classList.toggle('active', mode === 'text');
  document.getElementById('composer-photo-mode').style.display = mode === 'photo' ? 'block' : 'none';
  document.getElementById('composer-text-mode').style.display = mode === 'text' ? 'block' : 'none';
}

window.handleStatusPhoto = function(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingPhotoData = e.target.result;
    document.getElementById('status-photo-preview').innerHTML = `<img src="${pendingPhotoData}" />`;
  };
  reader.readAsDataURL(file);
}

window.publishStatus = async function() {
  try {
    if (composerMode === 'photo') {
      if (!pendingPhotoData) {
        alert('Choisis une photo d\'abord !');
        return;
      }
      const caption = document.getElementById('status-caption').value.trim();
      await addDoc(collection(db, 'statuses'), {
        userId: currentUser.uid,
        type: 'photo',
        image: pendingPhotoData,
        caption,
        createdAt: serverTimestamp()
      });
    } else {
      const text = document.getElementById('status-text-content').value.trim();
      if (!text) {
        alert('Écris quelque chose d\'abord !');
        return;
      }
      await addDoc(collection(db, 'statuses'), {
        userId: currentUser.uid,
        type: 'text',
        text,
        createdAt: serverTimestamp()
      });
    }
    closeStatusComposer();
  } catch(e) {
    console.error(e);
    alert('Erreur lors de la publication.');
  }
}

// ============ VISIONNEUSE ============

window.openStatusViewerFor = function(uid) {
  const group = (window.__statusGroups || []).find(g => g.uid === uid);
  if (!group) return;
  viewedStatuses = group.statuses;
  viewerIndex = 0;

  const avatarSlot = document.getElementById('viewer-avatar');
  avatarSlot.innerHTML = '';
  avatarSlot.outerHTML = `<div id="viewer-avatar">${createAvatarHtml(group.userData)}</div>`;
  document.getElementById('viewer-username').textContent = group.uid === currentUser.uid ? 'Mon statut' : (group.userData.username || 'Utilisateur');

  document.getElementById('status-viewer-overlay').style.display = 'flex';
  renderCurrentStatus();
}

function renderCurrentStatus() {
  const s = viewedStatuses[viewerIndex];
  if (!s) { closeStatusViewer(); return; }

  document.getElementById('viewer-time').textContent = timeAgo(s.createdAt);
  const content = document.getElementById('status-viewer-content');

  if (s.type === 'photo') {
    content.innerHTML = `
      <img src="${s.image}" />
      ${s.caption ? `<div class="status-viewer-caption">${s.caption}</div>` : ''}
    `;
  } else {
    content.innerHTML = `<div class="status-viewer-text-content">${s.text}</div>`;
  }

  content.onclick = (e) => {
    e.stopPropagation();
    const rect = content.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX < rect.width / 2) {
      viewerIndex = Math.max(0, viewerIndex - 1);
    } else {
      if (viewerIndex < viewedStatuses.length - 1) {
        viewerIndex++;
      } else {
        closeStatusViewer();
        return;
      }
    }
    renderCurrentStatus();
  };
}

window.closeStatusViewer = function(event) {
  if (event && event.target.id !== 'status-viewer-overlay') return;
  document.getElementById('status-viewer-overlay').style.display = 'none';
}
