import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { toast } from "react-hot-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation Frontend : concordance des mots de passe
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    // Validation Frontend : force du mot de passe
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      setLoading(true);
      await authService.register(email, password);

      toast.success("Votre compte employé a été créé ! Connectez-vous.");
      navigate("/login"); // Redirection immédiate vers le login après succès
    } catch (err) {
      if (
        (err.response && err.response.status === 450) ||
        err.response?.status === 409
      ) {
        toast.error(err.response.data.error || "Cet email est déjà pris.");
      } else {
        toast.error("Échec de l'inscription. Vérifiez votre serveur Wamp.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Espace <span className="text-teal-400">Inscription</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Créez votre accès collaborateur pour la console d'inventaire
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Identifiant professionnel (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition text-sm"
                placeholder="employe@entreprise.com"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition text-sm"
                placeholder="••••••••••••"
              />
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Confirmez le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-400/10"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-teal-400 transition"
            >
              Déjà un compte ? Connectez-vous ici
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
