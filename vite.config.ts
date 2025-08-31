import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // .env Dateien + GitHub Actions Secrets laden
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/Familie/',
    define: {
      // GEMINI_API_KEY aus .env oder Secrets
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // Passwort aus GitHub Secret
      'import.meta.env.VITE_APP_PASSWORD': JSON.stringify(env.VITE_APP_PASSWORD),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

