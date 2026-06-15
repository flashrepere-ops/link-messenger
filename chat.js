import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;
let convId = null;
let otherUserId = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

const params = new URLSearchParams(window.location.search);
convId = params.get('conv');
otherUserId = params.get('user');
const otherName = params.get('name');

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

const usernameEl = document.getElementById('chat-username');
const avatarEl = document.getElementById('chat-avatar');

if (otherName) {
  usernameEl.textContent = otherName;
  avatarEl.textContent = otherName.charAt(0).toUpperCase();
  avatarEl.style.background = getColor(otherName);
}

async function loadOtherUserProfile() {
  if (!otherUserId) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', otherUserId));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.avatar) {
        avatarEl.style.backgroundImage = `url('${userData.avatar}')`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        avatarEl.textContent = '';
      } else {
        avatarEl.textContent = userData.username.charAt(0).toUpperCase();
        avatarEl.style.background = getColor(userData.username);
      }
      usernameEl.textContent = userData.username;
    }
  } catch(e) {
    console.error(e);
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;
  loadOtherUserProfile();
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

      if (msg.audio) {
        div.innerHTML = `
          <div class="audio-message">
            <audio controls src="${msg.audio}"></audio>
          </div>
          <div class="time">${formatTime(msg.createdAt)}</div>
        `;
      } else if (msg.image) {
        div.innerHTML = `
          <img src="${msg.image}" style="max-width:100%;border-radius:8px;" />
          <div class="time">${formatTime(msg.createdAt)}</div>
        `;
      } else {
        div.innerHTML = `
          <div class="msg-text">${msg.text}</div>
          <div class="time">${formatTime(msg.createdAt)}</div>
        `;
      }

      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}

async function doSend() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !currentUser) return;
  input.value = '';
  updateSendBtn('');

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

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    isRecording = true;

    const indicator = document.getElementById('recording-indicator');
    if (indicator) indicator.style.display = 'flex';

    const btn = document.getElementById('send-btn');
    btn.textContent = '⏹';
    btn.style.background = '#f15c6d';

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          await addDoc(collection(db, 'conversations', convId, 'messages'), {
            text: '',
            audio: ev.target.result,
            senderId: currentUser.uid,
            createdAt: serverTimestamp()
          });
          await setDoc(doc(db, 'conversations', convId), {
            participants: [currentUser.uid, otherUserId],
            lastMessage: '🎤 Message vocal',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch(e) {
          console.error(e);
        }
      };
      reader.readAsDataURL(audioBlob);
      stream.getTracks().forEach(t => t.stop());

      const indicator = document.getElementById('recording-indicator');
      if (indicator) indicator.style.display = 'none';

      const btn = document.getElementById('send-btn');
      btn.textContent = '🎤';
      btn.style.background = '#075e54';
      isRecording = false;
    };

    mediaRecorder.start();
  } catch(e) {
    alert('Impossible d\'accéder au micro !');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
}

window.cancelRecording = function() {
  if (mediaRecorder && isRecording) {
    audioChunks = [];
    mediaRecorder.stop();
    isRecording = false;
    const indicator = document.getElementById('recording-indicator');
    if (indicator) indicator.style.display = 'none';
    const btn = document.getElementById('send-btn');
    btn.textContent = '🎤';
    btn.style.background = '#075e54';
  }
}

window.sendMessage = doSend;

function updateSendBtn(value) {
  const btn = document.getElementById('send-btn');
  if (value.trim()) {
    btn.textContent = '➤';
    btn.onclick = doSend;
  } else {
    btn.textContent = '🎤';
    btn.onclick = null;
  }
}

const input = document.getElementById('message-input');

input.addEventListener('input', (e) => {
  updateSendBtn(e.target.value);
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doSend();
});

// Bouton envoi/micro
const sendBtn = document.getElementById('send-btn');
sendBtn.addEventListener('click', () => {
  const text = document.getElementById('message-input').value.trim();
  if (text) {
    doSend();
  } else if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

updateSendBtn('');

// EMOJIS
const emojiData = {
  smileys: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓'],
  gestures: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐'],
  animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄'],
  food: ['🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡'],
  travel: ['✈️','🚀','🛸','🚁','🛶','⛵','🚢','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗'],
  symbols: ['💯','🔥','⭐','🌟','✨','💫','⚡','🌈','🎉','🎊','🎈','🎁','🏆','🥇','🎯','🎮','🎲','🃏','🀄','🎴','🔮','🧿','🪬','🧲','💡','🔍','🔑','🗝','🔐','🔒']
};

window.toggleEmoji = function() {
  const picker = document.getElementById('emoji-picker');
  picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  if (picker.style.display === 'block') {
    showEmojiCat(document.querySelector('.emoji-cat.active'), 'smileys');
  }
}

window.showEmojiCat = function(btn, cat) {
  document.querySelectorAll('.emoji-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = '';
  emojiData[cat].forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => {
      const input = document.getElementById('message-input');
      input.value += emoji;
      input.focus();
      updateSendBtn(input.value);
    };
    grid.appendChild(btn);
  });
}

window.openCamera = function() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target.result;
      try {
        await addDoc(collection(db, 'conversations', convId, 'messages'), {
          text: '📷 Photo',
          image: imageData,
          senderId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, 'conversations', convId), {
          participants: [currentUser.uid, otherUserId],
          lastMessage: '📷 Photo',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch(e) {
        console.error(e);
      }
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
}