import { useState, useEffect, useMemo } from "react";
import { productService } from "../services/productService";
import {
  FaTrashAlt,
  FaPencilAlt,
  FaFolderPlus,
  FaTimes,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// Importations obligatoires de TanStack Table
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la recherche et le tri globale du tableau
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  // États unifiés pour le formulaire unique de gauche
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);

  // États pour la modale de suppression personnalisée
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    extractUserFromToken();
    fetchCategories();
  }, []);

  const extractUserFromToken = () => {
    const token = localStorage.getItem("jwt_token");

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      console.log(payload);

      setCurrentUserEmail(payload.username);
    } catch (error) {
      console.error("Impossible de décoder le JWT", error);

      localStorage.removeItem("jwt_token");
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // --- CONFIGURATION DES COLONNES DE TANSTACK TABLE ---
  // =========================================================================
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Identifiant",
        cell: (info) => (
          <span className="text-slate-500 font-mono">#00{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Nom de la catégorie",
        cell: (info) => (
          <span className="font-bold text-white">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-xs truncate text-slate-400">
            {info.getValue() || (
              <span className="italic text-slate-600 text-xs">
                Aucune description
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false, // Coupe le tri sur cette colonne
        cell: ({ row }) => {
          const cat = row.original;
          // CONDITION : Seul l'administrateur propriétaire a le droit d'écrire/modifier
          const isOwner = currentUserEmail === "admin@stock.com";
          return (
            <div className="flex justify-center gap-3">
              {isOwner ? (
                <>
                  {/* Bouton Modifier accessible uniquement au propriétaire */}
                  <button
                    onClick={() => handleEditClick(cat)}
                    className="p-2 rounded-lg bg-slate-700 text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition cursor-pointer"
                    title="Modifier"
                  >
                    <FaPencilAlt size={12} />
                  </button>

                  {/* Bouton Supprimer accessible uniquement au propriétaire */}
                  <button
                    onClick={() => openDeleteModal(cat)}
                    className="p-2 rounded-lg bg-slate-700 text-red-400 hover:bg-red-400 hover:text-white transition cursor-pointer"
                    title="Supprimer"
                  >
                    <FaTrashAlt size={12} />
                  </button>
                </>
              ) : (
                // Rendu alternatif sécurisé si un autre utilisateur consulte l'inventaire
                <span className="text-xs text-slate-500 italic">
                  Lecture seule
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [categories, currentUserEmail],
  );

  // Initialisation de l'instance TanStack Table
  const table = useReactTable({
    data: categories,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Active la recherche
    getSortedRowModel: getSortedRowModel(), // Active le tri
    getPaginationRowModel: getPaginationRowModel(), // Active la pagination
    initialState: {
      pagination: {
        pageSize: 25, // Limite stricte à 5 éléments par page
      },
    },
  });

  // =========================================================================
  // --- LOGIQUE ACTIONS (CRUD) ---
  // =========================================================================
  const handleEditClick = (category) => {
    setIsEditMode(true);
    setCurrentCategoryId(category.id);
    setCatName(category.name);
    setCatDesc(category.description || "");
    toast.success(`Édition de : "${category.name}"`);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setCurrentCategoryId(null);
    setCatName("");
    setCatDesc("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (catName.trim().length < 3) {
      toast.error("Le nom doit contenir au moins 3 caractères.");
      return;
    }

    const payload = { name: catName.trim(), description: catDesc.trim() };

    try {
      if (isEditMode) {
        const updatedCat = await productService.updateCategory(
          currentCategoryId,
          payload,
        );
        setCategories(
          categories.map((cat) =>
            cat.id === currentCategoryId ? updatedCat : cat,
          ),
        );
        toast.success(`Catégorie "${payload.name}" modifiée !`);
      } else {
        const newCategory = await productService.createCategory(payload);
        setCategories([...categories, newCategory]);
        toast.success(`Catégorie "${payload.name}" créée !`);
      }
      handleCancelEdit();
    } catch (err) {
      toast.error("Échec de l'enregistrement.");
    }
  };

  // 1. Déclenche l'ouverture de la modale attractive au lieu du confirm natif
  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  // 2. Confirme et exécute la suppression depuis la modale
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await productService.deleteCategory(categoryToDelete.id);

      // Mise à jour de la liste TanStack Table
      setCategories(categories.filter((cat) => cat.id !== categoryToDelete.id));
      toast.success(`La catégorie "${categoryToDelete.name}" a été supprimée.`);

      // Sécurité si on supprime la catégorie qui était en cours d'édition
      if (currentCategoryId === categoryToDelete.id) handleCancelEdit();

      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        toast.error(
          "Action refusée : Cette catégorie contient des produits actifs.",
        );
      } else {
        toast.error("Erreur lors de la suppression de la catégorie.");
      }
      setIsDeleteModalOpen(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 text-lg">
        Chargement...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. FORMULAIRE DYNAMIQUE UNIQUE (AJOUT / MODIFICATION) */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-fit">
        <div className="flex justify-between items-center mb-6">
          <div
            className={`flex items-center gap-2 font-bold text-lg ${isEditMode ? "text-amber-400" : "text-teal-400"}`}
          >
            <FaFolderPlus />
            <h2>{isEditMode ? "Éditer le secteur" : "Nouveau secteur"}</h2>
          </div>
          {isEditMode && (
            <button
              onClick={handleCancelEdit}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Intitulé *
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
              placeholder="Ex: Électronique, Mobilier..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none resize-none"
              placeholder="Description courte..."
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2.5 font-bold rounded-xl text-sm transition shadow-lg cursor-pointer ${isEditMode ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/10" : "bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-teal-400/10"}`}
          >
            {isEditMode ? "Mettre à jour" : "Créer la catégorie"}
          </button>
        </form>
      </div>

      {/* 2. BLOC DU TABLEAU AVEC RECHERCHE ET PAGINATION (TANSTACK) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Barre de recherche branchée sur le filtre global de TanStack */}
        <div className="w-full max-w-md">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:border-teal-500 focus:outline-none transition"
            placeholder="🔍 Filtrer les catégories à l'écran..."
          />
        </div>

        {/* Le Tableau HTML/JSX stylisé avec Tailwind v4 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-slate-900 border-b border-slate-700"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none cursor-pointer hover:bg-slate-850/50 transition"
                      onClick={header.column.getToggleSortingHandler()} // Déclenche le tri au clic
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
                    colSpan="4"
                    className="p-8 text-center text-slate-500 font-medium"
                  >
                    Aucun résultat trouvé.
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

          {/* BARRE DE PAGINATION INTERACTIVE EN BAS DU TABLEAU */}
          <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
            <div>
              Page{" "}
              <span className="font-bold text-white">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              sur{" "}
              <span className="font-bold text-white">
                {table.getPageCount()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <FaChevronLeft size={10} />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALE ATTRACTIVE DE CONFIRMATION DE SUPPRESSION --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 px-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-2xl border border-slate-700 transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                {/* Assurez-vous d'importer FaExclamationTriangle de react-icons/fa en haut si ce n'est pas fait */}
                <FaTrashAlt size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Supprimer le secteur
              </h3>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement la catégorie{" "}
              <span className="font-semibold text-white">
                "{categoryToDelete?.name}"
              </span>{" "}
              ? Cette action effacera la référence de votre base MySQL
              WampServer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer shadow-lg shadow-red-500/10"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------- */}
    </div>
  );
}
