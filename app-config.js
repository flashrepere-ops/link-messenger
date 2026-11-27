// =====================================================
// Réglages de la liaison Link <-> NOVA-Africa
// À REMPLIR par vous. Les formats de liens ne changent jamais (voir deeplinks.js).
// =====================================================
export const APP_CONFIG = {
  nova: {
    scheme: 'nova',
    packageName: 'com.nova.africa',   // identifiant Android de NOVA : à confirmer avant de publier (définitif ensuite)
    storeUrl: '',                     // page Google Play de NOVA, quand elle existera
    downloadUrl: ''                   // en attendant : lien de téléchargement de l'APK de NOVA
  },
  link: {
    scheme: 'link',
    packageName: 'com.link.messenger', // identifiant Android de Link : à confirmer avant de publier (définitif ensuite)
    storeUrl: '',
    downloadUrl: ''
  },
  // Adresse du pont Lia -> NOVA une fois déployé, par exemple https://ton-projet.vercel.app/api/nova/bridge
  bridgeUrl: ''
};