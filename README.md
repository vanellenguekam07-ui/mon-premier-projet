# Mon Premier Projet
cat << 'EOF' > README.md
# 🎁 LV Surprise Event - Application Web de Gestion d'Événements

**LV Surprise Event** est une application web interactive dédiée à la réservation et à la gestion d'anniversaires surprises sur mesure (décorations, bouquets d'argent, gâteaux, animations musicales, etc.).

---

## 🚀 Fonctionnalités

### 👤 Espace Client (Réservation & Devis)
- **Catalogue à la carte :** Choix des prestations (Décoration de chambre, Espace photo, Gâteau personnalisable, Bouquet d'argent, Panier surprise, Animation musicale avec prestataires).
- **Calculateur dynamique :** Estimation instantanée du tarif total en fonction des options cochées.
- **Formulaire de livraison :** Saisie précise du lieu (adresse/quartier), de la date, de l'heure et du bénéficiaire à surprendre.

### 🛠️ Espace Administration (Gestion & Prestataires)
- **Tableau de bord centralisé :** Visualisation de toutes les commandes passées.
- **Gestion des prestataires :** Suivi et validation du paiement des musiciens/intervenants externes.
- **Persistance des données :** Sauvegarde automatique des commandes dans le navigateur via `localStorage`.

---

## 🛠️ Technologies Utilisées

- **Frontend :** HTML5, CSS3 (Design Responsive), JavaScript Vanilla (ES6+)
- **Système d'exploitation :** Ubuntu Linux
- **Éditeur de code :** Visual Studio Code
- **Versionning & Hébergement :** Git, GitHub

---

## 📁 Structure du Projet

```text
mon-premier-projet/
├── index.html        # Structure principale (Client & Admin)
├── css/
│   └── style.css     # Style visuel et responsive design
├── js/
│   └── app.js        # Logique métier, calculateur et gestion Admin
└── README.md         # Documentation du projet