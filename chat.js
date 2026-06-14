import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let convId = null;
let otherUserId = null;

// Récupérer paramètres URL
const params = new URLSearchParams(window.location.search);
convId = params.get('conv');
otherUserId = params.get('user');
const otherName = params.get('name');

// Afficher nom
document.getElementById('chat-username').textContent = otherName || '...';

// Vérifier connexion
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadMessages();
});

// Charger messages en temps réel
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
      div.textContent = msg.text;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}

// Envoyer message
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

// Envoyer avec Enter
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});