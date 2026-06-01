import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose GROQ key — using Vite's native VITE_ prefix convention
        'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(
          env.VITE_GROQ_API_KEY || env.GROQ_API_KEY || ''
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['recharts'],
              'vendor-motion': ['framer-motion'],
              'vendor-groq': ['groq-sdk'],
            }
          }
        }
      }
    };
});

