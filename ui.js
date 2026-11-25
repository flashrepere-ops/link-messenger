// =====================================================
// ui.js : socle commun à toutes les pages
//  1. Icônes SVG dynamiques (remplacent les emojis de l'interface)
//  2. Accessibilité (contraste, texte gras)
//  3. Sons de notification et vibration
//  4. Compression des images avant envoi
//  5. Verrouillage de l'application par code PIN
// =====================================================
 
// ---------- 1. ICÔNES SVG ----------
const ICONS = {
  'chat': '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.6-5.3A8.5 8.5 0 1 1 21 11.5z"/>',
  'phone': '<path d="M5 3.5h3.5l1.8 4.5-2.2 1.4a11 11 0 0 0 5 5l1.4-2.2 4.5 1.8V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 3.5 6.2 2.5 2.5 0 0 1 5 3.5z"/>',
  'phone-off': '<path d="M5 3.5h3.5l1.8 4.5-2.2 1.4a11 11 0 0 0 5 5l1.4-2.2 4.5 1.8V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 3.5 6.2 2.5 2.5 0 0 1 5 3.5z"/><path d="M3 3l18 18"/>',
  'status': '<circle cx="12" cy="12" r="9" stroke-dasharray="3.2 2.6"/><circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  'search': '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
  'paperclip': '<path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/>',
  'camera': '<path d="M4 8h3l1.5-2.5h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8z"/><circle cx="12" cy="13.5" r="3.5"/>',
  'mic': '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8 21.5h8"/>',
  'send': '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  'smile': '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2.5 4 2.5S16 14 16 14"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.4"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'user-plus': '<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>',
  'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.2A5.5 5.5 0 0 1 21.5 20"/>',
  'shield': '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9.5C7.2 20 4 16.5 4 12V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
  'bell-off': '<path d="M6 16v-5a6 6 0 0 1 9-5.2M18 11v5l1.5 2H8"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/><path d="M3 3l18 18"/>',
  'palette': '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.2-.4-1.2.4-2.3 1.7-2.3H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7.5" r="1" fill="currentColor"/>',
  'chart': '<path d="M4 20V11M10 20V4M16 20v-6M21 20H3"/>',
  'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  'unlock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  'clipboard': '<rect x="5.5" y="4.5" width="13" height="16.5" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6"/>',
  'folder': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  'zap': '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  'moon': '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  'battery': '<rect x="2.5" y="7.5" width="17" height="9" rx="2"/><path d="M22 10.5v3M6 10.5v3M9.5 10.5v3"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  'help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8"/><path d="M12 17h.01" stroke-width="2.4"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01" stroke-width="2.2"/>',
  'logout': '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 8l4 4-4 4M20 12H9"/>',
  'trash': '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  'key': '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
  'edit': '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  'star': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
  'more': '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
  'video': '<rect x="3" y="6" width="12.5" height="12" rx="2.5"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>',
  'file': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  'image': '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
  'store': '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8M10 20v-5h4v5"/>',
  'pin-map': '<path d="M12 21s7-6 7-11.5a7 7 0 1 0-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'calendar': '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  'ban': '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  'archive': '<rect x="3" y="4" width="18" height="4.5" rx="1.2"/><path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M10 13h4"/>',
  'pin': '<path d="M9 3h6l-1 6 3 3v1.5H7V12l3-3-1-6z"/><path d="M12 13.5V21"/>',
  'check': '<path d="M5 12.5l4.5 4.5L19 7"/>',
  'check-double': '<path d="M1.5 12.5l4.5 4.5L15 7"/><path d="M10 15.5l1.5 1.5L21.5 7"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 9.5"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  'volume': '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  'volume-low': '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>',
  'volume-off': '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  'save': '<path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v6h8V3M7 21v-7h10v7"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'x': '<path d="M6 6l12 12M18 6L6 18"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'chevron-right': '<path d="M9 5l7 7-7 7"/>',
  'chevron-down': '<path d="M5 9l7 7 7-7"/>',
  'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.4 6.5A16.5 16.5 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'bot': '<rect x="4" y="8" width="16" height="12" rx="3.5"/><path d="M12 8V4.5M9.5 4.5h5"/><circle cx="9" cy="13.5" r="1.3" fill="currentColor"/><circle cx="15" cy="13.5" r="1.3" fill="currentColor"/><path d="M9.5 17h5"/>',
  'share': '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  'download': '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/>',
  'link': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  'alert': '<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5h.01" stroke-width="2.2"/>',
  'refresh': '<path d="M20 11a8 8 0 0 0-14.5-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 3.5M20 20v-4h-4"/>',
  'tool': '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/>',
  'type': '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
  'contrast': '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  'keyboard': '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7 14h10" stroke-width="2"/>',
  'timer': '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5"/>',
  'stop': '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  'accessibility': '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5M9 21l3-6 3 6"/>',
  'vibrate': '<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8M2 10.5v3M22 10.5v3"/>',
  'music': '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  'sparkles': '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
  'crown': '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/>',
  'megaphone': '<path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"/>'
};
 
// emoji (sans sélecteur de variation) -> nom d'icône
const EMOJI_MAP = {
  '💬': 'chat', '📞': 'phone', '📵': 'phone-off', '🔵': 'status', '⚙': 'settings', '🔍': 'search',
  '📎': 'paperclip', '📷': 'camera', '🎤': 'mic', '➤': 'send', '😊': 'smile', '👤': 'user', '👤+': 'user-plus',
  '👥': 'users', '🛡': 'shield', '🔔': 'bell', '🔕': 'bell-off', '🎨': 'palette', '📊': 'chart', '🔒': 'lock',
  '🔓': 'unlock', '📋': 'clipboard', '📁': 'folder', '⚡': 'zap', '🌙': 'moon', '🔋': 'battery', '🌐': 'globe',
  '❓': 'help', '🚪': 'logout', '🗑': 'trash', '🔑': 'key', '📧': 'mail', '✉': 'mail', '✏': 'edit', '⭐': 'star',
  '⋮': 'more', '📹': 'video', '📄': 'file', '🖼': 'image', '🏬': 'store', '📍': 'pin-map', '📅': 'calendar',
  '🚫': 'ban', '🗄': 'archive', '🗂': 'archive', '📌': 'pin', '✓': 'check', '✓✓': 'check-double',
  '✅': 'check-circle', '❌': 'x-circle', '🔊': 'volume', '🔈': 'volume-low', '🔇': 'volume-off', '💾': 'save',
  '➕': 'plus', '✕': 'x', '←': 'arrow-left', '›': 'chevron-right', '▾': 'chevron-down', '👁': 'eye',
  '🙈': 'eye-off', '🤖': 'bot', '📤': 'share', '🔗': 'link', '⚠': 'alert', '🔄': 'refresh', '🛠': 'tool',
  '🔤': 'type', '🌗': 'contrast', '⌨': 'keyboard', '⏱': 'timer', '⏹': 'stop', '♿': 'accessibility',
  '📳': 'vibrate', '🎵': 'music', 'ℹ': 'info', '✨': 'sparkles', '👑': 'crown', '📢': 'megaphone'
};
 
const SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
 
function iconHtml(name, extraClass) {
  const inner = ICONS[name];
  if (!inner) return '';
  return '<span class="svg-icon' + (extraClass ? ' ' + extraClass : '') + '" data-icon="' + name + '">' + SVG_OPEN + inner + '</svg></span>';
}
 
function iconEl(name) {
  const tpl = document.createElement('template');
  tpl.innerHTML = iconHtml(name);
  return tpl.content.firstChild;
}
 
window.icon = iconHtml;
window.setIcon = function(el, name) { el.innerHTML = iconHtml(name); };
 
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emojiKeys = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length).map(escRe).join('|');
const RE_TEST = new RegExp('(?:' + emojiKeys + ')', 'u');
const RE_ALL = new RegExp('(' + emojiKeys + ')\\uFE0F?', 'gu');
 
// Contenus écrits par les utilisateurs : on ne touche jamais aux emojis qu'ils contiennent
const SKIP = 'script,style,textarea,option,select,title,input,.svg-icon,.no-icons,.msg-text,.ai-bubble,' +
  '.status-viewer-text-content,.status-viewer-caption,.conv-last-msg,.emoji-grid,.emoji-btn,.quick-reply-item,.qr-row span';
 
function convertTextNode(node) {
  const text = node.nodeValue;
  if (!text || !RE_TEST.test(text)) return;
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP)) return;
 
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(RE_ALL)) {
    const name = EMOJI_MAP[m[1]];
    if (!name || !ICONS[name]) continue;
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    frag.appendChild(iconEl(name));
    last = m.index + m[0].length;
  }
  if (last === 0) return;
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  node.parentNode.replaceChild(frag, node);
}
 
function scan(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) { convertTextNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.closest && root.closest('.svg-icon')) return;
 
  const filled = root.matches && root.matches('[data-icon]:empty') ? [root] : [];
  root.querySelectorAll && root.querySelectorAll('[data-icon]:empty').forEach(e => filled.push(e));
  filled.forEach(e => { e.innerHTML = iconHtml(e.dataset.icon); e.classList.add('svg-icon'); });
 
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(convertTextNode);
}
 
function injectIconCss() {
  if (document.getElementById('lm-icon-css')) return;
  const s = document.createElement('style');
  s.id = 'lm-icon-css';
  s.textContent = `
.svg-icon{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;vertical-align:-0.2em;line-height:1;flex-shrink:0;transition:transform .18s ease,color .18s ease,filter .18s ease}
.svg-icon svg{width:100%;height:100%;display:block;overflow:visible}
button:hover>.svg-icon,.nav-btn:hover .svg-icon,.settings-category-item:hover .svg-icon{transform:scale(1.12)}
button:active>.svg-icon{transform:scale(.9)}
.nav-btn span:first-child .svg-icon{width:24px;height:24px}
.nav-btn.active .svg-icon{color:#34d399;filter:drop-shadow(0 0 6px rgba(52,211,153,.7));animation:lmPop .35s ease}
.cat-icon .svg-icon{width:22px;height:22px;color:#fff}
.attach-icon .svg-icon{width:26px;height:26px}
.fab .svg-icon,.ctrl-icon .svg-icon{width:26px;height:26px}
.send-btn .svg-icon{width:21px;height:21px}
.end-call-btn .svg-icon{width:30px;height:30px}
.doc-card-icon .svg-icon{width:30px;height:30px}
.msg-check .svg-icon{width:1.25em;height:1.25em;vertical-align:-0.3em}
.svg-icon.is-filled svg{fill:currentColor}
.svg-icon.spin svg{animation:lmSpin 1s linear infinite}
#fav-btn.fav-on .svg-icon{color:#fbbf24}
#fav-btn.fav-on .svg-icon svg{fill:#fbbf24}
@keyframes lmSpin{to{transform:rotate(360deg)}}
@keyframes lmPop{0%{transform:scale(.7)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
body.power-saver .svg-icon,body.power-saver .svg-icon svg{animation:none!important;transition:none!important}
body.a11y-contrast{--glass-bg:rgba(0,0,0,.62);--glass-bg-strong:rgba(0,0,0,.74);--glass-border:rgba(255,255,255,.75);--text-muted:rgba(255,255,255,.9)}
body.a11y-bold :where(*){font-weight:600}
`;
  document.head.appendChild(s);
}
 
let converting = false;
function startIcons() {
  injectIconCss();
  scan(document.body);
  new MutationObserver(muts => {
    if (converting) return;
    converting = true;
    try {
      for (const m of muts) {
        if (m.type === 'characterData') scan(m.target);
        else m.addedNodes.forEach(scan);
      }
    } finally { converting = false; }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
 
// ---------- 2. ACCESSIBILITÉ ----------
window.LM_applyA11y = function() {
  document.body.classList.toggle('a11y-contrast', localStorage.getItem('a11yContrast') === 'true');
  document.body.classList.toggle('a11y-bold', localStorage.getItem('a11yBold') === 'true');
};
 
window.LM_applyPrefs = function() {
  const root = document.documentElement;
  const dyn = localStorage.getItem('dynamism') || 'soft';
  root.classList.toggle('dyn-off', dyn === 'off');
  root.classList.toggle('dyn-intense', dyn === 'intense');
  root.style.setProperty('--dyn', dyn === 'intense' ? '1.5' : '1');
  root.style.setProperty('--bubble-radius', (localStorage.getItem('bubbleRadius') || '12') + 'px');
  const fonts = {
    system: "'Segoe UI', sans-serif",
    rounded: "ui-rounded, 'Nunito', 'Trebuchet MS', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Courier New', monospace"
  };
  root.style.setProperty('--msg-font-family', fonts[localStorage.getItem('msgFont') || 'system'] || fonts.system);
  document.body.classList.toggle('compact', localStorage.getItem('compact') === 'true');
  document.body.classList.toggle('hide-badges', localStorage.getItem('hideBadges') === 'true');
};
 
// ---------- 3. SONS & VIBRATION ----------
window.LM_playTone = function(name) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const seqs = {
    cloche: [[1318.5, 0, .15], [1567.98, .12, .28]],
    pop: [[880, 0, .08]],
    carillon: [[1046.5, 0, .18], [1318.5, .15, .18], [1567.98, .3, .3]],
    bip: [[1000, 0, .12], [1000, .18, .12]]
  };
  const seq = seqs[name];
  if (!AC || !seq) return;
  try {
    const ctx = new AC();
    if (ctx.resume) ctx.resume();
    const now = ctx.currentTime;
    seq.forEach(([freq, delay, dur]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.exponentialRampToValueAtTime(0.35, now + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + delay); o.stop(now + delay + dur + 0.02);
    });
    setTimeout(() => { try { ctx.close(); } catch(e) {} }, 1500);
  } catch(e) {}
};
 
function inQuietHours() {
  if (localStorage.getItem('quietHours') !== 'true') return false;
  const toMin = s => { const p = (s || '').split(':').map(Number); return p[0] * 60 + (p[1] || 0); };
  const start = toMin(localStorage.getItem('quietStart') || '22:00');
  const end = toMin(localStorage.getItem('quietEnd') || '07:00');
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return start <= end ? (cur >= start && cur < end) : (cur >= start || cur < end);
}
 
window.LM_notify = function() {
  if (inQuietHours()) return;
  if (localStorage.getItem('sound') !== 'false') {
    const tone = localStorage.getItem('notifTone') || 'cloche';
    if (tone !== 'none') window.LM_playTone(tone);
  }
  if (localStorage.getItem('vibrate') !== 'false' && navigator.vibrate) navigator.vibrate([120, 60, 120]);
};
 
// ---------- 4. COMPRESSION D'IMAGES ----------
// Les images sont stockées dans Firestore (limite ~1 Mo par document) : on les réduit avant l'envoi.
window.LM_compressDataUrl = function(dataUrl, maxDimOverride) {
  return new Promise(resolve => {
    if (!dataUrl || /^data:image\/(gif|svg)/.test(dataUrl)) { resolve(dataUrl); return; }
    const quality = localStorage.getItem('uploadQuality') || 'standard';
    const presets = { saver: [800, 0.6], standard: [1280, 0.75], hd: [1920, 0.9] };
    const [maxDim0, q] = presets[quality] || presets.standard;
    const maxDim = maxDimOverride || maxDim0;
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', q));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};
 
// ---------- 5. VERROUILLAGE PAR CODE PIN ----------
// Verrou local de l'écran : il protège contre un regard indiscret, pas contre un utilisateur averti.
async function sha(pin) {
  const data = new TextEncoder().encode('lm-lock:' + pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
 
window.AppLock = {
  isEnabled: () => !!localStorage.getItem('appLockHash'),
  async setPin(pin) {
    localStorage.setItem('appLockHash', await sha(pin));
    sessionStorage.setItem('appUnlocked', 'true');
  },
  async check(pin) { return (await sha(pin)) === localStorage.getItem('appLockHash'); },
  async disable(pin) {
    if (!(await this.check(pin))) return false;
    localStorage.removeItem('appLockHash');
    return true;
  }
};
 
function showLockScreen() {
  const css = document.createElement('style');
  css.textContent = `
#lm-lock{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(ellipse 80% 50% at 85% 12%,rgba(52,211,153,.45),transparent 60%),linear-gradient(160deg,#021a16,#04302a 50%,#03221e);color:#eafff7;font-family:'Segoe UI',sans-serif}
#lm-lock .lock-ico{width:54px;height:54px;color:#6ee7b7}
#lm-lock h2{font-size:20px;font-weight:700}
#lm-lock .dots{display:flex;gap:14px;height:16px}
#lm-lock .dots i{width:14px;height:14px;border-radius:50%;border:2px solid #6ee7b7}
#lm-lock .dots i.on{background:#6ee7b7}
#lm-lock .pad{display:grid;grid-template-columns:repeat(3,72px);gap:14px}
#lm-lock .pad button{height:72px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;font-size:26px;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
#lm-lock .pad button:active{background:rgba(255,255,255,.28)}
#lm-lock .err{height:18px;font-size:14px;color:#fda4af}
@keyframes lmShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
`;
  document.head.appendChild(css);
 
  const box = document.createElement('div');
  box.id = 'lm-lock';
  box.innerHTML = '<span class="svg-icon lock-ico">' + SVG_OPEN + ICONS.lock + '</svg></span>' +
    '<h2>Link Messenger est verrouillé</h2><div class="dots"><i></i><i></i><i></i><i></i></div><div class="err"></div>' +
    '<div class="pad">' + [1,2,3,4,5,6,7,8,9,'',0,'<'].map(k => k === '' ? '<span></span>' : '<button data-k="' + k + '">' + (k === '<' ? '⌫' : k) + '</button>').join('') + '</div>';
  document.body.appendChild(box);
 
  let entered = '';
  const dots = box.querySelectorAll('.dots i');
  const err = box.querySelector('.err');
  const render = () => dots.forEach((d, i) => d.classList.toggle('on', i < entered.length));
 
  box.querySelector('.pad').addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const k = btn.dataset.k;
    if (k === '<') entered = entered.slice(0, -1);
    else if (entered.length < 4) entered += k;
    render();
    if (entered.length === 4) {
      if (await window.AppLock.check(entered)) {
        sessionStorage.setItem('appUnlocked', 'true');
        box.remove();
      } else {
        err.textContent = 'Code incorrect';
        box.querySelector('.dots').style.animation = 'lmShake .3s';
        setTimeout(() => { box.querySelector('.dots').style.animation = ''; }, 350);
        entered = ''; render();
      }
    }
  });
}
 
// ---------- 6. RETOUR HAPTIQUE ----------
document.addEventListener('pointerdown', e => {
  if (localStorage.getItem('haptics') === 'false' || !navigator.vibrate) return;
  if (e.target.closest && e.target.closest('button, .nav-btn, .conv-item, .settings-category-item, .toggle')) navigator.vibrate(6);
}, { passive: true });
 
// ---------- 7. VITESSE DES MESSAGES VOCAUX ----------
document.addEventListener('play', e => {
  if (e.target && e.target.tagName === 'AUDIO') e.target.playbackRate = Number(localStorage.getItem('voiceSpeed') || 1);
}, true);
 
// ---------- 8. VERROUILLAGE AUTOMATIQUE ----------
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { sessionStorage.setItem('lmHiddenAt', String(Date.now())); return; }
  const delay = localStorage.getItem('autoLockDelay') || 'never';
  const hiddenAt = Number(sessionStorage.getItem('lmHiddenAt') || 0);
  if (delay === 'never' || !window.AppLock.isEnabled() || !hiddenAt) return;
  if (Date.now() - hiddenAt >= Number(delay) && !document.getElementById('lm-lock')) {
    sessionStorage.removeItem('appUnlocked');
    showLockScreen();
  }
});
 
// ---------- DÉMARRAGE ----------
function boot() {
  window.LM_applyA11y();
  window.LM_applyPrefs();
  startIcons();
  if (window.AppLock.isEnabled() && sessionStorage.getItem('appUnlocked') !== 'true') showLockScreen();
}
 
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
