import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@polkadot/api', '@polkadot/api-contract', '@polkadot/extension-dapp'],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'polkadot': ['@polkadot/api', '@polkadot/api-contract', '@polkadot/extension-dapp'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'charts': ['recharts'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
          // React and core dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Enable tree shaking with esbuild (faster than terser)
    minify: 'esbuild',
    target: 'es2020',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
}));
