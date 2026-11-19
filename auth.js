import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, getDocs,
  collection, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
 
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}
if (localStorage.getItem('powerSaver') === 'true') {
  document.body.classList.add('power-saver');
}
 
function setError(text, ok = false) {
  const el = document.getElementById('error-msg');
  el.style.color = ok ? '#6ee7b7' : '#fda4af';
  el.textContent = text;
}
 
// Afficher connexion
window.showLogin = function() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('switch-text').textContent = 'Pas encore de compte ?';
  const link = document.getElementById('switch-link');
  link.textContent = "S'inscrire";
  link.onclick = window.showRegister;
  setError('');
}
 
// Afficher inscription
window.showRegister = function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('switch-text').textContent = 'Déjà un compte ?';
  const link = document.getElementById('switch-link');
  link.textContent = 'Se connecter';
  link.onclick = window.showLogin;
  setError('');
}
 
// Afficher / masquer le mot de passe
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁️';
}
 
// Inscription
window.register = async function() {
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
 
  if (!username || !email || !password) {
    setError("Remplis tous les champs !");
    return;
  }
 
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError("Ce nom d'utilisateur est déjà pris !");
      return;
    }
 
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      username: username,
      email: email,
      avatar: '',
      createdAt: new Date()
    });
 
    window.location.href = 'home.html';
  } catch(e) {
    setError("Erreur : " + e.message);
  }
}
 
// Connexion
window.login = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
 
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'home.html';
  } catch(e) {
    setError("Email ou mot de passe incorrect !");
  }
}
 
// Connexion avec Google
window.loginWithGoogle = async function() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
 
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
 
    if (!existing.exists()) {
      let username = (user.displayName || user.email.split('@')[0]).trim();
      const taken = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
      if (!taken.empty) username += Math.floor(100 + Math.random() * 900);
 
      await setDoc(userRef, {
        uid: user.uid,
        username,
        email: user.email,
        avatar: user.photoURL || '',
        createdAt: new Date()
      });
    }
 
    window.location.href = 'home.html';
  } catch(e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    if (e.code === 'auth/operation-not-allowed') {
      setError("Connexion Google non activée dans Firebase.");
    } else if (e.code === 'auth/unauthorized-domain') {
      setError("Domaine non autorisé dans Firebase (voir Authentication > Settings).");
    } else {
      setError("Erreur Google : " + e.message);
    }
  }
}
 
// Mot de passe oublié
window.resetPassword = async function() {
  const email = document.getElementById('login-email').value.trim();
 
  if (!email) {
    setError("Entre ton email d'abord !");
    return;
  }
 
  try {
    await sendPasswordResetEmail(auth, email);
    setError("Email de réinitialisation envoyé !", true);
  } catch(e) {
    setError("Erreur : " + e.message);
  }
}