<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class CategoryApiController extends AbstractController
{
    #[Route('/categories', name: 'categories_list', methods: ['GET'])]
    public function list(CategoryRepository $categoryRepository): JsonResponse
    {
        $categories = $categoryRepository->findAll();
        return $this->json($categories, Response::HTTP_OK, [], ['groups' => 'category:read']);
    }

    #[Route('/categories/{id}', name: 'categories_show', methods: ['GET'])]
    public function show(Category $category = null): JsonResponse
    {
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }
        return $this->json($category, Response::HTTP_OK, [], ['groups' => 'category:read']);
    }



    #[Route('/categories', name: 'categories_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator // 1. Injecter le validateur
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'])) {
            return $this->json(['error' => 'Le nom de la catégorie est obligatoire'], Response::HTTP_BAD_REQUEST);
        }

        $category = new Category();
        $category->setName($data['name']);
        $category->setDescription($data['description'] ?? null);

        // 2. Déclencher la validation
        $errors = $validator->validate($category);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $em->persist($category);
        $em->flush();

        return $this->json($category, Response::HTTP_CREATED, [], ['groups' => 'category:read']);
    }


    #[Route('/categories/{id}', name: 'categories_update', methods: ['PUT'])]
    public function update(Category $category = null, Request $request, EntityManagerInterface $em): JsonResponse
    {
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $category->setName($data['name']);
        }
        if (isset($data['description'])) {
            $category->setDescription($data['description']);
        }

        $em->flush();

        return $this->json($category, Response::HTTP_OK, [], ['groups' => 'category:read']);
    }

    #[Route('/categories/{id}', name: 'categories_delete', methods: ['DELETE'])]
    public function delete(Category $category = null, EntityManagerInterface $em): JsonResponse
    {
        if (!$category) {
            return $this->json(['error' => 'Catégorie non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Vérification de sécurité : empêcher la suppression si la catégorie contient des produits
        if (!$category->getProducts()->isEmpty()) {
            return $this->json([
                'error' => 'Impossible de supprimer cette catégorie car elle contient des produits actifs'
            ], Response::HTTP_CONFLICT);
        }

        $em->remove($category);
        $em->flush();

        return $this->json(['message' => 'Catégorie supprimée avec succès'], Response::HTTP_OK);
    }
}
