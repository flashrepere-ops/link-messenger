// Affichage d'un montant en francs CFA : 1000 -> « 5 000 F »
export function formatFCFA(n) {
  const v = Math.round(Number(n) || 0);
  return String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') .replace(/^/, v < 0 ? '-' : '') + ' F';
}