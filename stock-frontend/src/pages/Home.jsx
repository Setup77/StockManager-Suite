import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../services/productService";
import { toast } from "react-hot-toast";

export default function Home() {
  // 1. Initialisation des états pour stocker les calculs et le statut
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockAlerts: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  // 2. Chargement des données au montage du composant
  useEffect(() => {
    async function calculateKPIs() {
      try {
        setLoading(true);

        // Appel simultané des endpoints /products et /categories de Symfony
        const [products, categories] = await Promise.all([
          productService.getAll(),
          productService.getCategories(),
        ]);

        // Calculs basés sur les structures de vos tables MySQL (stock_quantity)
        const totalProducts = products.length;
        const totalCategories = categories.length;

        // Filtre pour le stock critique : quantité strictement supérieure à 0 et inférieure à 10
        const lowStockAlerts = products.filter(
          (p) => p.stockQuantity > 0 && p.stockQuantity < 10,
        ).length;

        // Filtre pour la rupture totale : quantité égale à 0
        const outOfStock = products.filter((p) => p.stockQuantity === 0).length;

        // Mise à jour de l'état
        setStats({
          totalProducts,
          totalCategories,
          lowStockAlerts,
          outOfStock,
        });
      } catch (err) {
        console.error("Erreur lors du calcul des KPIs", err);
        toast.error("Impossible de charger les statistiques en temps réel.");
      } finally {
        setLoading(false);
      }
    }

    calculateKPIs();
  }, []);

  // Écran de transition professionnel pendant la récupération réseau
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center text-slate-400 text-lg font-medium animate-pulse">
        🔄 Synchronisation avec la base de données WampServer...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Section Héro / Bienvenue */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl p-8 md:p-12 border border-slate-700/50 mb-12 shadow-xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Gestion de Stock <span className="text-teal-400">Entreprise</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
          Bienvenue sur votre application de suivi de stock en temps réel.
          Suivez vos références, administrez vos catégories et contrôlez les
          niveaux de rupture en toute simplicité.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition shadow-lg shadow-teal-500/10 cursor-pointer"
          >
            Accéder au Dashboard
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition border border-slate-600 cursor-pointer"
          >
            Espace Connexion
          </Link>
        </div>
      </div>

      {/* Grille des Cartes Statistiques (KPIs) Réactifs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Carte 1 : Total Produits */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md hover:border-slate-600 transition">
          <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Total Références
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">
              {stats.totalProducts}
            </span>
            <span className="text-sm text-slate-400">
              {stats.totalProducts > 1 ? "articles" : "article"}
            </span>
          </div>
        </div>

        {/* Carte 2 : Total Catégories */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md hover:border-slate-600 transition">
          <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Catégories Actives
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-teal-400">
              {stats.totalCategories}
            </span>
            <span className="text-sm text-slate-400">
              {stats.totalCategories > 1 ? "secteurs" : "secteur"}
            </span>
          </div>
        </div>

        {/* Carte 3 : Stock Faible */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md hover:border-slate-600 transition">
          <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Stock Critique (&lt; 10)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400">
              {stats.lowStockAlerts}
            </span>
            <span className="text-sm text-amber-400/80 font-medium">
              {stats.lowStockAlerts > 1
                ? "à réapprovisionner"
                : "à réapprovisionner"}
            </span>
          </div>
        </div>

        {/* Carte 4 : Rupture de Stock */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md hover:border-slate-600 transition">
          <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Ruptures Totales
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-red-400">
              {stats.outOfStock}
            </span>
            <span className="text-sm text-red-400/80 font-medium">
              {stats.outOfStock > 1 ? "épuisés" : "épuisé"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
