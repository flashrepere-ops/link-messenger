import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DAILY_API_KEY = '67a3b2fc45f3aa099b42b93b31a003a2b2c650cb66f6054a880d65fefeb75cd4';
const DAILY_DOMAIN = 'link-messenger';

let callFrame = null;
let isMuted = false;
let isVideoOff = false;
let currentUser = null;

const params = new URLSearchParams(window.location.search);
const otherUserId = params.get('user');
const otherName = params.get('name');
const callType = params.get('type') || 'video';
const roomName = params.get('room');

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

// Afficher infos
const usernameEl = document.getElementById('call-username');
const avatarEl = document.getElementById('call-avatar');
const statusEl = document.getElementById('call-status');

if (otherName) {
  usernameEl.textContent = otherName;
  avatarEl.textContent = otherName.charAt(0).toUpperCase();
  avatarEl.style.background = getColor(otherName);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;

  // Charger photo
  const userSnap = await getDoc(doc(db, 'users', otherUserId));
  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (userData.avatar) {
      avatarEl.style.backgroundImage = `url('${userData.avatar}')`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.textContent = '';
    }
  }

  startCall();
});

async function createRoom() {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_chat: false,
          enable_screenshare: false
        }
      })
    });
    const data = await response.json();
    return data.url;
  } catch(e) {
    console.error(e);
    return `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
  }
}

async function startCall() {
  statusEl.textContent = 'Connexion en cours...';

  const roomUrl = await createRoom();

  callFrame = window.DailyIframe.createFrame(
    document.getElementById('daily-call-frame'),
    {
      showLeaveButton: false,
      showFullscreenButton: false,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '12px'
      }
    }
  );

  callFrame.on('joined-meeting', () => {
    statusEl.textContent = 'En appel';
    if (callType === 'audio') {
      callFrame.setLocalVideo(false);
      isVideoOff = true;
      document.getElementById('video-btn').textContent = '📵';
    }
  });

  callFrame.on('left-meeting', () => {
    window.history.back();
  });

  callFrame.on('error', (e) => {
    console.error(e);
    statusEl.textContent = 'Erreur de connexion';
  });

  await callFrame.join({ url: roomUrl });
}

window.toggleMute = function() {
  isMuted = !isMuted;
  callFrame.setLocalAudio(!isMuted);
  document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🎤';
}

window.toggleVideo = function() {
  isVideoOff = !isVideoOff;
  callFrame.setLocalVideo(!isVideoOff);
  document.getElementById('video-btn').textContent = isVideoOff ? '📵' : '📹';
}

window.endCall = function() {
  if (callFrame) {
    callFrame.leave();
  }
  window.history.back();
}