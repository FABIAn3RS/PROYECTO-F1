import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_THESPORTSDB_API_KEY || '123';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/thesportsdb': {
          target: 'https://www.thesportsdb.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/thesportsdb/, `/api/v1/json/${apiKey}`),
        },
      },
    },
  };
});
