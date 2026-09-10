import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useEffect } from "react"; // Assurez-vous d'avoir cet import en haut
import { toast } from "react-hot-toast"; // Importer également toast s'il ne l'est pas

export default function Login() {
  // 1. Déclarations des états pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 2. Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Appel de notre service Axios vers Symfony
      await authService.login(email, password);

      // Si la connexion réussit, redirection automatique vers le Dashboard
      navigate("/dashboard");
    } catch (err) {
      // Capture des erreurs d'identifiants (401 de Symfony) ou de réseau
      if (err.response && err.response.status === 401) {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        setError("Impossible de joindre le serveur de base de données Wamp.");
      }
    } finally {
      setLoading(false);
    }
  };

  // À l'intérieur de votre composant Login() :
  useEffect(() => {
    // Vérification de la présence du drapeau de déconnexion
    const showToast = sessionStorage.getItem("logout_success_toast");

    if (showToast === "true") {
      // Affichage du toast de succès d'entreprise
      toast.success("Vous avez été déconnecté avec succès. À bientôt !");

      // Nettoyage immédiat pour éviter que le toast ne réapparaisse au prochain rafraîchissement
      sessionStorage.removeItem("logout_success_toast");
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Espace <span className="text-teal-400">Connexion</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Accédez à la console d'administration des stocks
          </p>

          {/* 💼 ACCÈS RECRUTEUR / DÉMO COMPTE TEST */}
          <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs space-y-1">
            <div className="font-bold text-teal-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Accès Démo
            </div>
            <div className="text-slate-300 flex justify-between">
              <span className="text-slate-500">Identifiant :</span>
              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 select-all">
                paulo@gmail.com
              </span>
            </div>
            <div className="text-slate-300 flex justify-between">
              <span className="text-slate-500">Mot de passe :</span>
              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 select-all">
                azerty
              </span>
            </div>
          </div>
        </div>

        {/* Zone d'affichage des erreurs */}
        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400 text-center font-medium animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Champ Email */}
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Adresse Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition text-sm"
                placeholder="admin@stock.com"
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Bouton de Validation */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-teal-400/10"
            >
              {loading ? "Vérification en cours..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
