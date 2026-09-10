import { useState, useEffect } from "react";
import {
  FaUserShield,
  FaEnvelope,
  FaCalendarAlt,
  FaIdCard,
} from "react-icons/fa";

export default function Profile() {
  const [user, setUser] = useState({
    email: "",
    roles: [],
    expiration: "",
  });

  useEffect(() => {
    extractUserMetadata();
  }, []);

  const extractUserMetadata = () => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        // Isolation et décodage du Payload du jeton JWT (Index 1)
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

        // Conversion de la date d'expiration (timestamp Unix exp) en format lisible
        const expDate = new Date(payload.exp * 1000).toLocaleString("fr-FR", {
          dateStyle: "long",
          timeStyle: "short",
        });

        setUser({
          email: payload.username, // Contient l'email configuré dans Symfony
          roles: payload.roles || [],
          expiration: expDate,
        });
      } catch (e) {
        console.error(
          "Erreur lors de l'extraction des métadonnées du profil",
          e,
        );
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* En-tête de la page */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Mon Espace Personnel</h1>
        <p className="text-sm text-slate-400 mt-1">
          Consultez vos habilitations et les détails de votre session
        </p>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonne de Gauche : Avatar d'entreprise */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 rounded-full bg-teal-500/10 border-2 border-teal-400 flex items-center justify-center text-teal-400 text-4xl font-black shadow-lg shadow-teal-500/5 mb-4">
            {user.email ? user.email.charAt(0).toUpperCase() : "A"}
          </div>
          <h2 className="text-xl font-bold text-white truncate max-w-full">
            {user.email || "Administrateur"}
          </h2>
          <span className="mt-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Compte Actif
          </span>
        </div>

        {/* Colonne de Droite : Fiche récapitulative des permissions */}
        <div className="md:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-5 bg-slate-900 border-b border-slate-700 flex items-center gap-2 text-teal-400 font-bold">
            <FaUserShield />
            <h3>Fiche d'Habilitations Securisée</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Identifiant / Email */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 mt-0.5">
                <FaEnvelope size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Adresse de connexion
                </h4>
                <p className="text-white font-medium mt-0.5">
                  {user.email || "Chargement..."}
                </p>
              </div>
            </div>

            {/* Rôles de Sécurité Symfony */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 mt-0.5">
                <FaIdCard size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rôles d'accès applicatifs
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.roles.map((role, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Expiration du jeton JWT */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 mt-0.5">
                <FaCalendarAlt size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fin de validité de la session (JWT)
                </h4>
                <p className="text-amber-400 font-medium mt-0.5">
                  {user.expiration || "Chargement..."}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Au-delà de cette heure, le pare-feu Apache et Symfony
                  rejetteront vos requêtes d'écriture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
