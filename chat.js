import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

const NOTIF_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAAEQAAB6YAJSUlJSUzMzMzMzNAQEBAQEBOTk5OTk5cXFxcXFxpaWlpaWl3d3d3d3eFhYWFhYWSkpKSkqCgoKCgoK6urq6urru7u7u7u8nJycnJydfX19fX1+Tk5OTk5PLy8vLy8v//////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEIQAAAAAAAAemv39HgQAAAAAAAAAAAAAAAAD/80DEABPAzlADScAAwKxWKxWKxWKydGgFAoFAoFAoQIEYrFYJgmGxWTtyh2GcPw8Zf8wjMpQEsyAAQC4iYDEHcjFJh3OvT09sP1Ag6c5d/DHLv5zp9zqgGf4Y6QAJCAwIBgAAKwivBf/zQsQMF1F6bF2KoAChA+DaAr45QrYMbfh7INjIHsiTID2u5iB5JAGLdg2DQbhFnAYo4lgYUa2LmFzEyRUiv/kOHOHOJkipFTL//IsRYxIqRUyLxeMf+VCQNCUJA0VVtrVvfateNAEARP/zQMQKFPi6FAHF8ACiycpgBAPmBYASYB4GBhAigGReU4b/MNpjnESmKaGMYr4TRg5g9GCCAcgOVVabSxKWlq71+tP3ff3PqX/9VPxWl6P+t/qnF6NnJkFE4A6WZJLrT3L17DSzUdbE//NCxBEQ6K4mNA484KojsAAFaZRCqxgJARquMNIB0WAdZtFbVk1S8qn6V3VW83260fvu/fU9dX9T9vZxe3o/VcAFunPabA9Em0P+HOT9SP0CmYWEIzmCMJAYljIJgAgGGAwAUUDvBAG7//NAxCkSsMIhSg48xKk9OX6WRz9iXhE4XNARFCSDn/qoo4t7P/9mNft//R9uv6UNwZJH4Eaxtp19Y209EvOENciPzhCWqjwQxQOIuCg4TnR6WxEZObOc278vCnoQAzTpQcODBiQ7PGf/80LEOSHZlmz8ZpMJTyuuiosGyJprN2INweF3nsA2AgHiocDAXGCE0JBWUVMmyQuWQn0BGqic2gTWc2jUVaYRqJyfAsLA4SMjIkpWLTqFp0dlSMi1emrq1bdbagZNhaNPCRprWpKadsr/80DEDRNxBkgQNwbpNKtSREVMT8th6HYKIBmZ6OoKICHZXbWElxH2zTQLhx3nRg2MS8AFAIYGCQdY5MoYE6KpKUDEpX/pVBq1SWgmZ/b+nJ9zOXqMBXL9+GWyNfVhQTIesPQ1CogRQ//zQsQaEnjKGAAWvOQwB5qzDCChLACifrwRiB4EkUChUBCMZNMXLCzohc5jqyXmfp4Fp9y/Zr3/8iv7P928fAjKwXddTsCUs3NZQhv2bUaaKk4KwmAcziY2IMYWAGX21iHJPOROQh0xtf/zQMQsEHDKJXQOfQDi7e/7+2YnHd7f9/osb7rnfd2f09m9/t3kYAu/23BnKVKfEXz7+fdSx8CvBGRNigV2Kexhnyu7rvVp8Yicfqn1htS9av0//7Lq/r2K/ZqVSBaaC3b5bt5zG7oJ//NCxEUOEMZOXgt5AJnr0ncGlpyAH5gqKsmh2CiYBAASYbsP5L5Y3eiNmwnb25PMJ1I+jSxn+2i7a3/7zX6BX/UpuUn2WYysinpZXObz3SyR2X5hRfg6TTFCXDNu8EwMBRGgA1MHQf+O//NAxGgQMMoktA49ACstFvvbw5iUDDC7r1Ra2bdt2ZuzirP+l1t/6f/X+l3UjabZAu7oHy6qROQZyj6/jWlL+uUsUwsMYlNPIwmCAdZNJpiU00Au97ul6sPoapv1rT5ty/5bpTau+yX/80LEghG42hgADnzk3f/Fv6pepP/5l5NGUUth53Vyo3BQeY2wYRwUxqdhTGA8A2gmg2TwLAy8b3YGFck1SLNRVhVSKCt2r7ec2T6/oV2ybFTOnAV9dSXqxt1FJgQ3rd9H9MttWXkHqyL/80DElw/wxi40DjsAirMU9iAOFLhgG6h2WYAICFKplbvxWBndsbLrF3bY2L1urVU3R2sn1op3Xfin9WymOF6ucYRsPbUelY2VCmViXMM4hPk4n4hBiZhvU1x2VtLfEehvcsbWIGHBKP/zQsSyEijOFAAOvQDM1eVyyLVQVGAz8S/yPPcRZV3/8RBr9niKW5L3/5Z7VTwA1l/rBgoYLJLI1qYlRPSRExKoqyYErJwjFU9khwIbccpBR9DlEiDvEgD/EcG+X9ONbdLJDgA/WKiv1v/zQMTFEeDOFMIWuwAqKs8sLCzVCoqKiooLCwsLMWKirP/X///+oWFlTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxNgQEMYN9A53AFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxPMV4Pj4MADeTFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

function playNotificationSound() {
  if (localStorage.getItem('sound') === 'false') return;
  try {
    new Audio(NOTIF_SOUND).play().catch(() => {});
  } catch(e) {}
}

let currentUser = null;
let convId = null;
let otherUserId = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let knownMessageIds = new Set();
let firstMessagesLoad = true;

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

function applyWallpaper() {
  const container = document.getElementById('messages-container');
  const wallpaper = localStorage.getItem('wallpaper') || 'default';

  container.classList.remove('wallpaper-dark-solid', 'wallpaper-teal', 'wallpaper-navy', 'wallpaper-warm');
  container.style.backgroundImage = '';

  if (wallpaper === 'custom') {
    const customData = localStorage.getItem('wallpaperCustom');
    if (customData) {
      container.style.backgroundImage = `url('${customData}')`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    }
  } else if (wallpaper !== 'default') {
    container.classList.add(`wallpaper-${wallpaper}`);
  }
}

applyWallpaper();

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
    let hasNewIncoming = false;

    snap.forEach((d) => {
      const msg = d.data();
      const isMine = msg.senderId === currentUser.uid;

      if (!firstMessagesLoad && !isMine && !knownMessageIds.has(d.id)) {
        hasNewIncoming = true;
      }
      knownMessageIds.add(d.id);

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

    if (hasNewIncoming) playNotificationSound();
    firstMessagesLoad = false;

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

// APPELS
window.startAudioCall = function() {
  if (!currentUser || !otherUserId) return;
  const ids = [currentUser.uid, otherUserId].sort();
  const roomName = 'call-' + ids.join('-').substring(0, 20);
  window.location.href = `call.html?user=${otherUserId}&name=${encodeURIComponent(otherName)}&type=audio&room=${roomName}`;
}

window.startVideoCall = function() {
  if (!currentUser || !otherUserId) return;
  const ids = [currentUser.uid, otherUserId].sort();
  const roomName = 'call-' + ids.join('-').substring(0, 20);
  window.location.href = `call.html?user=${otherUserId}&name=${encodeURIComponent(otherName)}&type=video&room=${roomName}`;
}

function updateSendBtn(value) {
  const btn = document.getElementById('send-btn');
  if (value.trim()) {
    btn.textContent = '➤';
  } else {
    btn.textContent = '🎤';
  }
}

const input = document.getElementById('message-input');

input.addEventListener('input', (e) => {
  updateSendBtn(e.target.value);
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doSend();
});

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
