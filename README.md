# 🎁 LV Surprise Event — Application Web Pro

Application web de réservation et de gestion d'anniversaires surprises sur mesure : décorations, gâteaux personnalisés, bouquets d'argent, paniers gourmands et animations musicales.

> ✅ **État actuel : site en ligne, synchronisé et sécurisé.**
> - Site public : **https://lv-surprise-event.vercel.app**
> - Base de données : Supabase (`lv-surprise-event`) — tarifs, textes, commandes et finances partagés
> - Les rôles (Super Admin / Manager) sont **vérifiés par la base de données**, pas par le navigateur
> Voir [`DEPLOY.md`](DEPLOY.md) pour la checklist de mise en service.

## 🚀 Fonctionnalités

### 👤 Espace Client
- **Accueil vitrine** : hero, univers de prestations, avis clients, packs promo.
- **Page Nos Gâteaux** : créations artisanales avec photos, descriptions et **tarifs affichés**.
- **Page Prestations** : décoration, espace photo, bouquet d'argent, panier gourmand, musiciens — chacun avec photo et tarif.
- **Devis & réservation** : panier à la carte, remise pack auto (-10 % déco + gâteau), acompte 30 %, récapitulatif instantané, validation téléphone camerounais, captcha anti-spam, consentement CGV.
- **Confirmation WhatsApp** : le client confirme sa réservation en 1 clic avec un récapitulatif pré-rempli envoyé au numéro WhatsApp de la boutique.
- **Suivi commande sécurisé** : référence **+** téléphone requis (plus de recherche par téléphone seul).
- **Pages légales** : CGV, paiements & annulation, confidentialité, mentions légales, page contact.

### 🔐 Espace Pro — rôles réels (contrôlés par le serveur)
| Rôle | Droits |
|---|---|
| 👑 Super Admin | Tous droits (catalogue, photos, contenus, tarifs, suppressions, comptes, sauvegarde) |
| 🧑‍💼 Manager | Commandes, finances, prestataires (catalogue & contenus en lecture seule) |

Les permissions sont appliquées par PostgreSQL (RLS + fonctions `is_admin()` / `is_super()`) :
un Manager ne peut pas modifier les tarifs même en manipulant son navigateur. La gestion des
comptes (ajout, réinitialisation de mot de passe, retrait) se fait dans l'onglet **Administrateurs**.

- **📊 Tableau de bord** : CA, encaissé, bénéfice net, marge, panier moyen, reste à encaisser, alertes, graphiques.
- **🧾 Commandes** : recherche, filtres, détail, statuts, encaissement acompte/solde, paiement musiciens, facture imprimable, export CSV.
- **💰 Finances** : journal recettes/dépenses, bénéfice et marge nets, exports CSV.
- **🎷 Prestataires** : musiciens/intervenants, tarifs, suivi des paiements.
- **🏷️ Tarifs & catalogue** : nom, prix, photo, badge, description — ajout/suppression (Super Admin).
- **🌐 Contenu du site** : marque, bandeau promo, hero, bannières, coordonnées, **WhatsApp**, **moyens de paiement**, horaires, compteur réel.
- **💾 Sauvegarde** : export/import complet en JSON (les comptes ne sont jamais exportés).
- **👥 Administrateurs** : rôles, changement de mot de passe (10 caractères min).

### 🔒 Sécurité
- Mots de passe **hachés en bcrypt côté serveur** (pgcrypto) — le navigateur n'envoie jamais de hash.
- Connexion par **jeton opaque** (`admin_sessions`) transmis dans l'en-tête `x-admin-token`.
- **Changement forcé** au premier login pour les comptes par défaut.
- Verrouillage après 5 tentatives (60 s côté serveur), session admin expirant après 12 h.
- Le client ne peut **pas** lire les commandes des autres : la lecture est refusée par la base ;
  le suivi passe par `track_order(référence + téléphone)`.
- Captcha mathématique + champ piège anti-robots, validation téléphone camerounais, anti-double-envoi.
- Suivi commande : référence + téléphone obligatoires.

### 💾 Données (synchronisées)
- `site_content` (Supabase) : catalogue, textes, photos, coordonnées, réglages → **lecture publique**.
- `orders`, `transactions`, `providers` → lecture réservée aux administrateurs connectés.
- `admins`, `admin_sessions` → jamais accessibles directement (uniquement via fonctions sécurisées).
- Un cache `localStorage` sert de secours hors ligne ; le badge **🟢 Synchronisé** (ou 💾 Mode local)
  en haut de l'espace Pro indique l'état de la connexion.
- **Aucune donnée de démonstration n'est chargée automatiquement** : le site démarre vide.
- Les changements faits dans l'admin (prix, photos, textes) sont **publiés immédiatement** pour tous
  les visiteurs, sur tous les appareils — plus besoin de modifier le code.

## 🛠️ Technologies
- HTML5, CSS3 (responsive), JavaScript Vanilla (ES6+, graphiques canvas maison, sans dépendance)
- Git / GitHub — aucun build, aucun `node_modules`

## 📁 Structure
```text
mon-premier-projet/
├── index.html            # Pages client + espace admin + pages légales
├── css/style.css         # Design system (client + admin, responsive)
├── js/
│   ├── config.js         # Config Supabase/WhatsApp (à remplir à l'hébergement)
│   └── app.js            # Catalogue, devis, commandes, dashboard, finances, auth
├── supabase/schema.sql   # Schéma BDD à exécuter à l'étape hébergement
├── images/               # Visuels : hero, gâteaux, prestations
├── favicon.svg / manifest.webmanifest / robots.txt / sitemap.xml
├── DEPLOY.md             # Checklist de mise en service
└── README.md
```

## ▶️ Lancer le projet
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## ✅ Problèmes corrigés avant hébergement
1. **Sécurité** : mots de passe hachés, changement forcé, verrouillage login, session 2 h, identifiants retirés du README et de l'écran de connexion.
2. **Données démo** : `seedDemo()` automatique supprimé, compteur « surprises » réel (0 au départ), purge des démos en 1 clic.
3. **Contacts fictifs** : téléphone/email/WhatsApp/paiement centralisés dans l'admin, liens `tel:`/`mailto:`/`wa.me` cliquables, bouton WhatsApp flottant.
4. **Notifications** : confirmation de commande par WhatsApp pré-rempli + copie du récapitulatif + instructions de paiement MoMo.
5. **Paiement** : numéros MoMo/Orange Money éditables dans l'admin et affichés au client.
6. **Légal** : vraies pages CGV / Paiements / Confidentialité / Mentions légales (remplacent les toasts « en cours de rédaction »).
7. **Confidentialité** : suivi par référence + téléphone, plus par téléphone seul.
8. **Anti-spam** : captcha, honeypot, validation téléphone CM, consentement CGV, anti-double-envoi.
9. **SEO/social** : Open Graph, Twitter Card, JSON-LD LocalBusiness, favicon, manifest, robots/sitemap, images en lazy-loading.
10. **Sauvegarde** : export/import JSON complet depuis l'admin.
11. **Préparation Supabase** : schéma SQL + couche de config prêts pour l'étape hébergement (voir `DEPLOY.md`).
