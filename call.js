import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

const DAILY_API_KEY = '67a3b2fc45f3aa099b42b93b31a003a2b2c650cb66f6054a880d65fefeb75cd4';

let callFrame = null;
let isMuted = false;
let isVideoOff = true;
let isSpeakerOn = true;
let currentUser = null;
let callStartTime = null;
let timerInterval = null;

const params = new URLSearchParams(window.location.search);
const otherUserId = params.get('user');
const otherName = decodeURIComponent(params.get('name') || '');
const callType = params.get('type') || 'audio';
const roomName = params.get('room');

const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#00acc1','#43a047'];

function getColor(name) {
  let sum = 0;
  for (let c of name) sum += c.charCodeAt(0);
  return colors[sum % colors.length];
}

const nameEl = document.getElementById('call-name');
const avatarEl = document.getElementById('call-avatar');
const statusEl = document.getElementById('call-status');
const typeLabelEl = document.getElementById('call-type-label');

if (otherName) {
  nameEl.textContent = otherName;
  avatarEl.textContent = otherName.charAt(0).toUpperCase();
  avatarEl.style.background = getColor(otherName);
}

typeLabelEl.textContent = callType === 'video' ? 'Appel vidéo' : 'Appel audio';
if (callType === 'video') {
  isVideoOff = false;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = user;

  try {
    const userSnap = await getDoc(doc(db, 'users', otherUserId));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.avatar) {
        avatarEl.style.backgroundImage = `url('${userData.avatar}')`;
        avatarEl.textContent = '';
      }
    }
  } catch(e) {
    console.error(e);
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
          enable_screenshare: false,
          start_video_off: callType === 'audio',
          start_audio_off: false
        }
      })
    });
    const data = await response.json();
    if (data.url) return data.url;
    return `https://link-messenger.daily.co/${roomName}`;
  } catch(e) {
    return `https://link-messenger.daily.co/${roomName}`;
  }
}

function startTimer() {
  callStartTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('call-timer').textContent = `${mins}:${secs}`;
  }, 1000);
}

async function startCall() {
  statusEl.textContent = 'Connexion en cours...';

  const roomUrl = await createRoom();
  const iframe = document.getElementById('daily-frame');

  callFrame = window.DailyIframe.wrap(iframe, {
    showLeaveButton: false,
    showFullscreenButton: false
  });

  callFrame.on('joined-meeting', () => {
    statusEl.textContent = 'En appel';
    startTimer();
    if (callType === 'video') {
      iframe.classList.add('active');
      document.getElementById('call-ui').style.display = 'none';
    }
  });

  callFrame.on('left-meeting', () => {
    cleanup();
    window.history.back();
  });

  callFrame.on('error', (e) => {
    console.error(e);
    statusEl.textContent = 'Erreur de connexion';
  });

  try {
    await callFrame.join({
      url: roomUrl,
      startVideoOff: callType === 'audio',
      startAudioOff: false
    });
  } catch(e) {
    statusEl.textContent = 'Impossible de se connecter';
    console.error(e);
  }
}

function cleanup() {
  if (timerInterval) clearInterval(timerInterval);
}

window.toggleMute = function() {
  if (!callFrame) return;
  isMuted = !isMuted;
  callFrame.setLocalAudio(!isMuted);
  const icon = document.getElementById('mute-icon');
  icon.textContent = isMuted ? '🔇' : '🎤';
  icon.classList.toggle('active', isMuted);
}

window.toggleVideo = function() {
  if (!callFrame) return;
  isVideoOff = !isVideoOff;
  callFrame.setLocalVideo(!isVideoOff);
  const icon = document.getElementById('video-icon');
  icon.textContent = isVideoOff ? '📵' : '📹';

  const iframe = document.getElementById('daily-frame');
  const ui = document.getElementById('call-ui');

  if (!isVideoOff) {
    iframe.classList.add('active');
    ui.style.display = 'none';
  } else {
    iframe.classList.remove('active');
    ui.style.display = 'flex';
  }
}

window.toggleSpeaker = function() {
  isSpeakerOn = !isSpeakerOn;
  const icon = document.getElementById('speaker-icon');
  icon.textContent = isSpeakerOn ? '🔊' : '🔈';
  icon.classList.toggle('active', !isSpeakerOn);
}

window.addPerson = function() {
  alert('Fonctionnalité bientôt disponible : ajouter une personne à l\'appel !');
}

window.endCall = function() {
  cleanup();
  if (callFrame) {
    callFrame.leave();
  } else {
    window.history.back();
  }
}
