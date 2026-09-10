import { useState, useEffect, useMemo } from "react";
import { productService } from "../services/productService";
import {
  FaPencilAlt,
  FaTrashAlt,
  FaExclamationTriangle,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
} from "react-icons/fa"; // <-- Ajoutez FaEye ici

import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Importations obligatoires de TanStack Table
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // États des modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // États pour la modale de visualisation détaillée
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [productToView, setProductToView] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    image: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
    extractUserFromToken();
  }, []);

  const extractUserFromToken = () => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserEmail(payload.username);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("jwt_token");
        navigate("/login");
      } else {
        toast.error("Erreur de communication avec le serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // --- DÉFINITION DES COLONNES TANSTACK AVEC CELLULES SÉCURISÉES ---
  // =========================================================================
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Produit",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {row.original.image ? (
                <img
                  src={`http://localhost/symfony-stock/stock-api/public${row.original.image}`}
                  alt={row.original.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                "📦"
              )}
            </div>
            <span className="font-semibold text-white">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category.name",
        header: "Catégorie",
        cell: (info) => (
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-400">
            {info.getValue() || "Non classé"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Prix Unitaire",
        cell: (info) => (
          <span className="font-medium text-white">
            {parseFloat(info.getValue()).toFixed(2)} €
          </span>
        ),
      },
      {
        accessorKey: "stockQuantity",
        header: "Stock",
        cell: (info) => {
          const qty = parseInt(info.getValue(), 10);
          return (
            <span
              className={`font-bold ${qty === 0 ? "text-red-400" : qty < 10 ? "text-amber-400" : "text-slate-300"}`}
            >
              {qty}{" "}
              {qty < 10 && (
                <span className="text-[10px] ml-1 uppercase bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                  Alerte
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          // PROTECTION : Comparer l'utilisateur connecté avec l'adresse email du créateur du produit
          const isOwner = currentUserEmail === product.user?.email;

          return (
            <div className="flex justify-center gap-3">
              {/* 1. BOUTON VIEW (ŒIL) - ACCESSIBLE À TOUS LES EMPLOYÉS CONNECTÉS */}
              <button
                onClick={() => {
                  setProductToView(product);
                  setIsViewModalOpen(true);
                }}
                className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition cursor-pointer"
                title="Voir les détails"
              >
                <FaEye size={12} />
              </button>
              {isOwner ? (
                <>
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 rounded-lg bg-slate-700 text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition cursor-pointer"
                    title="Modifier"
                  >
                    <FaPencilAlt size={12} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(product)}
                    className="p-2 rounded-lg bg-slate-700 text-red-400 hover:bg-red-400 hover:text-white transition cursor-pointer"
                    title="Supprimer"
                  >
                    <FaTrashAlt size={12} />
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Par :{" "}
                  {product.user?.email
                    ? product.user.email.split("@")[0]
                    : "Système"}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [products, currentUserEmail],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  // --- ACTIONS CRUD JAVASCRIPT (Identiques aux fonctions sécurisées du Jour 4) ---
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentProductId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stockQuantity: "",
      categoryId: categories[0]?.id || "",
      image: "",
    });
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stockQuantity: product.stockQuantity,
      categoryId: product.category?.id || "",
      image: "",
    });
    setImagePreview(product.image || null);
    setIsFormModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return toast.error("Format invalide.");
      if (file.size > 2 * 1024 * 1024)
        return toast.error("Fichier trop lourd (>2Mo).");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formDataPayload = new FormData();
    formDataPayload.append("name", formData.name);
    formDataPayload.append("description", formData.description);
    formDataPayload.append("price", parseFloat(formData.price));
    formDataPayload.append(
      "stockQuantity",
      parseInt(formData.stockQuantity, 10),
    );
    formDataPayload.append("categoryId", parseInt(formData.categoryId, 10));
    if (formData.image) formDataPayload.append("image", formData.image);
    if (isEditMode) formDataPayload.append("_method", "PUT");

    try {
      if (isEditMode) {
        await productService.update(currentProductId, formDataPayload);
        toast.success("Produit mis à jour !");
      } else {
        await productService.create(formDataPayload);
        toast.success("Produit ajouté !");
      }
      setIsFormModalOpen(false);
      fetchInitialData(); // Rechargement propre de la liste TanStack
    } catch (err) {
      toast.error("Échec de la validation ou de la connexion.");
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await productService.delete(productToDelete.id);
      toast.success("Produit effacé.");
      setIsDeleteModalOpen(false);
      fetchInitialData();
    } catch (e) {
      toast.error("Erreur de suppression.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 text-lg">
        Chargement de la console...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">
            Console d'Inventaire
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            TanStack Engine - Gestion autonome par collaborateur
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg cursor-pointer"
        >
          + Ajouter un produit
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-md rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none"
          placeholder="🔍 Rechercher une référence dans le stock..."
        />
      </div>

      {/* --- TABLEAU TANSTACK D'ENTREPRISE --- */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-slate-900 border-b border-slate-700"
                >
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-slate-400 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-850/50 select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <FaSort size={10} className="text-slate-500" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-slate-500 font-medium"
                  >
                    Aucune référence trouvée.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-750/30 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* BARRE DE PAGINATION INTERACTIVE */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <div>
            Page{" "}
            <span className="font-bold text-white">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            sur{" "}
            <span className="font-bold text-white">{table.getPageCount()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-slate-300"
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-slate-300"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALE DYNAMIQUE DE FORMULAIRE (AJOUT / MODIFICATION) --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-6">
              {isEditMode
                ? "📝 Modifier la référence"
                : "🚀 Ajouter une référence au stock"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Ex: Écran Gamer 24\"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Prix Unitaire (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
                    placeholder="199.99"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Catégorie cible *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Sélectionnez un secteur
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Illustration
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="h-16 w-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img
                        src={
                          imagePreview.startsWith("data:")
                            ? imagePreview
                            : `http://localhost/symfony-stock/stock-api/public${imagePreview}`
                        }
                        alt="Aperçu"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📷"
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-teal-400 hover:file:bg-slate-600 file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
                  placeholder="Spécifications techniques..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-bold transition shadow-lg shadow-teal-400/10 cursor-pointer"
                >
                  {isEditMode ? "Sauvegarder" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE ATTRACTIVE DE SUPPRESSION --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 px-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800 p-6 border border-slate-700 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                <FaExclamationTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation de suppression
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement le produit{" "}
              <span className="font-semibold text-white">
                "{productToDelete?.name}"
              </span>{" "}
              ? Cette action détruira le fichier de l'illustration et la ligne
              MySQL.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition cursor-pointer"
              >
                Annuler
              </button>
              {/* 1. Bouton de confirmation de suppression complété */}
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer shadow-lg shadow-red-500/10"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE PROFESSIONNELLE DE VISUALISATION DÉTAILLÉE --- */}
      {isViewModalOpen && productToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* En-tête de la modale */}
            <div className="p-5 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] uppercase font-bold tracking-wider">
                  Fiche Référence #{productToView.id}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {productToView.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setProductToView(null);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Corps de la modale divisé en 2 colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Colonne Gauche : Image grand format */}
              <div className="h-64 md:h-full w-full rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-5xl overflow-hidden shadow-inner group">
                {productToView.image ? (
                  <img
                    src={`http://localhost/symfony-stock/stock-api/public${productToView.image}`}
                    alt={productToView.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  "📦"
                )}
              </div>

              {/* Colonne Droite : Données techniques */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Prix & Quantité */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Prix Unitaire
                      </span>
                      <span className="text-xl font-black text-teal-400">
                        {parseFloat(productToView.price).toFixed(2)} €
                      </span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/60 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Quantité
                      </span>
                      <span
                        className={`text-xl font-black ${productToView.stockQuantity === 0 ? "text-red-400" : "text-white"}`}
                      >
                        {productToView.stockQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Secteur / Catégorie
                    </span>
                    <span className="px-3 py-1.5 inline-block text-xs font-semibold rounded-xl bg-slate-900 text-slate-300 border border-slate-700">
                      {productToView.category?.name || "Non classé"}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Spécifications
                    </span>
                    <p className="text-sm text-slate-300 bg-slate-900/30 p-3 rounded-xl border border-slate-700/40 min-h-[4.5rem] max-h-32 overflow-y-auto leading-relaxed whitespace-pre-line">
                      {productToView.description || (
                        <span className="italic text-slate-500">
                          Aucune description technique rédigée pour cet article.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Pied de fiche : Métadonnées système */}
                <div className="pt-4 border-t border-slate-700/60 space-y-1.5 text-[11px] text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enregistré par :</span>
                    <span className="text-slate-300 font-mono font-semibold">
                      {productToView.user?.email || "Système"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d'intégration :</span>
                    <span className="text-slate-300">
                      {productToView.createdAt
                        ? new Date(productToView.createdAt).toLocaleDateString(
                            "fr-FR",
                            { dateStyle: "long" },
                          )
                        : "Inconnue"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div> // 2. Fermeture indispensable de la grande div parente (max-w-7xl) de la page
  ); // 3. Fermeture correcte du bloc return (
} // 4. Fermeture définitive de la fonction principale Dashboard()
