import { defineConfig } from 'vite';
import { handleApiRequest } from './server/api';
import { handleSsoRequest } from './server/sso';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // 4400 keeps Toggle Mail clear of the other Toggle apps
    // (auth service :4000, Toggle Calendar :3000).
    port: Number(process.env.PORT || 4400),
    open: true,
  },
  plugins: [
    {
      name: 'toggle-mail-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || '';
          if (url.startsWith('/auth/')) {
            try {
              const handled = await handleSsoRequest(req, res);
              if (handled) return;
            } catch (err) {
              console.error('[SSO Middleware Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'SSO middleware failure' }));
              return;
            }
          }
          if (url.startsWith('/api/')) {
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
