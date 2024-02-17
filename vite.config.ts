
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [vue(), viteSingleFile({inlinePattern: ["*.css"]})],
  build: {
    assetsDir: '.',
    cssCodeSplit: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    // declare it in env.d.ts, otherwise won't build
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()), 
  }
})
