import { defineConfig } from 'vite';
import { handleApiRequest } from './server/api';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    {
      name: 'toggle-mail-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/')) {
            try {
              const handled = await handleApiRequest(req, res);
              if (handled) return;
            } catch (err) {
              console.error('[API Middleware Error]:', err);
            }
          }
          next();
        });
      },
    },
  ],
});
