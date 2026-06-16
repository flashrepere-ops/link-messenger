import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  doc, setDoc, getDocs,
  collection, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// Afficher connexion
window.showLogin = function() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.querySelectorAll('.tab')[0].classList.add('active');
  document.querySelectorAll('.tab')[1].classList.remove('active');
}

// Afficher inscription
window.showRegister = function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.querySelectorAll('.tab')[0].classList.remove('active');
  document.querySelectorAll('.tab')[1].classList.add('active');
}

// Inscription
window.register = async function() {
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errorMsg = document.getElementById('error-msg');

  if (!username || !email || !password) {
    errorMsg.textContent = "Remplis tous les champs !";
    return;
  }

  try {
    // Vérifier username unique
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) {
      errorMsg.textContent = "Ce nom d'utilisateur est déjà pris !";
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
    errorMsg.textContent = "Erreur : " + e.message;
  }
}

// Connexion
window.login = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('error-msg');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'home.html';
  } catch(e) {
    errorMsg.textContent = "Email ou mot de passe incorrect !";
  }
}

// Mot de passe oublié
window.resetPassword = async function() {
  const email = document.getElementById('login-email').value.trim();
  const errorMsg = document.getElementById('error-msg');

  if (!email) {
    errorMsg.textContent = "Entre ton email d'abord !";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    errorMsg.style.color = 'green';
    errorMsg.textContent = "Email de réinitialisation envoyé !";
  } catch(e) {
    errorMsg.textContent = "Erreur : " + e.message;
  }
}
