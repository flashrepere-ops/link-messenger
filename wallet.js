// Portefeuille unique Link Pay = NOVA Pay : un seul document wallets/{uid}, lu en direct.
// Lecture seule ici : les soldes ne se modifient JAMAIS depuis l'application, uniquement depuis le serveur.
import { db } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export { formatFCFA } from './wallet-format.js';
 
export function watchWallet(uid, callback) {
  return onSnapshot(
    doc(db, 'wallets', uid),
    snap => callback(snap.exists() ? snap.data() : { balance: 0 }),
    () => callback({ balance: 0, error: true })
  );
}