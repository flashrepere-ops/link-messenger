import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

const params = new URLSearchParams(window.location.search);
const groupId = params.get('id');
const groupName = decodeURIComponent(params.get('name') || 'Groupe');

let currentUser = null;
let groupData = null;

document.getElementById('group-name').textContent = groupName;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;

  try {
    const snap = await getDoc(doc(db, 'groups', groupId));
    if (snap.exists()) {
      groupData = snap.data();
      document.getElementById('group-members-label').textContent = `${groupData.members.length} membres`;
    }
  } catch(e) {
    console.error(e);
  }

  loadGroupMessages();
});

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getSenderName(uid) {
  if (!groupData) return '';
  const idx = groupData.members.indexOf(uid);
  return idx >= 0 ? (groupData.memberNames[idx] || 'Membre') : 'Membre';
}

function loadGroupMessages() {
  const container = document.getElementById('messages-container');
  const q = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  onSnapshot(q, (snap) => {
    container.innerHTML = '';
    snap.forEach((d) => {
      const msg = d.data();
      const isMine = msg.senderId === currentUser.uid;
      const div = document.createElement('div');
      div.className = `message ${isMine ? 'mine' : 'theirs'}`;
      div.innerHTML = `
        ${!isMine ? `<div style="font-size:12px;font-weight:700;color:#00a884;margin-bottom:2px">${getSenderName(msg.senderId)}</div>` : ''}
        <div class="msg-text">${msg.text}</div>
        <div class="time">${formatTime(msg.createdAt)}</div>
      `;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}

async function sendGroupMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !currentUser) return;
  input.value = '';

  try {
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      text,
      senderId: currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch(e) {
    console.error(e);
  }
}

document.getElementById('send-btn').addEventListener('click', sendGroupMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendGroupMessage();
});
