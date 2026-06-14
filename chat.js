import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let convId = null;
let otherUserId = null;

const params = new URLSearchParams(window.location.search);
convId = params.get('conv');
otherUserId = params.get('user');
const otherName = params.get('name');

document.getElementById('chat-username').textContent = otherName || '...';

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadMessages();
});

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function loadMessages() {
  const container = document.getElementById('messages-container');
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
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
        <div class="msg-text">${msg.text}</div>
        <div class="time">${formatTime(msg.createdAt)}</div>
      `;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}

window.sendMessage = async function() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text: text,
      senderId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'conversations', convId), {
      participants: [currentUser.uid, otherUserId],
      lastMessage: text,
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch(e) {
    console.error(e);
  }
}

document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});