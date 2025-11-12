import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
  plugins: [preact()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${path.resolve(__dirname, 'src/styles/_variables.scss')}";\n`
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // Vendor chunk - all node_modules
          vendor: ['preact', 'preact/hooks', 'preact/jsx-runtime'],
          // LangChain and text processing
          langchain: ['@langchain/textsplitters', 'langchain'],
          // Markdown and syntax highlighting
          markdown: ['marked', 'highlight.js'],
        },
        // File naming patterns
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.ts', '').replace('.tsx', '')
            : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name ?? '')) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/\.(css)$/i.test(assetInfo.name ?? '')) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name ?? '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },
    // Build optimizations
    minify: 'esbuild',
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Development optimizations
  server: {
    hmr: {
      overlay: false,
    },
  },
});
