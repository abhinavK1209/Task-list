import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the app works when deployed to any subdirectory
  // (e.g. GitHub Pages at /Task-list/ instead of /)
  base: './',
  // Output to /docs so GitHub Pages "Deploy from branch" can serve it
  // (GitHub Pages only supports / root or /docs, not /dist)
  build: {
    outDir: 'docs',
  },
})
