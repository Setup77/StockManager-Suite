<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Product;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface; // 1. Import du service

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $passwordHasher;

    // 2. Injection du service de hachage via le constructeur
    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        // --- 1. CRÉATION DE L'UTILISATEUR DE TEST ---
        $user = new User();
        $user->setEmail('admin@stock.com');
        $user->setRoles(['ROLE_ADMIN']);
        
        // Hachage sécurisé du mot de passe "password123"
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            'password123'
        );
        $user->setPassword($hashedPassword);
        
        $manager->persist($user);

        // --- 2. CRÉATION DES CATÉGORIES (Déjà codé au Jour 2) ---
        $categoriesData = [
            'Électronique' => 'Téléphones, ordinateurs, composants et accessoires.',
            'Mobilier' => 'Bureaux, chaises, armoires et aménagement.',
            'Fournitures' => 'Stylos, cahiers, papier et consommables de bureau.'
        ];

        $createdCategories = [];
        foreach ($categoriesData as $name => $description) {
            $category = new Category();
            $category->setName($name);
            $category->setDescription($description);
            $manager->persist($category);
            $createdCategories[] = $category;
        }

        // --- 3. CRÉATION DES PRODUITS (Déjà codé au Jour 2) ---
        for ($i = 1; $i <= 10; $i++) {
            $product = new Product();
            $product->setName('Produit Exemple ' . $i);
            $product->setDescription('Description automatique pour le produit numéro ' . $i);
            $product->setPrice(rand(10, 1000) / 10);
            $product->setStockQuantity(rand(0, 150));
            $product->setCreatedAt(new \DateTimeImmutable());

            $randomCategory = $createdCategories[array_rand($createdCategories)];
            $product->setCategory($randomCategory);

            $manager->persist($product);
        }

        // Envoi de toutes les données (User + Catégories + Produits) vers WampServer
        $manager->flush();
    }
}
