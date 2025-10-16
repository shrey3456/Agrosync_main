import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  preview: {
    // Allow the Render preview host and onrender domains
    allowedHosts: ['krushisetu-dishangpatel-13-forntend.onrender.com', '.onrender.com']
  }
})