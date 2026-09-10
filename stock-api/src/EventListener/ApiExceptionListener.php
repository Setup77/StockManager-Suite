<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ApiExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();

        // On applique le traitement JSON uniquement si la route commence par /api
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        // Récupération de l'exception levée par Symfony
        $exception = $event->getThrowable();
        
        // Par défaut, on prépare une erreur 500
        $statusCode = Response::HTTP_INTERNAL_SERVER_ERROR;
        $message = "Une erreur interne est survenue sur le serveur.";

        // Si l'exception est une erreur HTTP standard (comme une 404 ou une 403)
        if ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $message = $exception->getMessage();
        }

        // Personnalisation explicite du message pour la fameuse erreur 404
        if ($statusCode === Response::HTTP_NOT_FOUND) {
            $message = "La ressource demandée ou la route de l'API n'existe pas.";
        }

        // Structure du tableau de réponse JSON
        $responseData = [
            'status' => $statusCode,
            'error' => match ($statusCode) {
                Response::HTTP_NOT_FOUND => 'Not Found',
                Response::HTTP_BAD_REQUEST => 'Bad Request',
                Response::HTTP_UNAUTHORIZED => 'Unauthorized',
                Response::HTTP_FORBIDDEN => 'Forbidden',
                default => 'Internal Server Error',
            },
            'message' => $message
        ];

        // ==========================================
        // 🔍 ENCLENCHEMENT DU SUPER-DEBUG LOCAL
        // ==========================================
        // Si le message d'origine n'est pas vide et que c'est une erreur 500 interne
        if ($statusCode === Response::HTTP_INTERNAL_SERVER_ERROR) {
            $responseData['debug'] = [
                'real_message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => substr($exception->getTraceAsString(), 0, 1000) // Extrait les 1000 premiers caractères du crash
            ];
        }

        // Création de la réponse JSON finale
        $response = new JsonResponse($responseData, $statusCode);

        // On impose à Symfony d'utiliser notre réponse au lieu de sa page d'erreur par défaut
        $event->setResponse($response);
    }
}
