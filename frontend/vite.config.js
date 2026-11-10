import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  // A production bundle that points at localhost loads no data for real visitors
  // (their browser calls its own machine). Keep local URLs in .env.development.
  if (command === 'build' && mode === 'production') {
    const localUrl = ['VITE_API_URL', 'VITE_BACKEND_URL', 'VITE_ADMIN_URL']
      .find((key) => /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(env[key] || ''));
    if (localUrl) {
      throw new Error(
        `${localUrl}=${env[localUrl]} points at localhost in a production build. ` +
        'Move local URLs to frontend/.env.development or set the production backend URL.'
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/static': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/media': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
