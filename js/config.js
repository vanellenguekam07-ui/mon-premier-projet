/* ═══════════════════════════════════════════════════════════════
   CONFIGURATION — LV SURPRISE EVENT
   ───────────────────────────────────────────────────────────────
   Ces valeurs sont PUBLIQUES et sans danger : la clé « publishable »
   ne permet que ce que les règles de sécurité (RLS) autorisent.
   ⚠️  Ne mettez JAMAIS ici une clé « secret » / « service_role ».
   ───────────────────────────────────────────────────────────────
   Projet Supabase : lv-surprise-event (région eu-west-1)
   Tables : site_content (catalogue + textes), orders, transactions,
            providers, admins, admin_sessions
   Si SUPABASE_URL est vidé → le site retombe en mode 100 % local
   (données dans le navigateur uniquement).
   ═══════════════════════════════════════════════════════════════ */
window.LV_CONFIG = {
  SUPABASE_URL: 'https://dzylqxnrmnsgcuhaqprg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_jQo6wTbb2f49FxQJRt_zLw_9SWt8Io3',
  WHATSAPP_NUMBER: ''      // ex : '237690000000' — sinon le numéro de l'admin est utilisé
};
