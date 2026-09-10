import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // <-- Correction ici
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
