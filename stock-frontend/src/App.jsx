import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute"; // Import du Pare-feu
import { authService } from "./services/authService";

function NavigationBar({ isConnected, handleLogout }) {
  const location = useLocation(); // Écoute les changements d'URL
  const [localConnected, setLocalConnected] = useState(
    authService.isAuthenticated(),
  );
  const [firstName, setFirstName] = useState("");

  // À chaque changement de page, on recalcule la connexion et l'identité
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const connected = authService.isAuthenticated();
    setLocalConnected(connected);

    if (connected && token) {
      try {
        // Décodage sécurisé du Payload du jeton (Index 1)
        const tokenParts = token.split(".");
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );

        const payload = JSON.parse(jsonPayload);
        const email = payload.username; // Contient l'email configuré dans Symfony

        if (email) {
          // Extraction du prénom (ex: paul@gmail.com devient ["paul", "gmail.com"])
          const namePart = email.split("@")[0];
          // Première lettre en majuscule pour un rendu professionnel (paul -> Paul)
          setFirstName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }
      } catch (e) {
        console.error("Erreur de lecture du prénom dans la navbar", e);
      }
    } else {
      setFirstName("");
    }
  }, [location]);

  return (
    <nav className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700 font-medium shadow-md">
      <div className="flex gap-6 items-center">
        <Link
          to="/"
          className="hover:text-teal-400 font-black text-teal-400 text-lg tracking-tight"
        >
          📦 StockManager
        </Link>

        {/* Liens privés */}
        {localConnected && (
          <div className="hidden sm:flex gap-4 text-sm text-slate-300">
            <Link to="/dashboard" className="hover:text-teal-400 transition">
              Dashboard
            </Link>
            <Link to="/categories" className="hover:text-teal-400 transition">
              Catégories
            </Link>
            <Link to="/profile" className="hover:text-teal-400 transition">
              Profil
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Liens publics anonymes */}
        {!localConnected ? (
          <>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-sm font-bold hover:bg-teal-400 transition"
            >
              Inscription
            </Link>
          </>
        ) : (
          // Zone utilisateur connecté personnalisée
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-medium">
                Session :
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {firstName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500 hover:text-white transition cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

// 2. Votre composant principal App reste propre
function App() {
  const [isConnected, setIsConnected] = useState(authService.isAuthenticated());

  const handleLogout = () => {
    authService.logout();
    setIsConnected(false);
    sessionStorage.setItem("logout_success_toast", "true");
    window.location.href = "/login";
  };

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
            border: "1px solid #334155",
          },
        }}
      />

      <div className="min-h-screen bg-slate-900 text-slate-100">
        {/* APPEL DE LA NAVBAR CORRIGÉE */}
        <NavigationBar isConnected={isConnected} handleLogout={handleLogout} />

        {/* --- GESTION DES ACCÈS AUX ROUTES --- */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Si déjà connecté, on bloque l'accès et on redirige vers le Dashboard */}
            <Route
              path="/login"
              element={
                !authService.isAuthenticated() ? (
                  <Login />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/register"
              element={
                !authService.isAuthenticated() ? (
                  <Register />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <div className="p-8 text-red-400">404 - Page Introuvable</div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
