import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { join } from 'path'

const PROJECT_PATH = __dirname

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: {},
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: [],
      dts: true,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dirs: [],
    }),
  ],
  server: {
    port: 28000,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': join(PROJECT_PATH, 'src'),
    },
  },
  build: {
    rollupOptions: {},
  },
})
