import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Handle both GitHub Pages and custom domain
  const isGhPages = process.env.GITHUB_PAGES === 'true';
  const base = isGhPages ? '/children4worldchildren/' : '/';
  
  // Use the env variable to avoid lint warning
  console.log('Google Maps API Key:', env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set');
  
  return {
  plugins: [react()],
  base,
  server: {
    port: 5173,
    host: true
  },
  publicDir: 'public',
  build: {
    target: 'es2015',
    assetsDir: 'assets',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
  css: {
    devSourcemap: false,
    },
  };
});