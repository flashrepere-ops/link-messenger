import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, orderBy, query, where, doc, setDoc, getDoc, getDocs, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

function getFavoritesList() {
  try {
    return JSON.parse(localStorage.getItem('favoriteContacts')) || [];
  } catch(e) { return []; }
}

function updateFavBtnState() {
  const favBtn = document.getElementById('fav-btn');
  if (!favBtn || !otherUserId) return;
  const isFav = getFavoritesList().includes(otherUserId);
  favBtn.style.opacity = isFav ? '1' : '0.5';
}

window.toggleFavorite = function() {
  if (!otherUserId) return;
  let list = getFavoritesList();
  if (list.includes(otherUserId)) {
    list = list.filter(id => id !== otherUserId);
  } else {
    list.push(otherUserId);
  }
  localStorage.setItem('favoriteContacts', JSON.stringify(list));
  updateFavBtnState();
}

updateFavBtnState();

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
  markConversationAsRead();
  checkAutoReplies();
});

async function markConversationAsRead() {
  try {
    await setDoc(doc(db, 'conversations', convId), {
      [`unreadCount_${currentUser.uid}`]: 0
    }, { merge: true });
  } catch(e) { console.error(e); }
}

async function checkAutoReplies() {
  if (!otherUserId) return;
  try {
    const otherSnap = await getDoc(doc(db, 'users', otherUserId));
    if (!otherSnap.exists()) return;
    const otherData = otherSnap.data();

    if (otherData.awayMsg && otherData.awayMsg.enabled && otherData.awayMsg.text) {
      const alreadySent = sessionStorage.getItem(`awaySent_${convId}`);
      if (!alreadySent) {
        sessionStorage.setItem(`awaySent_${convId}`, 'true');
        await sendAutoMessage(otherData.awayMsg.text);
      }
      return;
    }

    if (otherData.greetingMsg && otherData.greetingMsg.enabled && otherData.greetingMsg.text) {
      const msgsSnap = await getDocs(collection(db, 'conversations', convId, 'messages'));
      const isFirstContact = msgsSnap.empty;
      if (isFirstContact) {
        await sendAutoMessage(otherData.greetingMsg.text);
      }
    }
  } catch(e) {
    console.error(e);
  }
}

async function sendAutoMessage(text) {
  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text,
      senderId: otherUserId,
      read: false,
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, 'conversations', convId), {
      participants: [currentUser.uid, otherUserId],
      lastMessage: text,
      updatedAt: serverTimestamp(),
      [`unreadCount_${currentUser.uid}`]: increment(1)
    }, { merge: true });
  } catch(e) {
    console.error(e);
  }
}

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
    const unreadIncomingIds = [];

    snap.forEach((d) => {
      const msg = d.data();
      const isMine = msg.senderId === currentUser.uid;

      if (!isMine && !msg.read) {
        unreadIncomingIds.push(d.id);
      }

      if (!firstMessagesLoad && !isMine && !knownMessageIds.has(d.id)) {
        hasNewIncoming = true;
      }
      knownMessageIds.add(d.id);

      const div = document.createElement('div');
      div.className = `message ${isMine ? 'mine' : 'theirs'}`;

      const checkmark = isMine
        ? `<span class="msg-check" style="color:${msg.read ? '#53bdeb' : '#8696a0'}">${msg.read ? '✓✓' : '✓'}</span>`
        : '';

      if (msg.audio) {
        div.innerHTML = `
          <div class="audio-message">
            <audio controls src="${msg.audio}"></audio>
          </div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.image) {
        div.innerHTML = `
          <img src="${msg.image}" style="max-width:100%;border-radius:8px;" />
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.document) {
        div.innerHTML = `
          <a href="${msg.document}" download="${msg.docName}" class="doc-card" style="color:inherit;text-decoration:none">
            <span class="doc-card-icon">📄</span>
            <div>
              <div class="struct-card-title">${msg.docName}</div>
              <div class="struct-card-sub">${msg.docSize ? Math.round(msg.docSize/1024) + ' Ko' : ''}</div>
            </div>
          </a>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.catalogue) {
        div.innerHTML = `
          <div class="struct-card">
            <div class="struct-card-title">🏬 ${msg.catalogue.name}</div>
            ${msg.catalogue.price ? `<div class="struct-card-sub">${msg.catalogue.price} €</div>` : ''}
            ${msg.catalogue.desc ? `<div class="struct-card-sub">${msg.catalogue.desc}</div>` : ''}
          </div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.location) {
        const mapUrl = `https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`;
        div.innerHTML = `
          <a href="${mapUrl}" target="_blank" class="location-card">
            <div class="struct-card">
              <div class="struct-card-title">📍 Position partagée</div>
              <div class="struct-card-sub">Ouvrir dans Google Maps</div>
            </div>
          </a>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.contactCard) {
        div.innerHTML = `
          <div class="struct-card">
            <div class="struct-card-title">👤 ${msg.contactCard.username}</div>
            <div class="struct-card-sub">Contact partagé</div>
          </div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.poll) {
        const votes = msg.poll.votes || {};
        const myVote = votes[currentUser.uid];
        const counts = msg.poll.options.map((_, i) =>
          Object.values(votes).filter(v => v === i).length
        );
        const optionsHtml = msg.poll.options.map((opt, i) => `
          <div class="poll-option-row ${myVote === i ? 'voted' : ''}" onclick="voteOnPoll('${d.id}', ${i})">
            <span>${opt}</span>
            <span>${counts[i]}</span>
          </div>
        `).join('');
        div.innerHTML = `
          <div class="struct-card">
            <div class="struct-card-title">📊 ${msg.poll.question}</div>
            ${optionsHtml}
          </div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else if (msg.event) {
        div.innerHTML = `
          <div class="struct-card">
            <div class="struct-card-title">📅 ${msg.event.title}</div>
            <div class="struct-card-sub">${msg.event.date}${msg.event.time ? ' à ' + msg.event.time : ''}</div>
            ${msg.event.location ? `<div class="struct-card-sub">📍 ${msg.event.location}</div>` : ''}
          </div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      } else {
        div.innerHTML = `
          <div class="msg-text">${msg.text}</div>
          <div class="time">${formatTime(msg.createdAt)} ${checkmark}</div>
        `;
      }

      container.appendChild(div);
    });

    if (hasNewIncoming) playNotificationSound();
    firstMessagesLoad = false;

    if (unreadIncomingIds.length) {
      unreadIncomingIds.forEach(async (msgId) => {
        try {
          await updateDoc(doc(db, 'conversations', convId, 'messages', msgId), { read: true });
        } catch(e) { console.error(e); }
      });
    }

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
      read: false,
      createdAt: serverTimestamp()
    });

    await sendConvUpdate(text);

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
            read: false,
            createdAt: serverTimestamp()
          });
          await sendConvUpdate('🎤 Message vocal');
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
          read: false,
          createdAt: serverTimestamp()
        });
        await sendConvUpdate('📷 Photo');
      } catch(e) {
        console.error(e);
      }
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
}

// ============ PANNEAU TROMBONE ============

window.toggleAttachPanel = function() {
  const panel = document.getElementById('attach-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function closeAttachPanel() {
  document.getElementById('attach-panel').style.display = 'none';
}

async function sendConvUpdate(lastMessage) {
  await setDoc(doc(db, 'conversations', convId), {
    participants: [currentUser.uid, otherUserId],
    lastMessage,
    updatedAt: serverTimestamp(),
    [`unreadCount_${otherUserId}`]: increment(1)
  }, { merge: true });
}

// ---- MODALE GÉNÉRIQUE ----
window.closeModal = function(event) {
  if (event && event.target.id !== 'modal-overlay') return;
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-box').innerHTML = '';
}

function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}

// ---- 1. DOCUMENT ----
window.attachDocument = function() {
  closeAttachPanel();
  document.getElementById('document-file').click();
}

window.handleDocumentFile = async function(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file || !currentUser) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('Fichier trop volumineux (max 5 Mo) !');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        text: '',
        document: ev.target.result,
        docName: file.name,
        docSize: file.size,
        senderId: currentUser.uid,
        read: false,
        createdAt: serverTimestamp()
      });
      await sendConvUpdate('📄 ' + file.name);
    } catch(e) {
      console.error(e);
    }
  };
  reader.readAsDataURL(file);
}

// ---- 2. GALERIE (multi-photos) ----
window.attachGallery = function() {
  closeAttachPanel();
  document.getElementById('gallery-file').click();
}

window.handleGalleryFiles = async function(event) {
  const files = Array.from(event.target.files);
  event.target.value = '';
  if (!files.length || !currentUser) return;

  for (const file of files) {
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          await addDoc(collection(db, 'conversations', convId, 'messages'), {
            text: '🖼️ Photo',
            image: ev.target.result,
            senderId: currentUser.uid,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch(e) {
          console.error(e);
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
  await sendConvUpdate(files.length > 1 ? `🖼️ ${files.length} photos` : '🖼️ Photo');
}

// ---- 3. CATALOGUE ----
window.openCatalogue = function() {
  closeAttachPanel();
  openModal(`
    <h3>🏬 Ajouter un produit</h3>
    <input type="text" id="cat-name" placeholder="Nom du produit" />
    <input type="number" id="cat-price" placeholder="Prix (€)" />
    <textarea id="cat-desc" placeholder="Description" rows="3"></textarea>
    <div class="modal-actions">
      <button class="modal-btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="modal-btn-primary" onclick="sendCatalogueItem()">Envoyer</button>
    </div>
  `);
}

window.sendCatalogueItem = async function() {
  const name = document.getElementById('cat-name').value.trim();
  const price = document.getElementById('cat-price').value.trim();
  const desc = document.getElementById('cat-desc').value.trim();
  if (!name) { alert('Le nom du produit est requis !'); return; }

  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text: '',
      catalogue: { name, price, desc },
      senderId: currentUser.uid,
      read: false,
      createdAt: serverTimestamp()
    });
    await sendConvUpdate('🏬 ' + name);
    closeModal();
  } catch(e) { console.error(e); }
}

// ---- 4. RÉPONSE RAPIDE ----
const quickReplies = [
  "Merci, à bientôt !",
  "Je te recontacte dès que possible.",
  "Disponible aujourd'hui ?",
  "Bien reçu 👍",
  "Pouvons-nous fixer un rendez-vous ?",
  "Désolé, je suis occupé là."
];

window.openQuickReply = function() {
  closeAttachPanel();
  const items = quickReplies.map(r =>
    `<button class="quick-reply-item" onclick="useQuickReply('${r.replace(/'/g, "\\'")}')">${r}</button>`
  ).join('');
  openModal(`
    <h3>⚡ Réponses rapides</h3>
    <div class="quick-reply-list">${items}</div>
    <div class="modal-actions">
      <button class="modal-btn-secondary" onclick="closeModal()">Fermer</button>
    </div>
  `);
}

window.useQuickReply = function(text) {
  const input = document.getElementById('message-input');
  input.value = text;
  updateSendBtn(text);
  closeModal();
  input.focus();
}

// ---- 5. LOCALISATION ----
window.attachLocation = function() {
  closeAttachPanel();
  if (!navigator.geolocation) {
    alert('La localisation n\'est pas disponible sur cet appareil !');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        text: '',
        location: { lat: latitude, lng: longitude },
        senderId: currentUser.uid,
        read: false,
        createdAt: serverTimestamp()
      });
      await sendConvUpdate('📍 Position partagée');
    } catch(e) { console.error(e); }
  }, () => {
    alert('Impossible d\'obtenir ta position. Vérifie les autorisations !');
  });
}

// ---- 6. CONTACT ----
window.openContactPicker = async function() {
  closeAttachPanel();
  openModal(`<h3>👤 Choisir un contact</h3><p style="font-size:13px;color:#8696a0">Chargement...</p>`);

  try {
    const convsSnap = await getDocs(query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    ));

    const others = [];
    for (const d of convsSnap.docs) {
      const data = d.data();
      const otherUid = data.participants.find(p => p !== currentUser.uid);
      if (otherUid && otherUid !== otherUserId) others.push(otherUid);
    }

    if (!others.length) {
      openModal(`
        <h3>👤 Choisir un contact</h3>
        <p style="font-size:13px;color:#8696a0">Tu n'as aucun autre contact à partager.</p>
        <div class="modal-actions"><button class="modal-btn-secondary" onclick="closeModal()">Fermer</button></div>
      `);
      return;
    }

    let html = `<h3>👤 Choisir un contact</h3>`;
    for (const uid of others) {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) continue;
      const u = snap.data();
      html += `
        <div class="contact-pick-item" onclick="sendContactCard('${uid}', '${(u.username || '').replace(/'/g, "\\'")}')">
          <div class="avatar" style="width:40px;height:40px;font-size:16px;background:${getColor(u.username || '?')}">${(u.username || '?').charAt(0).toUpperCase()}</div>
          <span>${u.username || 'Utilisateur'}</span>
        </div>
      `;
    }
    html += `<div class="modal-actions"><button class="modal-btn-secondary" onclick="closeModal()">Fermer</button></div>`;
    openModal(html);
  } catch(e) {
    console.error(e);
    closeModal();
  }
}

window.sendContactCard = async function(uid, username) {
  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text: '',
      contactCard: { uid, username },
      senderId: currentUser.uid,
      read: false,
      createdAt: serverTimestamp()
    });
    await sendConvUpdate('👤 Contact : ' + username);
    closeModal();
  } catch(e) { console.error(e); }
}

// ---- 7. SONDAGE ----
window.openPollCreator = function() {
  closeAttachPanel();
  openModal(`
    <h3>📊 Créer un sondage</h3>
    <input type="text" id="poll-question" placeholder="Ta question" />
    <input type="text" id="poll-opt-1" placeholder="Option 1" />
    <input type="text" id="poll-opt-2" placeholder="Option 2" />
    <input type="text" id="poll-opt-3" placeholder="Option 3 (facultatif)" />
    <div class="modal-actions">
      <button class="modal-btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="modal-btn-primary" onclick="sendPoll()">Créer</button>
    </div>
  `);
}

window.sendPoll = async function() {
  const question = document.getElementById('poll-question').value.trim();
  const opt1 = document.getElementById('poll-opt-1').value.trim();
  const opt2 = document.getElementById('poll-opt-2').value.trim();
  const opt3 = document.getElementById('poll-opt-3').value.trim();

  if (!question || !opt1 || !opt2) {
    alert('Question + au moins 2 options requises !');
    return;
  }

  const options = [opt1, opt2];
  if (opt3) options.push(opt3);

  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text: '',
      poll: { question, options, votes: {} },
      senderId: currentUser.uid,
      read: false,
      createdAt: serverTimestamp()
    });
    await sendConvUpdate('📊 Sondage : ' + question);
    closeModal();
  } catch(e) { console.error(e); }
}

window.voteOnPoll = async function(msgId, optionIndex) {
  try {
    const msgRef = doc(db, 'conversations', convId, 'messages', msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const votes = data.poll.votes || {};
    votes[currentUser.uid] = optionIndex;
    await updateDoc(msgRef, { 'poll.votes': votes });
  } catch(e) { console.error(e); }
}

// ---- 8. ÉVÉNEMENT ----
window.openEventCreator = function() {
  closeAttachPanel();
  openModal(`
    <h3>📅 Créer un événement</h3>
    <input type="text" id="evt-title" placeholder="Titre de l'événement" />
    <input type="date" id="evt-date" />
    <input type="time" id="evt-time" />
    <input type="text" id="evt-location" placeholder="Lieu (facultatif)" />
    <div class="modal-actions">
      <button class="modal-btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="modal-btn-primary" onclick="sendEvent()">Envoyer</button>
    </div>
  `);
}

window.sendEvent = async function() {
  const title = document.getElementById('evt-title').value.trim();
  const date = document.getElementById('evt-date').value;
  const time = document.getElementById('evt-time').value;
  const location = document.getElementById('evt-location').value.trim();

  if (!title || !date) {
    alert('Titre et date requis !');
    return;
  }

  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      text: '',
      event: { title, date, time, location },
      senderId: currentUser.uid,
      read: false,
      createdAt: serverTimestamp()
    });
    await sendConvUpdate('📅 ' + title);
    closeModal();
  } catch(e) { console.error(e); }
}
