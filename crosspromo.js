// Carte de recommandation croisée : une fois par semaine au maximum.
// « Plus tard » = on ne la remontre pas pendant 7 jours.
import { isAppInstalled, openStore } from './deeplinks.js';
 
const WEEK = 7 * 24 * 3600 * 1000;
const KEY = 'crossPromo_nova';
 
function readState() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function writeState(st) { localStorage.setItem(KEY, JSON.stringify(st)); }
 
export function canShowPromo(now, st) {
  const s = st || readState();
  const t = now == null ? Date.now() : now;
  if (s.snoozedUntil && t < s.snoozedUntil) return false;
  if (s.lastShown && t - s.lastShown < WEEK) return false;
  return true;
}
 
export function markShown(now) { writeState(Object.assign(readState(), { lastShown: now == null ? Date.now() : now })); }
export function snooze(now) { writeState(Object.assign(readState(), { snoozedUntil: (now == null ? Date.now() : now) + WEEK })); }
 
// Sur le web on ne peut pas savoir si NOVA est installée : la carte n'apparaît que dans l'APK.
// Pour la tester : localStorage.setItem('forcePromo', 'true')
export async function maybeShowNovaCard() {
  const forced = localStorage.getItem('forcePromo') === 'true';
  if (!forced) {
    const installed = await isAppInstalled('nova');
    if (installed !== false) return;
    if (!canShowPromo()) return;
  }
  const anchor = document.querySelector('.tabs-bar');
  if (!anchor || document.getElementById('promo-nova')) return;
 
  const card = document.createElement('div');
  card.id = 'promo-nova';
  card.className = 'announce-banner promo-card';
 
  const text = document.createElement('div');
  text.textContent = 'Débloque le vrai pouvoir de Lia ! Télécharge NOVA-Africa pour que Lia te trouve taxi, nourriture, job.';
 
  const actions = document.createElement('div');
  actions.className = 'promo-actions';
 
  const dl = document.createElement('button');
  dl.className = 'promo-btn promo-primary';
  dl.textContent = 'Télécharger NOVA';
  dl.onclick = () => { markShown(); openStore('nova'); card.remove(); };
 
  const later = document.createElement('button');
  later.className = 'promo-btn';
  later.textContent = 'Plus tard';
  later.onclick = () => { snooze(); card.remove(); };
 
  actions.appendChild(dl);
  actions.appendChild(later);
  card.appendChild(text);
  card.appendChild(actions);
  anchor.insertAdjacentElement('afterend', card);
  markShown();
}