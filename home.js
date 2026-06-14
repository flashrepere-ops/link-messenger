import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;

// Vérifier connexion
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadConversations();
});

// Déconnexion
window.logout = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
}

// Afficher/cacher recherche
window.showSearch = function() {
  const box = document.getElementById('search-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

// Rechercher utilisateur
window.searchUser = async function() {
  const input = document.getElementById('search-input').value.trim();
  const resultDiv = document.getElementById('search-result');
  resultDiv.innerHTML = '<p>Recherche...</p>';

  if (!input) {
    resultDiv.innerHTML = '<p>Entre un email ou username !</p>';
    return;
  }

  try {
    let snap = await getDocs(query(collection(db, 'users'), where('email', '==', input)));
    if (snap.empty) {
      snap = await getDocs(query(collection(db, 'users'), where('username', '==', input)));
    }

    if (snap.empty) {
      resultDiv.innerHTML = '<p class="error">Utilisateur introuvable !</p>';
      return;
    }

    const userData = snap.docs[0].data();
    if (userData.uid === currentUser.uid) {
      resultDiv.innerHTML = '<p class="error">C\'est toi-même !</p>';
      return;
    }

    resultDiv.innerHTML = `
      <div class="user-result">
        <span>👤 ${userData.username}</span>
        <button class="btn-primary" onclick="startChat('${userData.uid}', '${userData.username}')">
          Démarrer la discussion
        </button>
      </div>
    `;
  } catch(e) {
    resultDiv.innerHTML = '<p class="error">Erreur de recherche !</p>';
  }
}

// Démarrer chat
window.startChat = async function(otherUid, otherUsername) {
  const ids = [currentUser.uid, otherUid].sort();
  const convId = ids.join('_');

  window.location.href = `chat.html?conv=${convId}&user=${otherUid}&name=${otherUsername}`;
}

// Charger conversations
async function loadConversations() {
  const list = document.getElementById('conversations-list');
  list.innerHTML = '<p style="padding:16px;color:#888">Chargement...</p>';

  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid));

  onSnapshot(q, async (snap) => {
    if (snap.empty) {
      list.innerHTML = '<p style="padding:16px;color:#888">Aucune conversation</p>';
      return;
    }

    const convs = [];
    for (const d of snap.docs) {
      const data = d.data();
      const otherUid = data.participants.find(p => p !== currentUser.uid);
      const userSnap = await getDoc(doc(db, 'users', otherUid));
      const userData = userSnap.data();
      convs.push({ id: d.id, ...data, otherUser: userData });
    }

    convs.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

    list.innerHTML = convs.map(c => `
      <div class="conv-item" onclick="startChat('${c.otherUser.uid}', '${c.otherUser.username}')">
        <div class="avatar">👤</div>
        <div class="conv-info">
          <strong>${c.otherUser.username}</strong>
          <span>${c.lastMessage || ''}</span>
        </div>
      </div>
    `).join('');
  });
}