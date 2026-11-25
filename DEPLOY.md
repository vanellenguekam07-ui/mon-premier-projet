# 🚀 Mise en service — Checklist hébergement

Le site est corrigé et testé en local. Il reste ces étapes **externes au code** avant l'ouverture commerciale :

## 1. Remplir les vraies informations (admin → Contenu du site)
- [ ] Téléphone réel, email réel, **numéro WhatsApp** de réception des commandes
- [ ] **Numéros MTN MoMo / Orange Money** exacts dans « Moyens de paiement »
- [ ] Compteur « surprises réalisées » = nombre réel (ou 0)
- [ ] Remplacer les 3 avis clients par de vrais avis (avec accord des clients)
- [ ] Changer les mots de passe admin (onglet Équipe, 10 caractères min) — **obligatoire**
- [ ] Purger les données de test si elles ont été chargées (Zone dangereuse)
- [ ] Exporter une sauvegarde JSON et la conserver en lieu sûr

## 2. Héberger le site statique — Vercel (choisi)
Le fichier `vercel.json` est déjà prêt (site statique, en-têtes de sécurité, cache images).
- [ ] Dans Vercel : **Add New → Project → Import** le dépôt GitHub `mon-premier-projet` (Framework : *Other*, Build : vide, Output : `.`)
- [ ] Ou déploiement via l'assistant Arena (connecteur Vercel) sur demande
- [ ] L'URL publique sera du type `mon-premier-projet.vercel.app` (HTTPS inclus, gratuit)
- [ ] Acheter le domaine (ex : `lv-surprise.cm`) et le brancher dans Vercel → Domains
- [ ] Remplacer les URL `https://www.lv-surprise.cm/` dans `index.html`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`
- [ ] Tester sur mobile (4G) : vitesse, formulaire, WhatsApp, suivi

> ⚠️ **Important :** Vercel héberge uniquement les fichiers du site. Il ne crée pas de base de données :
> après déploiement, le fonctionnement reste identique à l'aperçu actuel (données dans le navigateur,
> confirmation par WhatsApp). Voir l'étape 3 pour la synchro multi-appareils.

## 3. Base de données partagée (Supabase) — recommandé avant l'ouverture
Sans cette étape, les commandes restent dans le navigateur du client et **l'admin ne les voit pas** sur un autre appareil.
- [ ] Créer un projet Supabase (gratuit)
- [ ] Exécuter `supabase/schema.sql` dans SQL Editor
- [ ] Créer les comptes admin dans Supabase Auth, **désactiver l'inscription publique**
- [ ] Renseigner `SUPABASE_URL` + clé `anon` dans `js/config.js` (jamais la clé `service_role`)
- [ ] Brancher `js/app.js` sur Supabase (remplacer les appels `localStorage` par les requêtes — schéma prêt)

## 4. Légal & business (Cameroun)
- [ ] Faire valider CGV / confidentialité / mentions légales par un professionnel
- [ ] Compléter raison sociale, RCCM, NIU dans les mentions légales
- [ ] Vérifier les obligations de facturation et de TVA applicables
- [ ] Tester le parcours complet : commande → WhatsApp → acompte MoMo → confirmation admin → suivi client

## 5. Après l'ouverture
- [ ] Google Search Console + Analytics (si souhaité)
- [ ] Sauvegarde automatique régulière (export JSON hebdomadaire minimum)
- [ ] Surveiller les commandes « En attente » chaque matin
