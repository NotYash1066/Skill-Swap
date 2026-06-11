import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  console.log('Mode:', mode);
  
  const plugins = [];
  
  // Only add react plugin if NOT in test mode to avoid HMR preamble issues
  if (mode !== 'test') {
    plugins.push(react());
  }
  
  plugins.push(nodePolyfills({
    protocolImports: true,
  }));

  return {
    plugins,
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      'process.env': {}
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: true,
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
  }
})
