# 🎁 LV Surprise Event — Application Web Pro

**LV Surprise Event** est une application web complète de réservation et de gestion d'anniversaires surprises sur mesure : décorations, gâteaux personnalisés, bouquets d'argent, paniers gourmands et animations musicales.

## 🚀 Fonctionnalités

### 👤 Espace Client
- **Accueil vitrine** : hero, univers de prestations, avis clients, packs promo.
- **Page Nos Gâteaux** : 4 créations artisanales avec photos d'exemple, descriptions et **tarifs affichés**.
- **Page Prestations** : décoration, espace photo, bouquet d'argent, panier gourmand, musiciens — chacun avec photo et tarif.
- **Devis & réservation** : panier à la carte, remise pack auto (-10% déco + gâteau), acompte 30%, récapitulatif instantané.
- **Suivi commande** : recherche par référence (ex : `LV-2026-2410`) ou téléphone, timeline de statut.

### 🔐 Espace Pro — 2 administrateurs
| Compte | Identifiant | Mot de passe | Droits |
|---|---|---|---|
| 👑 Super Admin | `vanelle` | `vanelle2026` | Tous droits (tarifs, suppressions, comptes) |
| 🧑‍💼 Manager | `assistant` | `assistant2026` | Commandes, finances, prestataires |

- **📊 Tableau de bord** : chiffre d'affaires, encaissé, **bénéfice net**, marge, panier moyen, reste à encaisser, alertes, graphiques (CA 6 mois + répartition par prestation), dernières commandes.
- **🧾 Commandes** : recherche, filtres statut/paiement, détail, changement de statut, encaissement acompte/solde, paiement musiciens, **facture imprimable**, export CSV.
- **💰 Gestion financière** : journal recettes/dépenses, bénéfice et marge nets, ajout d'opérations, export CSV.
- **🎷 Prestataires** : musiciens/intervenants, tarifs, suivi des paiements par commande.
- **🏷️ Tarifs & catalogue** : modification des prix affichés côté client + paramètres (taux acompte, remise pack, coût musicien). Réservé Super Admin.
- **👥 Administrateurs** : rôles et permissions, changement de mot de passe.

### 💾 Données
Persistance locale via `localStorage` (commandes, journal financier, tarifs, comptes). Des **données de démonstration** réalistes sont chargées au premier lancement (réinitialisables depuis l'onglet Administrateurs).

## 🛠️ Technologies
- **Frontend** : HTML5, CSS3 (design responsive), JavaScript Vanilla (ES6+, graphiques canvas maison, sans dépendance)
- **Versionning** : Git, GitHub

## 📁 Structure
```text
mon-premier-projet/
├── index.html        # Pages client + espace admin
├── css/
│   └── style.css     # Design system complet (client + admin, responsive)
├── js/
│   └── app.js        # Catalogue, devis, commandes, dashboard, finances, auth
├── images/           # Visuels : hero, gâteaux, prestations
└── README.md         # Documentation
```

## ▶️ Lancer le projet
Ouvrir `index.html` dans un navigateur, ou servir le dossier :
```bash
python3 -m http.server 8000
# → http://localhost:8000
```
