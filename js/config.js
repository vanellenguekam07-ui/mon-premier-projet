/* ═══════════════════════════════════════════════════════════════
   CONFIGURATION — à remplir UNIQUEMENT à l'étape hébergement
   ───────────────────────────────────────────────────────────────
   Tant que SUPABASE_URL est vide, le site fonctionne en mode
   100% local (localStorage, navigateur unique).
   Pour passer en production multi-appareils :
   1. Crée un projet Supabase (gratuit)
   2. Exécute supabase/schema.sql dans l'éditeur SQL
   3. Colle ici l'URL du projet + la clé "anon public"
   4. Recharge le site : les données migreront automatiquement
   ⚠️  Ne mets JAMAIS la clé "service_role" (secrète) dans ce fichier.
   ═══════════════════════════════════════════════════════════════ */
window.LV_CONFIG = {
  SUPABASE_URL: '',        // ex: 'https://xxxx.supabase.co'
  SUPABASE_ANON_KEY: '',   // clé anon public uniquement
  WHATSAPP_NUMBER: ''      // ex: '237690000000' (sans + ni espaces) — sinon le téléphone du footer est utilisé
};
