import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // sockjs-client dùng `global` (Node) – browser cần polyfill
    global: 'globalThis',
  },
})