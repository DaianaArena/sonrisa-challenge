import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-converter', '@tensorflow-models/face-landmarks-detection']
  }
}); 