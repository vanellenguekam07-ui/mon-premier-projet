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
- [x] Projet Vercel **lv-surprise-event** relié au dépôt GitHub **LV-EVENT-COPI** (branche `main`) (Framework : *Other*, Build : vide, Output : `.`)
- [ ] Ou déploiement via l'assistant Arena (connecteur Vercel) sur demande
- [x] URL publique en ligne : **https://lv-surprise-event.vercel.app** (HTTPS inclus, gratuit)
- [ ] Acheter le domaine (ex : `lv-surprise.cm`) et le brancher dans Vercel → Domains
- [ ] Remplacer les URL `https://www.lv-surprise.cm/` dans `index.html`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`
- [ ] Tester sur mobile (4G) : vitesse, formulaire, WhatsApp, suivi

> ℹ️ Vercel héberge les fichiers du site ; la base de données est chez Supabase (étape 3, déjà faite).
> Chaque `git push` sur le dépôt redéploie automatiquement le site en ~1 minute.

## 3. Base de données partagée (Supabase) — ✅ FAIT
Le site n'est plus limité au navigateur : commandes, tarifs, photos et textes vivent dans la base.
- [x] Projet Supabase **lv-surprise-event** créé (région eu-west-1, plan gratuit)
- [x] Tables `admins`, `admin_sessions`, `orders`, `transactions`, `providers`, `site_content`
- [x] Règles **RLS** : rôles super / manager réellement appliqués par PostgreSQL
- [x] Mots de passe hachés en **bcrypt** côté serveur + verrouillage après 5 échecs
- [x] `js/config.js` rempli (URL + clé *publishable* — clé publique, sans risque)
- [x] `js/cloud.js` : synchronisation (lecture contenu public, commandes, finances, comptes)
- [ ] **Changer les mots de passe** des deux comptes (onglet Administrateurs) — obligatoire
- [ ] Vérifier le badge « 🟢 Synchronisé » en haut de l'espace Pro, sur téléphone **et** ordinateur

> ⚠️ Ne mettez jamais la clé `service_role` / « secret » dans `js/config.js` : la clé publique
> suffit, et les rôles sont contrôlés par la base.

## 4. Légal & business (Cameroun)
- [ ] Faire valider CGV / confidentialité / mentions légales par un professionnel
- [ ] Compléter raison sociale, RCCM, NIU dans les mentions légales
- [ ] Vérifier les obligations de facturation et de TVA applicables
- [ ] Tester le parcours complet : commande → WhatsApp → acompte MoMo → confirmation admin → suivi client

## 5. Après l'ouverture
- [ ] Google Search Console + Analytics (si souhaité)
- [ ] Sauvegarde automatique régulière (export JSON hebdomadaire minimum)
- [ ] Surveiller les commandes « En attente » chaque matin
