<?php

namespace App\Controller;

use App\Repository\ProductRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\Product;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Filesystem\Filesystem;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;






#[Route('/api', name: 'api_')]
class ProductApiController extends AbstractController
{
    #[Route('/products', name: 'products_list', methods: ['GET'])]
    public function list(ProductRepository $productRepository): JsonResponse
    {
        $products = $productRepository->findAll();

        // On retourne les données en utilisant le groupe de sérialisation défini plus haut
        return $this->json($products, Response::HTTP_OK, [], ['groups' => 'product:read']);
    }

    #[Route('/products/{id}', name: 'products_show', methods: ['GET'])]
    public function show(Product $product = null): JsonResponse
    {
        if (!$product) {
            return $this->json(['error' => 'Produit non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($product, Response::HTTP_OK, [], ['groups' => 'product:read']);
    }

    #[Route('/products', name: 'products_create', methods: ['POST'])]
    public function create(
        Request $request,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        try {
            // 1. Récupération des données textuelles classiques (provenant de FormData)
            $name = $request->request->get('name');
            $price = $request->request->get('price');
            $stockQuantity = $request->request->get('stockQuantity');
            $categoryId = $request->request->get('categoryId');
            $description = $request->request->get('description');

            // En haut de la méthode create, récupérez l'utilisateur connecté via le token :
            $currentUser = $this->getUser();
            if (!$currentUser) {
                return $this->json(['error' => 'Authentification requise'], Response::HTTP_UNAUTHORIZED);
            }


            // CORRECTIF : Utilisation de strlen pour accepter la valeur "0"
            if (strlen($name) === 0 || strlen($price) === 0 || strlen($stockQuantity) === 0 || strlen($categoryId) === 0) {
                return $this->json(['error' => 'Données textuelles incomplètes'], Response::HTTP_BAD_REQUEST);
            }

            $category = $categoryRepository->find($categoryId);
            if (!$category) {
                return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_BAD_REQUEST);
            }

            // 2. Hydratation de l'entité de base
            $product = new Product();

            $product->setName($name);
            $product->setDescription($description);
            $product->setPrice((float)$price);
            $product->setStockQuantity((int)$stockQuantity);
            $product->setCreatedAt(new \DateTimeImmutable());
            $product->setCategory($category);

            // Liaison sécurisée avec le créateur connecté
            $product->setUser($currentUser); 

        // 3. TRAITEMENT DE L'IMAGE PHYSIQUE
            /** @var UploadedFile $imageFile */
            $imageFile = $request->files->get('image');

            if ($imageFile) {
                $slugger = new \Symfony\Component\String\Slugger\AsciiSlugger();
                $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeFilename = $slugger->slug($originalFilename);
                $newFilename = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();

                try {
                    $uploadDirectory = dirname(__DIR__, 2) . '/public/uploads/products';
                    $imageFile->move($uploadDirectory, $newFilename);
                    $product->setImage('/uploads/products/' . $newFilename);
                } catch (FileException $e) {
                    return $this->json(['error' => "Erreur de déplacement de fichier"], Response::HTTP_INTERNAL_SERVER_ERROR);
                }
            }

            // 4. Déclenchement des validations standard (prix, stock, etc.)
            $errors = $validator->validate($product);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
            }

            $em->persist($product);
            $em->flush();

            return $this->json($product, Response::HTTP_CREATED, [], ['groups' => 'product:read']);
        } catch (\Throwable $e) {
            return $this->json([
                'error' => 'Crash interne PHP détecté',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    #[Route('/products/{id}', name: 'products_update', methods: ['POST', 'PUT'])]
    public function update(
        Product $product = null,
        Request $request,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$product) {
            return $this->json(['error' => 'Produit non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // 1. Récupération des données textuelles provenant du FormData simulé
        $name = $request->request->get('name');
        $price = $request->request->get('price');
        $stockQuantity = $request->request->get('stockQuantity');
        $categoryId = $request->request->get('categoryId');
        $description = $request->request->get('description');

        // Sécurité : Seul le propriétaire a le droit de modifier le produit
        $currentUser = $this->getUser();
        if ($product->getUser() !== $currentUser) {
            return $this->json(['error' => 'Action interdite. Vous n\'êtes pas le créateur de ce produit.'], Response::HTTP_FORBIDDEN);
        }


        // Mise à jour conditionnelle si les champs sont fournis
        if ($name !== null) $product->setName($name);
        if ($description !== null) $product->setDescription($description);
        if ($price !== null) $product->setPrice((float)$price);
        if ($stockQuantity !== null) $product->setStockQuantity((int)$stockQuantity);

        if ($categoryId !== null) {
            $category = $categoryRepository->find($categoryId);
            if ($category) $product->setCategory($category);
        }

    // 2. GESTION DE LA NOUVELLE IMAGE PHYSIQUE
        /** @var UploadedFile $imageFile */
        $imageFile = $request->files->get('image');

        if ($imageFile) {
            $slugger = new \Symfony\Component\String\Slugger\AsciiSlugger();
            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();

            $uploadDirectory = dirname(__DIR__, 2) . '/public/uploads/products';

            // NETTOYAGE : Suppression de l'ancienne image du disque dur si elle existe
            if ($product->getImage()) {
                $filesystem = new Filesystem();
                $oldImagePath = dirname(__DIR__, 2) . '/public' . $product->getImage();
                if ($filesystem->exists($oldImagePath)) {
                    $filesystem->remove($oldImagePath);
                }
            }

            try {
                // Déplacement du nouveau fichier
                $imageFile->move($uploadDirectory, $newFilename);
                $product->setImage('/uploads/products/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => "Erreur lors du déplacement du fichier"], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        $em->flush();

        return $this->json($product, Response::HTTP_OK, [], ['groups' => 'product:read']);
    }


    #[Route('/products/{id}', name: 'products_delete', methods: ['DELETE'])]
    public function delete(Product $product = null, EntityManagerInterface $em): JsonResponse
    {
        if (!$product) {
            return $this->json(['error' => 'Produit non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Sécurité : Seul le propriétaire a le droit de supprimer le produit
        $currentUser = $this->getUser();
        if ($product->getUser() !== $currentUser) {
            return $this->json(['error' => 'Action interdite.'], Response::HTTP_FORBIDDEN);
        }


        // NETTOYAGE : Suppression du fichier physique de l'image sur le disque dur
        if ($product->getImage()) {
            $filesystem = new Filesystem();

            // __DIR__ est dans src/Controller/, on remonte de 2 niveaux pour aller à la racine de Wamp
            $imagePath = dirname(__DIR__, 2) . '/public' . $product->getImage();

            // Si le fichier existe réellement dans le dossier public/uploads/products/
            if ($filesystem->exists($imagePath)) {
                $filesystem->remove($imagePath);
            }
        }

        // Suppression de la référence en base de données MySQL
        $em->remove($product);
        $em->flush();

        return $this->json(['message' => 'Produit et son image supprimés avec succès'], Response::HTTP_OK);
    }


    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json(['error' => 'Données incomplètes (email et password obligatoires)'], Response::HTTP_BAD_REQUEST);
        }

        // Sécurité : vérifier si l'email existe déjà
        $existingUser = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json(['error' => 'Cette adresse email est déjà utilisée par un employé.'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles(['ROLE_USER']); // Rôle de base pour un employé

        // Hachage sécurisé du mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // Validation des contraintes de l'entité (ex: format email)
        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            return $this->json(['error' => 'Format de l\'adresse email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'Compte employé créé avec succès !',
            'email' => $user->getEmail()
        ], Response::HTTP_CREATED);
    }
}
