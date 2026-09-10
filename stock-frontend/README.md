# 💻 StockManager UI — Client Single Page Application (React)

Ce dépôt contient l'interface utilisateur (Frontend) moderne et responsive de l'application **StockManager**. Conçue comme une application monopage (SPA) découplée, elle consomme l'API REST sécurisée du moteur Symfony pour offrir une console d'inventaire performante, fluide et sécurisée par rôle.

---

## 🛠️ Stack Technique Frontend

* **Framework de Base** : [React 18/19](https://react.dev) via l'outillage ultra-rapide **Vite**
* **Moteur Graphique** : [Tailwind CSS v4](https://tailwindcss.com) (Design moderne, sombre et adaptatif)
* **Tableaux Métiers** : [TanStack Table v8](https://tanstack.com) (Gestion unifiée du tri, du filtrage global et de la pagination native)
* **Navigation & Routage** : [React Router DOM v6](https://reactrouter.com) (Gestion des chemins d'URL et des barrières de sécurité)
* **Client HTTP** : [Axios](https://axios-http.com) (Centralisation des requêtes, intercepteurs automatisés pour injecter l'en-tête Bearer JWT)
* **Expérience Utilisateur (UX)** : [React Hot Toast](https://react-hot-toast.com) (Alertes et notifications animées de succès/échec de 5s) & [React Icons](https://github.io)

---

## ✨ Fonctionnalités Majeures Implémentées

* **Navbar Dynamique & Réactive** : Adaptation automatique du menu supérieur selon l'état de la session (Masquage de *Login/Register* si connecté, extraction du prénom de l'employé depuis le jeton pour afficher un badge de session personnalisé : `Session : Paul`).
* **Pare-feu Client (`ProtectedRoute`)** : Blindage des accès aux URL. Toute tentative d'accès manuel aux vues d'administration (`/dashboard`, `/categories`, `/profile`) sans jeton valide provoque une éjection immédiate vers la page de connexion.
* **Console d'Inventaire Avancée (Dashboard)** :
  * Recherche textuelle instantanée dans le stock sans réinterroger le serveur.
  * Indicateurs visuels automatiques pour les niveaux de stock critiques (< 10 articles) et les ruptures.
  * Modale de fiche technique (`View Modal`) complète avec affichage de l'illustration en grand format, des spécifications et de l'identité du publieur.
* **Cloisonnement Strict des Droits (CRUD)** : Décodage à chaud du jeton JWT pour vérifier la propriété de la ligne. Les boutons d'action (Crayon/Poubelle) ne s'affichent que sur les références créées par l'utilisateur connecté. Les autres sont figées en "Lecture seule".
* **Formulaires Unifiés & Validations Client** : Modales polyvalentes (Ajout/Édition). Protection des imports d'illustrations avec vérification instantanée de l'extension (`JPG, PNG, WEBP`) et blocage si le poids excède 2 Mo avec génération de prévisualisation en direct via `FileReader`.

---

## 📸 Architecture des 6 Pages Réalisées

1. **🏠 Accueil** : Présentation du portfolio d'entreprise et affichage de cartes de statistiques KPIs (Total références, alertes de rupture).
2. **📝 Inscription** : Formulaire de création de compte pour les nouveaux collaborateurs avec vérification de concordance des mots de passe.
3. **🔑 Connexion** : Interface d'authentification pour récupérer le token et intercepter la 401 si le mot de passe est faux.
4. **📊 Dashboard** : Grand tableau TanStack Table listant, triant et paginant les références de produits du stock.
5. **📁 Catégories** : Formulaire unifié de création/édition et gestion des secteurs d'inventaire piloté par TanStack Table.
6. **👤 Mon Profil** : Espace personnel décodant les métadonnées cachées du JWT (Email, rôles système `ROLE_ADMIN`, heure exacte d'expiration de la session).

---

## 🚀 Installation et Démarrage Local

### 1. Prérequis
* [Node.js](https://nodejs.org) (Version 18 ou supérieure recommandée)
* Le serveur **Backend Symfony** en cours d'exécution sur le port local standard (`http://localhost/stock-api`)

### 2. Téléchargement et Dépendances
```bash
git clone <url-de-votre-depot-frontend> stock-frontend
cd stock-frontend
npm install
```

### 3. Ajustement de l'URL de l'API (Si nécessaire)
La configuration de base est centralisée à l'adresse suivante dans le fichier `src/services/api.js` :
```javascript
const api = axios.create({
  baseURL: 'http://localhost/stock-api/public/index.php/api',
});
```

### 4. Lancement du Serveur de Développement
Démarrez l'application sur le serveur de développement local ultrarapide de Vite :
```bash
npm run dev
```
👉 Ouvrez votre navigateur sur l'adresse fournie dans votre console : **`http://localhost:5173/`**

---

## 🔒 Comptes Employés Tests Prévus

Pour évaluer la réactivité du tableau selon les droits des collaborateurs, vous pouvez utiliser ces deux profils pré-remplis en base :

* **Profil Administrateur Principal (Propriétaire initial)** :
  * **Email** : `admin@stock.com`
  * **Mot de passe** : `password123`
* **Profil Employé Collaborateur (Lecture seule sur les biens d'admin)** :
  * Créer un compte à la volée sur la page `/register` (ex: `paul@gmail.com`).
