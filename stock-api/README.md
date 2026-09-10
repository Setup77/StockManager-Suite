# 📦 StockManager API — Backend RESTful (Symfony 7)

Ce dépôt contient le moteur d'API (Backend) de l'application **StockManager**, un système découplé de gestion de stocks d'entreprise avec cloisonnement des privilèges par collaborateur. Il expose une API REST sécurisée, documentée, performante et interconnectée avec une base de données MySQL.

---

## 🛠️ Stack Technique

* **Framework** : Symfony 7.x (Architecture API pure)
* **Persistance & ORM** : Doctrine ORM, MySQL (WampServer)
* **Sécurité & Auth** : JWT (JSON Web Tokens via `lexik/jwt-authentication-bundle`) avec clés SSH asymétriques
* **Validation** : Symfony Validator (Contraintes strictes sur les prix, formats et stocks)
* **Documentation** : OpenAPI / Swagger UI via `nelmio/api-doc-bundle`
* **Gestion Réseau** : `nelmio/cors-bundle` (Contrôle strict des origines de requêtes)

---

## ✨ Fonctionnalités Majeures Implémentées

* **Authentification JWT (SSH/RSA)** : Génération et signature asymétrique asynchrones de jetons cryptographiques à la connexion (`/api/login_check`).
* **CRUD Métier Sécurisé** : Gestion complète des Produits et des Catégories avec contrôle d'accès strict. Un utilisateur ne peut modifier ou supprimer que ses propres produits.
* **Gestion des Fichiers Physiques** : Système robuste de téléchargement d'images d'illustrations (Validation d'extensions `JPG/PNG/WEBP`, limite de poids à 2 Mo, hachage des noms via Slugger pour éviter les doublons et suppression physique sur le disque Windows lors du `DELETE`).
* **Gestion Globale des Erreurs JSON** : Interception unifiée des exceptions (`Exception Listener`) pour garantir que l'API réponde exclusivement au format JSON (ex: Erreurs 404, 403, 401, 409 adaptées pour le Frontend).
* **Sécurité d'Intégrité Relationnelle** : Blocage automatique de la suppression d'une catégorie via un code d'erreur `409 Conflict` si celle-ci contient encore des articles en stock.

---

## 🚀 Installation et Configuration Locale

### 1. Prérequis
* PHP 8.3 ou 8.4 avec l'extension `fileinfo` activée.
* Composer installé.
* Un serveur MySQL actif (WampServer / XAMPP).

### 2. Clonage et Dépendances
```bash
git clone <url-de-votre-depot-backend> stock-api
cd stock-api
composer install --no-audit
```

### 3. Variables d'Environnement (`.env.local`)
Créez un fichier `.env.local` et configurez l'accès à votre base de données locale :
```ini
DATABASE_URL="mysql://root:@127.0.0.1:3306/stock_db?serverVersion=8.0&charset=utf8mb4"
```

### 4. Génération des Clés SSH (Pour le jeton JWT)
Générez la paire de clés secrètes pour la signature des jetons dans le dossier `config/jwt/` :
```bash
php bin/console lexik:jwt:generate-keypair
```

### 5. Base de données et Données de Test (Fixtures)
Exécutez l'enchaînement des commandes pour créer les schémas et injecter le jeu d'essai initial :
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

### 6. Lancement
Le projet s'exécute directement dans le répertoire public de votre serveur **WampServer** :
`http://localhost/stock-api/public/index.php/api/`

---

## 📖 Points d'Accès de l'API (Endpoints REST)

| Méthode | URL | Description | Authentification |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/register` | Inscription d'un nouvel employé | Anonyme |
| **POST** | `/api/login_check` | Connexion & Récupération du jeton JWT | Anonyme |
| **GET** | `/api/products` | Liste complète des produits | **Requis (Bearer)** |
| **POST** | `/api/products` | Ajouter une référence au stock (+ Image) | **Requis (Bearer)** |
| **PUT** | `/api/products/{id}` | Modifier une référence (Propriétaire uniquement) | **Requis (Bearer)** |
| **DELETE** | `/api/products/{id}` | Supprimer une référence (Propriétaire uniquement) | **Requis (Bearer)** |
| **GET** | `/api/categories` | Liste des secteurs du stock | **Requis (Bearer)** |
| **POST** | `/api/categories` | Créer une nouvelle catégorie | **Requis (Bearer)** |

---

## 🔍 Documentation Interactive Swagger

La documentation complète au standard OpenAPI (incluant les modèles de données JSON et les codes HTTP de réponses `200`, `201`, `400`, `401`, `409`) est accessible et testable en direct sur :
👉 `http://localhost/stock-api/public/index.php/api/doc`
