// Appel invisible de Lia vers NOVA. Lia affiche seulement le résultat à l'utilisateur.
import { auth } from './firebase-config.js';
import { APP_CONFIG } from './app-config.js';
 
// service : taxi | food | job | hotel   action : search | book | cancel
export async function callNovaBridge({ service, action, params }) {
  if (!APP_CONFIG.bridgeUrl) return { ok: false, error: 'bridge_not_configured' };
  const user = auth.currentUser;
  if (!user) return { ok: false, error: 'not_signed_in' };
  try {
    const token = await user.getIdToken();
    const res = await fetch(APP_CONFIG.bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user_id: user.uid, service, action, params: params || {} })
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'network_error' };
  }
}