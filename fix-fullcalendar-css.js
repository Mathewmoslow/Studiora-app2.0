const fs = require('fs');
const path = require('path');

// Fix the CSS file
const cssPath = path.join(process.cwd(), 'src/index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Remove the problematic imports
const fixedCss = cssContent.replace(
  /@import\s+['"]@fullcalendar\/[^'"]+['"];?\s*/g,
  ''
);

fs.writeFileSync(cssPath, fixedCss);
console.log('✅ Fixed CSS imports');

// Update vite.config.js
const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  },
  optimizeDeps: {
    include: ['@fullcalendar/react', '@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction']
  }
})`;

fs.writeFileSync(viteConfigPath, viteConfig);
console.log('✅ Updated vite.config.js');

console.log('\n🎉 CSS issue fixed! Run npm run dev again.');
