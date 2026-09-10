import api from "./api";

export const authService = {
  // Envoi des identifiants au pare-feu Symfony
  login: async (email, password) => {
    const response = await api.post("/login_check", {
      username: email, // Symfony attend 'username' par défaut dans security.yaml
      password: password,
    });

    // Si un jeton est retourné, on le stocke localement
    if (response.data.token) {
      localStorage.setItem("jwt_token", response.data.token);
    }

    return response.data;
  },

  // Envoi des informations d'inscription à l'API Symfony
  register: async (email, password) => {
    const response = await api.post("/register", {
      email: email,
      password: password,
    });
    return response.data;
  },

  // Suppression du jeton lors de la déconnexion
  logout: () => {
    localStorage.removeItem("jwt_token");
  },

  // Vérification rapide de l'état connecté
  isAuthenticated: () => {
    return localStorage.getItem("jwt_token") !== null;
  },
};
