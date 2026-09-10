# 📦 StockManager Suite — Console d'Inventaire Découplée (Symfony 7 & React 19)

**StockManager Suite** est une application web d'entreprise moderne et performante dédiée à la gestion, au suivi et au contrôle des stocks de marchandises en temps réel. Conçu selon une architecture logicielle entièrement découplée, le projet réunit un moteur d'API REST robuste et une interface monopage (SPA) fluide, dotée d'un système de cloisonnement strict des privilèges par collaborateur.

---

## 🛠️ Stack Technique Globale

### 🖥️ Moteur API (Backend)
* **Framework** : Symfony 7.3.x (Architecture API Pure & Stateless)
* **Runtime** : PHP 8.3.x (Hébergé localement via WampServer / Apache)
* **Persistance & ORM** : Doctrine ORM, MySQL 8.0
* **Sécurité & Authentification** : Jetons cryptographiques JWT (`lexik/jwt-authentication-bundle`) avec signature asymétrique par paire de clés SSH (RSA).
* **Validation & Intégrité** : Symfony Validator (Contraintes strictes sur les prix négatifs, formats d'emails et stocks) et gestion unifiée des erreurs via un `ApiExceptionListener` global (réponses exclusivement au format JSON).

### 🎨 Interface Utilisateur (Frontend)
* **Framework de Base** : React 19.x (Gestion des formulaires asynchrones et des transitions)
* **Outillage & Compilation** : Vite v8.1 (Serveur de développement ultra-rapide avec Hot Module Replacement nativement basé sur les modules ESM)
* **Moteur Graphique** : Tailwind CSS v4.0 (Plugin natif Vite, thémisation moderne sombre sans fichier de configuration lourd)
* **Tableaux Métiers** : TanStack Table v8 (Gestion haute performance du tri, filtrage textuel global et pagination en mémoire vive)
* **Routage & Pare-feu** : React Router DOM v7 (Gestion des vues et protection étanche des accès via des barrières `ProtectedRoute`)
* **Client HTTP** : Axios (Intercepteurs automatisés pour greffer l'en-tête `Authorization: Bearer` et gestion transparente des transferts binaires `FormData`)

---

## ✨ Fonctionnalités Majeures Implémentées

* **🔒 Authentification JWT Asymétrique** : Connexion sécurisée sur `/api/login_check` générant un jeton signé. La Navbar décode le jeton à chaud pour extraire l'identité de l'employé connecté (`Session : Paulo`) et adapter dynamiquement les boutons d'accès.
* **🛡️ Pare-feu Client & Serveur** : Blindage des URLs sur React (toute tentative d'intrusion sans jeton éjecte l'utilisateur vers le login). Côté API, les requêtes de modification/suppression (`POST, PUT, DELETE`) vérifient rigoureusement la clé propriétaire (`user_id`) : une action sur une référence tierce provoque immédiatement un blocage **HTTP 403 Forbidden**.
* **📊 Dashboard de Pilotage KPIs & TanStack** : Page d'accueil publique affichant les statistiques dynamiques du stock (Total références, alertes critiques < 10 articles, ruptures à 0) connectée en lecture seule à l'API. Console d'inventaire avancée permettant de trier et rechercher instantanément les articles.
* **🖼️ Gestion Physique des Images (Mécanisme Antécédent de Spoofing)** : Système d'upload d'illustrations avec vérification client instantanée (extensions autorisées, limite de poids à 2 Mo et prévisualisation directe via `FileReader`). Le système contourne la limite native de PHP concernant la lecture du format `multipart/form-data` sur les requêtes `PUT` en utilisant le **Method Spoofing** (`_method: PUT` encapsulé dans un `POST`).
* **🧹 Nettoyage du Disque Dur** : Lors d'une mise à jour d'image ou d'une suppression complète d'un produit, l'application utilise le composant `Filesystem` de Symfony pour détruire physiquement le fichier orphelin sur le disque dur Windows, évitant ainsi la saturation du serveur.
* **⚡ Intégrité Relationnelle (Blocage 409)** : Interdiction stricte de supprimer une catégorie de stock via un code d'erreur `409 Conflict` tant que celle-ci contient encore des articles actifs en base de données.

---

## 📸 Architecture des Dossiers du Projet

```text
symfony-stock/
├── stock-api/            # Moteur Backend (Symfony 7)
│   ├── config/           # Configurations packages (Doctrine, JWT, Security, CORS)
│   ├── src/
│   │   ├── Controller/   # Endpoints REST (ProductApiController, CategoryApiController)
│   │   ├── Entity/       # Schémas de base de données (Product, Category, User)
│   │   └── EventListener/# Intercepteur JSON (ApiExceptionListener)
│   └── public/           # Point d'entrée unique Apache & images physiques /uploads
│
└── stock-frontend/       # Application Client SPA (React 19 / Vite)
    ├── public/           # Favicons et assets statiques
    └── src/
        ├── components/   # Composants réutilisables (Navbar, ProtectedRoute)
        ├── pages/        # Les 6 Vues (Home, Login, Register, Dashboard, Categories, Profile)
        └── services/     # Appels Ajax (api.js, authService.js, productService.js)
```

---

## 🚀 Installation et Configuration Locale

### 1. Prérequis
* PHP 8.3 ou supérieur (avec extension `fileinfo` activée dans votre `php.ini`)
* Node.js (Version 18 ou supérieure)
* Composer installé
* Un serveur MySQL actif via **WampServer** ou XAMPP.

### 2. Configuration du Backend (`stock-api`)
```bash
cd stock-api
# Installation des dépendances
composer install

# Configuration de la base de données : créez un fichier .env.local et insérez :
# DATABASE_URL="mysql://root:@127.0.0.1:3306/stock_api?serverVersion=8.0&charset=utf8mb4"

# Génération de la paire de clés SSH pour la signature JWT
php bin/console lexik:jwt:generate-keypair

# Initialisation des schémas MySQL et injection du jeu d'essai (Fixtures)
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```
Le backend est accessible sur votre serveur Apache local à l'adresse : `http://localhost/symfony-stock/stock-api/public/index.php/api`

### 3. Configuration du Frontend (`stock-frontend`)
```bash
cd ../stock-frontend
# Installation des dépendances NPM
npm install

# Lancement du serveur de développement Vite
npm run dev
```
Ouvrez votre navigateur sur l'adresse locale fournie par Vite : **`http://localhost:5173/`**

---

## 🔑 Comptes Employés Prévus pour les Tests (Spécial Recruteurs)

Pour évaluer la réactivité du Dashboard, l'adaptation de la Navbar et les barrières de cloisonnement des droits d'écriture, vous pouvez utiliser les deux profils pré-remplis :

### 💼 Profil Démo Collaborateur (Lecture seule sur les biens d'admin)
* **Identifiant (Email)** : `paulo@gmail.com`
* **Mot de passe** : `azerty`
*(Ce compte permet de voir les articles créés par l'administrateur, mais fige les actions d'édition/suppression en lecture seule en affichant l'identité du publieur initial).*

### 👑 Profil Administrateur Principal (Propriétaire initial du stock)
* **Identifiant (Email)** : `admin@stock.com`
* **Mot de passe** : `password123`
*(Ce compte possède les droits complets de modification et suppression sur les 10 articles d'exemples générés par les fixtures).*
