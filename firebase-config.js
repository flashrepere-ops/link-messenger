import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAb0yCOtdU91YgEYAyQKxH-aN0eL7SazxE",
  authDomain: "link-messenger-952eb.firebaseapp.com",
  projectId: "link-messenger-952eb",
  storageBucket: "link-messenger-952eb.firebasestorage.app",
  messagingSenderId: "633240088719",
  appId: "1:633240088719:web:7ec74f931c6edefa5200fa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);