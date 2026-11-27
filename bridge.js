// =====================================================
// POST /api/nova/bridge : pont Lia -> NOVA (fonction Vercel)
// STRUCTURE UNIQUEMENT : tant que les étapes ci-dessous ne sont pas faites,
// la fonction vérifie le format de la demande puis répond 501, sans rien exécuter.
//
// Corps attendu :
// { "token": "...", "user_id": "...", "service": "taxi|food|job|hotel",
//   "action": "search|book|cancel", "params": { "heure": "15:00", "destination": "Lomé" } }
//
// Le « token » est le jeton d'identité Firebase de l'utilisateur (pas un secret inventé).
// =====================================================
const SERVICES = ['taxi', 'food', 'job', 'hotel'];
const ACTIONS = ['search', 'book', 'cancel'];
 
function validateBridgeRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return { ok: false, errors: ['corps manquant'] };
  if (typeof body.token !== 'string' || !body.token) errors.push('token manquant');
  if (typeof body.user_id !== 'string' || !body.user_id) errors.push('user_id manquant');
  if (!SERVICES.includes(body.service)) errors.push('service invalide');
  if (!ACTIONS.includes(body.action)) errors.push('action invalide');
  if (body.params != null && (typeof body.params !== 'object' || Array.isArray(body.params))) errors.push('params invalide');
  return { ok: errors.length === 0, errors };
}
 
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
 
  const check = validateBridgeRequest(req.body);
  if (!check.ok) return res.status(400).json({ ok: false, error: 'bad_request', details: check.errors });
 
  // ÉTAPE 1 (à faire) : vérifier le jeton avec firebase-admin et exiger que user_id == uid du jeton
  // ÉTAPE 2 (à faire) : appeler NOVA selon service/action, puis renvoyer { ok, chauffeur, prix, temps, id }
  return res.status(501).json({ ok: false, error: 'not_implemented' });
}
 
module.exports = handler;
module.exports.validateBridgeRequest = validateBridgeRequest;