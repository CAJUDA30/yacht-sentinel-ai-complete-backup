import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Enable network access for multi-device testing
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select', 
            '@radix-ui/react-tabs',
            '@radix-ui/react-progress',
            '@radix-ui/react-switch',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog'
          ],
          
          // Data fetching
          'query-vendor': ['@tanstack/react-query'],
          
          // Charts and visualization
          'chart-vendor': ['recharts'],
          
          // 3D graphics (lazy loaded)
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // AI/ML libraries (optimize for tree shaking)
          'ai-vendor': [
            '@huggingface/transformers'
          ],
          
          // Utilities and helpers
          'utils-vendor': [
            'lodash',
            'date-fns',
            'zod',
            'clsx',
            'class-variance-authority'
          ]
        }
      }
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 800, // Reduced from 1000
    minify: 'esbuild', // Use faster esbuild minification
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Better compression
    cssCodeSplit: true
  },
  // Development optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'lucide-react',
      'recharts'
    ],
    exclude: [
      '@huggingface/transformers',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  },
  // Performance optimizations
  esbuild: {
    // Remove console.log in production builds, keep them in development for debugging
    ...(process.env.NODE_ENV === 'production' ? {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    } : {
      // Keep console in development but minify the output
      legalComments: 'none'
    })
  },
  
  // Add define to handle browser extension variables
  define: {
    // Prevent browser extension globals from causing issues
    'window.tronWeb': 'undefined',
    'window.ethereum': 'undefined',
    'window.TronLink': 'undefined'
  }
});