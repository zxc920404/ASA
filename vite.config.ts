import { defineConfig } from 'vite';

// GitHub Pages deploys under /ASA/ sub-path.
// Use `npm run build:gh-pages` (--mode gh-pages) for deployment.
export default defineConfig(({ mode }) => ({
  base: mode === 'gh-pages' ? '/ASA/' : './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    port: 3000,
    open: true,
  },
}));
