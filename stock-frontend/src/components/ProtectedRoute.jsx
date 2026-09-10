import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children }) {
  // Si l'utilisateur n'est pas authentifié, redirection forcée vers le login
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Si connecté, on laisse charger le composant enfant (ex: le Dashboard)
  return children;
}
