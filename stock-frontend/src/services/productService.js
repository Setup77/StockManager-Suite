import api from "./api";

export const productService = {
  getAll: async () => {
    const response = await api.get("/products");
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  // CORRECTIF : Plus aucun en-tête manuel, on laisse Axios gérer le FormData
  create: async (formDataPayload) => {
    const response = await api.post("/products", formDataPayload);
    return response.data;
  },

  // CORRECTIF : On passe en POST pour que PHP accepte de lire le FormData,
  // mais on ajoute le suffixe de redirection de méthode pour Symfony
  update: async (id, formDataPayload) => {
    // On force l'encre de simulation de méthode PUT requise par le protocole
    formDataPayload.append("_method", "PUT");

    const response = await api.post(`/products/${id}`, formDataPayload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  },
  createCategory: async (categoryData) => {
    const response = await api.post("/categories", categoryData);
    return response.data;
  },
  // AJOUT DE LA REQUÊTE DE MODIFICATION
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
