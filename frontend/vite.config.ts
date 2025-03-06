import react from '@vitejs/plugin-react';
import { resolve } from "path";
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  root: '.',
  plugins: [
    nodePolyfills(),
    react(),
    svgr({}),
  ],
  server: {
    port: 3202,
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
