import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { editorImageAssetsPlugin } from './build/editorImageAssetsPlugin.js'

const editorImageDirectory = fileURLToPath(new URL('./src/assets/editor_image', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    editorImageAssetsPlugin({ sourceDirectory: editorImageDirectory }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    // @ffmpeg/ffmpeg creates its worker from a package-relative URL.
    // Pre-bundling moves the module and breaks that URL in development.
    exclude: ['@ffmpeg/ffmpeg'],
  },
})
