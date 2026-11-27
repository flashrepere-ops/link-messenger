// =====================================================
// Deep links Link <-> NOVA. FORMAT FIGÉ (spécification V1.0).
// Ne jamais changer ces formats, même lors d'une mise à jour :
//   nova://chat?service=taxi&driver_id=12345&order_id=6789
//   nova://chat?service=food&seller_id=54321&order_id=9999
//   nova://chat?service=job&employer_id=11111&order_id=2222
//   link://chat?user_id=72230580
//   link://chat?group_id=XXXX
// =====================================================
import { APP_CONFIG } from './app-config.js';
 
export const PROVIDER_PARAM = Object.freeze({ taxi: 'driver_id', food: 'seller_id', job: 'employer_id' });
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
 
function cleanId(label, value) {
  const v = String(value == null ? '' : value);
  if (!ID_RE.test(v)) throw new Error('Identifiant invalide : ' + label);
  return v;
}
 
export function buildNovaChatLink({ service, providerId, orderId }) {
  const param = PROVIDER_PARAM[service];
  if (!param) throw new Error('Service inconnu : ' + service);
  return 'nova://chat?service=' + service + '&' + param + '=' + cleanId(param, providerId) + '&order_id=' + cleanId('order_id', orderId);
}
 
export function buildLinkChatLink({ userId, groupId }) {
  if (userId && groupId) throw new Error('userId ou groupId, pas les deux');
  if (userId) return 'link://chat?user_id=' + cleanId('user_id', userId);
  if (groupId) return 'link://chat?group_id=' + cleanId('group_id', groupId);
  throw new Error('userId ou groupId requis');
}
 
// Lit un lien reçu. Retourne null si le lien n'est pas valide.
export function parseDeepLink(url) {
  const m = /^(nova|link):\/\/chat\?(.*)$/.exec(String(url || ''));
  if (!m) return null;
  const p = {};
  try {
    for (const pair of m[2].split('&')) {
      const i = pair.indexOf('=');
      const k = decodeURIComponent(i === -1 ? pair : pair.slice(0, i));
      const v = i === -1 ? '' : decodeURIComponent(pair.slice(i + 1));
      if (k) p[k] = v;
    }
  } catch (e) { return null; }
 
  if (m[1] === 'nova') {
    const param = PROVIDER_PARAM[p.service];
    if (!param || !ID_RE.test(p[param] || '') || !ID_RE.test(p.order_id || '')) return null;
    return { app: 'nova', screen: 'chat', service: p.service, providerId: p[param], orderId: p.order_id };
  }
  if (ID_RE.test(p.user_id || '')) return { app: 'link', screen: 'chat', userId: p.user_id };
  if (ID_RE.test(p.group_id || '')) return { app: 'link', screen: 'chat', groupId: p.group_id };
  return null;
}
 
// Lien Android qui ouvre l'appli, ou bascule vers la page de téléchargement si elle est absente
export function buildAndroidIntentUrl(deepLink, appKey) {
  const cfg = APP_CONFIG[appKey];
  const rest = String(deepLink).replace(/^[a-z]+:\/\//, '');
  const fallback = cfg.storeUrl || cfg.downloadUrl;
  return 'intent://' + rest + '#Intent;scheme=' + cfg.scheme + ';package=' + cfg.packageName + ';' +
    (fallback ? 'S.browser_fallback_url=' + encodeURIComponent(fallback) + ';' : '') + 'end';
}
 
function launcher() {
  return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher;
}
 
// true / false dans l'APK ; null sur le web (impossible à savoir)
export async function isAppInstalled(appKey) {
  const l = launcher();
  if (!l) return null;
  try {
    const r = await l.canOpenUrl({ url: APP_CONFIG[appKey].scheme + '://chat' });
    return !!r.value;
  } catch (e) { return null; }
}
 
export function openStore(appKey) {
  const cfg = APP_CONFIG[appKey];
  const url = cfg.storeUrl || cfg.downloadUrl;
  if (!url) return 'unavailable';
  window.location.href = url;
  return 'store';
}
 
// Ouvre l'autre appli directement sur la bonne discussion, sinon sa page de téléchargement
export async function openApp(appKey, deepLink) {
  const l = launcher();
  if (l) {
    try {
      const r = await l.canOpenUrl({ url: deepLink });
      if (r.value) { await l.openUrl({ url: deepLink }); return 'opened'; }
    } catch (e) { /* on bascule vers le téléchargement */ }
    return openStore(appKey);
  }
  if (/Android/i.test(navigator.userAgent)) {
    window.location.href = buildAndroidIntentUrl(deepLink, appKey);
    return 'intent';
  }
  return openStore(appKey);
}